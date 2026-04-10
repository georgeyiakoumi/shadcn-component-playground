/**
 * Slider composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/slider
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with raw Radix Slider primitives so we can place
 * `data-node-id` on Root, Track, and Range for canvas selection +
 * Style panel routing. Track and Range are declared as body parts
 * in the composition tree so they appear in the AssemblyPanel.
 *
 * KNOWN LIMITATION: the Thumb is NOT a body part in the parsed
 * tree. The source generates thumbs via `Array.from(...)` which
 * the parser captures as `{ kind: "expression" }`, not as a
 * `{ kind: "part" }` child. So the Thumb is rendered with
 * hardcoded source classes and is NOT selectable. A parser
 * enhancement to extract JSX from expression children would
 * fix this (tracked in GEO-371).
 *
 * `defaultValue={[50]}` shows a draggable thumb at 50%.
 */

"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import {
  classesFor,
  classesForBodyPart,
  pathFor,
  pathForBodyPart,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SliderRender(ctx: SnippetContext): React.ReactNode {
  const sliderCls = classesFor(ctx, "Slider")
  const trackCls = classesForBodyPart(ctx, "Slider", [0])
  const rangeCls = classesForBodyPart(ctx, "Slider", [0, 0])
  const sliderPath = pathFor(ctx, "Slider")
  const trackPath = pathForBodyPart("Slider", [0])
  const rangePath = pathForBodyPart("Slider", [0, 0])

  return (
    <div className="absolute top-1/2 left-1/2 w-[20rem] -translate-x-1/2 -translate-y-1/2">
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={[50]}
        max={100}
        step={1}
        data-node-id={sliderPath}
        className={withSelectionRing(
          sliderCls,
          ctx.selectedPath === sliderPath,
        )}
      >
        {/*
          No withSelectionRing on Track or Range — they're only h-1.5
          tall so the ring renders as a confusing thin blue line.
          Selection is indicated via the AssemblyPanel row highlight +
          Style panel populating.
        */}
        <SliderPrimitive.Track
          data-slot="slider-track"
          data-node-id={trackPath}
          className={trackCls}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            data-node-id={rangePath}
            className={rangeCls}
          />
        </SliderPrimitive.Track>
        {/*
          Thumb is NOT bound to the parsed tree — see KNOWN LIMITATION
          in the file header. Hardcoded classes from source.
        */}
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Root>
    </div>
  )
}

export const sliderRule: CompositionRule = {
  slug: "slider",
  source: "https://ui.shadcn.com/docs/components/slider (fetched 2026-04-10)",
  composition: {
    name: "Slider",
    children: [
      {
        name: "Track",
        bodyPart: true,
        bodyPartPath: [0],
        children: [
          { name: "Range", bodyPart: true, bodyPartPath: [0, 0] },
        ],
      },
    ],
  },
  render: SliderRender,
}
