"use client"

import * as React from "react"
import {
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react"
import { ExportDialog } from "@/components/playground/export-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ── Breakpoint type ───────────────────────────────────────────── */

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl"

export const breakpoints: {
  key: Breakpoint
  label: string
  width: number
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "sm", label: "Small (640px)", width: 640, icon: Smartphone },
  { key: "md", label: "Medium (768px)", width: 768, icon: Smartphone },
  { key: "lg", label: "Large (1024px)", width: 1024, icon: Tablet },
  { key: "xl", label: "X-Large (1280px)", width: 1280, icon: Monitor },
  { key: "2xl", label: "2X-Large (1536px)", width: 1536, icon: Monitor },
]

/* ── Types ──────────────────────────────────────────────────────── */

export interface PropSelector {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

interface ToolbarProps {
  componentName?: string
  slug?: string
  source?: string
  theme?: "light" | "dark"
  onThemeChange?: (theme: "light" | "dark") => void
  breakpoint?: Breakpoint
  onBreakpointChange?: (breakpoint: Breakpoint) => void
  propSelectors?: PropSelector[]
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function PlaygroundToolbar({
  componentName,
  slug,
  source,
  theme = "light",
  onThemeChange,
  breakpoint = "2xl",
  onBreakpointChange,
  propSelectors,
  className,
}: ToolbarProps) {
  const hasSelectors = propSelectors && propSelectors.length > 0

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-1 border-b bg-background px-4",
          className,
        )}
      >
        {/* ── Component name ─────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-blue-500" />
          <span
            className={cn(
              "text-sm font-medium",
              !componentName && "text-muted-foreground",
            )}
          >
            {componentName ?? "No component selected"}
          </span>
        </div>

        {/* ── Spacer ─────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Prop selectors ──────────────────────────────────── */}
        {hasSelectors && (
          <>
            {propSelectors.map((selector) => (
              <Select
                key={selector.label}
                value={selector.value}
                onValueChange={selector.onChange}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
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
            ))}

            <Separator orientation="vertical" className="mx-1.5 h-6" />
          </>
        )}

        {/* ── Breakpoint controls ─────────────────────────────── */}
        <div className="flex items-center gap-0.5">
          {breakpoints.map((bp) => {
            const Icon = bp.icon
            return (
              <ToolbarButton
                key={bp.key}
                icon={<Icon className="size-4" />}
                label={bp.label}
                active={breakpoint === bp.key}
                onClick={() => onBreakpointChange?.(bp.key)}
              />
            )
          })}
        </div>

        <Separator orientation="vertical" className="mx-1.5 h-6" />

        {/* ── Theme controls ──────────────────────────────────── */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Sun className="size-4" />}
            label="Light theme"
            active={theme === "light"}
            onClick={() => onThemeChange?.("light")}
          />
          <ToolbarButton
            icon={<Moon className="size-4" />}
            label="Dark theme"
            active={theme === "dark"}
            onClick={() => onThemeChange?.("dark")}
          />
        </div>

        {/* ── Export ──────────────────────────────────────────── */}
        {componentName && slug && source && (
          <>
            <Separator orientation="vertical" className="mx-1.5 h-6" />
            <ExportDialog
              slug={slug}
              source={source}
              componentName={componentName}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

/* ── ToolbarButton ──────────────────────────────────────────────── */

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function ToolbarButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground",
            active && "bg-blue-500/10 text-blue-500",
          )}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
