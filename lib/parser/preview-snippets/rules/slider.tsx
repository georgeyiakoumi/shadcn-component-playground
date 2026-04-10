/**
 * Slider composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/slider
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Imports the real shadcn Slider component and renders it with
 * `defaultValue={[50]}` so the canvas shows a draggable thumb at
 * 50%. The flat renderer couldn't show the thumb because the source
 * generates thumbs via `Array.from({ length: _values.length }, ...)`
 * which the parser captures as an expression and the renderer
 * suppresses for parsed components.
 */

"use client"

import * as React from "react"

import { Slider } from "@/components/ui/slider"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SliderRender(ctx: SnippetContext): React.ReactNode {
  const sliderCls = classesFor(ctx, "Slider")
  const sliderPath = pathFor(ctx, "Slider")

  return (
    <div className="absolute top-1/2 left-1/2 w-[20rem] -translate-x-1/2 -translate-y-1/2">
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        data-node-id={sliderPath}
        className={withSelectionRing(
          sliderCls,
          ctx.selectedPath === sliderPath,
        )}
      />
    </div>
  )
}

export const sliderRule: CompositionRule = {
  slug: "slider",
  source: "https://ui.shadcn.com/docs/components/slider (fetched 2026-04-10)",
  composition: {
    name: "Slider",
  },
  render: SliderRender,
}
