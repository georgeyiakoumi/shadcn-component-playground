"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface EditPanelRowProps {
  /** Row label */
  label: string
  /** Optional inline value displayed next to the label */
  value?: string
  /** Visual level — "default" has background card, "nested" is plain (for nesting inside a default row) */
  variant?: "default" | "nested"
  /** Control content — omit for a sub-heading with no controls */
  children?: React.ReactNode
}

function EditPanelRow({ label, value, variant = "default", children }: EditPanelRowProps) {
  return (
    <div className={cn(
      children && "space-y-2",
      variant === "default" && children && "rounded-md bg-muted/50 p-2",
    )}>
      <p className={cn(
        "text-xs text-muted-foreground",
        variant === "default"
          ? "font-semibold uppercase tracking-widest"
          : "font-medium",
      )}>
        {label}
        {value && (
          <span className="ml-1 font-normal normal-case tracking-normal">{value}</span>
        )}
      </p>
      {children}
    </div>
  )
}

export { EditPanelRow }
export type { EditPanelRowProps }
