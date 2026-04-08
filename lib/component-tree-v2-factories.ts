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
  PartNode,
  PropsDecl,
  SubComponentV2,
} from "@/lib/component-tree-v2"

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
  return {
    name,
    dataSlot: toDataSlot(name),
    exportOrder,
    isDefaultExport: false,
    jsdoc: null,
    propsDecl: {
      kind: "single",
      part: { kind: "component-props", target: baseTag },
    } satisfies PropsDecl,
    variantStrategy: { kind: "none" },
    passthrough: [],
    parts: {
      root: createPartNode(baseTag),
    },
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
