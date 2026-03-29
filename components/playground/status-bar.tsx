"use client"

import * as React from "react"
import {
  Shield,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { checkAccessibility } from "@/lib/a11y-checker"
import { checkSemanticHtml } from "@/lib/semantic-checker"
import { A11yPanel } from "@/components/playground/a11y-panel"
import { SemanticPanel } from "@/components/playground/semantic-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { breakpoints, type Breakpoint } from "@/components/playground/toolbar"

interface StatusBarProps {
  source: string
  theme?: "light" | "dark"
  onThemeChange?: (theme: "light" | "dark") => void
  breakpoint?: Breakpoint
  onBreakpointChange?: (breakpoint: Breakpoint) => void
}

export function StatusBar({
  source,
  theme = "light",
  onThemeChange,
  breakpoint = "2xl",
  onBreakpointChange,
}: StatusBarProps) {
  const a11yIssues = React.useMemo(() => checkAccessibility(source), [source])
  const semanticIssues = React.useMemo(
    () => checkSemanticHtml(source),
    [source],
  )

  const a11yErrors = a11yIssues.filter((i) => i.severity === "error").length
  const a11yWarnings = a11yIssues.filter((i) => i.severity === "warning").length
  const semErrors = semanticIssues.filter((i) => i.severity === "error").length
  const semWarnings = semanticIssues.filter(
    (i) => i.severity === "warning",
  ).length

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-t bg-background px-3">
        {/* ── Left: A11y + Semantic checks ────────────────────── */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Shield className="size-3.5" />
              <span className="font-medium">A11y</span>
              <StatusBadges errors={a11yErrors} warnings={a11yWarnings} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-[400px] max-h-[500px] overflow-auto p-0"
          >
            <A11yPanel source={source} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <FileCode className="size-3.5" />
              <span className="font-medium">HTML</span>
              <StatusBadges errors={semErrors} warnings={semWarnings} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-[400px] max-h-[500px] overflow-auto p-0"
          >
            <SemanticPanel source={source} />
          </PopoverContent>
        </Popover>

        {/* ── Spacer ─────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Right: Breakpoints + Theme ──────────────────────── */}
        {onBreakpointChange && (
          <>
            <div className="flex items-center gap-0.5">
              {breakpoints.map((bp) => {
                const Icon = bp.icon
                return (
                  <Tooltip key={bp.key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          breakpoint === bp.key
                            ? "bg-blue-500/10 text-blue-500"
                            : "text-muted-foreground",
                        )}
                        onClick={() => onBreakpointChange(bp.key)}
                      >
                        <Icon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {bp.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            <Separator orientation="vertical" className="h-5" />
          </>
        )}

        {onThemeChange && (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    theme === "light"
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onThemeChange("light")}
                >
                  <Sun className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Light theme
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    theme === "dark"
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onThemeChange("dark")}
                >
                  <Moon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Dark theme
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

function StatusBadges({
  errors,
  warnings,
}: {
  errors: number
  warnings: number
}) {
  if (errors === 0 && warnings === 0) {
    return <CheckCircle2 className="size-3.5 text-green-500" />
  }

  return (
    <span className="flex items-center gap-1">
      {errors > 0 && (
        <Badge
          variant="outline"
          className={cn(
            "h-4 px-1 text-xs font-medium",
            "border-red-500/30 bg-red-500/10 text-red-500",
          )}
        >
          <AlertTriangle className="mr-0.5 size-2.5" />
          {errors}
        </Badge>
      )}
      {warnings > 0 && (
        <Badge
          variant="outline"
          className={cn(
            "h-4 px-1 text-xs font-medium",
            "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
          )}
        >
          <AlertCircle className="mr-0.5 size-2.5" />
          {warnings}
        </Badge>
      )}
    </span>
  )
}
