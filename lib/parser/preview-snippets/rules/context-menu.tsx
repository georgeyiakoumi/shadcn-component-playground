/**
 * ContextMenu composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/context-menu
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuContent>
 *         <ContextMenuItem>Back</ContextMenuItem>
 *         <ContextMenuItem>Forward</ContextMenuItem>
 *         <ContextMenuSeparator />
 *         <ContextMenuItem>Reload</ContextMenuItem>
 *       </ContextMenuContent>
 *     </ContextMenu>
 *
 * ## Implementation notes
 *
 * Floating family — same recipe as DropdownMenu, but with two
 * differences:
 *
 * 1. **No `defaultOpen`** — ContextMenu has no `open` prop at all
 *    in Radix; it only opens on right-click. The user has to
 *    actually right-click the trigger area to see the menu.
 *
 * 2. **Trigger is a visible drop-zone**, not a button. We render
 *    a dashed-bordered area with text inviting the right-click,
 *    so the trigger is selectable + stylable in the canvas.
 *
 * `stylePath: [0]` on ContextMenuContent — Portal-wrapped just
 * like DropdownMenu.
 *
 * Blocked close handlers prevent Style panel clicks from
 * dismissing the menu after the user right-clicks open it.
 */

"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  stripPositioningAndWidth,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function ContextMenuRender(ctx: SnippetContext): React.ReactNode {
  const triggerCls = classesFor(ctx, "ContextMenuTrigger")
  const contentCls = classesFor(ctx, "ContextMenuContent")
  const labelCls = classesFor(ctx, "ContextMenuLabel")
  const itemCls = classesFor(ctx, "ContextMenuItem")
  const separatorCls = classesFor(ctx, "ContextMenuSeparator")
  const shortcutCls = classesFor(ctx, "ContextMenuShortcut")

  const triggerPath = pathFor(ctx, "ContextMenuTrigger")
  const contentPath = pathFor(ctx, "ContextMenuContent")
  const labelPath = pathFor(ctx, "ContextMenuLabel")
  const itemPath = pathFor(ctx, "ContextMenuItem")
  const separatorPath = pathFor(ctx, "ContextMenuSeparator")
  const shortcutPath = pathFor(ctx, "ContextMenuShortcut")

  return (
    /*
     * KEY: ContextMenu's Radix Root has no `open`/`modal` props
     * (it's right-click-only and always modal). To get an
     * always-visible, non-pointer-stealing version for the canvas,
     * we render the surface using DropdownMenuPrimitive instead
     * (same react-menu base, supports `open`+`modal={false}`),
     * and visually anchor the trigger as a right-click drop-zone.
     * Same swap trick as AlertDialog → DialogPrimitive.
     *
     * The composition tree below still names everything
     * `ContextMenu*` so the parser routes round-trip correctly.
     */
    <DropdownMenuPrimitive.Root open={true} modal={false}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DropdownMenuPrimitive.Trigger asChild>
          <div
            data-node-id={triggerPath}
            className={withSelectionRing(
              cn(
                "flex h-[10rem] w-[18rem] items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground select-none",
                triggerCls,
              ),
              ctx.selectedPath === triggerPath,
            )}
          >
            Right click here
          </div>
        </DropdownMenuPrimitive.Trigger>
      </div>
      {ctx.container && (
        <DropdownMenuPrimitive.Portal container={ctx.container}>
          <DropdownMenuPrimitive.Content
            data-node-id={contentPath}
            sideOffset={8}
            className={withSelectionRing(
              cn("z-50 w-[14rem]", stripPositioningAndWidth(contentCls)),
              ctx.selectedPath === contentPath,
            )}
          >
            <DropdownMenuPrimitive.Label
              data-node-id={labelPath}
              className={withSelectionRing(
                labelCls,
                ctx.selectedPath === labelPath,
              )}
            >
              Page navigation
            </DropdownMenuPrimitive.Label>
            <DropdownMenuPrimitive.Separator
              data-node-id={separatorPath}
              className={withSelectionRing(
                separatorCls,
                ctx.selectedPath === separatorPath,
              )}
            />
            <DropdownMenuPrimitive.Item
              data-node-id={itemPath}
              className={withSelectionRing(
                itemCls,
                ctx.selectedPath === itemPath,
              )}
            >
              Back
              <span
                data-node-id={shortcutPath}
                className={withSelectionRing(
                  shortcutCls,
                  ctx.selectedPath === shortcutPath,
                )}
              >
                ⌘[
              </span>
            </DropdownMenuPrimitive.Item>
            <DropdownMenuPrimitive.Item className={itemCls}>
              Forward
              <span className={shortcutCls}>⌘]</span>
            </DropdownMenuPrimitive.Item>
            <DropdownMenuPrimitive.Item className={itemCls}>
              Reload
              <span className={shortcutCls}>⌘R</span>
            </DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      )}
    </DropdownMenuPrimitive.Root>
  )
}

export const contextMenuRule: CompositionRule = {
  slug: "context-menu",
  source:
    "https://ui.shadcn.com/docs/components/context-menu (fetched 2026-04-09)",
  composition: {
    name: "ContextMenu",
    children: [
      { name: "ContextMenuTrigger" },
      {
        name: "ContextMenuContent",
        // Portal-wrapped. Real Content primitive is at [0].
        stylePath: [0],
        children: [
          { name: "ContextMenuLabel" },
          { name: "ContextMenuSeparator" },
          { name: "ContextMenuItem" },
          { name: "ContextMenuShortcut" },
        ],
      },
    ],
  },
  render: ContextMenuRender,
}
