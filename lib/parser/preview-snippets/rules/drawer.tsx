/**
 * Drawer composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/drawer
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Drawer>
 *       <DrawerTrigger>Open</DrawerTrigger>
 *       <DrawerContent>
 *         <DrawerHeader>
 *           <DrawerTitle>Are you absolutely sure?</DrawerTitle>
 *           <DrawerDescription>...</DrawerDescription>
 *         </DrawerHeader>
 *         <DrawerFooter>
 *           <Button>Submit</Button>
 *           <DrawerClose>Cancel</DrawerClose>
 *         </DrawerFooter>
 *       </DrawerContent>
 *     </Drawer>
 *
 * ## Implementation notes
 *
 * Drawer wraps `vaul`'s Drawer primitive (not Radix). Same
 * Portal-wrapped structure as Dialog: `DrawerPortal >
 * DrawerOverlay + DrawerPrimitive.Content`. `stylePath: [1]`.
 *
 * Vaul's drawer slides from the bottom by default (`direction="bottom"`).
 * The source uses `data-[vaul-drawer-direction=*]` classes to
 * conditionally position based on direction. We hardcode
 * bottom-direction positioning for the canvas preview and strip
 * source positioning classes to avoid conflicts.
 *
 * `shouldScaleBackground={false}` prevents vaul from scaling the
 * body background (which would look weird on the canvas), and
 * `open={true}` + `modal={false}` + blocked close handlers keep
 * the drawer visible for styling.
 */

"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

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

function DrawerRender(ctx: SnippetContext): React.ReactNode {
  return <DrawerRenderImpl ctx={ctx} />
}

function DrawerRenderImpl({ ctx }: { ctx: SnippetContext }): React.ReactNode {
  const [open, setOpen] = React.useState(true)

  const triggerCls = classesFor(ctx, "DrawerTrigger")
  const overlayCls = classesFor(ctx, "DrawerOverlay")
  const contentCls = classesFor(ctx, "DrawerContent")
  const headerCls = classesFor(ctx, "DrawerHeader")
  const footerCls = classesFor(ctx, "DrawerFooter")
  const titleCls = classesFor(ctx, "DrawerTitle")
  const descriptionCls = classesFor(ctx, "DrawerDescription")

  const triggerPath = pathFor(ctx, "DrawerTrigger")
  const overlayPath = pathFor(ctx, "DrawerOverlay")
  const contentPath = pathFor(ctx, "DrawerContent")
  const headerPath = pathFor(ctx, "DrawerHeader")
  const footerPath = pathFor(ctx, "DrawerFooter")
  const titlePath = pathFor(ctx, "DrawerTitle")
  const descriptionPath = pathFor(ctx, "DrawerDescription")

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      modal={false}
      direction="bottom"
      shouldScaleBackground={false}
    >
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <DrawerPrimitive.Trigger asChild>
          <Button
            variant="outline"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Open Drawer
          </Button>
        </DrawerPrimitive.Trigger>
      </div>
      {ctx.container && open && (
        <DrawerPrimitive.Portal container={ctx.container}>
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
          <DrawerPrimitive.Content
            data-node-id={contentPath}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={withSelectionRing(
              // Hardcode bottom-slide positioning for the canvas.
              // Inset-x-0 bottom-0 pins to bottom edge; rounded-t-lg
              // + border-t for the bottom-drawer look.
              cn(
                "absolute inset-x-0 bottom-0 z-50 flex h-auto max-h-[80%] flex-col rounded-t-lg border-t bg-background",
                stripPositioningAndWidth(contentCls),
              ),
              ctx.selectedPath === contentPath,
            )}
          >
            {/* Drag handle indicator — the little pill at the top */}
            <div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
            <div
              data-node-id={headerPath}
              className={withSelectionRing(
                cn("text-center", headerCls),
                ctx.selectedPath === headerPath,
              )}
            >
              <DrawerPrimitive.Title
                data-node-id={titlePath}
                className={withSelectionRing(
                  titleCls,
                  ctx.selectedPath === titlePath,
                )}
              >
                Are you absolutely sure?
              </DrawerPrimitive.Title>
              <DrawerPrimitive.Description
                data-node-id={descriptionPath}
                className={withSelectionRing(
                  descriptionCls,
                  ctx.selectedPath === descriptionPath,
                )}
              >
                This action cannot be undone.
              </DrawerPrimitive.Description>
            </div>
            <div
              data-node-id={footerPath}
              className={withSelectionRing(
                footerCls,
                ctx.selectedPath === footerPath,
              )}
            >
              <Button>Submit</Button>
              <DrawerPrimitive.Close asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerPrimitive.Close>
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      )}
    </DrawerPrimitive.Root>
  )
}

export const drawerRule: CompositionRule = {
  slug: "drawer",
  source: "https://ui.shadcn.com/docs/components/drawer (fetched 2026-04-09)",
  composition: {
    name: "Drawer",
    children: [
      { name: "DrawerTrigger" },
      {
        name: "DrawerContent",
        // Same Portal-wrapped shape as DialogContent. Real vaul
        // Content primitive at children[1] (after Overlay at [0]).
        stylePath: [1],
        children: [
          {
            name: "DrawerHeader",
            children: [
              { name: "DrawerTitle" },
              { name: "DrawerDescription" },
            ],
          },
          { name: "DrawerFooter" },
        ],
      },
    ],
  },
  render: DrawerRender,
}
