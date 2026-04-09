/**
 * Card composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/card
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Card>
 *       <CardHeader>
 *         <CardTitle>Card Title</CardTitle>
 *         <CardDescription>Card Description</CardDescription>
 *         <CardAction>Card Action</CardAction>
 *       </CardHeader>
 *       <CardContent>
 *         <p>Card Content</p>
 *       </CardContent>
 *       <CardFooter>
 *         <p>Card Footer</p>
 *       </CardFooter>
 *     </Card>
 *
 * ## Implementation notes
 *
 * All 7 Card sub-components are plain `<div>` elements with their
 * classes directly on `parts.root.className`. No Portal wrapping,
 * no interactive state, no floating positioning. The simplest
 * possible rule — we just emit the nested composition as plain
 * divs with each sub-component's classes bound via `classesFor`.
 *
 * Card is a good reference for any other pure-composition
 * compound (e.g. Item, Table's structural sub-components, etc.)
 * where the rule is just "nest these divs inside each other and
 * show preview text".
 */

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CardRender(ctx: SnippetContext): React.ReactNode {
  const cardCls = classesFor(ctx, "Card")
  const headerCls = classesFor(ctx, "CardHeader")
  const titleCls = classesFor(ctx, "CardTitle")
  const descriptionCls = classesFor(ctx, "CardDescription")
  const actionCls = classesFor(ctx, "CardAction")
  const contentCls = classesFor(ctx, "CardContent")
  const footerCls = classesFor(ctx, "CardFooter")

  const cardPath = pathFor(ctx, "Card")
  const headerPath = pathFor(ctx, "CardHeader")
  const titlePath = pathFor(ctx, "CardTitle")
  const descriptionPath = pathFor(ctx, "CardDescription")
  const actionPath = pathFor(ctx, "CardAction")
  const contentPath = pathFor(ctx, "CardContent")
  const footerPath = pathFor(ctx, "CardFooter")

  return (
    /*
     * Center the card in the canvas at natural size. Card's source
     * classes already include `flex-col`, width handling, padding,
     * etc. — we don't need to override anything positioning-wise,
     * just place it in the centre of the canvas box.
     */
    <div className="absolute top-1/2 left-1/2 w-[28rem] -translate-x-1/2 -translate-y-1/2">
      <div
        data-node-id={cardPath}
        className={withSelectionRing(
          cardCls,
          ctx.selectedPath === cardPath,
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
            Notifications
          </div>
          <div
            data-node-id={descriptionPath}
            className={withSelectionRing(
              descriptionCls,
              ctx.selectedPath === descriptionPath,
            )}
          >
            You have 3 unread messages.
          </div>
          <div
            data-node-id={actionPath}
            className={withSelectionRing(
              cn(
                "text-sm text-muted-foreground underline-offset-4 hover:underline cursor-pointer",
                actionCls,
              ),
              ctx.selectedPath === actionPath,
            )}
          >
            View all
          </div>
        </div>
        <div
          data-node-id={contentPath}
          className={withSelectionRing(
            contentCls,
            ctx.selectedPath === contentPath,
          )}
        >
          <p className="text-sm">
            You can manage your notification preferences in your account
            settings.
          </p>
        </div>
        <div
          data-node-id={footerPath}
          className={withSelectionRing(
            footerCls,
            ctx.selectedPath === footerPath,
          )}
        >
          <p className="text-xs text-muted-foreground">Last updated 2h ago</p>
        </div>
      </div>
    </div>
  )
}

export const cardRule: CompositionRule = {
  slug: "card",
  source: "https://ui.shadcn.com/docs/components/card (fetched 2026-04-09)",
  composition: {
    name: "Card",
    children: [
      {
        name: "CardHeader",
        children: [
          { name: "CardTitle" },
          { name: "CardDescription" },
          { name: "CardAction" },
        ],
      },
      { name: "CardContent" },
      { name: "CardFooter" },
    ],
  },
  render: CardRender,
}
