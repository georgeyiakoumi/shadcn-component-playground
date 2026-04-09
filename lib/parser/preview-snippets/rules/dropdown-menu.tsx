/**
 * DropdownMenu composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/dropdown-menu
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <DropdownMenu>
 *       <DropdownMenuTrigger asChild>
 *         <Button variant="outline">Open</Button>
 *       </DropdownMenuTrigger>
 *       <DropdownMenuContent>
 *         <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *         <DropdownMenuSeparator />
 *         <DropdownMenuGroup>
 *           <DropdownMenuItem>Profile <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
 *           <DropdownMenuItem>Billing <DropdownMenuShortcut>⌘B</DropdownMenuShortcut></DropdownMenuItem>
 *           <DropdownMenuItem>Settings <DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
 *         </DropdownMenuGroup>
 *         <DropdownMenuSeparator />
 *         <DropdownMenuItem>Log out</DropdownMenuItem>
 *       </DropdownMenuContent>
 *     </DropdownMenu>
 *
 * ## Implementation notes
 *
 * Floating family — same recipe as Popover. Radix Popper positions
 * Content; rule must NOT add absolute/fixed positioning.
 *
 * `defaultOpen={true}` (uncontrolled) so the menu is visible for
 * styling without us managing state. Blocked close handlers prevent
 * Style panel clicks from dismissing it.
 *
 * `stylePath: [0]` on DropdownMenuContent — the source wraps Content
 * inside `DropdownMenuPrimitive.Portal`, so the real Content
 * primitive is at children[0] of the Portal.
 *
 * We render a representative subset of items (Label, Group, Item,
 * Separator, Shortcut) but skip CheckboxItem / RadioItem / Sub /
 * SubContent — those are not in the canonical docs example and
 * including them would crowd the canvas. They still parse and
 * round-trip via the flat path; only the canvas preview is
 * abbreviated.
 */

"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

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

function DropdownMenuRender(ctx: SnippetContext): React.ReactNode {
  const triggerCls = classesFor(ctx, "DropdownMenuTrigger")
  const contentCls = classesFor(ctx, "DropdownMenuContent")
  const labelCls = classesFor(ctx, "DropdownMenuLabel")
  const groupCls = classesFor(ctx, "DropdownMenuGroup")
  const itemCls = classesFor(ctx, "DropdownMenuItem")
  const separatorCls = classesFor(ctx, "DropdownMenuSeparator")
  const shortcutCls = classesFor(ctx, "DropdownMenuShortcut")

  const triggerPath = pathFor(ctx, "DropdownMenuTrigger")
  const contentPath = pathFor(ctx, "DropdownMenuContent")
  const labelPath = pathFor(ctx, "DropdownMenuLabel")
  const groupPath = pathFor(ctx, "DropdownMenuGroup")
  const itemPath = pathFor(ctx, "DropdownMenuItem")
  const separatorPath = pathFor(ctx, "DropdownMenuSeparator")
  const shortcutPath = pathFor(ctx, "DropdownMenuShortcut")

  return (
    /*
     * Controlled `open={true}` (locked open) so Radix can never
     * close. Combined with `modal={false}` so the menu doesn't
     * apply `pointer-events: none` to the rest of the document
     * (which would disable Style panel + Assembly panel clicks).
     * No `onOpenChange` — the trigger click is purely a styling
     * affordance; the menu is always visible.
     */
    <DropdownMenuPrimitive.Root open={true} modal={false}>
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <DropdownMenuPrimitive.Trigger asChild>
          <Button
            variant="outline"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Open
          </Button>
        </DropdownMenuPrimitive.Trigger>
      </div>
      {ctx.container && (
        <DropdownMenuPrimitive.Portal container={ctx.container}>
          <DropdownMenuPrimitive.Content
            data-node-id={contentPath}
            sideOffset={8}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={withSelectionRing(
              cn(
                "z-50 w-[14rem]",
                stripPositioningAndWidth(contentCls),
              ),
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
              My Account
            </DropdownMenuPrimitive.Label>
            <DropdownMenuPrimitive.Separator
              data-node-id={separatorPath}
              className={withSelectionRing(
                separatorCls,
                ctx.selectedPath === separatorPath,
              )}
            />
            <DropdownMenuPrimitive.Group
              data-node-id={groupPath}
              className={withSelectionRing(
                groupCls,
                ctx.selectedPath === groupPath,
              )}
            >
              <DropdownMenuPrimitive.Item
                data-node-id={itemPath}
                className={withSelectionRing(
                  itemCls,
                  ctx.selectedPath === itemPath,
                )}
              >
                Profile
                <span
                  data-node-id={shortcutPath}
                  className={withSelectionRing(
                    shortcutCls,
                    ctx.selectedPath === shortcutPath,
                  )}
                >
                  ⇧⌘P
                </span>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item className={itemCls}>
                Billing
                <span className={shortcutCls}>⌘B</span>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item className={itemCls}>
                Settings
                <span className={shortcutCls}>⌘S</span>
              </DropdownMenuPrimitive.Item>
            </DropdownMenuPrimitive.Group>
            <DropdownMenuPrimitive.Separator className={separatorCls} />
            <DropdownMenuPrimitive.Item className={itemCls}>
              Log out
            </DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      )}
    </DropdownMenuPrimitive.Root>
  )
}

export const dropdownMenuRule: CompositionRule = {
  slug: "dropdown-menu",
  source:
    "https://ui.shadcn.com/docs/components/dropdown-menu (fetched 2026-04-09)",
  composition: {
    name: "DropdownMenu",
    children: [
      { name: "DropdownMenuTrigger" },
      {
        name: "DropdownMenuContent",
        // Portal-wrapped. Real Content primitive is at [0].
        stylePath: [0],
        children: [
          { name: "DropdownMenuLabel" },
          { name: "DropdownMenuSeparator" },
          {
            name: "DropdownMenuGroup",
            children: [
              { name: "DropdownMenuItem" },
              { name: "DropdownMenuShortcut" },
            ],
          },
        ],
      },
    ],
  },
  render: DropdownMenuRender,
}
