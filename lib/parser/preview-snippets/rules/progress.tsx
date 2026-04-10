/**
 * Progress composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/progress
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with real Radix Progress primitives (not the shadcn wrapper)
 * so we can place `data-node-id` on both Root and Indicator for canvas
 * selection + Style panel routing.
 *
 * The Indicator uses `transform: translateX(-50%)` to show a 50% fill.
 * The flat renderer couldn't show this because the source's inline
 * transform references a runtime `value` prop.
 */

"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function ProgressRender(ctx: SnippetContext): React.ReactNode {
  const progressCls = classesFor(ctx, "Progress")
  const progressPath = pathFor(ctx, "Progress")

  // Indicator is a body part at index 0 inside Progress's root.
  // Read its classes from the parsed tree directly.
  const progressSub = ctx.tree.subComponents.find(
    (s) => s.name === "Progress",
  )
  const indicatorPart = progressSub?.parts.root.children[0]
  const indicatorClasses =
    indicatorPart?.kind === "part" &&
    indicatorPart.part.className.kind === "literal"
      ? indicatorPart.part.className.value
      : "h-full w-full flex-1 bg-primary transition-all"
  const indicatorPath = progressPath ? `${progressPath}/0` : undefined

  return (
    <div className="absolute top-1/2 left-1/2 w-[20rem] -translate-x-1/2 -translate-y-1/2">
      <ProgressPrimitive.Root
        data-slot="progress"
        value={50}
        data-node-id={progressPath}
        className={withSelectionRing(
          progressCls,
          ctx.selectedPath === progressPath,
        )}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          data-node-id={indicatorPath}
          className={withSelectionRing(
            indicatorClasses,
            ctx.selectedPath === indicatorPath,
          )}
          style={{ transform: "translateX(-50%)" }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
}

export const progressRule: CompositionRule = {
  slug: "progress",
  source:
    "https://ui.shadcn.com/docs/components/progress (fetched 2026-04-10)",
  composition: {
    name: "Progress",
  },
  render: ProgressRender,
}
