/**
 * ScrollArea composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/scroll-area
 * Fetched: 2026-04-10
 *
 * ## Implementation notes
 *
 * Imports the real shadcn ScrollArea component and renders it with
 * a tall block of sample text so the vertical scrollbar is visible.
 * The flat renderer showed an empty box because ScrollArea's body
 * has `{children}` (a passthrough expression the renderer suppresses)
 * and no sample content.
 *
 * The sample text is a list of tags (matching the shadcn docs example
 * which shows a list of tags in a fixed-height scroll area).
 */

"use client"

import * as React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
)

function ScrollAreaRender(ctx: SnippetContext): React.ReactNode {
  const scrollAreaCls = classesFor(ctx, "ScrollArea")
  const scrollAreaPath = pathFor(ctx, "ScrollArea")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <ScrollArea
        data-node-id={scrollAreaPath}
        className={withSelectionRing(
          `h-72 w-48 rounded-md border ${scrollAreaCls}`,
          ctx.selectedPath === scrollAreaPath,
        )}
      >
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
          {tags.map((tag) => (
            <React.Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export const scrollAreaRule: CompositionRule = {
  slug: "scroll-area",
  source:
    "https://ui.shadcn.com/docs/components/scroll-area (fetched 2026-04-10)",
  composition: {
    name: "ScrollArea",
    children: [{ name: "ScrollBar" }],
  },
  render: ScrollAreaRender,
}
