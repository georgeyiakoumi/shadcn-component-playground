/**
 * Tooltip composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/tooltip
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <TooltipProvider>
 *       <Tooltip>
 *         <TooltipTrigger>Hover</TooltipTrigger>
 *         <TooltipContent>
 *           <p>Add to library</p>
 *         </TooltipContent>
 *       </Tooltip>
 *     </TooltipProvider>
 *
 * ## Implementation notes
 *
 * Floating family with TooltipProvider wrapping the whole tree.
 * In real usage TooltipProvider is mounted at the app root, not
 * per-tooltip, but for the canvas preview we wrap inline so the
 * component works in isolation.
 *
 * TooltipContent is Portal-wrapped (`TooltipPrimitive.Portal >
 * TooltipPrimitive.Content`) with a nested TooltipPrimitive.Arrow
 * as the last child. `stylePath: [0]` routes reads/writes to the
 * Content primitive.
 *
 * Force-open via `open={true}` + NO `onOpenChange` — same as
 * HoverCard / Popover. Radix Popper positions the Content
 * automatically; rule does NOT add absolute positioning.
 */

"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

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

function TooltipRender(ctx: SnippetContext): React.ReactNode {
  const triggerCls = classesFor(ctx, "TooltipTrigger")
  const contentCls = classesFor(ctx, "TooltipContent")

  const triggerPath = pathFor(ctx, "TooltipTrigger")
  const contentPath = pathFor(ctx, "TooltipContent")

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      {/*
       * `defaultOpen={true}` (uncontrolled) so Radix manages its
       * own open state. Lets the user hover the trigger to close/
       * re-open and see the animation, while blocked close
       * handlers keep the Style panel clickable without dismissing
       * the tooltip.
       */}
      <TooltipPrimitive.Root defaultOpen={true}>
        <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
          <TooltipPrimitive.Trigger asChild>
            <Button
              variant="outline"
              data-node-id={triggerPath}
              className={withSelectionRing(
                triggerCls,
                ctx.selectedPath === triggerPath,
              )}
            >
              Hover me
            </Button>
          </TooltipPrimitive.Trigger>
        </div>
        {ctx.container && (
          <TooltipPrimitive.Portal container={ctx.container}>
            <TooltipPrimitive.Content
              data-node-id={contentPath}
              sideOffset={8}
              onEscapeKeyDown={(e) => e.preventDefault()}
              onPointerDownOutside={(e) => e.preventDefault()}
              className={withSelectionRing(
                // Let Radix Popper position; we only layer
                // additional base classes from source.
                cn("z-50", stripPositioningAndWidth(contentCls)),
                ctx.selectedPath === contentPath,
              )}
            >
              Add to library
              <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export const tooltipRule: CompositionRule = {
  slug: "tooltip",
  source: "https://ui.shadcn.com/docs/components/tooltip (fetched 2026-04-09)",
  composition: {
    name: "Tooltip",
    children: [
      { name: "TooltipTrigger" },
      {
        name: "TooltipContent",
        // Portal-wrapped. Real Content primitive at [0].
        stylePath: [0],
      },
    ],
  },
  render: TooltipRender,
}
