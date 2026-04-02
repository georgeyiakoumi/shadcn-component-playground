"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface EditPanelSectionProps {
  /** Lucide icon component */
  icon: React.ElementType
  /** Section title */
  title: string
  /** Section content */
  children: React.ReactNode
  /** Whether the section starts open (default: false) */
  defaultOpen?: boolean
  /** Whether any values are set in this section — shows indicator dot */
  hasValues?: boolean
  /** Called when the user clicks "Clear" — resets all values in this section */
  onClear?: () => void
}

function EditPanelSection({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
  hasValues,
  onClear,
}: EditPanelSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon className="size-3.5" />
        <span className="flex-1 text-left">{title}</span>
        {hasValues && (
          <span className="size-1.5 rounded-full bg-blue-500" />
        )}
        {open && onClear && hasValues && (
          <span
            role="button"
            tabIndex={0}
            className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear() } }}
          >
            Clear
          </span>
        )}
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && <div className="space-y-2 pl-2 pr-8 pb-2">{children}</div>}
    </div>
  )
}

export { EditPanelSection }
export type { EditPanelSectionProps }
