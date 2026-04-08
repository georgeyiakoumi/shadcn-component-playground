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
  // Resolve the rendered HTML tag for this sub-component's root.
  //
  // The from-scratch builder always produces an `html` base, so the
  // common case is `part.base.tag` directly. Parsed shadcn components
  // can have other base kinds:
  //
  // - `dynamic-ref`: a local var like Button's
  //   `const Comp = asChild ? Slot.Root : "button"`. We extract the
  //   default-branch HTML tag from the sub-component's passthrough so
  //   the canvas renders an actual <button> instead of a placeholder
  //   pill. Covers Button, Badge, Toggle, AlertDialog, etc.
  // - `radix` / `third-party` / `component-ref`: genuinely can't be
  //   rendered without instantiating the underlying primitive. Falls
  //   through to the placeholder.
  let resolvedTag: string | null = null
  if (part.base.kind === "html") {
    resolvedTag = part.base.tag
  } else if (part.base.kind === "dynamic-ref") {
    resolvedTag = extractDefaultTagFromPassthrough(sub, part.base.localName)
  }

  if (resolvedTag === null) {
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

  const tag = resolvedTag
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

  // Empty placeholder if no children rendered. Two flavours:
  //
  // - From-scratch sub-components (html base, no cva): render the
  //   `<SubName>` placeholder span at very-low-opacity so the user
  //   sees there's a sub-component slot here even when it's empty.
  //   Matches the from-scratch builder's authoring affordance.
  //
  // - Parsed cva sub-components: the rendered element already has its
  //   resolved cva classes (via resolveVariantClasses). We render just
  //   the bare sub-component name as a TEXT node so a parsed Button
  //   shows up as a styled button labelled "Button" — like a real
  //   button you'd encounter in the wild — instead of an empty button
  //   that collapses to zero size.
  if (children.length === 0) {
    if (sub.variantStrategy.kind === "cva") {
      children.push(sub.name)
    } else {
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

/**
 * Look at a sub-component's passthrough statements for a `const <name>`
 * declaration of the form `const <name> = <cond> ? <something> : "<htmlTag>"`
 * (or with the literal in the THEN branch instead of the ELSE branch)
 * and return the literal HTML tag.
 *
 * Used by `renderShell` to resolve a `dynamic-ref` base back to its
 * default-branch tag at render time. The most common shape is shadcn's
 * `asChild` pattern:
 *
 *   const Comp = asChild ? Slot.Root : "button"
 *
 * Returns null when no matching declaration is found, or when the
 * literal isn't a plain HTML tag (e.g. both branches are PascalCase
 * components — we'd hit a placeholder anyway).
 *
 * Heuristic and string-based; covers Button, Badge, Toggle,
 * AlertDialog, Item, Label, NavigationMenu, Pagination, Sheet,
 * Sidebar, Tabs (the entire `asChild` family in the registry as of
 * 2026-04-08). A future iteration could promote this to a parser-time
 * field on the `dynamic-ref` Base kind, but the heuristic is reliable
 * enough for v1 and avoids touching the frozen parser file.
 */
function extractDefaultTagFromPassthrough(
  sub: SubComponentV2,
  localName: string,
): string | null {
  // The passthrough statements are stored verbatim — see
  // parse-source-v2.ts where bodyStmt.getText() is captured.
  for (const passthrough of sub.passthrough) {
    if (passthrough.kind !== "statement") continue
    const src = passthrough.source

    // Cheap prefix check before reaching for a regex.
    if (!src.includes(`const ${localName}`)) continue

    // Match `const <localName> = ... ? ... : "<tag>"` (literal in else)
    // or                        ... ? "<tag>" : ...   (literal in then)
    // The tag must look like a valid HTML element name (lowercase
    // letters, optional digits) so we don't accidentally pick up a
    // CSS class string or some other quoted value.
    const elsePattern = new RegExp(
      `const\\s+${localName}\\s*=\\s*[^?]+\\?[^:]+:\\s*"([a-z][a-z0-9-]*)"`,
    )
    const thenPattern = new RegExp(
      `const\\s+${localName}\\s*=\\s*[^?]+\\?\\s*"([a-z][a-z0-9-]*)"\\s*:`,
    )

    const elseMatch = src.match(elsePattern)
    if (elseMatch) return elseMatch[1]

    const thenMatch = src.match(thenPattern)
    if (thenMatch) return thenMatch[1]
  }
  return null
}
