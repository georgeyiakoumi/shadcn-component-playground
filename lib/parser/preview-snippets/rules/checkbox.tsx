/**
 * Checkbox composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/checkbox
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Renders with raw Radix Checkbox primitives so we can place
 * `data-node-id` on both Root and Indicator. The Indicator is
 * declared as a body part in the composition tree so it appears
 * in the AssemblyPanel as a selectable row.
 *
 * `defaultChecked` so the check icon is visible by default on
 * the canvas — matches the shadcn docs example.
 */

"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import {
  classesFor,
  classesForBodyPart,
  pathFor,
  pathForBodyPart,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CheckboxRender(ctx: SnippetContext): React.ReactNode {
  const checkboxCls = classesFor(ctx, "Checkbox")
  const indicatorCls = classesForBodyPart(ctx, "Checkbox", [0])
  const checkboxPath = pathFor(ctx, "Checkbox")
  const indicatorPath = pathForBodyPart("Checkbox", [0])

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <CheckboxPrimitive.Root
          defaultChecked
          data-slot="checkbox"
          data-node-id={checkboxPath}
          className={withSelectionRing(
            checkboxCls,
            ctx.selectedPath === checkboxPath,
          )}
        >
          <CheckboxPrimitive.Indicator
            data-slot="checkbox-indicator"
            data-node-id={indicatorPath}
            className={withSelectionRing(
              indicatorCls,
              ctx.selectedPath === indicatorPath,
            )}
          >
            <CheckIcon className="size-3.5" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <label className="text-sm font-medium leading-none">
          Accept terms and conditions
        </label>
      </div>
    </div>
  )
}

export const checkboxRule: CompositionRule = {
  slug: "checkbox",
  source:
    "https://ui.shadcn.com/docs/components/checkbox (fetched 2026-04-10)",
  composition: {
    name: "Checkbox",
    children: [
      { name: "Indicator", bodyPart: true, bodyPartPath: [0] },
    ],
  },
  render: CheckboxRender,
}
