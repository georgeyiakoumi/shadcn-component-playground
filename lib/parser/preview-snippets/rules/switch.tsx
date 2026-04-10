/**
 * Switch composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/switch
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Imports the real shadcn Switch component so the canvas shows a
 * toggleable switch. Clicking toggles between checked/unchecked
 * with the proper thumb animation.
 *
 * KNOWN LIMITATION: the internal Thumb sub-part is not separately
 * selectable in the Style panel. The parser captures Switch as a
 * single sub-component with the Thumb as an internal body part.
 * Promoting body parts to selectable sub-components requires a
 * deeper parser/architecture change — tracked as a follow-up.
 */

"use client"

import * as React from "react"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <Switch
          id="demo-switch"
          data-node-id={switchPath}
          className={withSelectionRing(
            switchCls,
            ctx.selectedPath === switchPath,
          )}
        />
        <Label htmlFor="demo-switch">Airplane Mode</Label>
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
