"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* ── EditSection (root) ──────────────────────────────────────────── */

interface EditSectionProps {
  /** Lucide icon component */
  icon: React.ElementType
  /** Whether the section starts open (default: false) */
  defaultOpen?: boolean
  /** Whether any values are set in this section — shows indicator dot */
  hasValues?: boolean
  /** Called when the user clicks "Clear" — resets all values in this section */
  onClear?: () => void
  children: React.ReactNode
}

function EditSection({
  icon: Icon,
  defaultOpen = false,
  hasValues,
  onClear,
  children,
}: EditSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  // Extract title and action from children for the header
  const title = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === EditSectionTitle,
  )
  const rest = React.Children.toArray(children).filter(
    (child) => !(React.isValidElement(child) && child.type === EditSectionTitle),
  )

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
      {open && <div className="space-y-4 px-3 pb-3">{rest}</div>}
    </div>
  )
}

/* ── EditSectionTitle ────────────────────────────────────────────── */

function EditSectionTitle({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/* ── EditSectionContent ──────────────────────────────────────────── */

function EditSectionContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {children}
    </div>
  )
}

/* ── EditSubSectionWrapper ───────────────────────────────────────── */

function EditSubSectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-md bg-muted/50 p-2">
      {children}
    </div>
  )
}

/* ── EditSubSection ──────────────────────────────────────────────── */

function EditSubSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  )
}

/* ── EditSubSectionTitle ─────────────────────────────────────────── */

function EditSubSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

/* ── EditSubSectionContent ───────────────────────────────────────── */

function EditSubSectionContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  )
}

/* ── EditNestedGroup (groups nested rows within a sub-section) ──── */

function EditNestedGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-l-2 border-border/50 pl-3">
      {children}
    </div>
  )
}

/* ── Backwards-compatible wrapper ────────────────────────────────── */
// TODO: migrate all usages to compound pattern, then remove this

interface EditPanelSectionProps {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  hasValues?: boolean
  onClear?: () => void
}

function EditPanelSection({
  icon,
  title,
  children,
  defaultOpen,
  hasValues,
  onClear,
}: EditPanelSectionProps) {
  return (
    <EditSection icon={icon} defaultOpen={defaultOpen} hasValues={hasValues} onClear={onClear}>
      <EditSectionTitle>{title}</EditSectionTitle>
      {children}
    </EditSection>
  )
}

export {
  EditSection,
  EditSectionTitle,
  EditSectionContent,
  EditSubSectionWrapper,
  EditSubSection,
  EditSubSectionTitle,
  EditSubSectionContent,
  EditNestedGroup,
  EditPanelSection,
}
export type { EditSectionProps, EditPanelSectionProps }
