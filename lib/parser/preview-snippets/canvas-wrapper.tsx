/**
 * Canvas wrapper for composition-rule previews.
 *
 * This React component owns the canvas container ref + state, so
 * rules can target it with Radix Portals. It's a thin, standalone
 * wrapper that calls the rule's `render` function with a
 * populated `SnippetContext` — hooks live inside this component
 * (legal), not inside the rule's render function (would be a Rules
 * of Hooks violation because rules are invoked from `useMemo` in
 * the dashboard).
 *
 * Usage:
 *
 *     <CompositionCanvas
 *       rule={rule}
 *       tree={tree}
 *       selectedPath={selectedPath}
 *       resolveVariantClasses={resolveVariantClasses}
 *     />
 *
 * The wrapper:
 * 1. Creates a ref state via `useState<HTMLDivElement | null>(null)`
 * 2. Renders a positioned `<div ref={setContainer}>` that fills the
 *    canvas area
 * 3. On the second render (after the ref populates), calls the
 *    rule's render function with `container` set, enabling Radix
 *    Portal's `container` prop to target the canvas
 */

"use client"

import * as React from "react"

import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import type { PartPath } from "@/lib/parser/v2-tree-path"
import type { CompositionRule, SnippetContext } from "./index"

interface CompositionCanvasProps {
  rule: CompositionRule
  tree: ComponentTreeV2
  selectedPath: PartPath | null
  resolveVariantClasses: (classes: string[]) => string[]
}

/**
 * Absolutely-positioned full-canvas wrapper. ElementSelector is
 * now `relative flex flex-1 w-full items-center justify-center`
 * (updated in the same commit), so it's a positioning context that
 * fills the canvas area. We use `absolute inset-0` to claim the
 * full ElementSelector area, escaping the `items-center`
 * justification so our backdrop fills corner-to-corner while
 * compound content centres itself within us.
 */
export function CompositionCanvas({
  rule,
  tree,
  selectedPath,
  resolveVariantClasses,
}: CompositionCanvasProps): React.ReactNode {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)

  const ctx: SnippetContext = {
    tree,
    selectedPath,
    resolveVariantClasses,
    container,
  }

  return (
    <div
      ref={setContainer}
      className="absolute inset-0 overflow-hidden"
    >
      {rule.render(ctx)}
    </div>
  )
}
