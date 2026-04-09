"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

interface DragHandleProps {
  /** Current width of the panel being resized */
  width: number
  /** Min allowed width */
  minWidth: number
  /** Max allowed width */
  maxWidth: number
  /** Callback when width changes */
  onWidthChange: (width: number) => void
  /** Which side the panel is on — determines drag direction */
  side?: "left" | "right"
}

export function DragHandle({
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  side = "left",
}: DragHandleProps) {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)

      const startX = e.clientX
      const startWidth = width

      function onMouseMove(moveEvent: MouseEvent) {
        const delta = moveEvent.clientX - startX
        const adjusted = side === "left" ? startWidth + delta : startWidth - delta
        const newWidth = Math.min(maxWidth, Math.max(minWidth, adjusted))
        onWidthChange(newWidth)
      }

      function onMouseUp() {
        setIsDragging(false)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [width, minWidth, maxWidth, onWidthChange, side],
  )

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "relative z-[70] flex w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-blue-500/20",
          isDragging && "bg-blue-500/20",
        )}
      >
        <div className="absolute z-[70] flex h-6 w-3.5 items-center justify-center rounded-sm border bg-background shadow-sm">
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
      </div>

      {/* Prevent text selection while dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </>
  )
}
