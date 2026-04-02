"use client"

import * as React from "react"

interface EditPanelRowProps {
  /** Row label (displayed uppercase) */
  label: string
  /** Optional inline value displayed next to the label */
  value?: string
  /** Control content — omit for a sub-heading with no controls */
  children?: React.ReactNode
}

function EditPanelRow({ label, value, children }: EditPanelRowProps) {
  return (
    <div className={children ? "space-y-2 p-2 bg-muted/50 rounded-md" : undefined}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
