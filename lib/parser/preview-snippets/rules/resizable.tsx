/**
 * Resizable composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/resizable
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <ResizablePanelGroup orientation="horizontal">
 *       <ResizablePanel>One</ResizablePanel>
 *       <ResizableHandle />
 *       <ResizablePanel>Two</ResizablePanel>
 *     </ResizablePanelGroup>
 *
 * ## Implementation notes
 *
 * Resizable wraps `react-resizable-panels` — a full third-party
 * component that can't be rendered from a ComponentTree. The parser
 * captures ResizablePrimitive.Group / Panel / Separator as
 * `third-party` bases which fall through to placeholder pills.
 *
 * Fix: import the real shadcn Resizable components (same trick as
 * Carousel and Calendar) and render them directly. The canvas shows
 * two resizable panels with a draggable handle between them.
 *
 * `withHandle` is set on ResizableHandle so the docs-style
 * GripVertical icon is visible in the separator.
 *
 * The panels need explicit `defaultSize` props (percentages) and
 * the group needs a fixed height so it doesn't collapse to zero.
 */

"use client"

import * as React from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function ResizableRender(ctx: SnippetContext): React.ReactNode {
  const groupCls = classesFor(ctx, "ResizablePanelGroup")
  const panelCls = classesFor(ctx, "ResizablePanel")
  const handleCls = classesFor(ctx, "ResizableHandle")

  const groupPath = pathFor(ctx, "ResizablePanelGroup")
  const panelPath = pathFor(ctx, "ResizablePanel")
  const handlePath = pathFor(ctx, "ResizableHandle")

  return (
    <div className="absolute top-1/2 left-1/2 w-[32rem] -translate-x-1/2 -translate-y-1/2">
      <ResizablePanelGroup
        {...({ direction: "horizontal" } as Record<string, unknown>)}
        data-node-id={groupPath}
        className={withSelectionRing(
          `min-h-[12rem] rounded-lg border ${groupCls}`,
          ctx.selectedPath === groupPath,
        )}
      >
        <ResizablePanel
          defaultSize={50}
          data-node-id={panelPath}
          className={withSelectionRing(
            panelCls,
            ctx.selectedPath === panelPath,
          )}
        >
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          data-node-id={handlePath}
          className={withSelectionRing(
            handleCls,
            ctx.selectedPath === handlePath,
          )}
        />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Two</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export const resizableRule: CompositionRule = {
  slug: "resizable",
  source:
    "https://ui.shadcn.com/docs/components/resizable (fetched 2026-04-09)",
  composition: {
    name: "ResizablePanelGroup",
    children: [
      { name: "ResizablePanel" },
      { name: "ResizableHandle" },
    ],
  },
  render: ResizableRender,
}
