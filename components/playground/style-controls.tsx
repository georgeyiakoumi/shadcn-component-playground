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
}) {
  const currentIndex = value ? values.indexOf(value.replace(`${prefix}-`, "")) : -1
  const hasValue = currentIndex >= 0
  const displayValue = hasValue ? values[currentIndex] + (suffix ?? "") : "–"

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
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
      <Slider
        value={[Math.max(0, currentIndex)]}
        min={0}
        max={values.length - 1}
        step={1}
        onValueChange={([idx]) => {
          onChange(`${prefix}-${values[idx]}`)
        }}
      />
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
}: {
  label: string
  prefix: string // "text", "bg", "border", "ring", "ring-offset", "outline", "from", "via", "to"
  shadcnTokens?: { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Parse current value for display
  const hex = value ? getSwatchHex(value, prefix) : null
  const tokenSwatch = value ? getShadcnTokenSwatch(value) : null
  const displayLabel = value
    ? value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value
    : "–"

  // Filter palette by search
  const filteredColors = search
    ? TW_COLOR_NAMES.filter((c) => c.includes(search.toLowerCase()))
    : TW_COLOR_NAMES

  return (
    <EditPanelRow label={label}>
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
          {isNumeric ? currentNum : "–"}
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
}
