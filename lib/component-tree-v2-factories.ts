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
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"

/* ── Legacy v1 ComponentTree shape (for liftV1TreeToV2) ──────────
 *
 * GEO-305 Step 6 deleted `lib/component-tree.ts`. The lift helper
 * still needs to accept legacy v1 trees coming from localStorage, so
 * we inline a minimal shape here. The store reads JSON and casts to
 * `LegacyComponentTreeV1` before calling `liftV1TreeToV2`.
 */

interface LegacyElementNode {
  id: string
  tag: string
  children: LegacyElementNode[]
  classes: string[]
  text?: string
  props?: Record<string, string>
}

interface LegacySubComponentDef {
  id: string
  name: string
  baseElement: string
  dataSlot: string
  classes: string[]
  props: ComponentProp[]
  variants: CustomVariantDef[]
  nestInside?: string
  namedGroup?: boolean
  headingFont?: boolean
}

export interface LegacyComponentTreeV1 {
  name: string
  baseElement: string
  dataSlot: string
  classes: string[]
  assemblyTree: LegacyElementNode
  props: ComponentProp[]
  variants: CustomVariantDef[]
  subComponents: LegacySubComponentDef[]
}

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

/* ── v1 → v2 lift (one-time, on legacy localStorage read) ───────── */

/**
 * Lift a legacy v1 `ComponentTree` (built by the from-scratch builder
 * before GEO-305 Step 3) to a `ComponentTreeV2`. Used at the localStorage
 * read boundary to upgrade entries that pre-date the migration.
 *
 * From-scratch v1 trees use a strict subset of v2's expressiveness:
 * - HTML bases only (no Radix, no third-party)
 * - cn-call className with one base literal + className override
 * - Assembly tree (v1) becomes the root sub-component's parts.root tree
 * - Sub-components (v1) become additional v2 sub-components
 *
 * The lift is **lossless** for from-scratch trees: every v1 field has a
 * v2 home.
 *
 * @internal
 */
export function liftV1TreeToV2(
  v1: LegacyComponentTreeV1,
): ComponentTreeV2 {
  const tree = createComponentTreeV2(v1.name, v1.baseElement)
  const root = tree.subComponents[0]

  // Convert v1.props and v1.variants via the existing translators
  const inlineProps = translatePropsToV2Inline(v1.props)
  if (inlineProps.length > 0) {
    root.propsDecl = {
      kind: "intersection",
      parts: [
        { kind: "component-props", target: v1.baseElement } satisfies PropsPart,
        { kind: "inline", properties: inlineProps } satisfies PropsPart,
      ],
    } satisfies PropsDecl
  }

  const cvaResult = translateVariantsToV2Cva(v1.variants, v1.name)
  if (cvaResult) {
    tree.cvaExports.push(cvaResult.cva)
    root.variantStrategy = { kind: "cva", cvaRef: cvaResult.cvaRef }
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

  // Set the root's classes from the v1 root.classes array
  if (v1.classes.length > 0) {
    root.parts.root.className = {
      kind: "cn-call",
      args: [`"${v1.classes.join(" ")}"`, "className"],
    } satisfies ClassNameExpr
  }

  // Convert v1.assemblyTree's children to v2 PartChild[] under the root part
  root.parts.root.children = liftElementNodeChildrenToPartChildren(
    v1.assemblyTree.children,
  )

  // Convert v1.subComponents to v2.subComponents (in addition to the root)
  v1.subComponents.forEach((sc, i) => {
    const subRoot: PartNode = {
      base: { kind: "html", tag: sc.baseElement } satisfies Base,
      dataSlot: sc.dataSlot,
      className: {
        kind: "cn-call",
        args: [`"${sc.classes.join(" ")}"`, "className"],
      } satisfies ClassNameExpr,
      propsSpread: true,
      attributes: {},
      asChild: false,
      children: [],
    }
    const v2Sub: SubComponentV2 = {
      name: sc.name,
      dataSlot: sc.dataSlot,
      exportOrder: i + 1,
      isDefaultExport: false,
      jsdoc: null,
      propsDecl: {
        kind: "single",
        part: { kind: "component-props", target: sc.baseElement },
      } satisfies PropsDecl,
      variantStrategy: { kind: "none" },
      passthrough: [],
      parts: { root: subRoot },
    }
    tree.subComponents.push(v2Sub)
  })

  return tree
}

function liftElementNodeChildrenToPartChildren(
  children: LegacyElementNode[],
): import("@/lib/component-tree-v2").PartChild[] {
  return children.map((node) => {
    const part: PartNode = {
      base: { kind: "html", tag: node.tag } satisfies Base,
      className:
        node.classes.length > 0
          ? ({
              kind: "cn-call",
              args: [`"${node.classes.join(" ")}"`, "className"],
            } satisfies ClassNameExpr)
          : ({ kind: "literal", value: "" } satisfies ClassNameExpr),
      propsSpread: false,
      attributes: {},
      asChild: false,
      children: liftElementNodeChildrenToPartChildren(node.children),
    }
    if (node.text) {
      part.children.unshift({ kind: "text", value: node.text })
    }
    return { kind: "part" as const, part }
  })
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
