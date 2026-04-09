/**
 * AlertDialog composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/alert-dialog
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <AlertDialog>
 *       <AlertDialogTrigger asChild>
 *         <Button variant="outline">Show Dialog</Button>
 *       </AlertDialogTrigger>
 *       <AlertDialogContent>
 *         <AlertDialogHeader>
 *           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
 *           <AlertDialogDescription>...</AlertDialogDescription>
 *         </AlertDialogHeader>
 *         <AlertDialogFooter>
 *           <AlertDialogCancel>Cancel</AlertDialogCancel>
 *           <AlertDialogAction>Continue</AlertDialogAction>
 *         </AlertDialogFooter>
 *       </AlertDialogContent>
 *     </AlertDialog>
 *
 * ## Implementation notes
 *
 * Copy-paste of Dialog pattern with Action/Cancel buttons in the
 * footer. Same modal-family concerns:
 *
 * - `open={true}` + `modal={false}` + blocked close handlers so
 *   editing the Style panel doesn't dismiss the alert
 * - DialogOverlay rendered as plain `<div>` (Radix's Overlay
 *   returns null with `modal={false}`)
 * - `stylePath: [1]` on AlertDialogContent (Portal-wrapped, same
 *   as DialogContent) to route reads/writes to the nested
 *   primitive where classes live
 * - AlertDialogAction and AlertDialogCancel wrap Button via
 *   asChild, so their styleable classes are on the inner button
 *   — we render them directly as pre-styled Buttons with the
 *   cancel/action labels from docs
 */

"use client"

import * as React from "react"
/*
 * NOTE: we use `DialogPrimitive` under the hood for the canvas
 * preview, NOT `AlertDialogPrimitive`. Reason: Radix's
 * AlertDialogPrimitive is always modal by design (alert dialogs
 * are not dismissable via outside click for accessibility
 * reasons), which activates a focus trap that physically prevents
 * clicks on the Style panel, drag handles, assembly panel, etc.
 *
 * The visual + DOM structure is identical to Dialog, so we can
 * use DialogPrimitive + `modal={false}` to get the same look
 * with canvas-compatible interaction. The user's SOURCE still
 * uses AlertDialogPrimitive (the parser reads source truthfully),
 * and exports correctly. This substitution only affects the
 * live preview rendering.
 */
import { Dialog as DialogPrimitive } from "radix-ui"

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

function AlertDialogRender(ctx: SnippetContext): React.ReactNode {
  return <AlertDialogRenderImpl ctx={ctx} />
}

function AlertDialogRenderImpl({
  ctx,
}: {
  ctx: SnippetContext
}): React.ReactNode {
  const [open, setOpen] = React.useState(true)

  const triggerCls = classesFor(ctx, "AlertDialogTrigger")
  const overlayCls = classesFor(ctx, "AlertDialogOverlay")
  const contentCls = classesFor(ctx, "AlertDialogContent")
  const headerCls = classesFor(ctx, "AlertDialogHeader")
  const footerCls = classesFor(ctx, "AlertDialogFooter")
  const titleCls = classesFor(ctx, "AlertDialogTitle")
  const descriptionCls = classesFor(ctx, "AlertDialogDescription")
  const cancelCls = classesFor(ctx, "AlertDialogCancel")
  const actionCls = classesFor(ctx, "AlertDialogAction")

  const triggerPath = pathFor(ctx, "AlertDialogTrigger")
  const overlayPath = pathFor(ctx, "AlertDialogOverlay")
  const contentPath = pathFor(ctx, "AlertDialogContent")
  const headerPath = pathFor(ctx, "AlertDialogHeader")
  const footerPath = pathFor(ctx, "AlertDialogFooter")
  const titlePath = pathFor(ctx, "AlertDialogTitle")
  const descriptionPath = pathFor(ctx, "AlertDialogDescription")
  const cancelPath = pathFor(ctx, "AlertDialogCancel")
  const actionPath = pathFor(ctx, "AlertDialogAction")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
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
            Show Dialog
          </Button>
        </DialogPrimitive.Trigger>
      </div>
      {ctx.container && open && (
        <DialogPrimitive.Portal container={ctx.container}>
          {/* Plain <div> overlay — Radix's Overlay returns null for
              non-modal alerts, same trick as Dialog.
              `pointer-events-none` is CRITICAL — without it, the
              backdrop hijacks every click on the canvas area,
              blocking the style panel, assembly panel, drag
              handles, and trigger interactions. */}
          <div
            data-node-id={overlayPath}
            className={withSelectionRing(
              cn(
                "pointer-events-none absolute inset-0 z-40 bg-black/50",
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
              {/*
                AlertDialogCancel / AlertDialogAction don't exist
                on DialogPrimitive (we swapped DialogPrimitive in
                above so the canvas interactions work). Render
                Buttons directly so data-node-id still points at
                the right sub-components for selection.
              */}
              <Button
                variant="outline"
                data-node-id={cancelPath}
                className={withSelectionRing(
                  cancelCls,
                  ctx.selectedPath === cancelPath,
                )}
              >
                Cancel
              </Button>
              <Button
                data-node-id={actionPath}
                className={withSelectionRing(
                  actionCls,
                  ctx.selectedPath === actionPath,
                )}
              >
                Continue
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  )
}

export const alertDialogRule: CompositionRule = {
  slug: "alert-dialog",
  source:
    "https://ui.shadcn.com/docs/components/alert-dialog (fetched 2026-04-09)",
  composition: {
    name: "AlertDialog",
    children: [
      { name: "AlertDialogTrigger" },
      {
        name: "AlertDialogContent",
        // Portal-wrapped like DialogContent. Real classes at [1]
        // (after AlertDialogOverlay at [0]).
        stylePath: [1],
        children: [
          {
            name: "AlertDialogHeader",
            children: [
              { name: "AlertDialogTitle" },
              { name: "AlertDialogDescription" },
            ],
          },
          {
            name: "AlertDialogFooter",
            children: [
              { name: "AlertDialogCancel" },
              { name: "AlertDialogAction" },
            ],
          },
        ],
      },
    ],
  },
  render: AlertDialogRender,
}
