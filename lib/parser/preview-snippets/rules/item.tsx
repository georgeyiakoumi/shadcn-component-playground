/**
 * Item composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/item
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <Item>
 *       <ItemMedia variant="icon">
 *         <Icon />
 *       </ItemMedia>
 *       <ItemContent>
 *         <ItemTitle>Title</ItemTitle>
 *         <ItemDescription>Description</ItemDescription>
 *       </ItemContent>
 *       <ItemActions>
 *         <Button>Action</Button>
 *       </ItemActions>
 *     </Item>
 *
 * ## Implementation notes
 *
 * Item has 10 sub-components total. The canonical example only uses
 * 6 (Item, ItemMedia, ItemContent, ItemTitle, ItemDescription,
 * ItemActions). To make all 10 selectable in the AssemblyPanel, the
 * rule renders an ItemGroup containing two Items separated by an
 * ItemSeparator, with the second Item using ItemHeader / ItemFooter
 * (the additional sub-components from the secondary docs variants).
 *
 * Item is cva-rooted (`itemVariants`) — variant + size both come
 * from the parser via `classesFor`. ItemMedia is also cva-rooted
 * (`itemMediaVariants`) with its own variant (default/icon/image).
 *
 * Rendering icon-variant ItemMedia with a real Lucide ShieldAlert
 * + image-variant in the second Item with a sample div so the
 * size-8/size-10 classes from the cva have something to size.
 */

"use client"

import * as React from "react"
import { ChevronRight, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function ItemRender(ctx: SnippetContext): React.ReactNode {
  const groupCls = classesFor(ctx, "ItemGroup")
  const itemCls = classesFor(ctx, "Item")
  const mediaCls = classesFor(ctx, "ItemMedia")
  const contentCls = classesFor(ctx, "ItemContent")
  const titleCls = classesFor(ctx, "ItemTitle")
  const descriptionCls = classesFor(ctx, "ItemDescription")
  const actionsCls = classesFor(ctx, "ItemActions")
  const headerCls = classesFor(ctx, "ItemHeader")
  const footerCls = classesFor(ctx, "ItemFooter")
  const separatorCls = classesFor(ctx, "ItemSeparator")

  const groupPath = pathFor(ctx, "ItemGroup")
  const itemPath = pathFor(ctx, "Item")
  const mediaPath = pathFor(ctx, "ItemMedia")
  const contentPath = pathFor(ctx, "ItemContent")
  const titlePath = pathFor(ctx, "ItemTitle")
  const descriptionPath = pathFor(ctx, "ItemDescription")
  const actionsPath = pathFor(ctx, "ItemActions")
  const headerPath = pathFor(ctx, "ItemHeader")
  const footerPath = pathFor(ctx, "ItemFooter")
  const separatorPath = pathFor(ctx, "ItemSeparator")

  return (
    <div className="absolute top-1/2 left-1/2 w-[28rem] -translate-x-1/2 -translate-y-1/2">
      <div
        role="list"
        data-node-id={groupPath}
        className={withSelectionRing(
          groupCls,
          ctx.selectedPath === groupPath,
        )}
      >
        {/*
          First Item — canonical docs example with icon media,
          title, description, and action button.
        */}
        <div
          data-node-id={itemPath}
          className={withSelectionRing(
            itemCls,
            ctx.selectedPath === itemPath,
          )}
        >
          <div
            data-variant="icon"
            data-node-id={mediaPath}
            className={withSelectionRing(
              mediaCls,
              ctx.selectedPath === mediaPath,
            )}
          >
            <ShieldAlert />
          </div>
          <div
            data-node-id={contentPath}
            className={withSelectionRing(
              contentCls,
              ctx.selectedPath === contentPath,
            )}
          >
            <div
              data-node-id={titlePath}
              className={withSelectionRing(
                titleCls,
                ctx.selectedPath === titlePath,
              )}
            >
              Verified account
            </div>
            <p
              data-node-id={descriptionPath}
              className={withSelectionRing(
                descriptionCls,
                ctx.selectedPath === descriptionPath,
              )}
            >
              Your identity has been confirmed by our security team.
            </p>
          </div>
          <div
            data-node-id={actionsPath}
            className={withSelectionRing(
              actionsCls,
              ctx.selectedPath === actionsPath,
            )}
          >
            <Button variant="ghost" size="icon">
              <ChevronRight />
            </Button>
          </div>
        </div>

        {/* Separator between the two items */}
        <div
          data-orientation="horizontal"
          role="none"
          data-node-id={separatorPath}
          className={withSelectionRing(
            separatorCls,
            ctx.selectedPath === separatorPath,
          )}
        />

        {/*
          Second Item — uses ItemHeader and ItemFooter (additional
          sub-components from secondary docs variants) so all 10
          sub-components are selectable in the AssemblyPanel.
        */}
        <div
          className={itemCls}
        >
          <div
            data-node-id={headerPath}
            className={withSelectionRing(
              headerCls,
              ctx.selectedPath === headerPath,
            )}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Latest
            </span>
            <span className="text-xs text-muted-foreground">2h ago</span>
          </div>
          <div className={contentCls}>
            <div className={titleCls}>Weekly digest</div>
            <p className={descriptionCls}>
              5 new updates from teams you follow.
            </p>
          </div>
          <div
            data-node-id={footerPath}
            className={withSelectionRing(
              footerCls,
              ctx.selectedPath === footerPath,
            )}
          >
            <span className="text-xs text-muted-foreground">3 mentions</span>
            <span className="text-xs text-muted-foreground">12 replies</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const itemRule: CompositionRule = {
  slug: "item",
  source: "https://ui.shadcn.com/docs/components/item (fetched 2026-04-09)",
  composition: {
    name: "ItemGroup",
    children: [
      {
        name: "Item",
        children: [
          { name: "ItemMedia" },
          {
            name: "ItemContent",
            children: [
              { name: "ItemTitle" },
              { name: "ItemDescription" },
            ],
          },
          { name: "ItemActions" },
          { name: "ItemHeader" },
          { name: "ItemFooter" },
        ],
      },
      { name: "ItemSeparator" },
    ],
  },
  render: ItemRender,
}
