"use client"

import * as React from "react"
import { Layers, Lock, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useComponentEdit } from "@/lib/component-state"
import { getRequiredSubComponents } from "@/lib/component-state"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

/* ── Types ──────────────────────────────────────────────────────── */

interface SubComponentPanelProps {
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function SubComponentPanel({ className }: SubComponentPanelProps) {
  const { edit, meta, toggleSubComponent, resetToOriginal } =
    useComponentEdit()

  if (!meta || !meta.isCompound) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex flex-col items-center gap-2 text-center">
          <Layers className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            This component has no sub-components
          </p>
        </div>
      </div>
    )
  }

  const required = getRequiredSubComponents(meta.slug)
  const activeCount = edit.activeSubComponents.length
  const totalCount = meta.subComponents.length

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-4">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Sub-components</h3>
            <Badge variant="secondary" className="text-xs">
              {activeCount}/{totalCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={resetToOriginal}
            disabled={!edit.isDirty}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        </div>

        <Separator />

        {/* ── Sub-component list ─────────────────────────── */}
        <div className="space-y-1">
          {meta.subComponents.map((sub) => {
            const isRequired = required.includes(sub)
            const isActive = edit.activeSubComponents.includes(sub)

            return (
              <SubComponentRow
                key={sub}
                name={sub}
                isActive={isActive}
                isRequired={isRequired}
                onToggle={() => toggleSubComponent(sub)}
              />
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

/* ── SubComponentRow ──────────────────────────────────────────── */

interface SubComponentRowProps {
  name: string
  isActive: boolean
  isRequired: boolean
  onToggle: () => void
}

function SubComponentRow({
  name,
  isActive,
  isRequired,
  onToggle,
}: SubComponentRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-2 transition-colors",
        isActive
          ? "bg-muted/30"
          : "opacity-50",
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Active indicator */}
        <div
          className={cn(
            "size-1.5 shrink-0 rounded-full transition-colors",
            isActive ? "bg-emerald-500" : "bg-muted-foreground/30",
          )}
        />
        <span
          className={cn(
            "text-sm",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {isRequired && (
          <Lock className="size-3 text-muted-foreground/60" />
        )}
      </div>

      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        disabled={isRequired}
       
        aria-label={`Toggle ${name}`}
      />
    </div>
  )
}
