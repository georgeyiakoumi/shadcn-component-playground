/**
 * Menubar composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/menubar
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <Menubar>
 *       <MenubarMenu>
 *         <MenubarTrigger>File</MenubarTrigger>
 *         <MenubarContent>
 *           <MenubarItem>New Tab <MenubarShortcut>⌘T</MenubarShortcut></MenubarItem>
 *           <MenubarItem>New Window</MenubarItem>
 *           <MenubarSeparator />
 *           <MenubarItem>Print...</MenubarItem>
 *         </MenubarContent>
 *       </MenubarMenu>
 *       <MenubarMenu>
 *         <MenubarTrigger>Edit</MenubarTrigger>
 *         <MenubarContent>...</MenubarContent>
 *       </MenubarMenu>
 *     </Menubar>
 *
 * ## Implementation notes
 *
 * Hybrid: the bar itself is inline (a horizontal flex container of
 * MenubarTrigger buttons), and ONE MenubarContent at a time is
 * Portal-wrapped + popper-positioned below its trigger.
 *
 * To force one menu open in the canvas we set
 * `defaultValue="file"` on the Root and matching `value="file"` on
 * the first MenubarMenu — Radix uses this to know which menu is
 * currently open.
 *
 * `stylePath: [0]` on MenubarContent — Portal-wrapped (via the
 * MenubarPortal helper).
 *
 * Trigger and Content classes need to be visible/styleable for the
 * primary File menu; the secondary Edit/View menus are rendered
 * with raw class strings (no `data-node-id`) so the user only
 * styles each sub-component once.
 */

"use client"

import * as React from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  stripPositioningAndWidth,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function MenubarRender(ctx: SnippetContext): React.ReactNode {
  const menubarCls = classesFor(ctx, "Menubar")
  const triggerCls = classesFor(ctx, "MenubarTrigger")
  const contentCls = classesFor(ctx, "MenubarContent")
  const itemCls = classesFor(ctx, "MenubarItem")
  const separatorCls = classesFor(ctx, "MenubarSeparator")
  const shortcutCls = classesFor(ctx, "MenubarShortcut")

  const menubarPath = pathFor(ctx, "Menubar")
  const triggerPath = pathFor(ctx, "MenubarTrigger")
  const contentPath = pathFor(ctx, "MenubarContent")
  const itemPath = pathFor(ctx, "MenubarItem")
  const separatorPath = pathFor(ctx, "MenubarSeparator")
  const shortcutPath = pathFor(ctx, "MenubarShortcut")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      {/*
        Controlled `value="file"` (no `onValueChange`) locks the
        File menu open permanently — Radix has no way to flip it
        closed. Menubar doesn't expose a `modal` prop, but with the
        menu locked open the body's pointer-events lock isn't a
        problem because no outside-click ever triggers a dismiss
        cycle.
      */}
      <MenubarPrimitive.Root
        value="file"
        data-node-id={menubarPath}
        className={withSelectionRing(
          menubarCls,
          ctx.selectedPath === menubarPath,
        )}
      >
        <MenubarPrimitive.Menu value="file">
          <MenubarPrimitive.Trigger
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            File
          </MenubarPrimitive.Trigger>
          {ctx.container && (
            <MenubarPrimitive.Portal container={ctx.container}>
              <MenubarPrimitive.Content
                data-node-id={contentPath}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className={withSelectionRing(
                  cn("z-50", stripPositioningAndWidth(contentCls)),
                  ctx.selectedPath === contentPath,
                )}
              >
                <MenubarPrimitive.Item
                  data-node-id={itemPath}
                  className={withSelectionRing(
                    itemCls,
                    ctx.selectedPath === itemPath,
                  )}
                >
                  New Tab
                  <span
                    data-node-id={shortcutPath}
                    className={withSelectionRing(
                      shortcutCls,
                      ctx.selectedPath === shortcutPath,
                    )}
                  >
                    ⌘T
                  </span>
                </MenubarPrimitive.Item>
                <MenubarPrimitive.Item className={itemCls}>
                  New Window
                  <span className={shortcutCls}>⌘N</span>
                </MenubarPrimitive.Item>
                <MenubarPrimitive.Separator
                  data-node-id={separatorPath}
                  className={withSelectionRing(
                    separatorCls,
                    ctx.selectedPath === separatorPath,
                  )}
                />
                <MenubarPrimitive.Item className={itemCls}>
                  Print...
                  <span className={shortcutCls}>⌘P</span>
                </MenubarPrimitive.Item>
              </MenubarPrimitive.Content>
            </MenubarPrimitive.Portal>
          )}
        </MenubarPrimitive.Menu>
        <MenubarPrimitive.Menu>
          <MenubarPrimitive.Trigger className={triggerCls}>
            Edit
          </MenubarPrimitive.Trigger>
        </MenubarPrimitive.Menu>
        <MenubarPrimitive.Menu>
          <MenubarPrimitive.Trigger className={triggerCls}>
            View
          </MenubarPrimitive.Trigger>
        </MenubarPrimitive.Menu>
      </MenubarPrimitive.Root>
    </div>
  )
}

export const menubarRule: CompositionRule = {
  slug: "menubar",
  source: "https://ui.shadcn.com/docs/components/menubar (fetched 2026-04-09)",
  composition: {
    name: "Menubar",
    children: [
      { name: "MenubarTrigger" },
      {
        name: "MenubarContent",
        // Portal-wrapped via MenubarPortal helper. Real Content
        // primitive is at children[0] of the Portal.
        stylePath: [0],
        children: [
          { name: "MenubarItem" },
          { name: "MenubarSeparator" },
          { name: "MenubarShortcut" },
        ],
      },
    ],
  },
  render: MenubarRender,
}
