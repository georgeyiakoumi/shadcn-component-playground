/**
 * Sheet composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/sheet
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Sheet>
 *       <SheetTrigger asChild>
 *         <Button variant="outline">Open</Button>
 *       </SheetTrigger>
 *       <SheetContent>
 *         <SheetHeader>
 *           <SheetTitle>Edit profile</SheetTitle>
 *           <SheetDescription>...</SheetDescription>
 *         </SheetHeader>
 *         <SheetFooter>
 *           <Button>Save changes</Button>
 *         </SheetFooter>
 *       </SheetContent>
 *     </Sheet>
 *
 * ## Implementation notes
 *
 * Sheet is literally Dialog under the hood — `SheetPrimitive` is
 * an alias for `Dialog as SheetPrimitive`. Same Portal-wrapped
 * structure as Dialog/AlertDialog with SheetOverlay +
 * SheetPrimitive.Content inside the Portal.
 *
 * Difference from Dialog: Sheet slides in from a side (default
 * `right`). The source conditionally applies positioning classes
 * based on a `side` prop. Our canvas hardcodes the right-side
 * positioning via base classes and drops the source's
 * position/size classes via `stripPositioningAndWidth` so they
 * don't conflict.
 *
 * - `stylePath: [1]` on SheetContent (same as DialogContent)
 * - `open={true}` + `modal={false}` + blocked close handlers
 * - Overlay rendered as plain `<div>` (Radix's Overlay returns
 *   null for non-modal dialogs)
 */

"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

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

function SheetRender(ctx: SnippetContext): React.ReactNode {
  return <SheetRenderImpl ctx={ctx} />
}

function SheetRenderImpl({ ctx }: { ctx: SnippetContext }): React.ReactNode {
  const [open, setOpen] = React.useState(true)

  const triggerCls = classesFor(ctx, "SheetTrigger")
  const overlayCls = classesFor(ctx, "SheetOverlay")
  const contentCls = classesFor(ctx, "SheetContent")
  const headerCls = classesFor(ctx, "SheetHeader")
  const footerCls = classesFor(ctx, "SheetFooter")
  const titleCls = classesFor(ctx, "SheetTitle")
  const descriptionCls = classesFor(ctx, "SheetDescription")

  const triggerPath = pathFor(ctx, "SheetTrigger")
  const overlayPath = pathFor(ctx, "SheetOverlay")
  const contentPath = pathFor(ctx, "SheetContent")
  const headerPath = pathFor(ctx, "SheetHeader")
  const footerPath = pathFor(ctx, "SheetFooter")
  const titlePath = pathFor(ctx, "SheetTitle")
  const descriptionPath = pathFor(ctx, "SheetDescription")

  return (
    <SheetPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <SheetPrimitive.Trigger asChild>
          <Button
            variant="outline"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Open Sheet
          </Button>
        </SheetPrimitive.Trigger>
      </div>
      {ctx.container && open && (
        <SheetPrimitive.Portal container={ctx.container}>
          <div
            data-node-id={overlayPath}
            className={withSelectionRing(
              cn(
                // pointer-events-none is critical — without it, the
                // backdrop hijacks every click on the canvas area.
                "pointer-events-none absolute inset-0 z-40 bg-black/50",
                stripPositioningAndWidth(overlayCls),
              ),
              ctx.selectedPath === overlayPath,
            )}
          />
          <SheetPrimitive.Content
            data-node-id={contentPath}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={withSelectionRing(
              // Hardcode right-side positioning. Full height of
              // the canvas, pinned to the right edge, max-width
              // like a real sheet. Source positioning/width
              // classes are stripped so our hardcoded layout
              // wins.
              cn(
                "absolute inset-y-0 right-0 z-50 flex h-full w-[24rem] flex-col gap-4 border-l bg-background shadow-lg",
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
              <SheetPrimitive.Title
                data-node-id={titlePath}
                className={withSelectionRing(
                  titleCls,
                  ctx.selectedPath === titlePath,
                )}
              >
                Edit profile
              </SheetPrimitive.Title>
              <SheetPrimitive.Description
                data-node-id={descriptionPath}
                className={withSelectionRing(
                  descriptionCls,
                  ctx.selectedPath === descriptionPath,
                )}
              >
                Make changes to your profile here. Click save when you&apos;re
                done.
              </SheetPrimitive.Description>
            </div>
            <div className="flex-1 px-4">
              <p className="text-sm text-muted-foreground">
                Sheet body content goes here.
              </p>
            </div>
            <div
              data-node-id={footerPath}
              className={withSelectionRing(
                footerCls,
                ctx.selectedPath === footerPath,
              )}
            >
              <Button>Save changes</Button>
            </div>
            <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      )}
    </SheetPrimitive.Root>
  )
}

export const sheetRule: CompositionRule = {
  slug: "sheet",
  source: "https://ui.shadcn.com/docs/components/sheet (fetched 2026-04-09)",
  composition: {
    name: "Sheet",
    children: [
      { name: "SheetTrigger" },
      {
        name: "SheetContent",
        // Portal-wrapped. Same structure as DialogContent, real
        // classes at children[1].
        stylePath: [1],
        children: [
          {
            name: "SheetHeader",
            children: [{ name: "SheetTitle" }, { name: "SheetDescription" }],
          },
          { name: "SheetFooter" },
        ],
      },
    ],
  },
  render: SheetRender,
}
