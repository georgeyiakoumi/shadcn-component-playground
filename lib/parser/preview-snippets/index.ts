/**
 * Preview snippets for compound shadcn components on the stock-page
 * canvas.
 *
 * ## The problem this module solves
 *
 * A shadcn component file like `dialog.tsx` exports N sibling
 * sub-components (Dialog, DialogTrigger, DialogContent, DialogHeader,
 * DialogTitle, etc.) with no composition relationship expressed in
 * the source. The composition only exists in the consumer's code
 * where a user writes `<Dialog><DialogTrigger>...</DialogTrigger>...</Dialog>`.
 *
 * The playground has no consumer — it only has the source file. So
 * the flat renderer in `render-tree-preview-v2.ts` shows every
 * sub-component as a disconnected sibling, which is fine for simple
 * components (Button, Card) but falls apart for compound Radix
 * components where users expect to see a real `<Dialog>` with proper
 * portal behaviour, backdrop, and nested composition.
 *
 * This module fixes that via **hand-authored composition rules** per
 * compound component, each pulling its canonical composition from
 * the shadcn docs.
 *
 * ## Architecture
 *
 * Each rule has TWO parts:
 *
 * 1. **`composition`** — an ordered, flat list of sub-component
 *    names the rule references, in Assembly-panel display order.
 *    The Assembly panel walks this list to render rows; clicking a
 *    row selects the sub-component in the Style panel.
 *
 * 2. **`render`** — an imperative function that returns live React
 *    JSX for the canvas. It uses real Radix primitives directly
 *    (bypassing `components/ui/*.tsx` for compound components where
 *    the source has hardcoded `fixed` positioning or uninterceptable
 *    Portal targets) and binds each element's `className` to the
 *    parsed tree so Style panel edits update the canvas live.
 *
 * Both parts reference the same sub-component names by string, so
 * they stay in sync by construction.
 *
 * ## Rendering guarantees
 *
 * - **Canvas-scoped Radix Portals**: the render function receives a
 *   `container` element ref and passes it to `Radix.Portal` so
 *   overlays, tooltips, popovers, and dropdowns stay within the
 *   canvas box instead of covering the Style panel.
 * - **Interactive state**: compound components that open via a
 *   trigger (Dialog, Popover, Tooltip, etc.) render with their
 *   Radix Root set to `open={true}`, `modal={false}`, and all
 *   close handlers blocked, so the user can edit styles without
 *   the preview collapsing.
 * - **Live className binding**: every JSX element uses `classesFor`
 *   to read the current className from the parsed tree at render
 *   time, so edits in the Style panel are immediately visible.
 * - **Click-to-select**: every element has `data-node-id` matching
 *   the sub-component's path, so the dashboard's existing click
 *   handler routes selections correctly.
 *
 * ## Authoring a rule
 *
 * For each compound component:
 * 1. Read the shadcn docs Usage example
 * 2. Identify the sub-components the user actually composes
 * 3. Write the `composition` array with those names in tree-display
 *    order
 * 4. Write the `render` function using raw Radix primitives (not
 *    the `components/ui/*` wrappers) with canvas-scoped Portal
 * 5. Include sample text content matching the docs example
 * 6. Document the docs URL + fetch date in a top-of-file comment
 *
 * Stragglers (sub-components not in the `composition` array but
 * present in the parsed source) are automatically shown in the
 * Assembly panel as "Additional exports" IF they have a non-empty
 * className in source. Pure pass-throughs like `DialogPortal` and
 * `DialogClose` get hidden because there's nothing to style.
 */

import * as React from "react"

import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import {
  getPartClasses,
  makePartPath,
  type PartPath,
} from "@/lib/parser/v2-tree-path"

/* ── Public types ───────────────────────────────────────────────── */

/**
 * A node in the Assembly panel's composition tree for a parsed
 * compound component. Rules author this as a nested structure
 * matching the docs composition.
 */
export type CompositionNode = {
  /** Sub-component name matching a parsed tree entry (e.g. "DialogContent"). */
  name: string
  /** Nested composition children, if any. */
  children?: CompositionNode[]
}

/**
 * Rendering context passed to each rule's render function. Mirrors
 * the fields a snippet needs from `RenderContextV2` but without
 * coupling rule authors to the full flat-renderer context type.
 */
export interface SnippetContext {
  tree: ComponentTreeV2
  selectedPath: PartPath | null
  /** Resolves data-attribute variant classes (from dashboard). */
  resolveVariantClasses: (classes: string[]) => string[]
  /**
   * Canvas container element the render function should target with
   * Radix Portals. Null on the initial render; populated on the
   * second render after the wrapper div mounts its ref.
   */
  container: HTMLElement | null
}

/**
 * A composition rule for a single compound component. Hand-authored
 * per slug based on the shadcn docs Usage example.
 */
export interface CompositionRule {
  /** File slug (e.g. "dialog", "alert-dialog") matching `tree.slug`. */
  slug: string
  /** Where this rule was sourced from + when. */
  source: string
  /**
   * Flat list of sub-component names in the order the Assembly
   * panel should display them, with nested composition expressed
   * via `children`. Drives the Assembly panel tree AND the
   * straggler detection (anything in the parsed tree that isn't in
   * this composition is a straggler candidate).
   */
  composition: CompositionNode
  /**
   * Imperative render function for the canvas. Returns JSX using
   * raw Radix primitives with canvas-scoped Portals and className
   * bindings to the parsed tree via `classesFor(ctx, subName)`.
   */
  render: (ctx: SnippetContext) => React.ReactNode
}

/* ── Shared helpers for rule authors ────────────────────────────── */

/**
 * Look up a sub-component by name and return its resolved className
 * string (after variant resolution + prefix stripping). Returns the
 * empty string if the sub-component doesn't exist, so rules are
 * tolerant of tree drift.
 */
export function classesFor(ctx: SnippetContext, subName: string): string {
  const sub = ctx.tree.subComponents.find((sc) => sc.name === subName)
  if (!sub) return ""
  const rawClasses = getPartClasses(sub.parts.root)
  const resolved = ctx.resolveVariantClasses(rawClasses)
  return resolved.join(" ")
}

/**
 * For Portal-wrapped compound sub-components like `DialogContent`,
 * `SheetContent`, `AlertDialogContent`, `DrawerContent` where the
 * exported function's root JSX is a transparent wrapper (Portal,
 * Provider, etc.) and the actual user-visible styleable classes
 * live on a nested Radix primitive, this helper walks the parts
 * tree to find the first descendant with a non-empty className.
 *
 * Example: DialogContent's root is `DialogPortal` (empty classes),
 * with children `[DialogOverlay, DialogPrimitive.Content]`. The
 * DialogPrimitive.Content part has `p-6 gap-4 rounded-lg border
 * bg-background shadow-lg ...` — those are the classes the user
 * cares about styling. This helper returns those.
 *
 * Returns empty string if the sub-component doesn't exist or if
 * nothing in its parts tree has any classes.
 *
 * **Known limitation**: this is READ-ONLY. Style panel edits still
 * land on `sub.parts.root.className`, which for Portal-wrapped
 * sub-components is an empty passthrough. This means editing
 * DialogContent's classes via the Style panel currently adds user
 * classes on the ROOT of DialogContent (the Portal wrapper), not
 * the inner content — which wouldn't apply visually. This is a
 * follow-up concern once the render path is working end-to-end.
 */
export function classesForDescended(
  ctx: SnippetContext,
  subName: string,
): string {
  const sub = ctx.tree.subComponents.find((sc) => sc.name === subName)
  if (!sub) return ""

  // Try the root first
  const rootClasses = getPartClasses(sub.parts.root)
  if (rootClasses.length > 0) {
    return ctx.resolveVariantClasses(rootClasses).join(" ")
  }

  // Walk children depth-first looking for the first part with classes
  function walk(part: {
    children: Array<{ kind: string; part?: { children: unknown[] } }>
  }): string[] | null {
    for (const child of part.children) {
      if (child.kind !== "part" || !child.part) continue
      const childClasses = getPartClasses(child.part as never)
      if (childClasses.length > 0) return childClasses
      const deeper = walk(
        child.part as { children: Array<{ kind: string; part?: { children: unknown[] } }> },
      )
      if (deeper !== null) return deeper
    }
    return null
  }

  const descended = walk(
    sub.parts.root as {
      children: Array<{ kind: string; part?: { children: unknown[] } }>
    },
  )
  if (descended === null) return ""
  return ctx.resolveVariantClasses(descended).join(" ")
}

/**
 * Build the click-to-select path for a sub-component's root element.
 * Matches the path format used by the flat renderer + AssemblyPanel
 * so the dashboard's existing click handler picks up the selection.
 */
export function pathFor(subName: string): PartPath {
  return makePartPath(subName, [])
}

/**
 * Append the selection ring class to a base className when the path
 * matches the current selection. Mirrors the flat renderer's visual
 * affordance.
 */
export function withSelectionRing(
  baseClass: string,
  isSelected: boolean,
): string {
  if (!isSelected) return baseClass
  return `${baseClass} ring-2 ring-blue-500 ring-offset-1`
}

/**
 * Strip positioning + width classes from a resolved class string so
 * the rule's base positioning (`absolute top-1/2 left-1/2 w-[28rem]
 * -translate-x-1/2 -translate-y-1/2`) wins in the canvas preview.
 *
 * Shadcn's real compound components use viewport-relative positioning
 * (`fixed inset-0`, `fixed top-[50%] left-[50%]`) + full-width with a
 * max-w cap that depends on responsive breakpoints. Neither works
 * inside a fixed-size canvas container — we end up with content that
 * collapses to 0 or stretches beyond the canvas edges.
 *
 * The rule's base layout classes handle positioning; this helper
 * drops any source classes that would fight them. User edits to
 * other properties (background, padding, border, shadow, text, etc.)
 * still come through normally — they don't match the strip patterns.
 *
 * Patterns stripped:
 * - `fixed`, `absolute`, `relative`, `sticky` (position modes)
 * - `top-*`, `left-*`, `right-*`, `bottom-*`, `inset-*` (placement)
 * - `w-*`, `min-w-*`, `max-w-*` (width sizing)
 * - `h-*`, `min-h-*`, `max-h-*` (height sizing)
 * - `translate-x-*`, `translate-y-*`, `translate-*`, `-translate-*`
 * - Responsive prefixes of all the above (e.g. `sm:max-w-lg`)
 */
export function stripPositioningAndWidth(classes: string): string {
  if (!classes) return ""
  const strippedPatterns = [
    /^(?:[a-z0-9-]+:)*(?:fixed|absolute|relative|sticky)$/,
    /^(?:[a-z0-9-]+:)*-?(?:top|left|right|bottom|inset)-\S*$/,
    /^(?:[a-z0-9-]+:)*-?(?:w|min-w|max-w|h|min-h|max-h)-\S*$/,
    /^(?:[a-z0-9-]+:)*-?translate-(?:x|y)?-?\S*$/,
    /^(?:[a-z0-9-]+:)*size-\S*$/,
  ]
  return classes
    .split(/\s+/)
    .filter((token) => {
      if (!token) return false
      return !strippedPatterns.some((p) => p.test(token))
    })
    .join(" ")
}

/* ── Stragglers ──────────────────────────────────────────────────── */

/**
 * Walk a composition tree and collect every sub-component name it
 * references (including nested children).
 */
function collectReferencedNames(node: CompositionNode): Set<string> {
  const set = new Set<string>()
  function walk(n: CompositionNode) {
    set.add(n.name)
    if (n.children) for (const c of n.children) walk(c)
  }
  walk(node)
  return set
}

/**
 * Find sub-components in the parsed tree that are NOT referenced by
 * the rule's composition AND have a non-empty className in source.
 * These are rendered as "Additional exports" in the Assembly panel
 * so users can still style them (e.g. DialogPortal has nothing to
 * style so it's hidden, but DialogOverlay has the backdrop classes
 * so it's shown).
 */
export function findStragglers(
  tree: ComponentTreeV2,
  rule: CompositionRule,
): string[] {
  const referenced = collectReferencedNames(rule.composition)
  const stragglers: string[] = []
  for (const sc of tree.subComponents) {
    if (referenced.has(sc.name)) continue
    if (sc.name === tree.subComponents[0]?.name) continue // skip root
    const classes = getPartClasses(sc.parts.root)
    if (classes.length > 0) {
      stragglers.push(sc.name)
    }
  }
  return stragglers
}

/* ── Rule registry ──────────────────────────────────────────────── */

/**
 * Look up a composition rule for a parsed tree. Returns null for
 * from-scratch trees (no rule applies), for simple components without
 * rules (Button, Card, etc.), or for any slug we haven't authored yet.
 *
 * The registry is lazily required to avoid circular-import TDZ
 * issues — rule files import helpers from this file.
 */
export function lookupRule(tree: ComponentTreeV2): CompositionRule | null {
  if (tree.originalSource === undefined) return null
  if (!tree.slug) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { COMPOSITION_RULES } = require("./registry") as {
    COMPOSITION_RULES: Record<string, CompositionRule>
  }
  return COMPOSITION_RULES[tree.slug] ?? null
}
