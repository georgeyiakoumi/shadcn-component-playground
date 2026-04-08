/**
 * ComponentTree v2 — factory helpers for programmatic construction.
 *
 * GEO-305 Step 1. The from-scratch builder calls these to produce v2 trees
 * that the v2 generator can emit (via the template-emission path landing in
 * Step 2). All helpers return minimally-shaped, valid trees — no source
 * ranges, no `originalSource`, no `customHandling`. They are NOT for parsing
 * existing source files; that path lives in `lib/parser/parse-source-v2.ts`.
 *
 * The naming convention `createXxx` mirrors the v1 factory style for muscle
 * memory during the migration (see Step 4).
 */

import type {
  Base,
  ClassNameExpr,
  ComponentTreeV2,
  CvaExport,
  ImportDecl,
  InlineProperty,
  PartNode,
  PropsDecl,
  PropsPart,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import type { CustomVariantDef } from "@/lib/component-state"
import type { ComponentProp } from "@/lib/component-tree"

/* ── Slug helpers ───────────────────────────────────────────────── */

/** Convert PascalCase to kebab-case for `data-slot` values. */
export function toDataSlot(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/* ── PartNode ───────────────────────────────────────────────────── */

/**
 * Create an empty `PartNode` wrapping an HTML tag. Defaults to no className,
 * no attributes, no children, no propsSpread, no asChild.
 */
export function createPartNode(tag: string): PartNode {
  return {
    base: { kind: "html", tag } satisfies Base,
    className: { kind: "literal", value: "" } satisfies ClassNameExpr,
    propsSpread: false,
    attributes: {},
    asChild: false,
    children: [],
  }
}

/* ── SubComponentV2 ─────────────────────────────────────────────── */

/**
 * Create a minimally-shaped `SubComponentV2` for a from-scratch builder.
 * The sub-component starts with:
 *
 * - the given PascalCase name (e.g. "MyCard", "MyCardHeader")
 * - kebab-case `data-slot` derived from the name
 * - a `parts.root` PartNode wrapping the given base HTML tag
 * - no JSDoc, no passthrough, no variants (`variantStrategy.kind === "none"`)
 * - `propsDecl` is `single + component-props` for the base tag
 * - `exportOrder` is the supplied index — caller's responsibility to keep
 *   this consistent across the parent tree's `subComponents` array
 */
export function createSubComponentV2(
  name: string,
  baseTag: string,
  exportOrder: number,
): SubComponentV2 {
  const dataSlot = toDataSlot(name)
  // The root PartNode carries the dataSlot attribute and spreads props.
  // Wrapping it in a cn() call gives the visual editor a string-literal
  // baseRange to splice into when the user edits classes (Pillar 3b).
  const root: PartNode = {
    base: { kind: "html", tag: baseTag } satisfies Base,
    dataSlot,
    className: { kind: "cn-call", args: ['""', "className"] } satisfies ClassNameExpr,
    propsSpread: true,
    attributes: {},
    asChild: false,
    children: [],
  }
  return {
    name,
    dataSlot,
    exportOrder,
    isDefaultExport: false,
    jsdoc: null,
    propsDecl: {
      kind: "single",
      part: { kind: "component-props", target: baseTag },
    } satisfies PropsDecl,
    variantStrategy: { kind: "none" },
    passthrough: [],
    parts: { root },
  }
}

/* ── ComponentTreeV2 ────────────────────────────────────────────── */

/**
 * Create a minimally-shaped `ComponentTreeV2` for a from-scratch builder.
 * The tree starts with:
 *
 * - the given PascalCase name and kebab-case slug
 * - `filePath` set to `components/ui/${slug}.tsx` by convention
 * - `roundTripRisk: 'handleable'` (programmatic trees are always handleable)
 * - `customHandling: false` (escape hatch is for parsed unhandleable files)
 * - one default import: `import * as React from "react"`
 * - one named import: `import { cn } from "@/lib/utils"`
 * - one root sub-component built from the given base tag
 * - no cva exports, no context exports, no hook exports, no passthrough
 * - **no** `originalSource` — this is the signal to the generator that the
 *   slow-path slicer cannot apply, and template-based emission must be used
 *   instead (Step 2).
 */
export function createComponentTreeV2(
  name: string,
  baseTag: string,
): ComponentTreeV2 {
  const slug = toSlug(name)
  return {
    name,
    slug,
    filePath: `components/ui/${slug}.tsx`,
    roundTripRisk: "handleable",
    customHandling: false,
    rawSource: undefined,
    originalSource: undefined,
    directives: [],
    filePassthrough: [],
    imports: [
      {
        kind: "default-namespace",
        source: "react",
        localName: "React",
        namespaceImport: true,
      } satisfies ImportDecl,
      {
        kind: "named",
        source: "@/lib/utils",
        names: ["cn"],
      } satisfies ImportDecl,
    ],
    cvaExports: [],
    contextExports: [],
    hookExports: [],
    subComponents: [createSubComponentV2(name, baseTag, 0)],
  }
}

/* ── CvaExport ──────────────────────────────────────────────────── */

/**
 * Create an empty `CvaExport` for a from-scratch builder. The from-scratch
 * builder calls this when the user opts into a cva variant strategy on a
 * sub-component.
 */
export function createCvaExport(name: string): CvaExport {
  return {
    name,
    baseClasses: "",
    variants: {},
    defaultVariants: undefined,
    exported: true,
  }
}

/* ── Slug helpers ───────────────────────────────────────────────── */

/** Convert PascalCase to kebab-case for filenames and slugs. */
export function toSlug(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/* ── v1 → v2 translation (GEO-305 Step 3) ──────────────────────── */

/**
 * Translate the from-scratch builder's "props at create time" UI input
 * (`ComponentProp[]`, a v1 shape) into v2 `InlineProperty[]` so the
 * factory can attach them to the root sub-component's `propsDecl`.
 *
 * The translation is mechanical:
 * - `string` → `string`
 * - `number` → `number`
 * - `boolean` → `boolean`
 * - `ReactNode` → `React.ReactNode`
 *
 * Default values are passed through verbatim (the v2 emitter quotes
 * string defaults; non-string defaults are emitted as-is).
 */
export function translatePropsToV2Inline(
  props: ComponentProp[],
): InlineProperty[] {
  return props.map((p) => ({
    name: p.name,
    type:
      p.type === "ReactNode"
        ? "React.ReactNode"
        : p.type, // string | number | boolean
    optional: !p.required,
    defaultValue:
      p.defaultValue !== undefined && p.defaultValue !== ""
        ? formatDefaultValue(p.type, p.defaultValue)
        : undefined,
  }))
}

function formatDefaultValue(
  type: ComponentProp["type"],
  raw: string,
): string {
  if (type === "string") return `"${raw}"`
  if (type === "boolean") return raw === "true" ? "true" : "false"
  if (type === "number") return raw
  // ReactNode default values are passed through as-is.
  return raw
}

/**
 * Translate the from-scratch builder's "variants at create time" UI input
 * (`CustomVariantDef[]`, a v1 shape) into a v2 `CvaExport` plus a
 * `VariantStrategy` reference for the sub-component to point at.
 *
 * Returns null when there are no variants — caller should leave the
 * sub-component's `variantStrategy` as `{ kind: "none" }` and not add
 * any `cvaExports` entry.
 *
 * The cva export starts with empty class strings for each variant value;
 * the user fills them in via the visual editor in a later session.
 */
export function translateVariantsToV2Cva(
  variants: CustomVariantDef[],
  componentName: string,
): { cva: CvaExport; cvaRef: string } | null {
  if (variants.length === 0) return null

  const cvaRef = `${componentName.charAt(0).toLowerCase()}${componentName.slice(1)}Variants`

  // Group variants by name. v1's CustomVariantDef is one variant *group*
  // (e.g. "size"), and `options` is the list of values within it.
  const variantsMap: Record<string, Record<string, string>> = {}
  const defaultVariants: Record<string, string> = {}

  for (const v of variants) {
    if (v.type === "boolean") {
      // Boolean variants in cva become a group with "true" / "false" keys.
      variantsMap[v.name] = { true: "", false: "" }
    } else {
      // Variant variants become a group with one entry per option.
      variantsMap[v.name] = {}
      for (const opt of v.options) {
        variantsMap[v.name][opt] = ""
      }
    }
    if (v.defaultValue) {
      defaultVariants[v.name] = v.defaultValue
    }
  }

  return {
    cva: {
      name: cvaRef,
      baseClasses: "",
      variants: variantsMap,
      defaultVariants:
        Object.keys(defaultVariants).length > 0 ? defaultVariants : undefined,
      exported: true,
    },
    cvaRef,
  }
}

/**
 * Build a complete v2 tree for a from-scratch component, optionally with
 * pre-declared props and variants from the create-page UI. This is the
 * shape `app/playground/new/page.tsx` calls when the user hits Create
 * in scratch mode after Step 3.
 */
export function createV2TreeFromScratch(
  name: string,
  baseTag: string,
  props: ComponentProp[],
  variants: CustomVariantDef[],
): ComponentTreeV2 {
  const tree = createComponentTreeV2(name, baseTag)
  const root = tree.subComponents[0]

  // Attach pre-declared props to the root sub-component's propsDecl.
  // The factory's default propsDecl is `single + component-props`. When
  // the user adds inline props, we promote it to an intersection of the
  // base ComponentProps + an inline part.
  const inlineProps = translatePropsToV2Inline(props)
  if (inlineProps.length > 0) {
    root.propsDecl = {
      kind: "intersection",
      parts: [
        { kind: "component-props", target: baseTag } satisfies PropsPart,
        { kind: "inline", properties: inlineProps } satisfies PropsPart,
      ],
    } satisfies PropsDecl
  }

  // Attach pre-declared variants as a cva export and wire the root
  // sub-component's variantStrategy to point at it.
  const cvaResult = translateVariantsToV2Cva(variants, name)
  if (cvaResult) {
    tree.cvaExports.push(cvaResult.cva)
    root.variantStrategy = { kind: "cva", cvaRef: cvaResult.cvaRef }
    // Also intersect VariantProps<typeof xxxVariants> into the propsDecl
    // so the type signature is correct.
    const variantPropsPart: PropsPart = {
      kind: "variant-props",
      cvaRef: cvaResult.cvaRef,
    }
    if (root.propsDecl.kind === "single") {
      root.propsDecl = {
        kind: "intersection",
        parts: [root.propsDecl.part, variantPropsPart],
      }
    } else if (root.propsDecl.kind === "intersection") {
      root.propsDecl.parts.push(variantPropsPart)
    }
  }

  return tree
}
