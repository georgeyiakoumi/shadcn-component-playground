/**
 * Popover composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/popover
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Popover>
 *       <PopoverTrigger asChild>
 *         <Button variant="outline">Open popover</Button>
 *       </PopoverTrigger>
 *       <PopoverContent>
 *         <PopoverHeader>
 *           <PopoverTitle>Dimensions</PopoverTitle>
 *           <PopoverDescription>Set the dimensions.</PopoverDescription>
 *         </PopoverHeader>
 *       </PopoverContent>
 *     </Popover>
 *
 * ## Implementation notes
 *
 * Floating family — Radix's internal Popper wrapper positions the
 * PopoverContent relative to the trigger's anchor. The rule MUST
 * NOT add absolute/fixed positioning classes to the Content or
 * they'll stack with Radix's positioning. See
 * `feedback_floating_family_positioning.md`.
 *
 * PopoverContent is Portal-wrapped (`PopoverPrimitive.Portal >
 * PopoverPrimitive.Content`). Only one child inside the Portal,
 * so `stylePath: [0]` on PopoverContent.
 *
 * PopoverAnchor is a rarely-used alternative to PopoverTrigger
 * for cases where the trigger element is different from the
 * positioning anchor. Not in the docs Usage example; we list it
 * in the composition but don't render it in the canvas preview.
 *
 * `open={true}` + NO `onOpenChange` — same trick as HoverCard to
 * prevent Radix auto-closing on outside click.
 */

"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  stripPositioningAndWidth,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function PopoverRender(ctx: SnippetContext): React.ReactNode {
  const triggerCls = classesFor(ctx, "PopoverTrigger")
  const contentCls = classesFor(ctx, "PopoverContent")
  const headerCls = classesFor(ctx, "PopoverHeader")
  const titleCls = classesFor(ctx, "PopoverTitle")
  const descriptionCls = classesFor(ctx, "PopoverDescription")

  const triggerPath = pathFor(ctx, "PopoverTrigger")
  const contentPath = pathFor(ctx, "PopoverContent")
  const headerPath = pathFor(ctx, "PopoverHeader")
  const titlePath = pathFor(ctx, "PopoverTitle")
  const descriptionPath = pathFor(ctx, "PopoverDescription")

  return (
    /*
     * `defaultOpen={true}` (uncontrolled) so Radix manages its own
     * open state. The trigger click flips it; the blocked close
     * handlers on Content prevent Style panel clicks from closing
     * it. This gives both the "visible by default for styling"
     * behaviour AND lets the user click the trigger to see the
     * animation.
     */
    <PopoverPrimitive.Root defaultOpen={true}>
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Open popover
          </Button>
        </PopoverPrimitive.Trigger>
      </div>
      {ctx.container && (
        <PopoverPrimitive.Portal container={ctx.container}>
          <PopoverPrimitive.Content
            data-node-id={contentPath}
            sideOffset={8}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={withSelectionRing(
              // No absolute positioning — Radix Popper handles it.
              // Just width + z-index + source-stripped classes.
              cn(
                "z-50 w-[20rem]",
                stripPositioningAndWidth(contentCls),
              ),
              ctx.selectedPath === contentPath,
            )}
          >
            <div
              data-node-id={headerPath}
              className={withSelectionRing(
                headerCls,
                ctx.selectedPath === headerPath,
              )}
            >
              <div
                data-node-id={titlePath}
                className={withSelectionRing(
                  titleCls,
                  ctx.selectedPath === titlePath,
                )}
              >
                Dimensions
              </div>
              <p
                data-node-id={descriptionPath}
                className={withSelectionRing(
                  descriptionCls,
                  ctx.selectedPath === descriptionPath,
                )}
              >
                Set the dimensions for the layer.
              </p>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}
    </PopoverPrimitive.Root>
  )
}

export const popoverRule: CompositionRule = {
  slug: "popover",
  source: "https://ui.shadcn.com/docs/components/popover (fetched 2026-04-09)",
  composition: {
    name: "Popover",
    children: [
      { name: "PopoverTrigger" },
      {
        name: "PopoverContent",
        // Portal-wrapped. Real Content primitive is at [0].
        stylePath: [0],
        children: [
          {
            name: "PopoverHeader",
            children: [
              { name: "PopoverTitle" },
              { name: "PopoverDescription" },
            ],
          },
        ],
      },
    ],
  },
  render: PopoverRender,
}
