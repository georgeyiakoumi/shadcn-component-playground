/**
 * Progress composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/progress
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with raw Radix Progress primitives so we can place
 * `data-node-id` on both Root and Indicator. The Indicator is
 * declared as a body part in the composition tree so it appears
 * in the AssemblyPanel as a selectable row.
 *
 * `value={50}` shows a 50% filled progress bar via the inline
 * `transform: translateX(-50%)` on the Indicator.
 */

"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import {
  classesFor,
  classesForBodyPart,
  pathFor,
  pathForBodyPart,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function ProgressRender(ctx: SnippetContext): React.ReactNode {
  const progressCls = classesFor(ctx, "Progress")
  const indicatorCls = classesForBodyPart(ctx, "Progress", [0])
  const progressPath = pathFor(ctx, "Progress")
  const indicatorPath = pathForBodyPart("Progress", [0])

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
        {/*
          No withSelectionRing on the Indicator — it's only h-2 tall
          so the ring renders as a confusing thin blue line. Selection
          is indicated via the AssemblyPanel row highlight + Style
          panel populating. The user clicks "Indicator" in the panel,
          not on the thin bar itself.
        */}
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          data-node-id={indicatorPath}
          className={indicatorCls}
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
    children: [
      { name: "Indicator", bodyPart: true, bodyPartPath: [0] },
    ],
  },
  render: ProgressRender,
}
