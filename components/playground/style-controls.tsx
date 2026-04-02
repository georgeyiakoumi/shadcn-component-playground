"use client"

import * as React from "react"
import {
  Minus,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"
import {
  TW_SWATCH_COLORS,
  TW_COLOR_NAMES,
  TW_SHADES,
  getSwatchHex,
  GAP_SLIDER_VALUES,
  SPACING_VALUES,
  NEGATIVE_SPACING_VALUES,
  SPACING_PX,
  JUSTIFY_KEYS,
  ALIGN_KEYS,
  PLACE_ITEMS_MAP,
  OBJECT_POSITION_GRID,
} from "@/lib/tailwind-options"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
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
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EditPanelRow } from "@/components/playground/edit-panel-row"

/* ── shadcn semantic token swatch map ──────────────────────────── */

/** Maps token class to its CSS bg class for display */
const SHADCN_SWATCH_MAP: Record<string, string> = {
  // text tokens
  "text-foreground": "bg-foreground",
  "text-primary": "bg-primary",
  "text-secondary-foreground": "bg-secondary-foreground",
  "text-muted-foreground": "bg-muted-foreground",
  "text-destructive": "bg-destructive",
  "text-accent-foreground": "bg-accent-foreground",
  // bg tokens
  "bg-background": "bg-background border",
  "bg-primary": "bg-primary",
  "bg-secondary": "bg-secondary",
  "bg-muted": "bg-muted",
  "bg-accent": "bg-accent",
  "bg-destructive": "bg-destructive",
  "bg-card": "bg-card border",
  "bg-popover": "bg-popover border",
  // border tokens
  "border-border": "bg-border",
  "border-input": "bg-input",
  "border-ring": "bg-ring",
  "border-primary": "bg-primary",
  "border-destructive": "bg-destructive",
  // ring tokens
  "ring-ring": "bg-ring",
  "ring-primary": "bg-primary",
  "ring-destructive": "bg-destructive",
}

/** Get the swatch for a shadcn token class */
function getShadcnTokenSwatch(cls: string): { type: "css"; value: string } | null {
  const mapped = SHADCN_SWATCH_MAP[cls]
  if (mapped) return { type: "css", value: mapped }
  return null
}

/* ── Position grid (Figma-style justify × align) ─────────────────── */

function PositionGrid({
  justify,
  align,
  display,
  direction,
  onJustifyChange,
  onAlignChange,
}: {
  justify: string
  align: string
  display: string
  /** Flex direction — determines icon orientation for distribute/stretch */
  direction?: string
  onJustifyChange: (v: string) => void
  onAlignChange: (v: string) => void
}) {
  const isGrid = display === "grid"
  const isCol = direction === "flex-col" || direction === "flex-col-reverse"
  const isBetween = justify === "justify-between" || justify === "justify-around" || justify === "justify-evenly"
  const isStretch = align === "items-stretch" || align === "items-baseline"

  // Pick icons based on axis — justify is main axis, align is cross axis
  const justifyBetweenIcon = isCol ? AlignVerticalSpaceBetween : AlignHorizontalSpaceBetween
  const justifyAroundIcon = isCol ? AlignVerticalSpaceAround : AlignHorizontalSpaceAround
  const justifyEvenlyIcon = isCol ? AlignVerticalDistributeCenter : AlignHorizontalDistributeCenter
  const stretchIcon = isCol ? StretchHorizontal : StretchVertical

  function getTooltip(j: string, a: string): string {
    if (isGrid) {
      const shorthand = PLACE_ITEMS_MAP[j]?.[a]
      if (shorthand) return shorthand
    }
    return `${j} ${a}`
  }

  return (
    <div className="space-y-1.5">
      {/* Grid + toggle groups — side by side, wrap when narrow */}
      <div className="flex flex-wrap items-start gap-3">
        {/* 3×3 grid */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Position</p>
          <div className="inline-grid grid-cols-3 gap-0.5 rounded-md border p-0.5">
          {ALIGN_KEYS.map((a) =>
            JUSTIFY_KEYS.map((j) => {
              const justifyMatch = isBetween || justify === j
              const alignMatch = isStretch || align === a
              const isActive = justifyMatch && alignMatch && !isBetween && !isStretch
              const isRowHighlight = isBetween && !isStretch && align === a
              const isColHighlight = isStretch && !isBetween && justify === j
              const isBothHighlight = isBetween && isStretch
              const highlighted = isActive || isRowHighlight || isColHighlight || isBothHighlight

              const tooltipText = getTooltip(j, a)
              return (
                <Tooltip key={`${j}-${a}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex size-7 items-center justify-center rounded-sm transition-colors",
                        highlighted
                          ? "bg-blue-500/15 text-blue-500"
                          : "text-muted-foreground hover:bg-muted",
                        isActive && "!bg-blue-500 !text-white",
                      )}
                      onClick={() => {
                        if (isBetween) {
                          onAlignChange(a)
                        } else if (isStretch) {
                          onJustifyChange(j)
                        } else {
                          onJustifyChange(j)
                          onAlignChange(a)
                        }
                      }}
                    >
                      {isBetween && isStretch ? (
                        <div className="h-1 w-3 rounded-full bg-current" />
                      ) : isBetween ? (
                        <div className="flex w-3 items-center justify-between">
                          <div className="size-1 rounded-full bg-current" />
                          <div className="size-1 rounded-full bg-current" />
                          <div className="size-1 rounded-full bg-current" />
                        </div>
                      ) : isStretch ? (
                        <div className="h-3 w-1 rounded-full bg-current" />
                      ) : (
                        <div className={cn(
                          "size-1.5 rounded-full",
                          isActive ? "bg-white" : "bg-current",
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-mono">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              )
            }),
          )}
        </div>
        </div>

        {/* Icon toggle groups beside the grid */}
        <div className="flex shrink-0 flex-col gap-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Distribute</p>
            <div className="flex flex-wrap gap-0.5">
              <IconToggle value="justify-between" icon={justifyBetweenIcon} tooltip="justify-between" isActive={justify === "justify-between"} onClick={() => onJustifyChange(justify === "justify-between" ? "justify-start" : "justify-between")} />
              <IconToggle value="justify-around" icon={justifyAroundIcon} tooltip="justify-around" isActive={justify === "justify-around"} onClick={() => onJustifyChange(justify === "justify-around" ? "justify-start" : "justify-around")} />
              <IconToggle value="justify-evenly" icon={justifyEvenlyIcon} tooltip="justify-evenly" isActive={justify === "justify-evenly"} onClick={() => onJustifyChange(justify === "justify-evenly" ? "justify-start" : "justify-evenly")} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Stretch</p>
            <div className="flex flex-wrap gap-0.5">
              <IconToggle value="items-stretch" icon={stretchIcon} tooltip="items-stretch" isActive={align === "items-stretch"} onClick={() => onAlignChange(align === "items-stretch" ? "items-start" : "items-stretch")} />
              <IconToggle value="items-baseline" icon={Baseline} tooltip="items-baseline" isActive={align === "items-baseline"} onClick={() => onAlignChange(align === "items-baseline" ? "items-start" : "items-baseline")} />
            </div>
          </div>
        </div>
      </div>

      {/* Standalone justify-content + align-items controls */}
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Justify content</p>
          <div className="flex flex-wrap gap-0.5">
            {([
              { value: "justify-start", icon: isCol ? AlignVerticalJustifyStart : AlignStartHorizontal },
              { value: "justify-center", icon: isCol ? AlignVerticalJustifyCenter : AlignCenterHorizontal },
              { value: "justify-end", icon: isCol ? AlignVerticalJustifyEnd : AlignEndHorizontal },
            ] as const).map((opt) => (
              <IconToggle key={opt.value} value={opt.value} icon={opt.icon} tooltip={opt.value} isActive={justify === opt.value} onClick={() => onJustifyChange(justify === opt.value ? "" : opt.value)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Align items</p>
          <div className="flex flex-wrap gap-0.5">
            {([
              { value: "items-start", icon: isCol ? AlignStartHorizontal : AlignStartVertical },
              { value: "items-center", icon: isCol ? AlignCenterHorizontal : AlignCenterVertical },
              { value: "items-end", icon: isCol ? AlignEndHorizontal : AlignEndVertical },
            ] as const).map((opt) => (
              <IconToggle key={opt.value} value={opt.value} icon={opt.icon} tooltip={opt.value} isActive={align === opt.value} onClick={() => onAlignChange(align === opt.value ? "" : opt.value)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Spatial grid (3×3 position picker — reusable) ───────────────── */

function SpatialGrid({
  options,
  value,
  onChange,
  labelPrefix,
}: {
  /** 3×3 array of class values */
  options: readonly (readonly string[])[]
  value: string
  onChange: (v: string) => void
  /** Prefix to strip from label display, e.g. "object-" or "origin-" */
  labelPrefix?: string
}) {
  return (
    <div className="inline-grid grid-cols-3 gap-0.5 rounded-md border p-0.5">
      {options.map((row) =>
        row.map((pos) => {
          const isActive = value === pos
          const label = labelPrefix ? pos.replace(labelPrefix, "") : pos
          return (
            <Tooltip key={pos}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-sm transition-colors",
                    isActive
                      ? "bg-blue-500/15 text-blue-500"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => onChange(value === pos ? "" : pos)}
                >
                  <div className="size-2 rounded-full bg-current" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-mono">
                {label}
              </TooltipContent>
            </Tooltip>
          )
        }),
      )}
    </div>
  )
}

/** Object position uses SpatialGrid with object-* values */
function ObjectPositionGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SpatialGrid options={OBJECT_POSITION_GRID} value={value} onChange={onChange} labelPrefix="object-" />
}

/** Transform origin grid */
const TRANSFORM_ORIGIN_GRID = [
  ["origin-top-left", "origin-top", "origin-top-right"],
  ["origin-left", "origin-center", "origin-right"],
  ["origin-bottom-left", "origin-bottom", "origin-bottom-right"],
] as const

function TransformOriginGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SpatialGrid options={TRANSFORM_ORIGIN_GRID} value={value} onChange={onChange} labelPrefix="origin-" />
}

/* ── Stepped slider (maps index to discrete values) ──────────────── */

function SteppedSlider({
  label,
  values,
  prefix,
  value,
  onChange,
  suffix,
  hideLabel,
  inline,
}: {
  label: string
  /** The discrete values (without prefix), e.g. ["0", "75", "100", ...] */
  values: readonly string[]
  /** Class prefix, e.g. "duration" → "duration-100" */
  prefix: string
  value: string
  onChange: (v: string) => void
  /** Display suffix, e.g. "ms" or "°" or "%" */
  suffix?: string
  /** Hide the label row (when used inside another control that provides its own) */
  hideLabel?: boolean
  /** Show label inline with slider */
  inline?: boolean
}) {
  const currentIndex = value ? values.indexOf(value.replace(`${prefix}-`, "")) : -1
  const hasValue = currentIndex >= 0
  const displayValue = hasValue ? values[currentIndex] + (suffix ?? "") : ""

  return (
    <div className={hideLabel ? undefined : "space-y-1 pb-3"}>
      {!hideLabel && (
        <div className="flex items-center gap-1 mb-3">
          <p className="flex-1 text-xs font-medium text-foreground">
            {label}
            <span className="ml-1 font-normal text-muted-foreground">{displayValue}</span>
          </p>
          {hasValue && (
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange("")}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {inline && label && <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>}
        <Slider
          className="flex-1"
          active={hasValue}
          value={[Math.max(0, currentIndex)]}
          min={0}
          max={values.length - 1}
          step={1}
          onValueChange={([idx]) => {
            onChange(`${prefix}-${values[idx]}`)
          }}
        />
      </div>
    </div>
  )
}

/* ── Linked control header (shared by Scale, Translate, Rotate, Skew) */

import { Link2, Unlink2 } from "lucide-react"

function LinkedControlHeader({
  label,
  value,
  linked,
  onToggleLink,
  onClear,
}: {
  label: string
  /** Display value string, e.g. "105%" or "105%, 90%" */
  value: string
  linked: boolean
  onToggleLink: () => void
  /** Called when clear button is clicked — clears all values */
  onClear?: () => void
}) {
  const hasValue = value.length > 0

  return (
    <div className="flex items-center gap-1">
      <p className="flex-1 text-xs font-medium text-foreground">
        {label}
        {hasValue && <span className="ml-1 font-normal text-muted-foreground">{value}</span>}
      </p>
      {hasValue && onClear && (
        <button type="button" className="text-muted-foreground hover:text-destructive" onClick={onClear}>
          <X className="size-3" />
        </button>
      )}
      <div className="flex gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors", linked ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={onToggleLink}>
              <Link2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Linked</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors", !linked ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={onToggleLink}>
              <Unlink2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Independent</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

/* ── Border corner/side icons ─────────────────────────────────────── */

function CornerIcon({ corner, className }: { corner: "tl" | "tr" | "bl" | "br"; className?: string }) {
  // Faint rounded square with the relevant corner highlighted as a bold curve
  const bgPaths = {
    tl: "M2 14 V7 Q2 2 7 2 H14 V14 Z",
    tr: "M2 2 H9 Q14 2 14 7 V14 H2 Z",
    br: "M14 2 V9 Q14 14 9 14 H2 V2 Z",
    bl: "M14 14 H7 Q2 14 2 9 V2 H14 Z",
  }
  const corners = {
    tl: "M2 14 V7 Q2 2 7 2 H14",
    tr: "M2 2 H9 Q14 2 14 7 V14",
    br: "M14 2 V9 Q14 14 9 14 H2",
    bl: "M14 14 H7 Q2 14 2 9 V2",
  }
  return (
    <svg className={cn("size-4 shrink-0", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path d={bgPaths[corner]} strokeWidth="1.5" opacity="0.2" />
      <path d={corners[corner]} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function SideIcon({ side, className }: { side: "top" | "right" | "bottom" | "left"; className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" opacity="0.3" />
      {side === "top" && <line x1="2" y1="2" x2="14" y2="2" strokeWidth="3" strokeLinecap="round" />}
      {side === "right" && <line x1="14" y1="2" x2="14" y2="14" strokeWidth="3" strokeLinecap="round" />}
      {side === "bottom" && <line x1="2" y1="14" x2="14" y2="14" strokeWidth="3" strokeLinecap="round" />}
      {side === "left" && <line x1="2" y1="2" x2="2" y2="14" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  )
}

/* ── Border radius control with link/unlink ──────────────────────── */

function BorderRadiusControl({
  radius, radiusTL, radiusTR, radiusBR, radiusBL,
  onRadiusChange, onRadiusTLChange, onRadiusTRChange, onRadiusBRChange, onRadiusBLChange,
}: {
  radius: string; radiusTL: string; radiusTR: string; radiusBR: string; radiusBL: string
  onRadiusChange: (v: string) => void; onRadiusTLChange: (v: string) => void; onRadiusTRChange: (v: string) => void; onRadiusBRChange: (v: string) => void; onRadiusBLChange: (v: string) => void
}) {
  const [linked, setLinked] = React.useState(!radiusTL && !radiusTR && !radiusBR && !radiusBL)
  const radiusValues = ["none", "sm", "md", "lg", "xl", "2xl", "full"] as const

  const handleToggleLink = () => {
    if (!linked) {
      onRadiusTLChange(""); onRadiusTRChange(""); onRadiusBRChange(""); onRadiusBLChange("")
      setLinked(true)
    } else {
      setLinked(false)
    }
  }

  const getVal = (v: string, pfx: string) => v ? v.replace(`${pfx}-`, "") : ""
  const headerValue = linked
    ? getVal(radius, "rounded")
    : [radiusTL ? `TL:${getVal(radiusTL, "rounded-tl")}` : null, radiusTR ? `TR:${getVal(radiusTR, "rounded-tr")}` : null, radiusBR ? `BR:${getVal(radiusBR, "rounded-br")}` : null, radiusBL ? `BL:${getVal(radiusBL, "rounded-bl")}` : null].filter(Boolean).join(", ")

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Radius"
        value={headerValue}
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onRadiusChange(""); onRadiusTLChange(""); onRadiusTRChange(""); onRadiusBRChange(""); onRadiusBLChange("") }}
      />
      {linked ? (
        <SteppedSlider label="Radius" values={radiusValues} prefix="rounded" value={radius} onChange={onRadiusChange} hideLabel />
      ) : (
        <>
          {([
            { corner: "tl" as const, key: radiusTL, prefix: "rounded-tl", onChange: onRadiusTLChange },
            { corner: "tr" as const, key: radiusTR, prefix: "rounded-tr", onChange: onRadiusTRChange },
            { corner: "bl" as const, key: radiusBL, prefix: "rounded-bl", onChange: onRadiusBLChange },
            { corner: "br" as const, key: radiusBR, prefix: "rounded-br", onChange: onRadiusBRChange },
          ]).map(({ corner, key, prefix, onChange: onCornerChange }) => (
            <div key={corner} className="flex items-center gap-1.5">
              <CornerIcon corner={corner} />
              <Slider
                className="flex-1"
                value={[Math.max(0, key ? radiusValues.indexOf(key.replace(`${prefix}-`, "") as typeof radiusValues[number]) : -1)]}
                min={0}
                max={radiusValues.length - 1}
                step={1}
                onValueChange={([idx]) => onCornerChange(`${prefix}-${radiusValues[idx]}`)}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/* ── Border width control with link/unlink ───────────────────────── */

function BorderWidthControl({
  width, widthT, widthR, widthB, widthL,
  onWidthChange, onWidthTChange, onWidthRChange, onWidthBChange, onWidthLChange,
}: {
  width: string; widthT: string; widthR: string; widthB: string; widthL: string
  onWidthChange: (v: string) => void; onWidthTChange: (v: string) => void; onWidthRChange: (v: string) => void; onWidthBChange: (v: string) => void; onWidthLChange: (v: string) => void
}) {
  const [linked, setLinked] = React.useState(!widthT && !widthR && !widthB && !widthL)
  const widthValues = ["0", "", "2", "4", "8"] as const

  const handleToggleLink = () => {
    if (!linked) {
      onWidthTChange(""); onWidthRChange(""); onWidthBChange(""); onWidthLChange("")
      setLinked(true)
    } else {
      setLinked(false)
    }
  }

  const getVal = (v: string, pfx: string) => {
    if (!v) return ""
    if (v === "border" || v === "border-t" || v === "border-r" || v === "border-b" || v === "border-l") return "1"
    return v.replace(`${pfx}-`, "")
  }
  const headerValue = linked
    ? (width ? getVal(width, "border") + "px" : "")
    : [widthT ? `T:${getVal(widthT, "border-t")}px` : null, widthR ? `R:${getVal(widthR, "border-r")}px` : null, widthB ? `B:${getVal(widthB, "border-b")}px` : null, widthL ? `L:${getVal(widthL, "border-l")}px` : null].filter(Boolean).join(", ")

  // Handle the special case where border-1 is just "border" (no number)
  const fixBorderVal = (v: string, pfx: string) => v === `${pfx}-` ? pfx : v

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Width"
        value={headerValue}
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onWidthChange(""); onWidthTChange(""); onWidthRChange(""); onWidthBChange(""); onWidthLChange("") }}
      />
      {linked ? (
        <SteppedSlider label="Width" values={widthValues} prefix="border" value={width} onChange={(v) => onWidthChange(fixBorderVal(v, "border"))} suffix="px" hideLabel />
      ) : (
        <>
          {([
            { side: "top" as const, key: widthT, prefix: "border-t", onChange: onWidthTChange },
            { side: "right" as const, key: widthR, prefix: "border-r", onChange: onWidthRChange },
            { side: "bottom" as const, key: widthB, prefix: "border-b", onChange: onWidthBChange },
            { side: "left" as const, key: widthL, prefix: "border-l", onChange: onWidthLChange },
          ]).map(({ side, key, prefix, onChange: onSideChange }) => (
            <div key={side} className="flex items-center gap-1.5">
              <SideIcon side={side} />
              <Slider
                className="flex-1"
                value={[Math.max(0, key ? widthValues.indexOf(key.replace(`${prefix}-`, "").replace(prefix, "") as typeof widthValues[number]) : -1)]}
                min={0}
                max={widthValues.length - 1}
                step={1}
                onValueChange={([idx]) => onSideChange(fixBorderVal(`${prefix}-${widthValues[idx]}`, prefix))}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/* ── Scale control with link/unlink ──────────────────────────────── */

function ScaleControl({
  scale,
  scaleX,
  scaleY,
  onScaleChange,
  onScaleXChange,
  onScaleYChange,
}: {
  scale: string
  scaleX: string
  scaleY: string
  onScaleChange: (v: string) => void
  onScaleXChange: (v: string) => void
  onScaleYChange: (v: string) => void
}) {
  const [linked, setLinked] = React.useState(!scaleX && !scaleY)

  const handleToggleLink = () => {
    if (!linked) {
      // Linking — clear X/Y, keep uniform scale
      onScaleXChange("")
      onScaleYChange("")
      setLinked(true)
    } else {
      // Unlinking — copy scale to both X and Y
      if (scale) {
        onScaleXChange(scale.replace("scale-", "scale-x-"))
        onScaleYChange(scale.replace("scale-", "scale-y-"))
        onScaleChange("")
      }
      setLinked(false)
    }
  }

  const scaleValues = ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150"] as const

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Scale"
        value={linked
          ? (scale ? scale.replace("scale-", "") + "%" : "")
          : [scaleX ? `X:${scaleX.replace("scale-x-", "")}%` : null, scaleY ? `Y:${scaleY.replace("scale-y-", "")}%` : null].filter(Boolean).join(", ")
        }
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onScaleChange(""); onScaleXChange(""); onScaleYChange("") }}
      />
      {linked ? (
        <SteppedSlider label="Scale" values={scaleValues} prefix="scale" value={scale} onChange={onScaleChange} suffix="%" hideLabel />
      ) : (
        <>
          <SteppedSlider label="X" values={scaleValues} prefix="scale-x" value={scaleX} onChange={onScaleXChange} suffix="%" hideLabel inline />
          <SteppedSlider label="Y" values={scaleValues} prefix="scale-y" value={scaleY} onChange={onScaleYChange} suffix="%" hideLabel inline />
        </>
      )}
    </div>
  )
}

/* ── Translate control with mode toggle ──────────────────────────── */

const TRANSLATE_NUMBERS = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16", "20", "24", "28", "32", "36", "40", "44", "48", "52", "56", "60", "64", "72", "80", "96"] as const
const TRANSLATE_FRACTIONS = ["1/2", "1/3", "2/3", "1/4", "3/4"] as const

type TranslateMode = "numbers" | "fractions" | "full"

function TranslateControl({
  translateX,
  translateY,
  onTranslateXChange,
  onTranslateYChange,
}: {
  translateX: string
  translateY: string
  onTranslateXChange: (v: string) => void
  onTranslateYChange: (v: string) => void
}) {
  const hasIndependentValues = translateX !== translateY
  const [linked, setLinked] = React.useState(!hasIndependentValues && !translateX && !translateY ? true : !hasIndependentValues)

  const handleToggleLink = () => {
    if (!linked) {
      // Linking — set both to X's value (or clear both)
      onTranslateYChange(translateX ? translateX.replace("translate-x-", "translate-y-").replace("-translate-x-", "-translate-y-") : "")
      setLinked(true)
    } else {
      setLinked(false)
    }
  }

  // When linked, sync Y to match X
  const handleLinkedChange = (v: string) => {
    onTranslateXChange(v)
    onTranslateYChange(v ? v.replace("translate-x-", "translate-y-").replace("-translate-x-", "-translate-y-") : "")
  }

  // Display value for header
  const getDisplayVal = (v: string, ax: string) => {
    if (!v) return ""
    const neg = v.startsWith("-")
    const raw = neg ? v.replace(`-translate-${ax}-`, "") : v.replace(`translate-${ax}-`, "")
    return neg ? `-${raw}` : raw
  }
  const headerValue = linked
    ? getDisplayVal(translateX, "x")
    : [translateX ? `X:${getDisplayVal(translateX, "x")}` : null, translateY ? `Y:${getDisplayVal(translateY, "y")}` : null].filter(Boolean).join(", ")

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Translate"
        value={headerValue}
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onTranslateXChange(""); onTranslateYChange("") }}
      />
      {linked ? (
        <TranslateAxisControl label="" axis="x" value={translateX} onChange={handleLinkedChange} hideLabel />
      ) : (
        <>
          <TranslateAxisControl label="X" axis="x" value={translateX} onChange={onTranslateXChange} inline hideLabel />
          <TranslateAxisControl label="Y" axis="y" value={translateY} onChange={onTranslateYChange} inline hideLabel />
        </>
      )}
    </div>
  )
}

function TranslateAxisControl({
  label,
  axis,
  value,
  onChange,
  hideLabel,
  inline,
}: {
  label: string
  /** "x" or "y" */
  axis: string
  value: string
  onChange: (v: string) => void
  /** Hide the label row */
  hideLabel?: boolean
  /** Show label inline with slider */
  inline?: boolean
}) {
  // Detect current mode and negativity from value
  const isNegative = value.startsWith("-")
  const rawValue = isNegative ? value.replace(`-translate-${axis}-`, "") : value.replace(`translate-${axis}-`, "")

  const detectMode = (): TranslateMode => {
    if (!value) return "numbers"
    if (rawValue === "full") return "full"
    if (TRANSLATE_FRACTIONS.includes(rawValue as typeof TRANSLATE_FRACTIONS[number])) return "fractions"
    return "numbers"
  }

  const [mode, setMode] = React.useState<TranslateMode>(detectMode)
  const [negative, setNegative] = React.useState(isNegative)

  const buildClass = (raw: string, neg: boolean) => {
    if (!raw) return ""
    return neg ? `-translate-${axis}-${raw}` : `translate-${axis}-${raw}`
  }

  const handleModeChange = (newMode: TranslateMode) => {
    setMode(newMode)
    if (newMode === "full") {
      onChange(buildClass("full", negative))
    } else {
      // Clear current value when switching modes
      onChange("")
    }
  }

  const handleNegativeToggle = () => {
    const newNeg = !negative
    setNegative(newNeg)
    if (value) {
      onChange(buildClass(rawValue, newNeg))
    }
  }

  const hasValue = !!value
  const displayValue = hasValue ? (isNegative ? `-${rawValue}` : rawValue) : ""

  return (
    <div className={hideLabel ? undefined : "space-y-1"}>
      {!hideLabel && (
        <div className="flex items-center gap-1">
          <p className="flex-1 text-xs font-medium text-foreground">
            {label}
            <span className="ml-1 font-normal text-muted-foreground">{displayValue}</span>
          </p>
          {hasValue && (
            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { onChange(""); setNegative(false) }}>
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {inline && label && <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>}
        {mode !== "full" ? (
          <Slider
            className="flex-1"
            value={[value ? Math.max(0, (mode === "fractions" ? TRANSLATE_FRACTIONS : TRANSLATE_NUMBERS).indexOf(rawValue as never)) : 0]}
            min={0}
            max={(mode === "fractions" ? TRANSLATE_FRACTIONS : TRANSLATE_NUMBERS).length - 1}
            step={1}
            onValueChange={([idx]) => {
              const vals = mode === "fractions" ? TRANSLATE_FRACTIONS : TRANSLATE_NUMBERS
              onChange(buildClass(vals[idx], negative))
            }}
          />
        ) : (
          <p className="flex-1 text-xs text-muted-foreground">{negative ? "-" : ""}full</p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <SlidersHorizontal className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuRadioGroup value={mode} onValueChange={(v) => handleModeChange(v as TranslateMode)}>
              <DropdownMenuRadioItem value="numbers" className="text-xs">Numbers</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="fractions" className="text-xs">Fractions</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="full" className="text-xs">Full</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={negative}
              onCheckedChange={(checked) => {
                const newNeg = !!checked
                setNegative(newNeg)
                if (value) onChange(buildClass(rawValue, newNeg))
              }}
            >
              Negative
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ── Rotate control with link/unlink + deg/rad ──────────────────── */

const ROTATE_DEG_VALUES = ["0", "1", "2", "3", "6", "12", "45", "90", "180"] as const
const ROTATE_RAD_VALUES = ["0", "0.1", "0.2", "0.3", "0.5", "0.8", "1", "1.57", "3.14"] as const

type RotateUnit = "deg" | "rad"

function RotateControl({
  rotate,
  rotateX,
  rotateY,
  onRotateChange,
  onRotateXChange,
  onRotateYChange,
}: {
  rotate: string
  rotateX: string
  rotateY: string
  onRotateChange: (v: string) => void
  onRotateXChange: (v: string) => void
  onRotateYChange: (v: string) => void
}) {
  const [linked, setLinked] = React.useState(!rotateX && !rotateY)

  const handleToggleLink = () => {
    if (!linked) {
      // Linking — clear X/Y
      onRotateXChange("")
      onRotateYChange("")
      setLinked(true)
    } else {
      setLinked(false)
    }
  }

  // Display value helper
  const getRotateVal = (v: string, pfx: string) => {
    if (!v) return ""
    const neg = v.startsWith("-")
    const isArb = v.includes("[")
    const raw = isArb ? v.replace(/.*\[/, "").replace(/\].*/, "") : neg ? v.replace(`-${pfx}-`, "") : v.replace(`${pfx}-`, "")
    return neg ? `-${raw}` : raw
  }
  const headerParts = linked
    ? [getRotateVal(rotate, "rotate")]
    : [
        rotateX ? `X:${getRotateVal(rotateX, "rotate-x")}` : null,
        rotateY ? `Y:${getRotateVal(rotateY, "rotate-y")}` : null,
        rotate ? `Z:${getRotateVal(rotate, "rotate")}` : null,
      ].filter(Boolean)
  const headerValue = headerParts.length > 0 ? headerParts.join(", ") : ""

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Rotate"
        value={headerValue}
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onRotateChange(""); onRotateXChange(""); onRotateYChange("") }}
      />
      {linked ? (
        <RotateAxisControl label="" prefix="rotate" value={rotate} onChange={onRotateChange} hideLabel />
      ) : (
        <>
          <RotateAxisControl label="X" prefix="rotate-x" value={rotateX} onChange={onRotateXChange} hideLabel inline />
          <RotateAxisControl label="Y" prefix="rotate-y" value={rotateY} onChange={onRotateYChange} hideLabel inline />
          <RotateAxisControl label="Z" prefix="rotate" value={rotate} onChange={onRotateChange} hideLabel inline />
        </>
      )}
    </div>
  )
}

function RotateAxisControl({
  label,
  prefix,
  value,
  onChange,
  hideLabel,
  inline,
}: {
  label: string
  prefix: string
  value: string
  onChange: (v: string) => void
  hideLabel?: boolean
  inline?: boolean
}) {
  const isArbitrary = value.includes("[")
  const isNegative = value.startsWith("-")
  const rawValue = isArbitrary
    ? value.replace(/.*\[/, "").replace(/\].*/, "").replace(/deg|rad/, "")
    : isNegative ? value.replace(`-${prefix}-`, "") : value.replace(`${prefix}-`, "")

  const detectUnit = (): RotateUnit => {
    if (isArbitrary && value.includes("rad")) return "rad"
    return "deg"
  }

  const [negative, setNegative] = React.useState(isNegative)
  const [unit, setUnit] = React.useState<RotateUnit>(detectUnit)

  const isAxisRotate = prefix === "rotate-x" || prefix === "rotate-y"

  const buildClass = (raw: string, neg: boolean, u: RotateUnit) => {
    if (!raw) return ""
    if (isAxisRotate || u === "rad") {
      const unitStr = u === "rad" ? "rad" : "deg"
      return neg ? `-${prefix}-[${raw}${unitStr}]` : `${prefix}-[${raw}${unitStr}]`
    }
    return neg ? `-${prefix}-${raw}` : `${prefix}-${raw}`
  }

  const currentValues = unit === "rad" ? ROTATE_RAD_VALUES : ROTATE_DEG_VALUES
  const hasValue = !!value
  const currentIndex = hasValue ? currentValues.indexOf(rawValue as never) : -1
  const unitSuffix = unit === "rad" ? "rad" : "°"
  const displayValue = hasValue ? (isNegative ? `-${rawValue}${unitSuffix}` : `${rawValue}${unitSuffix}`) : ""

  return (
    <div className={hideLabel ? undefined : "space-y-1"}>
      {!hideLabel && (
        <div className="flex items-center gap-1">
          <p className="flex-1 text-xs font-medium text-foreground">
            {label}
            <span className="ml-1 font-normal text-muted-foreground">{displayValue}</span>
          </p>
          {hasValue && (
            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { onChange(""); setNegative(false) }}>
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {inline && label && <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>}
        <Slider
          className="flex-1"
          value={[Math.max(0, currentIndex)]}
          min={0}
          max={currentValues.length - 1}
          step={1}
          onValueChange={([idx]) => {
            onChange(buildClass(currentValues[idx], negative, unit))
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <SlidersHorizontal className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuRadioGroup value={unit} onValueChange={(v) => { setUnit(v as RotateUnit); onChange("") }}>
              <DropdownMenuRadioItem value="deg" className="text-xs">Degrees</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rad" className="text-xs">Radians</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={negative}
              onCheckedChange={(checked) => {
                const newNeg = !!checked
                setNegative(newNeg)
                if (value) onChange(buildClass(rawValue, newNeg, unit))
              }}
            >
              Negative
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ── Skew control with link/unlink ───────────────────────────────── */

const SKEW_DEG_VALUES = ["0", "1", "2", "3", "6", "12"] as const

function SkewControl({
  skewX,
  skewY,
  onSkewXChange,
  onSkewYChange,
}: {
  skewX: string
  skewY: string
  onSkewXChange: (v: string) => void
  onSkewYChange: (v: string) => void
}) {
  const hasIndependentValues = skewX !== skewY.replace("skew-y-", "skew-x-").replace("-skew-y-", "-skew-x-")
  const [linked, setLinked] = React.useState(!hasIndependentValues && !skewX && !skewY ? true : !hasIndependentValues)

  const handleToggleLink = () => {
    if (!linked) {
      // Linking — sync Y to X
      onSkewYChange(skewX ? skewX.replace("skew-x-", "skew-y-").replace("-skew-x-", "-skew-y-") : "")
      setLinked(true)
    } else {
      setLinked(false)
    }
  }

  const handleLinkedChange = (v: string) => {
    onSkewXChange(v)
    onSkewYChange(v ? v.replace("skew-x-", "skew-y-").replace("-skew-x-", "-skew-y-") : "")
  }

  const getSkewVal = (v: string, ax: string) => {
    if (!v) return ""
    const neg = v.startsWith("-")
    const isArb = v.includes("[")
    const raw = isArb ? v.replace(/.*\[/, "").replace(/\].*/, "").replace("rad", "") : neg ? v.replace(`-skew-${ax}-`, "") : v.replace(`skew-${ax}-`, "")
    const u = isArb && v.includes("rad") ? "rad" : "°"
    return neg ? `-${raw}${u}` : `${raw}${u}`
  }
  const headerValue = linked
    ? getSkewVal(skewX, "x")
    : [skewX ? `X:${getSkewVal(skewX, "x")}` : null, skewY ? `Y:${getSkewVal(skewY, "y")}` : null].filter(Boolean).join(", ")

  return (
    <div className="space-y-2">
      <LinkedControlHeader
        label="Skew"
        value={headerValue}
        linked={linked}
        onToggleLink={handleToggleLink}
        onClear={() => { onSkewXChange(""); onSkewYChange("") }}
      />
      {linked ? (
        <SkewAxisControl label="" axis="x" value={skewX} onChange={handleLinkedChange} hideLabel />
      ) : (
        <>
          <SkewAxisControl label="X" axis="x" value={skewX} onChange={onSkewXChange} hideLabel inline />
          <SkewAxisControl label="Y" axis="y" value={skewY} onChange={onSkewYChange} hideLabel inline />
        </>
      )}
    </div>
  )
}

const SKEW_RAD_VALUES = ["0", "0.1", "0.2", "0.3", "0.5", "0.8", "1"] as const

type SkewUnit = "deg" | "rad"

function SkewAxisControl({
  label,
  axis,
  value,
  onChange,
  hideLabel,
  inline,
}: {
  label: string
  axis: string
  value: string
  onChange: (v: string) => void
  hideLabel?: boolean
  inline?: boolean
}) {
  const isNegative = value.startsWith("-")
  const isArbitrary = value.includes("[")
  const rawValue = isArbitrary
    ? value.replace(/.*\[/, "").replace(/\].*/, "").replace("rad", "")
    : isNegative ? value.replace(`-skew-${axis}-`, "") : value.replace(`skew-${axis}-`, "")

  const detectUnit = (): SkewUnit => {
    if (isArbitrary && value.includes("rad")) return "rad"
    return "deg"
  }

  const [negative, setNegative] = React.useState(isNegative)
  const [unit, setUnit] = React.useState<SkewUnit>(detectUnit)

  const buildClass = (raw: string, neg: boolean, u: SkewUnit) => {
    if (!raw) return ""
    if (u === "rad") {
      return neg ? `-skew-${axis}-[${raw}rad]` : `skew-${axis}-[${raw}rad]`
    }
    return neg ? `-skew-${axis}-${raw}` : `skew-${axis}-${raw}`
  }

  const currentValues = unit === "rad" ? SKEW_RAD_VALUES : SKEW_DEG_VALUES
  const hasValue = !!value
  const currentIndex = hasValue ? currentValues.indexOf(rawValue as never) : -1
  const unitSuffix = unit === "rad" ? "rad" : "°"
  const displayValue = hasValue ? (isNegative ? `-${rawValue}${unitSuffix}` : `${rawValue}${unitSuffix}`) : ""

  return (
    <div className={hideLabel ? undefined : "space-y-1"}>
      {!hideLabel && (
        <div className="flex items-center gap-1">
          <p className="flex-1 text-xs font-medium text-foreground">
            {label}
            <span className="ml-1 font-normal text-muted-foreground">{displayValue}</span>
          </p>
          {hasValue && (
            <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { onChange(""); setNegative(false) }}>
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {inline && label && <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>}
        <Slider
          className="flex-1"
          value={[Math.max(0, currentIndex)]}
          min={0}
          max={currentValues.length - 1}
          step={1}
          onValueChange={([idx]) => {
            onChange(buildClass(currentValues[idx], negative, unit))
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <SlidersHorizontal className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuRadioGroup value={unit} onValueChange={(v) => { setUnit(v as SkewUnit); onChange("") }}>
              <DropdownMenuRadioItem value="deg" className="text-xs">Degrees</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rad" className="text-xs">Radians</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={negative}
              onCheckedChange={(checked) => {
                const newNeg = !!checked
                setNegative(newNeg)
                if (value) onChange(buildClass(rawValue, newNeg, unit))
              }}
            >
              Negative
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ── Content distribution picker (align-content / justify-content) ── */

import {
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalSpaceBetween,
  AlignVerticalSpaceAround,
  AlignVerticalDistributeCenter,
  StretchVertical,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalSpaceBetween,
  AlignHorizontalSpaceAround,
  AlignHorizontalDistributeCenter,
  StretchHorizontal,
  Baseline,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from "lucide-react"

const VERTICAL_DISTRIBUTION: Array<{ value: string; icon: React.ElementType }> = [
  { value: "start", icon: AlignVerticalJustifyStart },
  { value: "center", icon: AlignVerticalJustifyCenter },
  { value: "end", icon: AlignVerticalJustifyEnd },
  { value: "between", icon: AlignVerticalSpaceBetween },
  { value: "around", icon: AlignVerticalSpaceAround },
  { value: "evenly", icon: AlignVerticalDistributeCenter },
  { value: "stretch", icon: StretchVertical },
]

const HORIZONTAL_DISTRIBUTION: Array<{ value: string; icon: React.ElementType }> = [
  { value: "start", icon: AlignHorizontalJustifyStart },
  { value: "center", icon: AlignHorizontalJustifyCenter },
  { value: "end", icon: AlignHorizontalJustifyEnd },
  { value: "between", icon: AlignHorizontalSpaceBetween },
  { value: "around", icon: AlignHorizontalSpaceAround },
  { value: "evenly", icon: AlignHorizontalDistributeCenter },
  { value: "stretch", icon: StretchHorizontal },
]

function ContentDistributionPicker({
  prefix,
  value,
  onChange,
  axis = "vertical",
}: {
  /** Class prefix, e.g. "content" for align-content */
  prefix: string
  value: string
  onChange: (v: string) => void
  /** Which axis the distribution operates on — swaps icon set */
  axis?: "vertical" | "horizontal"
}) {
  const options = axis === "horizontal" ? HORIZONTAL_DISTRIBUTION : VERTICAL_DISTRIBUTION

  return (
    <div className="flex flex-wrap gap-0.5">
      {options.map((opt) => {
        const cls = `${prefix}-${opt.value}`
        const isActive = value === cls
        return (
          <IconToggle
            key={opt.value}
            value={cls}
            icon={opt.icon}
            tooltip={cls}
            isActive={isActive}
            onClick={() => onChange(value === cls ? "" : cls)}
          />
        )
      })}
    </div>
  )
}

/* ── Icon toggle item with tooltip ────────────────────────────────── */

function IconToggle({
  value,
  icon: Icon,
  tooltip,
  isActive,
  isDefault,
  onClick,
}: {
  value: string
  icon: React.ElementType
  tooltip: string
  isActive?: boolean
  /** When true, shows amber/orange instead of blue (inherited default, not user-set) */
  isDefault?: boolean
  onClick?: (value: string) => void
}) {
  const activeColor = isDefault
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "bg-blue-500/10 text-blue-500"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            isActive
              ? activeColor
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => onClick?.(value)}
        >
          <Icon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-mono">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Text toggle button (for text-label groups) ─────────────────── */

function TextToggle({
  value,
  label,
  tooltip,
  isActive,
  isDefault,
  onClick,
}: {
  value: string
  label: string
  tooltip: string
  isActive?: boolean
  /** When true, shows amber/orange instead of blue (inherited default, not user-set) */
  isDefault?: boolean
  onClick?: (value: string) => void
}) {
  const activeColor = isDefault
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "bg-blue-500/10 text-blue-500"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
            isActive
              ? activeColor
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => onClick?.(value)}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-mono">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Spacing value input (Figma-style) ──────────────────────────── */

function SpacingValueInput({
  prefix,
  value,
  onChange,
  placeholder = "–",
  allowNegative = false,
  allowAuto = false,
}: {
  prefix: string // e.g. "p", "pt", "m", "ml"
  value: string // e.g. "p-4" or ""
  onChange: (val: string) => void
  placeholder?: string
  allowNegative?: boolean
  allowAuto?: boolean
}) {
  // Handle negative prefix: value might be "-mt-4" with prefix "mt"
  const isNeg = value.startsWith("-")
  const stripped = isNeg ? value.replace(/^-[a-z]+-/, "") : value.replace(/^[a-z]+-/, "")
  const numericVal = value ? (isNeg ? `-${stripped}` : stripped === "auto" ? "auto" : stripped) : ""
  const pxLabel = SPACING_PX[stripped] ?? ""

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="w-5 text-xs text-muted-foreground">{prefix}</span>
      <Select
        value={numericVal || "__none__"}
        onValueChange={(v) => {
          if (v === "__none__") {
            onChange("")
          } else if (v === "auto") {
            onChange(`${prefix}-auto`)
          } else if (v.startsWith("-")) {
            onChange(`-${prefix}-${v.slice(1)}`)
          } else {
            onChange(`${prefix}-${v}`)
          }
        }}
      >
        <SelectTrigger className="h-6 w-16 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">–</SelectItem>
          {allowAuto && <SelectItem value="auto">auto</SelectItem>}
          {SPACING_VALUES.map((v) => (
            <SelectItem key={v} value={v}>
              {v} {SPACING_PX[v] ? `(${SPACING_PX[v]})` : ""}
            </SelectItem>
          ))}
          {allowNegative && (
            <>
              {NEGATIVE_SPACING_VALUES.map((v) => (
                <SelectItem key={`neg-${v}`} value={`-${v}`}>
                  -{v}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      {pxLabel && (
        <span className="text-xs text-muted-foreground">{pxLabel}</span>
      )}
    </div>
  )
}

/* ── Box model control (Figma-style: all → expand to sides) ──────── */

function BoxModelControl({
  label,
  allPrefix,
  allValue,
  onAllChange,
  sides,
  expanded,
  onToggleExpand,
  allowNegative = false,
  allowAuto = false,
}: {
  label: string
  allPrefix: string
  allValue: string
  onAllChange: (val: string) => void
  sides: {
    prefix: string
    label: string
    value: string
    onChange: (val: string) => void
  }[]
  expanded: boolean
  onToggleExpand: () => void
  allowNegative?: boolean
  allowAuto?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <SpacingValueInput
          prefix={allPrefix}
          value={allValue}
          onChange={onAllChange}
          allowNegative={allowNegative}
          allowAuto={allowAuto}
        />
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          onClick={onToggleExpand}
        >
          {expanded ? (
            <Minus className="size-3" />
          ) : (
            <Plus className="size-3" />
          )}
        </Button>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-1 pl-2">
          {sides.map((side) => (
            <SpacingValueInput
              key={side.prefix}
              prefix={side.prefix}
              value={side.value}
              onChange={side.onChange}
              allowNegative={allowNegative}
              allowAuto={allowAuto}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Spacing slider ──────────────────────────────────────────────── */

function SpacingSlider({
  label,
  scale,
  value,
  onChange,
}: {
  label: string
  scale: readonly string[]
  value: string
  onChange: (val: string) => void
}) {
  const index = scale.indexOf(value)
  const numericVal = value.replace(/^[a-z]+-/, "")
  const pxLabel = SPACING_PX[numericVal] ?? ""

  return (
    <EditPanelRow label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <Slider
          min={0}
          max={scale.length - 1}
          step={1}
          value={[Math.max(0, index)]}
          onValueChange={([v]) => {
            if (v !== undefined && scale[v]) onChange(scale[v])
          }}
          className="flex-1"
        />
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
          {pxLabel}
        </span>
      </div>
    </EditPanelRow>
  )
}

/* ── Colour picker ────────────────────────────────────────────────── */

/** ColourPicker popover — shadcn tokens + full Tailwind palette */
function ColorPicker({
  label,
  prefix,
  shadcnTokens,
  value,
  onChange,
  className,
}: {
  label: string
  prefix: string // "text", "bg", "border", "ring", "ring-offset", "outline", "from", "via", "to"
  shadcnTokens?: { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Parse current value for display
  const hex = value ? getSwatchHex(value, prefix) : null
  const tokenSwatch = value ? getShadcnTokenSwatch(value) : null
  const displayLabel = value
    ? value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value
    : ""

  // Filter palette by search
  const filteredColors = search
    ? TW_COLOR_NAMES.filter((c) => c.includes(search.toLowerCase()))
    : TW_COLOR_NAMES

  return (
    <EditPanelRow label={label} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-full items-center gap-2 rounded-md border bg-transparent px-2 text-xs hover:bg-muted"
          >
            {value ? (
              <span
                className={cn(
                  "size-4 shrink-0 rounded-sm border border-border/50",
                  tokenSwatch ? tokenSwatch.value : "",
                )}
                style={hex ? { backgroundColor: hex } : undefined}
              />
            ) : (
              <span className="size-4 shrink-0 rounded-sm border border-dashed border-muted-foreground/40" />
            )}
            <span className="flex-1 truncate text-left">{displayLabel}</span>
            {value && (
              <span
                role="button"
                tabIndex={0}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onChange("") }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange("") } }}
              >
                <X className="size-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="end" side="top">
          <div className="space-y-2 p-2">
            {/* Search */}
            <Input
              placeholder="Search colours…"
              className="h-7 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 pr-2">
                {/* Special values */}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Special</p>
                  <div className="flex flex-wrap gap-1">
                    {["inherit", "current", "transparent"].map((s) => {
                      const cls = `${prefix}-${s}`
                      return (
                        <Badge
                          key={s}
                          variant={value === cls ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => { onChange(value === cls ? "" : cls); setOpen(false) }}
                        >
                          {s}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* shadcn tokens */}
                {shadcnTokens && shadcnTokens.length > 0 && (!search || "shadcn".includes(search.toLowerCase())) && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">shadcn tokens</p>
                    <div className="flex flex-wrap gap-1">
                      {shadcnTokens.map((t) => (
                        <Tooltip key={t.value}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "size-6 rounded-md transition-all",
                                SHADCN_SWATCH_MAP[t.value] ?? "bg-muted",
                                value === t.value
                                  ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                                  : "ring-1 ring-border hover:ring-foreground/30",
                              )}
                              onClick={() => { onChange(value === t.value ? "" : t.value); setOpen(false) }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {t.label}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Black & White */}
                {(!search || "black white".includes(search.toLowerCase())) && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Black & White</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { s: "black", hex: "#000000" },
                        { s: "white", hex: "#ffffff" },
                      ].map(({ s, hex: h }) => {
                        const cls = `${prefix}-${s}`
                        return (
                          <button
                            key={s}
                            type="button"
                            className={cn(
                              "size-6 rounded-md border transition-all",
                              value === cls
                                ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                                : "ring-1 ring-border hover:ring-foreground/30",
                            )}
                            style={{ backgroundColor: h }}
                            onClick={() => { onChange(value === cls ? "" : cls); setOpen(false) }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Full Tailwind palette */}
                {filteredColors.map((colorName) => (
                  <div key={colorName}>
                    <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{colorName}</p>
                    <div className="flex flex-wrap gap-0.5">
                      {TW_SHADES.map((shade) => {
                        const cls = `${prefix}-${colorName}-${shade}`
                        const h = TW_SWATCH_COLORS[colorName]?.[shade] ?? "#888"
                        return (
                          <Tooltip key={shade}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "size-5 rounded-sm transition-all",
                                  value === cls
                                    ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                                    : "hover:ring-1 hover:ring-foreground/30",
                                )}
                                style={{ backgroundColor: h }}
                                onClick={() => { onChange(value === cls ? "" : cls); setOpen(false) }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {colorName}-{shade}
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </EditPanelRow>
  )
}

/* ── Z-index input (commits on blur/Enter) ─────────────────────── */

function ZIndexInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = value ? value.replace("z-", "").replace(/[\[\]]/g, "") : ""
  const [localVal, setLocalVal] = React.useState(parsed)

  React.useEffect(() => {
    setLocalVal(parsed)
  }, [parsed])

  function commit() {
    const v = localVal.replace(/[^0-9]/g, "")
    if (!v) { onChange(""); return }
    const num = parseInt(v, 10)
    if (isNaN(num)) return
    if ([0, 10, 20, 30, 40, 50].includes(num)) {
      onChange(`z-${num}`)
    } else {
      onChange(`z-[${num}]`)
    }
  }

  return (
    <div className="flex">
      <input
        type="text"
        inputMode="numeric"
        placeholder="–"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") commit() }}
        className="h-6 w-14 rounded-l-md rounded-r-none border border-r-0 bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
      />
      <Button
        variant="outline"
        size="icon"
        className="size-6 rounded-l-none"
        onClick={commit}
      >
        <Check className="size-3" />
      </Button>
    </div>
  )
}

/* ── Grid number picker (e.g. grid-cols-3) ─────────────────────── */

function GridNumberPicker({
  value,
  prefix,
  max = 12,
  extras,
  allowCustom = false,
  onChange,
}: {
  value: string
  prefix: string // e.g. "grid-cols", "col-span"
  max?: number
  extras?: Array<{ value: string; label: string }>
  allowCustom?: boolean
  onChange: (v: string) => void
}) {
  const [showCustom, setShowCustom] = React.useState(false)
  const [customInput, setCustomInput] = React.useState("")

  // Parse current numeric value
  const numMatch = value.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`))
  const currentNum = numMatch ? parseInt(numMatch[1], 10) : 0
  const isNumeric = !!numMatch
  const isArbitrary = value.includes("[")
  const isExtra = value && !isNumeric && !isArbitrary

  // Detect if current value is arbitrary and populate input
  React.useEffect(() => {
    if (isArbitrary) {
      const match = value.match(/\[([^\]]+)\]/)
      if (match) {
        setCustomInput(match[1].replace(/_/g, " "))
        setShowCustom(true)
      }
    }
  }, [value, isArbitrary])

  function handleCustomSubmit() {
    if (!customInput.trim()) {
      onChange("")
      setShowCustom(false)
      return
    }
    // Convert spaces to underscores for Tailwind arbitrary syntax
    const twValue = customInput.trim().replace(/\s+/g, "_")
    onChange(`${prefix}-[${twValue}]`)
  }

  if (showCustom) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit() }}
          placeholder="e.g. 1fr auto"
          className="h-6 w-28 text-xs"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="size-6" onClick={handleCustomSubmit}>
          <ChevronRight className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground"
          onClick={() => { setShowCustom(false); setCustomInput(""); if (isArbitrary) onChange("") }}
        >
          <X className="size-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Number input with up/down */}
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className="size-6 rounded-r-none"
          disabled={isExtra || isArbitrary || currentNum <= 1}
          onClick={() => onChange(currentNum <= 1 ? "" : `${prefix}-${currentNum - 1}`)}
        >
          <ChevronDown className="size-3" />
        </Button>
        <span className="w-6 text-center text-xs tabular-nums">
          {isNumeric ? currentNum : ""}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 rounded-l-none"
          disabled={isExtra || isArbitrary || currentNum >= max}
          onClick={() => onChange(`${prefix}-${currentNum + 1}`)}
        >
          <ChevronUp className="size-3" />
        </Button>
      </div>

      {/* Extra buttons (auto, full, etc.) */}
      {extras?.map((ext) => (
        <TextToggle
          key={ext.value}
          value={ext.value}
          label={ext.label}
          tooltip={ext.value}
          isActive={value === ext.value}
          onClick={() => onChange(value === ext.value ? "" : ext.value)}
        />
      ))}

      {/* Custom button */}
      {allowCustom && (
        <TextToggle
          value="__custom__"
          label="custom"
          tooltip="Arbitrary value (e.g. 1fr auto)"
          isActive={isArbitrary}
          onClick={() => setShowCustom(true)}
        />
      )}

      {/* Clear */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={() => onChange("")}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}

/* ── Gap helpers ────────────────────────────────────────────────── */

function gapValueToIndex(val: string, prefix: string): number {
  if (!val) return 0
  const num = parseFloat(val.replace(`${prefix}-`, ""))
  const idx = GAP_SLIDER_VALUES.indexOf(num)
  return idx >= 0 ? idx : 0
}

function indexToGapValue(idx: number, prefix: string): string {
  if (idx === 0) return ""
  const val = GAP_SLIDER_VALUES[idx]
  return val !== undefined ? `${prefix}-${val}` : ""
}

/* ── Gap control with slider + split toggle ────────────────────── */

function GapControl({
  gap,
  gapX,
  gapY,
  onGapChange,
  onGapXChange,
  onGapYChange,
}: {
  gap: string
  gapX: string
  gapY: string
  onGapChange: (v: string) => void
  onGapXChange: (v: string) => void
  onGapYChange: (v: string) => void
}) {
  const [split, setSplit] = React.useState(!!gapX || !!gapY)

  const handleToggleSplit = () => {
    if (split) {
      // Merging back to single gap — clear x/y
      onGapXChange("")
      onGapYChange("")
      setSplit(false)
    } else {
      // Splitting — copy gap to both x and y, clear gap
      onGapXChange(gap ? gap.replace("gap-", "gap-x-") : "")
      onGapYChange(gap ? gap.replace("gap-", "gap-y-") : "")
      onGapChange("")
      setSplit(true)
    }
  }

  const gapDisplayValue = split
    ? `x:${gapX ? gapX.replace("gap-x-", "") : "0"} y:${gapY ? gapY.replace("gap-y-", "") : "0"}`
    : gap ? gap.replace("gap-", "") : "0"

  return (
    <EditPanelRow label="Gap" value={gapDisplayValue}>
      <div className="space-y-2">
        {!split ? (
          <Slider
            value={[gapValueToIndex(gap, "gap")]}
            onValueChange={([v]) => onGapChange(indexToGapValue(v, "gap"))}
            max={GAP_SLIDER_VALUES.length - 1}
            step={1}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-3 text-xs text-muted-foreground">x</span>
              <Slider
                value={[gapValueToIndex(gapX, "gap-x")]}
                onValueChange={([v]) => onGapXChange(indexToGapValue(v, "gap-x"))}
                max={GAP_SLIDER_VALUES.length - 1}
                step={1}
                className="flex-1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-3 text-xs text-muted-foreground">y</span>
              <Slider
                value={[gapValueToIndex(gapY, "gap-y")]}
                onValueChange={([v]) => onGapYChange(indexToGapValue(v, "gap-y"))}
                max={GAP_SLIDER_VALUES.length - 1}
                step={1}
                className="flex-1"
              />
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-full gap-1 text-xs text-muted-foreground"
          onClick={handleToggleSplit}
        >
          {split ? "Merge to single gap" : "Split x / y"}
        </Button>
      </div>
    </EditPanelRow>
  )
}

/* ── Exports ─────────────────────────────────────────────────────── */

export {
  SHADCN_SWATCH_MAP,
  getShadcnTokenSwatch,
  PositionGrid,
  ObjectPositionGrid,
  IconToggle,
  TextToggle,
  SpacingValueInput,
  BoxModelControl,
  SpacingSlider,
  ColorPicker,
  ZIndexInput,
  GridNumberPicker,
  gapValueToIndex,
  indexToGapValue,
  GapControl,
  ContentDistributionPicker,
  SpatialGrid,
  TransformOriginGrid,
  SteppedSlider,
  ScaleControl,
  TranslateControl,
  TranslateAxisControl,
  SkewControl,
  RotateControl,
  BorderRadiusControl,
  BorderWidthControl,
}
