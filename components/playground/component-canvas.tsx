"use client"

import { cn } from "@/lib/utils"
import { renderComponent } from "@/lib/component-renderer"
import { breakpoints, type Breakpoint } from "@/components/playground/toolbar"
import {
  ElementSelector,
  type ElementInfo,
} from "@/components/playground/element-selector"
import type { PlaygroundMode } from "@/components/playground/toolbar"

/* ── Types ──────────────────────────────────────────────────────── */

interface ComponentCanvasProps {
  slug: string
  componentName: string
  theme?: "light" | "dark"
  breakpoint?: Breakpoint
  previewProps?: Record<string, string>
  /** Custom preview content — used for user-created components */
  customPreview?: React.ReactNode
  mode?: PlaygroundMode
  onElementSelect?: (element: ElementInfo) => void
  onElementHover?: (element: ElementInfo | null) => void
}

/* ── Component ──────────────────────────────────────────────────── */

export function ComponentCanvas({
  slug,
  componentName: _componentName,
  theme = "light",
  breakpoint = "2xl",
  previewProps,
  customPreview,
  mode = "inspect",
  onElementSelect,
  onElementHover,
}: ComponentCanvasProps) {
  const bp = breakpoints.find((b) => b.key === breakpoint)
  const maxWidth = bp?.width

  const handleSelect = (element: ElementInfo) => {
    onElementSelect?.(element)
  }

  const handleHover = (element: ElementInfo | null) => {
    onElementHover?.(element)
  }

  return (
    <div
      className={cn(
        "flex min-w-[100px] flex-1 justify-center overflow-auto bg-background text-foreground transition-colors duration-300",
        theme === "dark" && "dark",
      )}
      style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
    >
      <div
        className="flex w-full flex-1 transition-all duration-300"
        style={{ maxWidth: maxWidth ? `${maxWidth}px` : undefined }}
      >
        <ElementSelector
          isActive={mode === "edit"}
          onSelect={handleSelect}
          onHover={handleHover}
        >
          {customPreview ?? renderComponent(slug, previewProps ?? {})}
        </ElementSelector>
      </div>
    </div>
  )
}
