/**
 * Switch composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/switch
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with raw Radix Switch primitives so we can place
 * `data-node-id` on both Root and Thumb for canvas selection +
 * Style panel routing. The Thumb is declared as a body part in
 * the composition tree so it appears in the AssemblyPanel as a
 * selectable row.
 *
 * Uses `defaultChecked` (uncontrolled) so clicking toggles
 * the switch with proper thumb animation.
 */

"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import {
  classesFor,
  classesForBodyPart,
  pathFor,
  pathForBodyPart,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SwitchRender(ctx: SnippetContext): React.ReactNode {
  const switchCls = classesFor(ctx, "Switch")
  const thumbCls = classesForBodyPart(ctx, "Switch", [0])
  const switchPath = pathFor(ctx, "Switch")
  const thumbPath = pathForBodyPart("Switch", [0])

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <SwitchPrimitive.Root
          defaultChecked={false}
          data-slot="switch"
          data-size="default"
          data-node-id={switchPath}
          className={withSelectionRing(
            switchCls,
            ctx.selectedPath === switchPath,
          )}
        >
          <SwitchPrimitive.Thumb
            data-slot="switch-thumb"
            data-node-id={thumbPath}
            className={withSelectionRing(
              thumbCls,
              ctx.selectedPath === thumbPath,
            )}
          />
        </SwitchPrimitive.Root>
        <label className="text-sm font-medium leading-none">
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
    children: [
      { name: "Thumb", bodyPart: true, bodyPartPath: [0] },
    ],
  },
  render: SwitchRender,
}
