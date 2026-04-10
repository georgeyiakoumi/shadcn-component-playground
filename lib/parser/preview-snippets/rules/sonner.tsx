/**
 * Sonner (Toaster) composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/sonner
 * Fetched: 2026-04-09
 *
 * ## Implementation notes
 *
 * Sonner is a runtime-only toast component. The `<Toaster />` export
 * is a provider that mounts at the app root and only renders visible
 * toasts when `toast()` is called at runtime. There's no static
 * preview — the component has no visible DOM output on its own.
 *
 * The rule renders an informational placeholder card explaining this,
 * matching the style of the component's code panel so the user
 * understands why the canvas is intentionally empty. This is
 * preferable to a broken/empty canvas with no explanation.
 */

"use client"

import * as React from "react"
import { InfoIcon } from "lucide-react"

import {
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function SonnerRender(ctx: SnippetContext): React.ReactNode {
  const toasterPath = pathFor(ctx, "Toaster")

  return (
    <div className="absolute top-1/2 left-1/2 w-[24rem] -translate-x-1/2 -translate-y-1/2">
      <div
        data-node-id={toasterPath}
        className={withSelectionRing(
          "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
          ctx.selectedPath === toasterPath,
        )}
      >
        <div className="flex items-start gap-3">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Runtime component</p>
            <p className="text-sm text-muted-foreground">
              Toaster is a provider component that renders toasts when{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                toast()
              </code>{" "}
              is called. Add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {"<Toaster />"}
              </code>{" "}
              to your app layout to use it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const sonnerRule: CompositionRule = {
  slug: "sonner",
  source: "https://ui.shadcn.com/docs/components/sonner (fetched 2026-04-09)",
  composition: {
    name: "Toaster",
  },
  render: SonnerRender,
}
