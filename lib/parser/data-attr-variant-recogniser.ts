/**
 * Recognise the newer shadcn "data-attribute variant" pattern on a parsed
 * sub-component.
 *
 * ## The pattern
 *
 * ```tsx
 * function Card({
 *   className,
 *   size = "default",
 *   ...props
 * }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
 *   return (
 *     <div
 *       data-slot="card"
 *       data-size={size}
 *       className={cn(
 *         "... data-[size=sm]:gap-3 data-[size=sm]:py-3 ...",
 *         className
 *       )}
 *       {...props}
 *     />
 *   )
 * }
 * ```
 *
 * Three markers must all be present for a prop to count as a data-attr
 * variant:
 *
 * 1. An inline prop property in `propsDecl` with a **union of string
 *    literals** (e.g. `"default" | "sm"`) AND a default value.
 * 2. A matching `data-<propName>={<propName>}` expression attribute on the
 *    root element. The attribute value must be the prop identifier,
 *    verbatim.
 * 3. At least one `data-[<propName>=<value>]:` prefix for one of the union
 *    values in the cn() base string literal.
 *
 * All three together confirm the prop is driving styling via the data-attr
 * pattern — not just an accidental union prop with a similarly-named
 * attribute.
 *
 * ## What this module does NOT do
 *
 * - It does NOT re-parse TypeScript. It consumes the already-built
 *   `PropsDecl` and `PartNode` shapes from `parse-source-v2.ts`.
 * - It does NOT mutate the classes in the cn() base. The classes stay
 *   verbatim; the strategy is a semantic view onto them, not a separate
 *   storage. Read/write helpers in `data-attr-slot.ts` scan for the
 *   right prefixes when the user edits a slot.
 * - It does NOT detect cva-driven components. Those are handled earlier
 *   in the parser via `findCvaRefInClassName`. A component with a cva
 *   className always takes precedence — the cva export is where the
 *   classes actually live, and any `data-<prop>={prop}` mirror is just
 *   DOM decoration (see Button for an example).
 *
 * GEO-XXX — post-PR#29 follow-up for the new Card / Accordion / etc.
 * authoring style.
 */

import type {
  ClassNameExpr,
  DataAttrVariant,
  InlineProperty,
  PartNode,
  PropsDecl,
} from "@/lib/component-tree-v2"

/**
 * Given a sub-component's `propsDecl` and root PartNode, return the
 * list of data-attr variants the component declares, in source order
 * (by prop position in the inline destructuring).
 *
 * Returns an empty array when no data-attr variants are detected.
 */
export function recogniseDataAttrVariants(
  propsDecl: PropsDecl,
  rootPart: PartNode,
): DataAttrVariant[] {
  // Can only recognise data-attr variants on a cn-call className where the
  // first arg is a string literal. Literal-className and passthrough-className
  // paths don't fit the pattern. cva-call is explicitly excluded — that's
  // the cva strategy.
  const baseClasses = readCnCallBase(rootPart.className)
  if (baseClasses === null) return []

  // Gather candidate inline properties: union-of-string-literals with a
  // default value.
  const inlineProps = collectInlineProperties(propsDecl)
  const candidates = inlineProps.filter(isCandidateProperty)
  if (candidates.length === 0) return []

  const variants: DataAttrVariant[] = []
  for (const prop of candidates) {
    const values = parseStringLiteralUnion(prop.type)
    if (values === null) continue

    // The default value must be one of the union values, quoted.
    const defaultValue = unquote(prop.defaultValue ?? "")
    if (!defaultValue || !values.includes(defaultValue)) continue

    // A `data-<propName>={<propName>}` attribute must be present on the root.
    const attrName = `data-${toKebabCase(prop.name)}`
    const attrValue = rootPart.attributes[attrName]
    if (attrValue === undefined) continue
    // Strip braces and whitespace — `{size}` → `size`. Allow `{props.size}`
    // too (rare), or a literal string.
    const attrBound = stripExpressionBraces(attrValue).trim()
    if (attrBound !== prop.name) continue

    // The cn() base must contain at least one `data-[<attr-sans-data->=<value>]:`
    // prefix for one of the values. This confirms the prop is actually
    // styling the root. Without this check, we'd mis-detect props that
    // happen to be mirrored to the DOM but not styled inline.
    const attrBody = attrName.slice("data-".length) // `size`
    const hasStylingPrefix = values.some((value) =>
      baseClasses.includes(`data-[${attrBody}=${value}]:`),
    )
    if (!hasStylingPrefix) continue

    variants.push({
      propName: prop.name,
      values,
      defaultValue,
      attrName,
    })
  }

  return variants
}

/* ── Helpers ────────────────────────────────────────────────────── */

/**
 * Read the literal base string of a cn() call's first argument, or null
 * if the className isn't a cn-call with a leading string literal.
 */
function readCnCallBase(expr: ClassNameExpr): string | null {
  if (expr.kind !== "cn-call") return null
  const first = expr.args[0]
  if (typeof first !== "string") return null
  // First arg must be a quoted string literal (double or single quote,
  // no template strings — the recogniser conservatively declines those).
  if (first.length < 2) return null
  const open = first[0]
  const close = first[first.length - 1]
  if ((open !== '"' && open !== "'") || close !== open) return null
  return first.slice(1, -1)
}

/** Flatten every inline property across a PropsDecl. */
function collectInlineProperties(propsDecl: PropsDecl): InlineProperty[] {
  const out: InlineProperty[] = []
  if (propsDecl.kind === "single") {
    if (propsDecl.part.kind === "inline") out.push(...propsDecl.part.properties)
  } else if (propsDecl.kind === "intersection") {
    for (const part of propsDecl.parts) {
      if (part.kind === "inline") out.push(...part.properties)
    }
  }
  return out
}

/**
 * An inline property is a data-attr variant candidate if it has a union
 * type of string literals and a default value. Booleans and unrelated
 * props are filtered out here.
 */
function isCandidateProperty(prop: InlineProperty): boolean {
  if (!prop.defaultValue) return false
  // Cheap syntactic check — the type text contains a `|` and at least
  // one double-quoted token. We parse the full union below and bail if
  // it turns out not to be string literals.
  if (!prop.type.includes("|")) return false
  return /"[^"]*"/.test(prop.type)
}

/**
 * Parse a type annotation like `"default" | "sm"` or `"default" | "sm" | "lg"`
 * into an ordered list of the literal values. Returns null if the type
 * isn't a pure union of string literals.
 */
function parseStringLiteralUnion(type: string): string[] | null {
  const parts = type.split("|").map((s) => s.trim())
  const values: string[] = []
  for (const part of parts) {
    // Each part must be a double-quoted string literal, no surrounding
    // generics, no computed expressions.
    if (part.length < 2) return null
    if (part[0] !== '"' || part[part.length - 1] !== '"') return null
    const body = part.slice(1, -1)
    if (body.includes('"')) return null // no escaped quotes allowed in v1
    values.push(body)
  }
  return values.length > 0 ? values : null
}

/** Strip surrounding double or single quotes from a literal source string. */
function unquote(src: string): string {
  if (src.length < 2) return ""
  const open = src[0]
  const close = src[src.length - 1]
  if ((open === '"' || open === "'") && close === open) return src.slice(1, -1)
  return ""
}

/** Strip `{...}` expression braces, leaving the inner expression text. */
function stripExpressionBraces(src: string): string {
  const s = src.trim()
  if (s.length >= 2 && s[0] === "{" && s[s.length - 1] === "}") {
    return s.slice(1, -1)
  }
  return s
}

/** Convert a camelCase prop name to kebab-case for data- attribute naming. */
function toKebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}
