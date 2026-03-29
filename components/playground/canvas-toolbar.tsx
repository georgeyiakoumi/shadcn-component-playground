"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PropSelector } from "@/components/playground/toolbar"

/* ── Props ──────────────────────────────────────────────────────── */

interface CanvasToolbarProps {
  propSelectors?: PropSelector[]
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function CanvasToolbar({
  propSelectors,
  className,
}: CanvasToolbarProps) {
  const hasSelectors = propSelectors && propSelectors.length > 0

  if (!hasSelectors) return null

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-4 border-b bg-muted/30 px-3 py-2",
        className,
      )}
    >
      {propSelectors.map((selector) => (
        <div key={selector.label} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {selector.label}
          </span>
          <Select
            value={selector.value}
            onValueChange={selector.onChange}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder={selector.label} />
            </SelectTrigger>
            <SelectContent>
              {selector.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
