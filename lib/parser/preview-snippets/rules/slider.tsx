/**
 * Slider composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/slider
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Imports the real shadcn Slider component so the thumb is draggable
 * and the track/range render correctly with Radix's internal state.
 * The internal body parts (Track, Range, Thumb) aren't individual
 * sub-components in the parser — they're body parts nested inside
 * Slider's root JSX — so they won't appear as separate Assembly
 * panel rows. Style panel edits route to Slider's root classes.
 *
 * A proper fix for sub-part selectability requires the parser to
 * promote internal Radix primitives to selectable sub-components
 * (a deeper architecture change tracked separately).
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
