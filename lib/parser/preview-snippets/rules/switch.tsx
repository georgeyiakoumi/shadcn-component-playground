/**
 * Switch composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/switch
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with real Radix Switch primitives (not the shadcn wrapper)
 * so we can place `data-node-id` on both Root and Thumb for canvas
 * selection + Style panel routing. The shadcn wrapper encapsulates
 * Thumb internally — importing it directly would make the thumb
 * un-selectable.
 *
 * Uses `defaultChecked` (uncontrolled) so clicking toggles the
 * switch with proper thumb animation.
 */

"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SwitchRender(ctx: SnippetContext): React.ReactNode {
  const switchCls = classesFor(ctx, "Switch")
  const switchPath = pathFor(ctx, "Switch")

  // The parser captures Switch's source as one sub-component with
  // the Thumb as a body part at index 0. We can't use classesFor
  // for the thumb (it's not a sub-component), so we read its classes
  // from the parsed tree directly.
  const switchSub = ctx.tree.subComponents.find((s) => s.name === "Switch")
  const thumbPart = switchSub?.parts.root.children[0]
  const thumbClasses =
    thumbPart?.kind === "part" && thumbPart.part.className.kind === "literal"
      ? thumbPart.part.className.value
      : "pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
  const thumbPath = switchPath ? `${switchPath}/0` : undefined

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <SwitchPrimitive.Root
          defaultChecked={false}
          data-slot="switch"
          data-size="default"
          data-node-id={switchPath}
          className={withSelectionRing(
            cn(switchCls),
            ctx.selectedPath === switchPath,
          )}
        >
          <SwitchPrimitive.Thumb
            data-slot="switch-thumb"
            data-node-id={thumbPath}
            className={withSelectionRing(
              thumbClasses,
              ctx.selectedPath === thumbPath,
            )}
          />
        </SwitchPrimitive.Root>
        <label
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Airplane Mode
        </label>
      </div>
    </div>
  )
}

export const switchRule: CompositionRule = {
  slug: "switch",
  source: "https://ui.shadcn.com/docs/components/switch (fetched 2026-04-10)",
  composition: {
    name: "Switch",
  },
  render: SwitchRender,
}
