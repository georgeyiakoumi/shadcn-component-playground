"use client"

import * as React from "react"
import { MousePointer2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { VisualEditor } from "@/components/playground/visual-editor"
import { DragHandle } from "@/components/playground/drag-handle"
import type { ElementInfo } from "@/components/playground/element-selector"

const MIN_WIDTH = 280
const MAX_WIDTH = 550
const DEFAULT_WIDTH = 320

interface RightPanelProps {
  isOpen: boolean
  /**
   * Kept for source-API compatibility with callers that still pass it
   * (the M3 from-scratch path's parent components). Pillar 6 removed
   * the M2 right-panel tabs that used this prop.
   */
  source?: string
  isCompound?: boolean
  selectedElement?: ElementInfo | null
  onClassChange?: (classes: string[]) => void
  onDeselect?: () => void
  /**
   * Pillar 5c — optional header rendered above the visual editor when a
   * cva-style component is selected. Used by the slug page to mount the
   * `CvaSlotPicker` so the user can choose which cva slot their next
   * class edit will land in. Decoupled from the panel so the panel
   * stays unaware of v2-specific concerns.
   */
  editorHeader?: React.ReactNode
}

export function RightPanel({
  isOpen,
  selectedElement,
  onClassChange,
  onDeselect,
  editorHeader,
}: RightPanelProps) {
  const showVisualEditor = selectedElement != null
  const [width, setWidth] = React.useState(DEFAULT_WIDTH)

  return (
    <div
      className={cn(
        "flex shrink-0 overflow-hidden",
        !isOpen && "w-0",
      )}
      style={isOpen ? { width: `${width + 4}px` } : undefined}
    >
      {/* ── Drag handle (left edge) ──────────────────────── */}
      {isOpen && (
        <DragHandle
          width={width}
          minWidth={MIN_WIDTH}
          maxWidth={MAX_WIDTH}
          onWidthChange={setWidth}
          side="right"
        />
      )}

      {/* ── Panel content ────────────────────────────────── */}
      {/* GEO-305 Step 7 — `min-h-0` lets the inner ScrollArea constrain
          its own height instead of growing past the viewport. Without
          it, flex children of an overflow-hidden parent fall back to
          their content height and the right panel grows unbounded. */}
      <div
        className="flex min-h-0 flex-1 flex-col border-l bg-background"
        style={{ width: `${width}px` }}
      >
        {showVisualEditor ? (
          // `min-h-0` here is the load-bearing line — it lets this flex
          // child constrain its own height to the parent (which has its
          // own min-h-0 + flex-1 + overflow-hidden chain). Without it,
          // h-full / flex-1 inside the editor falls back to intrinsic
          // content height and the panel grows past the viewport.
          <div className="flex min-h-0 w-full flex-1 flex-col">
            {editorHeader}
            <div className="min-h-0 flex-1 overflow-hidden">
              <VisualEditor
                selectedElement={selectedElement}
                onClassChange={onClassChange ?? (() => {})}
                onDeselect={onDeselect ?? (() => {})}
              />
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <MousePointer2 className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Select an element on the canvas to edit its styles
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
