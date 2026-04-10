/**
 * Sonner (Toaster) composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/sonner
 * Fetched: 2026-04-10
 *
 * Docs canonical example:
 *
 *     import { toast } from "sonner"
 *
 *     <Button onClick={() => toast("Event has been created.")}>
 *       Show Toast
 *     </Button>
 *
 * ## Implementation notes
 *
 * The `<Toaster />` export is a provider that mounts at the app root.
 * Toasts appear when `toast()` is called at runtime. The rule renders
 * a "Show Toast" button + a scoped `<Toaster />` instance so the
 * user can click the button and see a real toast appear on the canvas.
 *
 * The Toaster is imported from the real shadcn component (same trick
 * as Calendar / Carousel) so it renders with the correct styles.
 */

"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SonnerRender(ctx: SnippetContext): React.ReactNode {
  const toasterPath = pathFor(ctx, "Toaster")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        data-node-id={toasterPath}
        className={withSelectionRing(
          "flex flex-col items-center gap-4",
          ctx.selectedPath === toasterPath,
        )}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast("Event has been created.", {
              description: "Sunday, April 10, 2026 at 9:00 AM",
            })
          }
        >
          Show Toast
        </Button>
      </div>
    </div>
  )
}

export const sonnerRule: CompositionRule = {
  slug: "sonner",
  source: "https://ui.shadcn.com/docs/components/sonner (fetched 2026-04-10)",
  composition: {
    name: "Toaster",
  },
  render: SonnerRender,
}
