"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { componentPreviews } from "@/lib/component-previews"
import { breakpoints, type Breakpoint } from "@/components/playground/toolbar"

/* ── Types ──────────────────────────────────────────────────────── */

interface ComponentCanvasProps {
  slug: string
  componentName: string
  theme?: "light" | "dark"
  breakpoint?: Breakpoint
}

/* ── Component ──────────────────────────────────────────────────── */

export function ComponentCanvas({
  slug,
  componentName,
  theme = "light",
  breakpoint = "2xl",
}: ComponentCanvasProps) {
  const PreviewComponent = componentPreviews[slug]

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
        {PreviewComponent ? (
          <PreviewComponent />
        ) : (
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-medium">{componentName}</h2>
            <p className="text-sm text-muted-foreground">
              Preview not yet available
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
