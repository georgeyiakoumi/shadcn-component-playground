/**
 * ComponentTreeV2 → source text generator.
 *
 * Has four execution paths:
 *
 * 1. **Escape-hatch path** (Pillar 1 D10) — `customHandling: true` trees
 *    re-emit `rawSource` verbatim. No structured emission, ever.
 * 2. **Fast path** (Pillar 3a, GEO-288) — `originalSource` is set and the
 *    tree has not been edited since parsing. Returns `originalSource`
 *    verbatim. Byte-equivalent by construction.
 * 3. **Slow path** (Pillar 3b, GEO-301) — `originalSource` is set and the
 *    tree HAS been edited. Walks the tree to find dirty fields (where the
 *    current value diverges from what `originalSource.slice(range)` would
 *    return) and surgically splices the new values back into the original
 *    source. Every byte that wasn't part of an edit is preserved exactly.
 * 4. **Template-emission path** (GEO-305 Step 2) — no `originalSource` is
 *    set. The tree was built programmatically by the M3 from-scratch
 *    builder via the v2 factory helpers. The generator emits the file from
 *    scratch using string templates derived from the structured tree.
 *    Lesson #16 still applies for the fields that ARE in the structured
 *    schema; for the from-scratch path the source IS the structured tree,
 *    so respecting it means emitting it without surprise transformations.
 *
 * Design philosophy: respect the source. Lesson #16 in the Notion Lessons
 * & Insights page explains why this generator never reformats and never
 * regenerates untouched regions, even under edit.
 *
 * Linear: GEO-288 (parent), GEO-301 (3b slow path), GEO-305 (Path A)
 */

import type {
  Base,
  ClassNameExpr,
  ComponentTreeV2,
  CvaExport,
  ImportDecl,
  InlineProperty,
  PartChild,
  PartNode,
  PropsDecl,
  PropsPart,
  SourceRange,
  SubComponentV2,
} from "@/lib/component-tree-v2"

/**
 * Error thrown when the generator cannot emit a tree. Carries enough context
 * for the caller to understand why the generator gave up.
 */
export class GeneratorError extends Error {
  readonly name = "GeneratorError"
  constructor(reason: string) {
    super(`[generator] ${reason}`)
  }
}

/**
 * Generate source code from a `ComponentTreeV2`.
 */
export function generateFromTreeV2(tree: ComponentTreeV2): string {
  // 1. Escape-hatch path. Currently no in-registry component requires this
  // but the path exists for future unhandleable families.
  if (tree.customHandling && tree.rawSource !== undefined) {
    return tree.rawSource
  }

  // 2 & 3. Tree has originalSource — fast path or slow path depending on
  // whether any field has been edited.
  if (tree.originalSource !== undefined) {
    const splices = collectSplices(tree, tree.originalSource)
    if (splices.length === 0) {
      // Fast path: no edits detected, return source verbatim.
      return tree.originalSource
    }
    // Slow path: apply splices in descending start order so earlier splices
    // don't shift the offsets of later ones.
    return applySplices(tree.originalSource, splices)
  }

  // 4. No originalSource — programmatically-built tree. Template-emission
  // path (GEO-305 Step 2) renders the file from the structured tree.
  return emitFromTemplate(tree)
}

/* ══════════════════════════════════════════════════════════════════════════
 * Slow path — splice collection + application
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A single edit to apply to the original source. `range` is the byte range
 * to replace; `value` is the new content to write into that range.
 */
interface Splice {
  range: SourceRange
  value: string
}

/**
 * Walk the tree, compare every value-with-a-range against what
 * `originalSource.slice(range.start, range.end)` produces, and collect a
 * `Splice` for every value that has diverged from the source.
 *
 * "Dirty" detection is byte comparison only — no mutation flags, no edit
 * tracking. This means an edit-then-revert returns the field to clean state
 * automatically (because the value matches the source again, no splice is
 * collected, and the fast path returns the source verbatim).
 */
function collectSplices(
  tree: ComponentTreeV2,
  source: string,
): Splice[] {
  const splices: Splice[] = []

  // cva exports — base classes and per-variant-value class strings.
  for (const cva of tree.cvaExports) {
    collectCvaSplices(cva, source, splices)
  }

  // Sub-components — walk every part's className expression.
  for (const sub of tree.subComponents) {
    collectPartSplices(sub.parts.root, source, splices)
  }

  return splices
}

/**
 * Collect splices for a `CvaExport`'s base class string and each variant
 * value's class string.
 */
function collectCvaSplices(
  cva: CvaExport,
  source: string,
  splices: Splice[],
): void {
  // Base classes
  if (cva.baseClassesRange) {
    const original = source.slice(
      cva.baseClassesRange.start,
      cva.baseClassesRange.end,
    )
    if (cva.baseClasses !== original) {
      splices.push({ range: cva.baseClassesRange, value: cva.baseClasses })
    }
  }

  // Per-variant-value class strings
  if (cva.variantRanges) {
    for (const groupName of Object.keys(cva.variants)) {
      const valueRanges = cva.variantRanges[groupName]
      if (!valueRanges) continue
      const valueMap = cva.variants[groupName]
      for (const valueName of Object.keys(valueMap)) {
        const range = valueRanges[valueName]
        if (!range) continue
        const currentValue = valueMap[valueName]
        const original = source.slice(range.start, range.end)
        if (currentValue !== original) {
          splices.push({ range, value: currentValue })
        }
      }
    }
  }
}

/**
 * Recursively walk a `PartNode` and collect splices for any className
 * expression that has a range and a diverged value.
 */
function collectPartSplices(
  part: PartNode,
  source: string,
  splices: Splice[],
): void {
  collectClassNameSplices(part.className, source, splices)

  for (const child of part.children) {
    collectChildSplices(child, source, splices)
  }
}

function collectChildSplices(
  child: PartChild,
  source: string,
  splices: Splice[],
): void {
  if (child.kind === "part") {
    collectPartSplices(child.part, source, splices)
  }
  // text, expression, jsx-comment, passthrough — no embedded class strings
  // we currently splice. (3c may add per-attribute ranges.)
}

/**
 * For a `ClassNameExpr`, collect splices for the editable string content.
 * Two shapes are currently supported:
 *
 * 1. `kind: "literal"` with a `range` — splice the inner string contents
 * 2. `kind: "cn-call"` with a `baseRange` — splice the first argument when
 *    it was originally a string literal (the most common shadcn shape:
 *    `cn("base classes", className)`)
 *
 * cva-call className expressions don't have ranges of their own — the
 * editable strings live in the cva export, which `collectCvaSplices` covers.
 */
function collectClassNameSplices(
  expr: ClassNameExpr,
  source: string,
  splices: Splice[],
): void {
  if (expr.kind === "literal" && expr.range) {
    const original = source.slice(expr.range.start, expr.range.end)
    if (expr.value !== original) {
      splices.push({ range: expr.range, value: expr.value })
    }
    return
  }

  if (expr.kind === "cn-call" && expr.baseRange) {
    // The first arg of cn() is the editable base. Its raw source includes
    // the surrounding quotes (because we stored it via `getText()`), so we
    // strip them before comparing to what's at the inner range.
    const firstArg = expr.args[0]
    if (firstArg === undefined) return
    const innerValue = stripStringQuotes(firstArg)
    if (innerValue === null) return // first arg isn't a string literal
    const original = source.slice(
      expr.baseRange.start,
      expr.baseRange.end,
    )
    if (innerValue !== original) {
      splices.push({ range: expr.baseRange, value: innerValue })
    }
  }
}

/**
 * Strip the surrounding quotes from a string literal source. Returns null
 * if the source isn't a recognised string literal shape.
 *
 * Examples:
 *   `"foo bar"` → `foo bar`
 *   `'foo bar'` → `foo bar`
 *   `\`foo bar\`` → `foo bar`
 *   `someExpression` → null
 */
function stripStringQuotes(source: string): string | null {
  if (source.length < 2) return null
  const first = source[0]
  const last = source[source.length - 1]
  if (first !== last) return null
  if (first !== '"' && first !== "'" && first !== "`") return null
  return source.slice(1, -1)
}

/**
 * Apply a list of splices to the source string. The splices are sorted by
 * `range.start` in descending order so earlier splices don't invalidate the
 * offsets of later ones.
 */
function applySplices(source: string, splices: Splice[]): string {
  // Sort descending by start so we can mutate the string back-to-front.
  const sorted = [...splices].sort((a, b) => b.range.start - a.range.start)

  // Validate non-overlapping ranges before applying. Overlapping splices
  // would corrupt the output; we'd rather throw a clear error than produce
  // garbage.
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    // a.start >= b.start (descending sort). Overlap means a.start < b.end.
    if (a.range.start < b.range.end) {
      throw new GeneratorError(
        `Overlapping splices at [${b.range.start}, ${b.range.end}) and ` +
          `[${a.range.start}, ${a.range.end}) — this is a parser bug.`,
      )
    }
  }

  let result = source
  for (const splice of sorted) {
    result =
      result.slice(0, splice.range.start) +
      splice.value +
      result.slice(splice.range.end)
  }
  return result
}

// Re-export type for tests that want to inspect splice collection directly.
export type { Splice }

/* ══════════════════════════════════════════════════════════════════════════
 * Template emission path (GEO-305 Step 2)
 *
 * Used when the tree has no `originalSource` — i.e. it was built
 * programmatically by the M3 from-scratch builder via the v2 factory
 * helpers. Renders the file from the structured tree.
 *
 * Scope: handles the shapes the from-scratch builder produces today.
 * Specifically: HTML-base parts with literal/cn-call className, no Radix
 * primitives (since the from-scratch builder doesn't introduce them yet),
 * minimal cva (no compoundVariants), no third-party integrations.
 *
 * If the parser ever feeds a parsed tree through this path (which would
 * indicate a bug — parsed trees always have originalSource), the emitter
 * will still produce sensible output as long as the tree only uses the
 * shapes it knows about. Anything it doesn't recognise becomes a clearly
 * marked TODO comment in the output.
 * ══════════════════════════════════════════════════════════════════════════
 */

function emitFromTemplate(tree: ComponentTreeV2): string {
  const sections: string[] = []

  // 1. Directives (e.g. "use client")
  if (tree.directives.length > 0) {
    sections.push(tree.directives.map((d) => `"${d}"`).join("\n"))
  }

  // 2. Imports
  if (tree.imports.length > 0) {
    sections.push(tree.imports.map(emitImport).join("\n"))
  }

  // 3. cva exports (each as its own section)
  for (const cva of tree.cvaExports) {
    sections.push(emitCvaExport(cva))
  }

  // 4. Sub-components (each as its own section)
  for (const sub of tree.subComponents) {
    sections.push(emitSubComponent(sub, tree))
  }

  // 5. Named export block — gathers all named-exported sub-components
  const exportNames = tree.subComponents
    .filter((sc) => !sc.isDefaultExport)
    .map((sc) => sc.name)
  if (exportNames.length > 0) {
    sections.push(`export { ${exportNames.join(", ")} }`)
  }

  // Single trailing newline so the file ends cleanly per POSIX convention.
  return sections.join("\n\n") + "\n"
}

/* ── Imports ────────────────────────────────────────────────────── */

function emitImport(imp: ImportDecl): string {
  switch (imp.kind) {
    case "default-namespace":
      if (imp.namespaceImport) {
        return `import * as ${imp.localName} from "${imp.source}"`
      }
      return `import ${imp.localName} from "${imp.source}"`

    case "named": {
      const valueNames = imp.names.join(", ")
      const typeNames = imp.typeNames ?? []
      const allNames =
        typeNames.length > 0
          ? [valueNames, ...typeNames.map((n) => `type ${n}`)].filter(Boolean).join(", ")
          : valueNames
      return `import { ${allNames} } from "${imp.source}"`
    }

    case "side-effect":
      return `import "${imp.source}"`
  }
}

/* ── cva exports ────────────────────────────────────────────────── */

function emitCvaExport(cva: CvaExport): string {
  // Skip imported cvas — they live in another file.
  if (cva.sourceFile) return ""

  const lines: string[] = []
  const exportKeyword = cva.exported ? "export " : ""
  lines.push(`${exportKeyword}const ${cva.name} = cva(`)
  lines.push(`  "${cva.baseClasses}",`)
  lines.push("  {")
  lines.push("    variants: {")
  for (const [groupName, valueMap] of Object.entries(cva.variants)) {
    lines.push(`      ${groupName}: {`)
    for (const [valueName, classes] of Object.entries(valueMap)) {
      lines.push(`        ${quoteKey(valueName)}: "${classes}",`)
    }
    lines.push("      },")
  }
  lines.push("    },")
  if (cva.defaultVariants) {
    lines.push("    defaultVariants: {")
    for (const [k, v] of Object.entries(cva.defaultVariants)) {
      lines.push(`      ${k}: "${v}",`)
    }
    lines.push("    },")
  }
  lines.push("  },")
  lines.push(")")
  return lines.join("\n")
}

/** Quote a variant value key only when necessary (when it's not a valid identifier). */
function quoteKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key
  return `"${key}"`
}

/* ── Sub-components ─────────────────────────────────────────────── */

function emitSubComponent(sub: SubComponentV2, _tree: ComponentTreeV2): string {
  const propsType = emitPropsDecl(sub.propsDecl)
  const destructured = emitDestructuringPattern(sub)
  // From-scratch sub-components are always emitted as self-closing JSX
  // with no body content. The user composes them via children in their
  // own consuming code (just like shadcn's actual Card/Dialog/etc.).
  // The body parts the user adds via the AssemblyPanel are canvas-
  // preview-only — they're for visualising what the component looks
  // like with content, not for the exported source.
  //
  // namedGroup and headingFont (re-added for the from-scratch flow)
  // are prepended to the cn() base classes here, mirroring v1's
  // generateSubComponent.
  const body = emitSelfClosingShell(sub, /* indent */ 4)

  // Function declaration. Default-exported sub-components get the `default`
  // keyword on the export at the bottom; here we always use `function`.
  const lines: string[] = []
  if (sub.jsdoc) {
    lines.push(sub.jsdoc)
  }
  lines.push(`function ${sub.name}({`)
  lines.push(`  ${destructured}`)
  lines.push(`}: ${propsType}) {`)
  lines.push("  return (")
  lines.push(body)
  lines.push("  )")
  lines.push("}")

  return lines.join("\n")
}

/**
 * Emit the self-closing JSX shell for a from-scratch sub-component.
 * Mirrors v1's `generateSubComponent`:
 *
 *   <div
 *     data-slot="..."
 *     className={cn("group/name cn-font-heading user-classes", className)}
 *     {...props}
 *   />
 *
 * - `namedGroup === true` prepends `group/<kebab-name>` to the base classes
 * - `headingFont === true` prepends `cn-font-heading` to the base classes
 * - The user's classes (from `parts.root.className`'s cn-call first arg)
 *   come last in the prepend chain so they override convention classes
 * - Body content (`parts.root.children`) is deliberately NOT emitted —
 *   it's preview-only
 */
function emitSelfClosingShell(sub: SubComponentV2, indent: number): string {
  const pad = " ".repeat(indent)
  const part = sub.parts.root
  const tag = part.base.kind === "html" ? part.base.tag : "div"

  // Base classes from the part's cn-call (or literal) plus the convention
  // classes (named group, heading font).
  const conventionClasses: string[] = []
  if (sub.namedGroup) {
    const subKebab = sub.name
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase()
    conventionClasses.push(`group/${subKebab}`)
  }
  if (sub.headingFont) {
    conventionClasses.push("cn-font-heading")
  }
  const userBase = readBaseClassesFromClassName(part.className)
  const allBase = [...conventionClasses, userBase].filter(Boolean).join(" ")

  // Build the className expression. If we have any base classes (from
  // conventions OR user), wrap in cn() with the user's className override.
  // Otherwise just pass through `className`.
  const classNameExpr = allBase
    ? `cn("${allBase}", className)`
    : "className"

  // Build attribute lines
  const attrs: string[] = []
  if (sub.dataSlot) {
    attrs.push(`data-slot="${sub.dataSlot}"`)
  }
  // Generic explicit attributes set by the factory path — currently used
  // by the data-attr variant strategy to emit `data-<prop>={<prop>}`
  // bindings like `data-size={size}`. Any other attributes on the root
  // (user-added or generator-emitted) flow through the same channel.
  // Source order is insertion order on the `attributes` record.
  for (const [name, expr] of Object.entries(part.attributes)) {
    attrs.push(`${name}=${expr}`)
  }
  attrs.push(`className={${classNameExpr}}`)
  attrs.push("{...props}")

  return (
    `${pad}<${tag}\n` +
    attrs.map((a) => `${pad}  ${a}`).join("\n") +
    `\n${pad}/>`
  )
}

/**
 * Read the user-set base classes from a className expression. Used by
 * `emitSelfClosingShell` to inject `namedGroup`/`headingFont` convention
 * classes alongside the user's classes.
 */
function readBaseClassesFromClassName(expr: ClassNameExpr): string {
  if (expr.kind === "literal") return expr.value
  if (expr.kind === "cn-call") {
    const first = expr.args[0]
    if (typeof first !== "string") return ""
    // Strip surrounding quotes
    if (
      first.length >= 2 &&
      (first[0] === '"' || first[0] === "'") &&
      first[first.length - 1] === first[0]
    ) {
      return first.slice(1, -1)
    }
    return first
  }
  return ""
}

/**
 * Emit the props destructuring pattern. Today's from-scratch builder
 * produces sub-components with `className` + spread; this function leaves
 * room for variants and inline properties when the builder grows them.
 */
function emitDestructuringPattern(sub: SubComponentV2): string {
  const names: string[] = ["className"]

  // Inline-property names from the propsDecl
  if (sub.propsDecl.kind === "single" || sub.propsDecl.kind === "intersection") {
    const parts =
      sub.propsDecl.kind === "single" ? [sub.propsDecl.part] : sub.propsDecl.parts
    for (const part of parts) {
      if (part.kind === "inline") {
        for (const prop of part.properties) {
          names.push(emitInlinePropertyDestructure(prop))
        }
      }
      if (part.kind === "variant-props") {
        // VariantProps gets pulled in via spread by convention; the actual
        // variant-key destructuring would need cvaExports cross-reference.
        // The from-scratch builder doesn't emit variant-props yet, so this
        // path is currently exercised only by lifted parsed trees.
      }
    }
  }

  return `${names.join(",\n  ")},\n  ...props`
}

function emitInlinePropertyDestructure(prop: InlineProperty): string {
  if (prop.defaultValue !== undefined) {
    return `${prop.name} = ${prop.defaultValue}`
  }
  return prop.name
}

/* ── Props declarations ─────────────────────────────────────────── */

function emitPropsDecl(decl: PropsDecl): string {
  switch (decl.kind) {
    case "none":
      return "{}"
    case "single":
      return emitPropsPart(decl.part)
    case "intersection":
      return decl.parts.map(emitPropsPart).join(" & ")
  }
}

function emitPropsPart(part: PropsPart): string {
  switch (part.kind) {
    case "component-props":
      return `React.ComponentProps<"${part.target}">`
    case "component-props-of":
      return `React.ComponentProps<${part.targetExpr}>`
    case "variant-props":
      return `VariantProps<typeof ${part.cvaRef}>`
    case "inline": {
      const props = part.properties
        .map((p) => {
          const optional = p.optional ? "?" : ""
          return `${p.name}${optional}: ${p.type}`
        })
        .join("; ")
      return `{ ${props} }`
    }
    case "passthrough":
      return part.source
  }
}

/* ── PartNode → JSX ─────────────────────────────────────────────── */

function emitPartNode(part: PartNode, indent: number): string {
  const pad = " ".repeat(indent)
  const tag = emitBase(part.base)

  // Build attribute lines.
  const attrs: string[] = []
  if (part.dataSlot !== undefined) {
    attrs.push(`data-slot="${part.dataSlot}"`)
  }
  for (const [name, expr] of Object.entries(part.attributes)) {
    attrs.push(`${name}=${expr}`)
  }
  attrs.push(emitClassNameAttr(part.className))
  if (part.propsSpread) {
    attrs.push("{...props}")
  }
  if (part.asChild) {
    attrs.push("asChild")
  }

  const hasChildren = part.children.length > 0

  // Self-closing form when no children
  if (!hasChildren) {
    return (
      `${pad}<${tag}\n` +
      attrs.map((a) => `${pad}  ${a}`).join("\n") +
      `\n${pad}/>`
    )
  }

  // Element with children
  const openTag =
    `${pad}<${tag}\n` +
    attrs.map((a) => `${pad}  ${a}`).join("\n") +
    `\n${pad}>`
  const childLines = part.children
    .map((child) => emitPartChild(child, indent + 2))
    .filter((s) => s.length > 0)
    .join("\n")
  const closeTag = `${pad}</${tag}>`
  return `${openTag}\n${childLines}\n${closeTag}`
}

function emitPartChild(child: PartChild, indent: number): string {
  const pad = " ".repeat(indent)
  switch (child.kind) {
    case "part":
      return emitPartNode(child.part, indent)
    case "text":
      return `${pad}${child.value}`
    case "expression":
      return `${pad}${child.source}`
    case "jsx-comment":
      return `${pad}${child.source}`
    case "passthrough":
      return `${pad}${child.passthrough.source}`
  }
}

function emitBase(base: Base): string {
  switch (base.kind) {
    case "html":
      return base.tag
    case "radix":
      return `${base.primitive}.${base.part}`
    case "third-party":
      return base.component
    case "component-ref":
      return base.name
    case "dynamic-ref":
      return base.localName
  }
}

function emitClassNameAttr(expr: ClassNameExpr): string {
  switch (expr.kind) {
    case "literal":
      return `className="${expr.value}"`
    case "cva-call":
      return `className={${expr.cvaRef}({ ${expr.args.join(", ")} })}`
    case "cn-call":
      return `className={cn(${expr.args.join(", ")})}`
    case "passthrough":
      return `className={${expr.source}}`
  }
}
