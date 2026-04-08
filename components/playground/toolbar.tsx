"use client"

import * as React from "react"
import {
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Moon,
  Sun,
  Eye,
  Layers,
  Download,
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

export type PlaygroundMode = "inspect" | "edit" | "define" | "preview"

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
  mode?: PlaygroundMode
  onModeChange?: (mode: PlaygroundMode) => void
  /** When true, shows the custom-component (define/preview) state values
   *  under the unified Structure/Style toggle. */
  isCustom?: boolean
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
  mode = "inspect",
  onModeChange,
  isCustom,
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

        {/* ── Mode toggle ────────────────────────────────────── */}
        {componentName && (
          <>
            <Separator orientation="vertical" className="mx-1.5 h-6" />
            <div className="flex items-center gap-0.5 rounded-md border p-0.5">
              {/* Pillar 6.1 — unified labels: Structure / Style across
                  both stock and custom pages. Underlying state values
                  stay the same (inspect/edit on stock, define/preview on
                  custom) so consumers don't need to refactor. */}
              {isCustom ? (
                <>
                  <Button
                    variant={mode === "define" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => onModeChange?.("define")}
                  >
                    <Layers className="size-3" />
                    Structure
                  </Button>
                  <Button
                    variant={mode === "preview" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => onModeChange?.("preview")}
                  >
                    <Eye className="size-3" />
                    Style
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={mode === "inspect" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => onModeChange?.("inspect")}
                  >
                    <Layers className="size-3" />
                    Structure
                  </Button>
                  <Button
                    variant={mode === "edit" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => onModeChange?.("edit")}
                  >
                    <Eye className="size-3" />
                    Style
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Spacer ─────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* Pillar 6.1 — manual Save button removed. Both stock and
            custom pages now silent-autosave to localStorage. The Save
            label will return in Phase 2 (Supabase auth) when it can
            mean real cloud persistence. */}

        {/* ── Export ─────────────────────────────────────────── */}
        {componentName && (
          slug && source ? (
            <ExportDialog
              slug={slug}
              source={source}
              componentName={componentName}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled className="gap-1.5 pointer-events-none">
                    <Download className="size-3.5" />
                    Export
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Design your component first to enable export</p>
              </TooltipContent>
            </Tooltip>
          )
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
