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
      <div
        className="flex flex-1 flex-col border-l bg-background"
        style={{ width: `${width}px` }}
      >
        {showVisualEditor ? (
          <div className="flex h-full w-full flex-col">
            {editorHeader}
            <div className="min-h-0 flex-1">
              <VisualEditor
                selectedElement={selectedElement}
                onClassChange={onClassChange ?? (() => {})}
                onDeselect={onDeselect ?? (() => {})}
              />
            </div>
          </div>
        ) : (
          // Empty state — Pillar 6 removed the M2 right-panel tabs that
          // used to live here. The visual editor is the only edit
          // affordance now; the user picks an element by clicking it
          // on the canvas.
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
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
