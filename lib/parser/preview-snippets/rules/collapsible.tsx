/**
 * Collapsible composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/collapsible
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Collapsible>
 *       <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
 *       <CollapsibleContent>
 *         Yes. Free to use for personal and commercial projects.
 *       </CollapsibleContent>
 *     </Collapsible>
 *
 * ## Implementation notes
 *
 * Collapsible's source is pure pass-through — all three
 * sub-components have empty classNames and forward props to the
 * Radix primitive. That means there are no source classes to show
 * in the Style panel by default, but users can still ADD classes
 * via the visual editor controls.
 *
 * No Portal, no floating positioning — Collapsible renders inline.
 * We start with `open={true}` so the content is visible for
 * styling; clicking the trigger toggles, but the close paths are
 * blocked so editing in the Style panel keeps the content open.
 */

"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CollapsibleRender(ctx: SnippetContext): React.ReactNode {
  return <CollapsibleRenderImpl ctx={ctx} />
}

function CollapsibleRenderImpl({
  ctx,
}: {
  ctx: SnippetContext
}): React.ReactNode {
  const [open, setOpen] = React.useState(true)

  const rootCls = classesFor(ctx, "Collapsible")
  const triggerCls = classesFor(ctx, "CollapsibleTrigger")
  const contentCls = classesFor(ctx, "CollapsibleContent")

  const rootPath = pathFor(ctx, "Collapsible")
  const triggerPath = pathFor(ctx, "CollapsibleTrigger")
  const contentPath = pathFor(ctx, "CollapsibleContent")

  return (
    <div className="absolute top-1/2 left-1/2 w-[22rem] -translate-x-1/2 -translate-y-1/2">
      <CollapsiblePrimitive.Root
        open={open}
        onOpenChange={setOpen}
        data-node-id={rootPath}
        className={withSelectionRing(
          // The shadcn source has no default classes on Collapsible,
          // so we provide a neutral layout base so the trigger +
          // content sit visibly on the canvas. User class edits
          // layer on top.
          cn("flex flex-col gap-2", rootCls),
          ctx.selectedPath === rootPath,
        )}
      >
        <div className="flex items-center justify-between gap-4 px-4">
          <h4 className="text-sm font-semibold">
            @peduarte starred 3 repositories
          </h4>
          <CollapsiblePrimitive.Trigger asChild>
            <button
              type="button"
              data-node-id={triggerPath}
              className={withSelectionRing(
                cn(
                  "inline-flex size-8 items-center justify-center rounded-md hover:bg-accent",
                  triggerCls,
                ),
                ctx.selectedPath === triggerPath,
              )}
            >
              <ChevronsUpDown className="size-4" />
              <span className="sr-only">Toggle</span>
            </button>
          </CollapsiblePrimitive.Trigger>
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/primitives
        </div>
        <CollapsiblePrimitive.Content
          data-node-id={contentPath}
          className={withSelectionRing(
            cn("flex flex-col gap-2", contentCls),
            ctx.selectedPath === contentPath,
          )}
        >
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @radix-ui/colors
          </div>
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @stitches/react
          </div>
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    </div>
  )
}

export const collapsibleRule: CompositionRule = {
  slug: "collapsible",
  source:
    "https://ui.shadcn.com/docs/components/collapsible (fetched 2026-04-09)",
  composition: {
    name: "Collapsible",
    children: [
      { name: "CollapsibleTrigger" },
      { name: "CollapsibleContent" },
    ],
  },
  render: CollapsibleRender,
}
