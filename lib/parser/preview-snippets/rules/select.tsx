/**
 * Select composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/select
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Select>
 *       <SelectTrigger className="w-[180px]">
 *         <SelectValue placeholder="Select a fruit" />
 *       </SelectTrigger>
 *       <SelectContent>
 *         <SelectGroup>
 *           <SelectLabel>Fruits</SelectLabel>
 *           <SelectItem value="apple">Apple</SelectItem>
 *           <SelectItem value="banana">Banana</SelectItem>
 *           <SelectItem value="blueberry">Blueberry</SelectItem>
 *         </SelectGroup>
 *       </SelectContent>
 *     </Select>
 *
 * ## Implementation notes
 *
 * KEY: Radix Select is hard-locked to modal mode (RemoveScroll +
 * FocusScope + aria-hidden on siblings). With the canvas preview
 * forced open this would block all clicks on the Style and
 * Assembly panels. There's no `modal={false}` escape hatch.
 *
 * Same trick as AlertDialog → DialogPrimitive and ContextMenu →
 * DropdownMenuPrimitive: render the surface using
 * DropdownMenuPrimitive (supports `modal={false}` + `open={true}`)
 * but name everything `Select*` in the composition tree so the
 * parser still routes round-trip correctly.
 *
 * The trigger is a styled button with `SelectTrigger`'s source
 * classes + a chevron. The listbox is a DropdownMenu surface
 * with `SelectItem`-classed items.
 *
 * Because we're not using real `SelectPrimitive`, there's no
 * `SelectViewport` rendered — DropdownMenu's Content scrolls
 * itself. The composition tree omits Viewport for this reason.
 *
 * Items use `onSelect={(e) => e.preventDefault()}` so clicking
 * an item doesn't try to close the (controlled-open) menu.
 *
 * `stylePath: [0]` on SelectContent because in real shadcn source
 * SelectContent is `SelectPrimitive.Portal > SelectPrimitive.Content`
 * — the parser still sees the Portal wrapper, so the style writes
 * need to skip into children[0]. This rule doesn't ACTUALLY use
 * a Portal wrapper in source-shape, but the round-trip parser
 * does, so the stylePath stays.
 */

"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
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

function SelectRender(ctx: SnippetContext): React.ReactNode {
  const triggerCls = classesFor(ctx, "SelectTrigger")
  const contentCls = classesFor(ctx, "SelectContent")
  const groupCls = classesFor(ctx, "SelectGroup")
  const labelCls = classesFor(ctx, "SelectLabel")
  const itemCls = classesFor(ctx, "SelectItem")
  const separatorCls = classesFor(ctx, "SelectSeparator")

  const triggerPath = pathFor(ctx, "SelectTrigger")
  const contentPath = pathFor(ctx, "SelectContent")
  const groupPath = pathFor(ctx, "SelectGroup")
  const labelPath = pathFor(ctx, "SelectLabel")
  const itemPath = pathFor(ctx, "SelectItem")
  const separatorPath = pathFor(ctx, "SelectSeparator")

  return (
    <DropdownMenuPrimitive.Root open={true} modal={false}>
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            data-node-id={triggerPath}
            data-size="default"
            className={withSelectionRing(
              cn("w-[12rem]", triggerCls),
              ctx.selectedPath === triggerPath,
            )}
          >
            <span>Apple</span>
            <ChevronDownIcon className="size-4 opacity-50" />
          </button>
        </DropdownMenuPrimitive.Trigger>
      </div>
      {ctx.container && (
        <DropdownMenuPrimitive.Portal container={ctx.container}>
          <DropdownMenuPrimitive.Content
            data-node-id={contentPath}
            sideOffset={8}
            className={withSelectionRing(
              cn("z-50 min-w-[12rem]", stripPositioningAndWidth(contentCls)),
              ctx.selectedPath === contentPath,
            )}
          >
            <DropdownMenuPrimitive.Group
              data-node-id={groupPath}
              className={withSelectionRing(
                groupCls,
                ctx.selectedPath === groupPath,
              )}
            >
              <DropdownMenuPrimitive.Label
                data-node-id={labelPath}
                className={withSelectionRing(
                  labelCls,
                  ctx.selectedPath === labelPath,
                )}
              >
                Fruits
              </DropdownMenuPrimitive.Label>
              <DropdownMenuPrimitive.Item
                data-node-id={itemPath}
                onSelect={(e) => e.preventDefault()}
                className={withSelectionRing(
                  itemCls,
                  ctx.selectedPath === itemPath,
                )}
              >
                Apple
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item
                onSelect={(e) => e.preventDefault()}
                className={itemCls}
              >
                Banana
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item
                onSelect={(e) => e.preventDefault()}
                className={itemCls}
              >
                Blueberry
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Separator
                data-node-id={separatorPath}
                className={withSelectionRing(
                  separatorCls,
                  ctx.selectedPath === separatorPath,
                )}
              />
              <DropdownMenuPrimitive.Item
                onSelect={(e) => e.preventDefault()}
                className={itemCls}
              >
                Grapes
              </DropdownMenuPrimitive.Item>
            </DropdownMenuPrimitive.Group>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      )}
    </DropdownMenuPrimitive.Root>
  )
}

export const selectRule: CompositionRule = {
  slug: "select",
  source: "https://ui.shadcn.com/docs/components/select (fetched 2026-04-09)",
  composition: {
    name: "Select",
    children: [
      { name: "SelectTrigger" },
      {
        name: "SelectContent",
        // Portal-wrapped in real source. Real Content primitive at [0].
        stylePath: [0],
        children: [
          {
            name: "SelectGroup",
            children: [
              { name: "SelectLabel" },
              { name: "SelectItem" },
              { name: "SelectSeparator" },
            ],
          },
        ],
      },
    ],
  },
  render: SelectRender,
}
