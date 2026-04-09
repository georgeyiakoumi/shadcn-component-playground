/**
 * HoverCard composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/hover-card
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <HoverCard>
 *       <HoverCardTrigger>@vercel</HoverCardTrigger>
 *       <HoverCardContent>
 *         The React Framework – created and maintained by @vercel.
 *       </HoverCardContent>
 *     </HoverCard>
 *
 * ## Implementation notes
 *
 * Same modal-family pattern as Dialog:
 * - `open={true}` so the floating content is visible for styling
 * - No `modal={false}` equivalent on HoverCard — it's non-modal by
 *   default (hover, not click), so we just keep it open via state
 *   and block the close paths
 * - Raw `HoverCardPrimitive.*` so we can pass `container` to the
 *   Portal and scope it to the canvas
 *
 * HoverCardContent is Portal-wrapped in source: `HoverCardPortal >
 * HoverCardPrimitive.Content[className]`. The rule sets
 * `stylePath: [0]` to route reads + writes to the nested primitive
 * where the real classes live.
 */

"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

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

function HoverCardRender(ctx: SnippetContext): React.ReactNode {
  return <HoverCardRenderImpl ctx={ctx} />
}

function HoverCardRenderImpl({
  ctx,
}: {
  ctx: SnippetContext
}): React.ReactNode {
  // Force-open for canvas preview. We deliberately DO NOT pass
  // onOpenChange so Radix can't auto-close when the user hovers
  // away or clicks elsewhere — the canvas preview needs the
  // content to stay visible while the user edits styles.
  const triggerCls = classesFor(ctx, "HoverCardTrigger")
  const contentCls = classesFor(ctx, "HoverCardContent")

  const triggerPath = pathFor(ctx, "HoverCardTrigger")
  const contentPath = pathFor(ctx, "HoverCardContent")

  return (
    <HoverCardPrimitive.Root open={true}>
      {/*
       * Center the trigger in the canvas. HoverCard is designed
       * to be triggered by hovering a link or button, so we use
       * a ghost-like button styled similar to a link.
       */}
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <HoverCardPrimitive.Trigger asChild>
          <Button
            variant="link"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            @vercel
          </Button>
        </HoverCardPrimitive.Trigger>
      </div>
      {ctx.container && (
        <HoverCardPrimitive.Portal container={ctx.container}>
          <HoverCardPrimitive.Content
            data-node-id={contentPath}
            sideOffset={4}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={withSelectionRing(
              // IMPORTANT: no absolute positioning here. Radix's
              // internal Popper wraps our Content in a
              // `data-radix-popper-content-wrapper` with its own
              // `position: fixed` + `transform: translate(...)` based
              // on the trigger's measured anchor position. If we add
              // our own absolute positioning on top, Radix's
              // positioning + ours stack and the content renders in
              // the wrong place.
              //
              // Let Radix position the content; we just handle the
              // base width (source's w-64 is cramped) + source
              // classes after stripping fixed/absolute conflicts.
              cn(
                "z-50 w-[20rem]",
                stripPositioningAndWidth(contentCls),
              ),
              ctx.selectedPath === contentPath,
            )}
          >
            <div className="flex justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                ▲
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@vercel</h4>
                <p className="text-sm">
                  The React Framework – created and maintained by @vercel.
                </p>
              </div>
            </div>
          </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      )}
    </HoverCardPrimitive.Root>
  )
}

export const hoverCardRule: CompositionRule = {
  slug: "hover-card",
  source:
    "https://ui.shadcn.com/docs/components/hover-card (fetched 2026-04-09)",
  composition: {
    name: "HoverCard",
    children: [
      { name: "HoverCardTrigger" },
      {
        name: "HoverCardContent",
        // HoverCardContent's source root is HoverCardPortal (empty).
        // The real Radix.Content primitive with styles is at [0].
        stylePath: [0],
      },
    ],
  },
  render: HoverCardRender,
}
