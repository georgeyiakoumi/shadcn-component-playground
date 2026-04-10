/**
 * Progress composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/progress
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Imports the real shadcn Progress component and renders it with
 * `value={50}` so the canvas shows a 50% filled progress bar.
 *
 * KNOWN LIMITATION: the internal Indicator sub-part is not separately
 * selectable in the Style panel. The parser captures Progress as a
 * single sub-component with the Indicator as an internal body part.
 * Promoting body parts to selectable sub-components requires a
 * deeper parser/architecture change — tracked as a follow-up.
 */

"use client"

import * as React from "react"

import { Progress } from "@/components/ui/progress"
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

  return (
    <div className="absolute top-1/2 left-1/2 w-[20rem] -translate-x-1/2 -translate-y-1/2">
      <Progress
        value={50}
        data-node-id={progressPath}
        className={withSelectionRing(
          progressCls,
          ctx.selectedPath === progressPath,
        )}
      />
    </div>
  )
}

export const progressRule: CompositionRule = {
  slug: "progress",
  source: "https://ui.shadcn.com/docs/components/progress (fetched 2026-04-10)",
  composition: {
    name: "Progress",
  },
  render: ProgressRender,
}
