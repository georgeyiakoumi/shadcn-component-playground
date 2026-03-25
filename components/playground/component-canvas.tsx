"use client"

import { cn } from "@/lib/utils"
import { renderComponent } from "@/lib/component-renderer"
import { breakpoints, type Breakpoint } from "@/components/playground/toolbar"

/* ── Types ──────────────────────────────────────────────────────── */

interface ComponentCanvasProps {
  slug: string
  componentName: string
  theme?: "light" | "dark"
  breakpoint?: Breakpoint
  previewProps?: Record<string, string>
}

/* ── Component ──────────────────────────────────────────────────── */

export function ComponentCanvas({
  slug,
  componentName: _componentName,
  theme = "light",
  breakpoint = "2xl",
  previewProps,
}: ComponentCanvasProps) {
  const bp = breakpoints.find((b) => b.key === breakpoint)
  const maxWidth = bp?.width

  return (
    <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-8">
      <div
        className={cn(
          "w-full rounded-lg border border-border bg-background p-8 text-foreground shadow-sm transition-all duration-300",
          theme === "dark" && "dark",
        )}
        style={{
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          colorScheme: theme === "dark" ? "dark" : "light",
        }}
      >
        {renderComponent(slug, previewProps ?? {})}
      </div>
    </div>
  )
}
