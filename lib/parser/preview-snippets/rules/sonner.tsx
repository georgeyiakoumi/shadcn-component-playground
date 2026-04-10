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
 * Sonner's real `toast()` function broadcasts to ALL mounted
 * `<Toaster />` instances, and the app layout already has one at
 * the root. Using the real API would fire duplicate toasts (one in
 * the canvas, one at the bottom-right of the viewport).
 *
 * Instead, this rule renders a **static fake toast** inside the
 * canvas that toggles on button click. The visual matches sonner's
 * output (the same CSS custom properties the real Toaster uses:
 * `--normal-bg`, `--normal-text`, `--normal-border`, etc.) so the
 * user sees exactly what a toast looks like without leaving the
 * canvas. Clicking the button again hides it.
 */

"use client"

import * as React from "react"
import { CircleCheckIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SonnerRender(ctx: SnippetContext): React.ReactNode {
  const toasterPath = pathFor(ctx, "Toaster")
  const [visible, setVisible] = React.useState(false)
  // Track whether the toast is mounted (for exit animation)
  const [mounted, setMounted] = React.useState(false)

  const handleToggle = React.useCallback(() => {
    if (visible) {
      // Start exit animation, unmount after it finishes
      setVisible(false)
      setTimeout(() => setMounted(false), 300)
    } else {
      // Mount then trigger entrance animation on next frame
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    }
  }, [visible])

  const handleDismiss = React.useCallback(() => {
    setVisible(false)
    setTimeout(() => setMounted(false), 300)
  }, [])

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        data-node-id={toasterPath}
        className={withSelectionRing(
          "flex flex-col items-center gap-6",
          ctx.selectedPath === toasterPath,
        )}
      >
        <Button variant="outline" onClick={handleToggle}>
          Show Toast
        </Button>

        {mounted && (
          <div
            className="w-[22rem] rounded-lg border bg-background p-4 shadow-lg transition-all duration-300 ease-out"
            style={{
              borderColor: "var(--border)",
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0)"
                : "translateY(0.5rem)",
            }}
          >
            <div className="flex items-start gap-3">
              <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" />
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold">
                  Event has been created
                </p>
                <p className="text-sm text-muted-foreground">
                  Sunday, April 10, 2026 at 9:00 AM
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-md p-0.5 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}
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
