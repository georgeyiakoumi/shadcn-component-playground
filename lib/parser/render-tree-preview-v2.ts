/**
 * Canvas renderer for ComponentTreeV2 — produces live React JSX for the
 * from-scratch builder's preview canvas.
 *
 * v2 equivalent of v1's `renderTreePreview` + `renderSubComponentPreview`.
 *
 * ## How the composition graph works (post-Bug 4 fix)
 *
 * v1 had two parallel structures: `subComponents[]` (the declared exports)
 * and `assemblyTree: ElementNode` (the runtime canvas composition, NOT
 * exported). When the user added a sub-component to the assembly, v1 added
 * a node to the assembly tree referencing the sub-component by name.
 *
 * v2 doesn't have a separate assembly tree. Instead, the composition is
 * **implicit from `nestInside`** on each sub-component:
 *
 * - Sub-components with `nestInside === undefined` (or matching the
 *   compound root's name) are direct children of the compound root
 * - Sub-components with `nestInside === "X"` render inside sub-component X
 * - The renderer walks this implicit graph at render time
 *
 * Inside each sub-component's preview shell, the renderer also renders any
 * **HTML/text/expression children** the user added via the AssemblyPanel
 * (these are `parts.root.children` of kind `part` / `text` / `expression`).
 *
 * The exported source has each sub-component as its own function declaration
 * with NO JSX nesting between sub-components. The user composes them in
 * their own consuming code. This matches v1's behaviour and how shadcn's
 * actual compound components (Card, Dialog, etc.) work.
 *
 * GEO-305 follow-up after George caught the silent regression in M4.
 */

import * as React from "react"

import type {
  ClassNameExpr,
  ComponentTreeV2,
  PartChild,
  PartNode,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import {
  buildSubComponentMap,
  getPartClasses,
  makePartPath,
  type PartPath,
} from "@/lib/parser/v2-tree-path"
import { resolveColorStyles } from "@/lib/resolve-color-styles"
import { shadcnPreviewMap } from "@/lib/shadcn-preview-map"

/* ── Render context ─────────────────────────────────────────────── */

/**
 * Everything the renderer needs from the page. Pass-through dependency
 * injection — no module-level state, no implicit access to React context.
 */
export interface RenderContextV2 {
  /** The full tree being rendered. */
  tree: ComponentTreeV2

  /** Currently selected part path, or null. */
  selectedPath: PartPath | null

  /** Set of paths the user has hidden via the AssemblyPanel. */
  hiddenPaths: Set<PartPath>

  /**
   * Resolves data-attribute variant classes to active classes based on the
   * current variant prop values. Identical to v1's `resolveVariantClasses`
   * helper — passed in to avoid duplicating the logic.
   */
  resolveVariantClasses: (classes: string[]) => string[]

  /** Variant prop values for the data-* attributes on the root element. */
  variantDataAttrs: Record<string, string>
}

/* ── Public entry point ─────────────────────────────────────────── */

/**
 * Render the canvas preview for a `ComponentTreeV2`. The first sub-component
 * is the compound root; nested sub-components are pulled in by walking the
 * implicit composition graph from `nestInside`.
 *
 * Returns null if the tree has no sub-components.
 */
export function renderTreePreviewV2(ctx: RenderContextV2): React.ReactNode {
  const { tree } = ctx
  if (tree.subComponents.length === 0) return null

  const root = tree.subComponents[0]
  return renderSubComponent(root, ctx, ctx.variantDataAttrs)
}

/* ── Sub-component renderer ─────────────────────────────────────── */

/**
 * Render a sub-component's preview shell, plus its nested sub-components
 * (composition graph children) and HTML body children (parts.root.children).
 */
function renderSubComponent(
  sub: SubComponentV2,
  ctx: RenderContextV2,
  extraProps?: Record<string, string>,
): React.ReactNode {
  const subPath = makePartPath(sub.name, [])
  if (ctx.hiddenPaths.has(subPath)) return null

  // Find any sub-components nested inside this one (composition graph children)
  const nestedChildren = findNestedChildren(ctx.tree, sub.name)

  return renderShell(sub, sub.parts.root, subPath, ctx, nestedChildren, extraProps)
}

/**
 * Find sub-components whose `nestInside` matches the parent name.
 *
 * The compound root (`subComponents[0]`) is special: sub-components with
 * `nestInside === undefined` AND `nestInside === root.name` both nest
 * inside the root. Any other sub-component name only matches its explicit
 * children.
 */
function findNestedChildren(
  tree: ComponentTreeV2,
  parentName: string,
): SubComponentV2[] {
  const root = tree.subComponents[0]
  const isRoot = root && root.name === parentName

  return tree.subComponents.filter((sc, i) => {
    if (i === 0) return false // never include the root as a child of itself
    if (isRoot) {
      // Root: include subs with no explicit nestInside OR explicitly nested in root
      return !sc.nestInside || sc.nestInside === parentName
    }
    return sc.nestInside === parentName
  })
}

/**
 * Render a sub-component's "shell" — its parts.root rendered as JSX, with
 * the body containing both:
 *  1. Any nested sub-components (from the composition graph)
 *  2. Any html/text/expression children of parts.root
 *
 * The two are concatenated: nested sub-components first, then the body
 * children. (Order can be revisited later; this matches the natural
 * "shadcn compound component with children" pattern.)
 */
function renderShell(
  sub: SubComponentV2,
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
  nestedSubs: SubComponentV2[],
  extraProps?: Record<string, string>,
): React.ReactNode {
  if (part.base.kind !== "html") {
    // The from-scratch builder only produces html bases for sub-components.
    // If we hit a non-html base for a sub-component (e.g. an imported parsed
    // tree), render a placeholder.
    return renderPlaceholder(sub.name, path)
  }

  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  const resolved = ctx.resolveVariantClasses(rawClasses)
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  const tag = part.base.tag
  const isPascalCase = /^[A-Z]/.test(tag)
  if (isPascalCase && shadcnPreviewMap[tag]) {
    return React.createElement(
      "div",
      {
        key: path,
        "data-node-id": path,
        className: isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 rounded"
          : undefined,
      },
      shadcnPreviewMap[tag](),
    )
  }

  // Render nested sub-components first
  const children: React.ReactNode[] = []
  for (const nested of nestedSubs) {
    const rendered = renderSubComponent(nested, ctx, undefined)
    if (rendered !== null) children.push(rendered)
  }

  // Then render html/text/expression children of this sub-component's body
  for (let i = 0; i < part.children.length; i++) {
    const child = part.children[i]
    const childRendered = renderBodyChild(child, path, i, ctx)
    if (childRendered !== null) children.push(childRendered)
  }

  // Empty placeholder if no children rendered
  if (children.length === 0) {
    children.push(
      React.createElement(
        "span",
        {
          key: "__empty__",
          className: "text-xs text-muted-foreground/40 select-none",
        },
        `<${sub.name}>`,
      ),
    )
  }

  // Defensive: bail out if `tag` is PascalCase but not in the preview map
  // (would crash React with "incorrect casing"). Render as a placeholder.
  if (isPascalCase) {
    return renderPlaceholder(`<${tag}>`, path)
  }

  return React.createElement(
    tag as keyof React.JSX.IntrinsicElements,
    {
      key: path,
      className,
      style: inlineStyle,
      "data-node-id": path,
      ...extraProps,
    },
    ...children,
  )
}

/* ── Body children renderer (html/text/expression children of a sub-component) ── */

/**
 * Render a single PartChild (the things inside a sub-component's body):
 * raw HTML parts, text, expressions. NOT used for nested sub-components
 * (those go through `renderSubComponent` directly via the composition graph).
 */
function renderBodyChild(
  child: PartChild,
  parentPath: PartPath,
  childIndex: number,
  ctx: RenderContextV2,
): React.ReactNode {
  if (child.kind === "part") {
    const childPath = appendIndexToPath(parentPath, childIndex)
    return renderBodyPart(child.part, childPath, ctx)
  }
  if (child.kind === "text") {
    return child.value
  }
  if (child.kind === "expression") {
    return React.createElement(
      "span",
      {
        key: `expr-${childIndex}`,
        className: "text-xs text-muted-foreground/60 select-none italic",
      },
      child.source,
    )
  }
  // jsx-comment and passthrough don't render in the preview
  return null
}

/**
 * Render a non-sub-component PartNode — the things the user adds via the
 * AssemblyPanel's HTML/shadcn picker into a sub-component's body.
 *
 * Distinct from `renderShell` because:
 * - These don't have nested sub-components from the composition graph
 * - They're not the "root" of a sub-component, just JSX children inside one
 */
function renderBodyPart(
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  if (ctx.hiddenPaths.has(path)) return null

  // component-ref → render as a shadcn preview if known, else placeholder.
  // We deliberately do NOT recurse into other sub-components from here
  // (composition graph nesting is handled by renderShell + nestInside).
  if (part.base.kind === "component-ref") {
    if (shadcnPreviewMap[part.base.name]) {
      return renderShadcnPreview(part.base.name, path, ctx)
    }
    return renderPlaceholder(part.base.name, path)
  }

  if (part.base.kind === "radix" || part.base.kind === "dynamic-ref") {
    const label =
      part.base.kind === "radix"
        ? `${part.base.primitive}.${part.base.part}`
        : part.base.localName
    return renderPlaceholder(label, path)
  }

  if (part.base.kind === "third-party") {
    return renderPlaceholder(part.base.component, path)
  }

  // html base
  return renderHtmlPart(part, path, ctx)
}

function renderHtmlPart(
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  if (part.base.kind !== "html") return null

  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  const resolved = ctx.resolveVariantClasses(rawClasses)
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  const tag = part.base.tag
  const isPascalCase = /^[A-Z]/.test(tag)

  // PascalCase HTML tag — route through shadcn preview map or fall back
  // to a placeholder. Don't let React.createElement crash.
  if (isPascalCase) {
    if (shadcnPreviewMap[tag]) {
      return renderShadcnPreview(tag, path, ctx)
    }
    return renderPlaceholder(`<${tag}>`, path)
  }

  const children: React.ReactNode[] = []
  for (let i = 0; i < part.children.length; i++) {
    const child = part.children[i]
    const childRendered = renderBodyChild(child, path, i, ctx)
    if (childRendered !== null) children.push(childRendered)
  }

  if (children.length === 0) {
    children.push(
      React.createElement(
        "span",
        {
          key: "__empty__",
          className: "text-xs text-muted-foreground/40 select-none",
        },
        `<${tag}>`,
      ),
    )
  }

  return React.createElement(
    tag as keyof React.JSX.IntrinsicElements,
    {
      key: path,
      className,
      style: inlineStyle,
      "data-node-id": path,
    },
    ...children,
  )
}

function renderShadcnPreview(
  name: string,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  const isSelected = ctx.selectedPath === path
  return React.createElement(
    "div",
    {
      key: path,
      "data-node-id": path,
      className: isSelected
        ? "ring-2 ring-blue-500 ring-offset-1 rounded"
        : undefined,
    },
    shadcnPreviewMap[name](),
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

function renderPlaceholder(label: string, path: PartPath): React.ReactNode {
  return React.createElement(
    "span",
    {
      key: path,
      "data-node-id": path,
      className:
        "rounded bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500",
    },
    label,
  )
}

function appendIndexToPath(path: PartPath, index: number): PartPath {
  if (path.endsWith("/")) {
    return `${path}${index}`
  }
  return `${path}/${index}`
}
