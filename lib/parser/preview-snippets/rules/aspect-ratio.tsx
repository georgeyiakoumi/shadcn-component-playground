/**
 * AspectRatio composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/aspect-ratio
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <div className="w-[450px]">
 *       <AspectRatio ratio={16 / 9}>
 *         <Image src="..." alt="..." className="rounded-md object-cover" />
 *       </AspectRatio>
 *     </div>
 *
 * ## Implementation notes
 *
 * AspectRatio is a single-sub-component pass-through around a
 * Radix primitive. It's purely a layout wrapper — it doesn't
 * render any visible surface of its own. In the docs example,
 * users wrap an Image (or arbitrary content) inside it; the
 * preview here uses a placeholder box with a gradient + text
 * label so the user has something to click on and style.
 */

"use client"

import * as React from "react"
import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function AspectRatioRender(ctx: SnippetContext): React.ReactNode {
  const rootCls = classesFor(ctx, "AspectRatio")
  const rootPath = pathFor(ctx, "AspectRatio")

  return (
    <div className="absolute top-1/2 left-1/2 w-[28rem] -translate-x-1/2 -translate-y-1/2">
      <AspectRatioPrimitive.Root
        ratio={16 / 9}
        data-node-id={rootPath}
        className={withSelectionRing(
          cn(
            "flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-primary/5 text-sm text-muted-foreground",
            rootCls,
          ),
          ctx.selectedPath === rootPath,
        )}
      >
        16 / 9
      </AspectRatioPrimitive.Root>
    </div>
  )
}

export const aspectRatioRule: CompositionRule = {
  slug: "aspect-ratio",
  source:
    "https://ui.shadcn.com/docs/components/aspect-ratio (fetched 2026-04-09)",
  composition: {
    name: "AspectRatio",
  },
  render: AspectRatioRender,
}
