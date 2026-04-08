/**
 * Dialog composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/dialog
 * Fetched: 2026-04-08
 *
 * Docs Usage example:
 *
 *     <Dialog>
 *       <DialogTrigger>Open</DialogTrigger>
 *       <DialogContent>
 *         <DialogHeader>
 *           <DialogTitle>Are you absolutely sure?</DialogTitle>
 *           <DialogDescription>...</DialogDescription>
 *         </DialogHeader>
 *         <DialogFooter>...</DialogFooter>
 *       </DialogContent>
 *     </Dialog>
 *
 * ## Implementation notes
 *
 * We use raw Radix primitives instead of `components/ui/dialog.tsx`
 * because:
 *
 * 1. The shadcn `DialogContent` hardcodes `<DialogPortal>` without
 *    exposing a `container` prop, so we can't scope the Portal to
 *    the canvas.
 * 2. The shadcn `DialogContent` hardcodes `fixed` positioning
 *    (`fixed top-[50%] left-[50%] ...`) which positions relative
 *    to the viewport and escapes the canvas.
 *
 * By using raw `DialogPrimitive.*` we control the Portal container
 * and can use `absolute` positioning instead. The className we
 * bind to each element comes from the parsed tree — so user edits
 * in the Style panel ARE applied, but our base positioning ensures
 * the dialog stays inside the canvas.
 *
 * ## Interactive state
 *
 * - `open={true}` by default so the content is visible on the canvas
 * - `modal={false}` disables Radix's focus trap + pointer-outside
 *   behaviour so clicking the Style panel doesn't close the dialog
 * - `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside`
 *   all prevented — the Dialog only closes via the trigger button
 *   or the explicit close X
 * - The real backdrop is rendered via the user's `DialogOverlay`
 *   sub-component (className bound to parsed tree) so backdrop
 *   edits are live
 */

"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  classesFor,
  classesForDescended,
  pathFor,
  stripPositioningAndWidth,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function DialogRender(ctx: SnippetContext): React.ReactNode {
  return <DialogRenderImpl ctx={ctx} />
}

function DialogRenderImpl({ ctx }: { ctx: SnippetContext }): React.ReactNode {
  const [open, setOpen] = React.useState(true)

  const triggerCls = classesFor(ctx, "DialogTrigger")
  // DialogOverlay + DialogContent in source are Portal-wrapped —
  // their root JSX is DialogPortal (empty classes) with the real
  // styleable classes on the nested Radix primitive. Use the
  // descended helper to walk into the parts tree and pull the
  // actual classes.
  const overlayCls = classesForDescended(ctx, "DialogOverlay")
  const contentCls = classesForDescended(ctx, "DialogContent")
  const headerCls = classesFor(ctx, "DialogHeader")
  const footerCls = classesFor(ctx, "DialogFooter")
  const titleCls = classesFor(ctx, "DialogTitle")
  const descriptionCls = classesFor(ctx, "DialogDescription")
  const closeCls = classesFor(ctx, "DialogClose")

  const triggerPath = pathFor("DialogTrigger")
  const overlayPath = pathFor("DialogOverlay")
  const contentPath = pathFor("DialogContent")
  const headerPath = pathFor("DialogHeader")
  const footerPath = pathFor("DialogFooter")
  const titlePath = pathFor("DialogTitle")
  const descriptionPath = pathFor("DialogDescription")
  const closePath = pathFor("DialogClose")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      {/*
       * Center the trigger in the canvas box so the user sees it
       * where they'd click it in a real app. Absolute-positioned
       * over the canvas centre at z-0 so the Dialog content +
       * overlay render cleanly on top when open.
       */}
      <div className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <DialogPrimitive.Trigger asChild>
          <Button
            variant="outline"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Open Dialog
          </Button>
        </DialogPrimitive.Trigger>
      </div>
      {ctx.container && open && (
        <DialogPrimitive.Portal container={ctx.container}>
          {/*
           * IMPORTANT: we render the overlay as a plain <div>, NOT
           * via DialogPrimitive.Overlay. Reason: Radix's built-in
           * Overlay component returns null when the Dialog Root is
           * `modal={false}` (which we need to keep the Style panel
           * clickable while the Dialog is open). A plain <div> is
           * always visible, carries the user's DialogOverlay
           * className bindings from the parsed tree, and still has
           * a `data-node-id` matching `sub:DialogOverlay/` so the
           * click-to-select handler routes edits to the right
           * sub-component.
           */}
          <div
            data-node-id={overlayPath}
            className={withSelectionRing(
              cn(
                "absolute inset-0 z-40 bg-black/50",
                stripPositioningAndWidth(overlayCls),
              ),
              ctx.selectedPath === overlayPath,
            )}
          />
          <DialogPrimitive.Content
            data-node-id={contentPath}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={withSelectionRing(
              // Strip positioning + width classes from the source
              // string so our canvas-specific positioning wins. The
              // user's styling edits for other properties (bg, padding,
              // border, shadow, text, etc.) come through normally.
              // `bg-background` is hardcoded as a safety net so the
              // content is always opaque and the trigger behind it
              // can never bleed through.
              cn(
                "absolute top-1/2 left-1/2 z-50 grid w-[28rem] -translate-x-1/2 -translate-y-1/2 bg-background",
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
              <DialogPrimitive.Title
                data-node-id={titlePath}
                className={withSelectionRing(
                  titleCls,
                  ctx.selectedPath === titlePath,
                )}
              >
                Are you absolutely sure?
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                data-node-id={descriptionPath}
                className={withSelectionRing(
                  descriptionCls,
                  ctx.selectedPath === descriptionPath,
                )}
              >
                This action cannot be undone. This will permanently delete
                your account and remove your data from our servers.
              </DialogPrimitive.Description>
            </div>
            <div
              data-node-id={footerPath}
              className={withSelectionRing(
                footerCls,
                ctx.selectedPath === footerPath,
              )}
            >
              <Button variant="outline">Cancel</Button>
              <Button>Continue</Button>
            </div>
            <DialogPrimitive.Close
              data-node-id={closePath}
              className={withSelectionRing(
                cn(
                  "absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100",
                  closeCls,
                ),
                ctx.selectedPath === closePath,
              )}
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  )
}

export const dialogRule: CompositionRule = {
  slug: "dialog",
  source:
    "https://ui.shadcn.com/docs/components/dialog (fetched 2026-04-08)",
  composition: {
    name: "Dialog",
    children: [
      { name: "DialogTrigger" },
      {
        name: "DialogContent",
        children: [
          {
            name: "DialogHeader",
            children: [{ name: "DialogTitle" }, { name: "DialogDescription" }],
          },
          {
            name: "DialogFooter",
          },
        ],
      },
    ],
  },
  render: DialogRender,
}
