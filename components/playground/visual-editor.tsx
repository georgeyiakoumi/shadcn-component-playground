"use client"

import * as React from "react"
import {
  Layout,
  Type,
  Palette,
  Square,
  Sparkles,
  Box,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ElementInfo } from "@/components/playground/element-selector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* ── Types ──────────────────────────────────────────────────────── */

interface VisualEditorProps {
  selectedElement: ElementInfo | null
  onClassChange: (classes: string[]) => void
  onDeselect: () => void
}

interface ControlState {
  // Layout
  display: string
  direction: string
  justify: string
  align: string
  gap: string
  // Spacing
  padding: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  margin: string
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  // Typography
  fontSize: string
  fontWeight: string
  textAlign: string
  // Colours
  textColor: string
  bgColor: string
  // Borders
  borderRadius: string
  borderWidth: string
  // Effects
  shadow: string
}

/* ── Class-to-state mapping ──────────────────────────────────────── */

const DISPLAY_OPTIONS = ["flex", "grid", "block", "inline-flex", "hidden"]
const DIRECTION_OPTIONS = [
  "flex-row",
  "flex-col",
  "flex-row-reverse",
  "flex-col-reverse",
]
const JUSTIFY_OPTIONS = [
  "justify-start",
  "justify-center",
  "justify-end",
  "justify-between",
]
const ALIGN_OPTIONS = [
  "items-start",
  "items-center",
  "items-end",
  "items-stretch",
]
const GAP_OPTIONS = [
  "gap-0",
  "gap-1",
  "gap-2",
  "gap-3",
  "gap-4",
  "gap-6",
  "gap-8",
]

const PADDING_SCALE = [
  "p-0",
  "p-1",
  "p-2",
  "p-3",
  "p-4",
  "p-5",
  "p-6",
  "p-8",
  "p-10",
  "p-12",
]
const MARGIN_SCALE = [
  "m-0",
  "m-1",
  "m-2",
  "m-3",
  "m-4",
  "m-5",
  "m-6",
  "m-8",
  "m-10",
  "m-12",
]

const PADDING_SIDES = {
  paddingTop: ["pt-0", "pt-1", "pt-2", "pt-3", "pt-4", "pt-5", "pt-6", "pt-8", "pt-10", "pt-12"],
  paddingRight: ["pr-0", "pr-1", "pr-2", "pr-3", "pr-4", "pr-5", "pr-6", "pr-8", "pr-10", "pr-12"],
  paddingBottom: ["pb-0", "pb-1", "pb-2", "pb-3", "pb-4", "pb-5", "pb-6", "pb-8", "pb-10", "pb-12"],
  paddingLeft: ["pl-0", "pl-1", "pl-2", "pl-3", "pl-4", "pl-5", "pl-6", "pl-8", "pl-10", "pl-12"],
} as const

const MARGIN_SIDES = {
  marginTop: ["mt-0", "mt-1", "mt-2", "mt-3", "mt-4", "mt-5", "mt-6", "mt-8", "mt-10", "mt-12"],
  marginRight: ["mr-0", "mr-1", "mr-2", "mr-3", "mr-4", "mr-5", "mr-6", "mr-8", "mr-10", "mr-12"],
  marginBottom: ["mb-0", "mb-1", "mb-2", "mb-3", "mb-4", "mb-5", "mb-6", "mb-8", "mb-10", "mb-12"],
  marginLeft: ["ml-0", "ml-1", "ml-2", "ml-3", "ml-4", "ml-5", "ml-6", "ml-8", "ml-10", "ml-12"],
} as const

const FONT_SIZE_OPTIONS = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
]
const FONT_WEIGHT_OPTIONS = [
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
]
const TEXT_ALIGN_OPTIONS = ["text-left", "text-center", "text-right"]

const TEXT_COLOR_OPTIONS = [
  { label: "Foreground", value: "text-foreground" },
  { label: "Primary", value: "text-primary" },
  { label: "Secondary", value: "text-secondary-foreground" },
  { label: "Muted", value: "text-muted-foreground" },
  { label: "Destructive", value: "text-destructive" },
  { label: "Accent", value: "text-accent-foreground" },
]

const BG_COLOR_OPTIONS = [
  { label: "Background", value: "bg-background" },
  { label: "Primary", value: "bg-primary" },
  { label: "Secondary", value: "bg-secondary" },
  { label: "Muted", value: "bg-muted" },
  { label: "Accent", value: "bg-accent" },
  { label: "Destructive", value: "bg-destructive" },
]

const BORDER_RADIUS_OPTIONS = [
  "rounded-none",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-full",
]
const BORDER_WIDTH_OPTIONS = ["border-0", "border", "border-2", "border-4"]

const SHADOW_OPTIONS = [
  "shadow-none",
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
]

/* ── Pixel value mapping for spacing labels ──────────────────────── */

const SPACING_PX: Record<string, string> = {
  "0": "0px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
}

/* ── Parsing / serialising ──────────────────────────────────────── */

function findMatch(classes: string[], options: string[]): string {
  return classes.find((c) => options.includes(c)) ?? ""
}

function findColorMatch(
  classes: string[],
  options: { label: string; value: string }[],
): string {
  const values = options.map((o) => o.value)
  return classes.find((c) => values.includes(c)) ?? ""
}

function classesToControlState(classes: string[]): ControlState {
  return {
    display: findMatch(classes, DISPLAY_OPTIONS),
    direction: findMatch(classes, DIRECTION_OPTIONS),
    justify: findMatch(classes, JUSTIFY_OPTIONS),
    align: findMatch(classes, ALIGN_OPTIONS),
    gap: findMatch(classes, GAP_OPTIONS),
    padding: findMatch(classes, PADDING_SCALE),
    paddingTop: findMatch(classes, [...PADDING_SIDES.paddingTop]),
    paddingRight: findMatch(classes, [...PADDING_SIDES.paddingRight]),
    paddingBottom: findMatch(classes, [...PADDING_SIDES.paddingBottom]),
    paddingLeft: findMatch(classes, [...PADDING_SIDES.paddingLeft]),
    margin: findMatch(classes, MARGIN_SCALE),
    marginTop: findMatch(classes, [...MARGIN_SIDES.marginTop]),
    marginRight: findMatch(classes, [...MARGIN_SIDES.marginRight]),
    marginBottom: findMatch(classes, [...MARGIN_SIDES.marginBottom]),
    marginLeft: findMatch(classes, [...MARGIN_SIDES.marginLeft]),
    fontSize: findMatch(classes, FONT_SIZE_OPTIONS),
    fontWeight: findMatch(classes, FONT_WEIGHT_OPTIONS),
    textAlign: findMatch(classes, TEXT_ALIGN_OPTIONS),
    textColor: findColorMatch(classes, TEXT_COLOR_OPTIONS),
    bgColor: findColorMatch(classes, BG_COLOR_OPTIONS),
    borderRadius: findMatch(classes, BORDER_RADIUS_OPTIONS),
    borderWidth: findMatch(classes, BORDER_WIDTH_OPTIONS),
    shadow: findMatch(classes, SHADOW_OPTIONS),
  }
}

/** All class prefixes that the visual editor manages. */
const MANAGED_PREFIXES = [
  ...DISPLAY_OPTIONS,
  ...DIRECTION_OPTIONS,
  ...JUSTIFY_OPTIONS,
  ...ALIGN_OPTIONS,
  ...GAP_OPTIONS,
  ...PADDING_SCALE,
  ...Object.values(PADDING_SIDES).flat(),
  ...MARGIN_SCALE,
  ...Object.values(MARGIN_SIDES).flat(),
  ...FONT_SIZE_OPTIONS,
  ...FONT_WEIGHT_OPTIONS,
  ...TEXT_ALIGN_OPTIONS,
  ...TEXT_COLOR_OPTIONS.map((o) => o.value),
  ...BG_COLOR_OPTIONS.map((o) => o.value),
  ...BORDER_RADIUS_OPTIONS,
  ...BORDER_WIDTH_OPTIONS,
  ...SHADOW_OPTIONS,
]

function controlStateToClasses(state: ControlState): string[] {
  const result: string[] = []
  const push = (v: string) => {
    if (v) result.push(v)
  }

  push(state.display)
  push(state.direction)
  push(state.justify)
  push(state.align)
  push(state.gap)
  push(state.padding)
  push(state.paddingTop)
  push(state.paddingRight)
  push(state.paddingBottom)
  push(state.paddingLeft)
  push(state.margin)
  push(state.marginTop)
  push(state.marginRight)
  push(state.marginBottom)
  push(state.marginLeft)
  push(state.fontSize)
  push(state.fontWeight)
  push(state.textAlign)
  push(state.textColor)
  push(state.bgColor)
  push(state.borderRadius)
  push(state.borderWidth)
  push(state.shadow)

  return result
}

/**
 * Merge updated control-state classes with original classes,
 * preserving any classes the editor does not manage.
 */
function mergeClasses(
  original: string[],
  state: ControlState,
): string[] {
  const managed = new Set(MANAGED_PREFIXES)
  const unmanaged = original.filter((c) => !managed.has(c))
  const editorClasses = controlStateToClasses(state)
  return [...unmanaged, ...editorClasses]
}

/* ── Collapsible section ─────────────────────────────────────────── */

function ControlSection({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon className="size-3.5" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  )
}

/* ── Control row label ───────────────────────────────────────────── */

function ControlRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

/* ── Spacing value input (Figma-style) ──────────────────────────── */

const SPACING_VALUES = ["0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const

function SpacingValueInput({
  prefix,
  value,
  onChange,
  placeholder = "–",
}: {
  prefix: string // e.g. "p", "pt", "m", "ml"
  value: string // e.g. "p-4" or ""
  onChange: (val: string) => void
  placeholder?: string
}) {
  const numericVal = value ? value.replace(/^[a-z]+-/, "") : ""
  const pxLabel = SPACING_PX[numericVal] ?? ""

  return (
    <div className="flex items-center gap-1">
      <span className="w-5 text-[10px] text-muted-foreground">{prefix}</span>
      <Select
        value={numericVal || "__none__"}
        onValueChange={(v) => {
          if (v === "__none__") {
            onChange("")
          } else {
            onChange(`${prefix}-${v}`)
          }
        }}
      >
        <SelectTrigger className="h-6 w-14 text-[10px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">–</SelectItem>
          {SPACING_VALUES.map((v) => (
            <SelectItem key={v} value={v}>
              {v} {SPACING_PX[v] ? `(${SPACING_PX[v]})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pxLabel && (
        <span className="text-[9px] text-muted-foreground">{pxLabel}</span>
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
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <SpacingValueInput
          prefix={allPrefix}
          value={allValue}
          onChange={onAllChange}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Border radius control (Figma-style) ─────────────────────────── */

const RADIUS_VALUES = [
  { value: "rounded-none", label: "none", px: "0" },
  { value: "rounded-sm", label: "sm", px: "2px" },
  { value: "rounded-md", label: "md", px: "6px" },
  { value: "rounded-lg", label: "lg", px: "8px" },
  { value: "rounded-xl", label: "xl", px: "12px" },
  { value: "rounded-2xl", label: "2xl", px: "16px" },
  { value: "rounded-full", label: "full", px: "9999px" },
] as const

const RADIUS_SIDES = [
  { prefix: "rounded-tl", label: "TL" },
  { prefix: "rounded-tr", label: "TR" },
  { prefix: "rounded-bl", label: "BL" },
  { prefix: "rounded-br", label: "BR" },
] as const

/* ── (legacy SpacingSlider kept for compatibility but unused) ─────── */

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
    <ControlRow label={label}>
      <div className="flex items-center gap-2">
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
        <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
          {pxLabel}
        </span>
      </div>
    </ControlRow>
  )
}

/* ── Colour swatch grid ──────────────────────────────────────────── */

const COLOR_SWATCH_MAP: Record<string, string> = {
  "text-foreground": "bg-foreground",
  "text-primary": "bg-primary",
  "text-secondary-foreground": "bg-secondary-foreground",
  "text-muted-foreground": "bg-muted-foreground",
  "text-destructive": "bg-destructive",
  "text-accent-foreground": "bg-accent-foreground",
  "bg-background": "bg-background border",
  "bg-primary": "bg-primary",
  "bg-secondary": "bg-secondary",
  "bg-muted": "bg-muted",
  "bg-accent": "bg-accent",
  "bg-destructive": "bg-destructive",
}

function ColorSwatchGrid({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
}) {
  return (
    <ControlRow label={label}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "size-6 rounded-md transition-all",
                    COLOR_SWATCH_MAP[opt.value] ?? "bg-muted",
                    value === opt.value
                      ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                      : "ring-1 ring-border hover:ring-foreground/30",
                  )}
                  onClick={() =>
                    onChange(value === opt.value ? "" : opt.value)
                  }
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {opt.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </ControlRow>
  )
}

/* ── Main component ──────────────────────────────────────────────── */

export function VisualEditor({
  selectedElement,
  onClassChange,
  onDeselect,
}: VisualEditorProps) {
  const [state, setState] = React.useState<ControlState>(() =>
    classesToControlState(selectedElement?.currentClasses ?? []),
  )
  const [showPaddingSides, setShowPaddingSides] = React.useState(false)
  const [showMarginSides, setShowMarginSides] = React.useState(false)

  // Original classes that the editor does not manage
  const originalClasses = React.useRef<string[]>([])

  // Sync state when selected element changes
  React.useEffect(() => {
    const classes = selectedElement?.currentClasses ?? []
    originalClasses.current = classes
    setState(classesToControlState(classes))
    setShowPaddingSides(false)
    setShowMarginSides(false)
  }, [selectedElement])

  // Emit class changes whenever state updates (skip initial mount)
  const isInitial = React.useRef(true)
  React.useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    onClassChange(mergeClasses(originalClasses.current, state))
  }, [state, onClassChange])

  // Reset initial flag when element changes
  React.useEffect(() => {
    isInitial.current = true
  }, [selectedElement])

  const update = React.useCallback(
    <K extends keyof ControlState>(key: K, value: ControlState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const toggleValue = React.useCallback(
    <K extends keyof ControlState>(
      key: K,
      value: string,
    ) => {
      setState((prev) => ({
        ...prev,
        [key]: prev[key] === value ? "" : value,
      }))
    },
    [],
  )

  if (!selectedElement) return null

  const isFlex =
    state.display === "flex" || state.display === "inline-flex"

  const allClasses = mergeClasses(originalClasses.current, state)

  return (
    <div className="flex h-full w-[320px] flex-col">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onDeselect}
        >
          <ArrowLeft className="size-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {"<"}
            {selectedElement.tagName}
            {">"}
          </p>
          {selectedElement.textContent && (
            <p className="truncate text-[10px] text-muted-foreground">
              {selectedElement.textContent}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onDeselect}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {/* ── Layout ────────────────────────────────────── */}
          <ControlSection icon={Layout} title="Layout">
            <ControlRow label="Display">
              <ToggleGroup
                type="single"
                value={state.display}
                onValueChange={(v) => update("display", v)}
                className="flex flex-wrap gap-1"
              >
                {DISPLAY_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>

            {isFlex && (
              <ControlRow label="Direction">
                <ToggleGroup
                  type="single"
                  value={state.direction}
                  onValueChange={(v) => update("direction", v)}
                  className="flex flex-wrap gap-1"
                >
                  {DIRECTION_OPTIONS.map((opt) => (
                    <ToggleGroupItem
                      key={opt}
                      value={opt}
                      className="h-6 px-2 text-[10px]"
                    >
                      {opt.replace("flex-", "")}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </ControlRow>
            )}

            <ControlRow label="Justify">
              <ToggleGroup
                type="single"
                value={state.justify}
                onValueChange={(v) => update("justify", v)}
                className="flex flex-wrap gap-1"
              >
                {JUSTIFY_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("justify-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>

            <ControlRow label="Align">
              <ToggleGroup
                type="single"
                value={state.align}
                onValueChange={(v) => update("align", v)}
                className="flex flex-wrap gap-1"
              >
                {ALIGN_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("items-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>

            <ControlRow label="Gap">
              <ToggleGroup
                type="single"
                value={state.gap}
                onValueChange={(v) => update("gap", v)}
                className="flex flex-wrap gap-1"
              >
                {GAP_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("gap-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>
          </ControlSection>

          {/* ── Spacing ──────────────────────────────────── */}
          <ControlSection icon={Box} title="Spacing">
            <ControlRow label="Padding">
              <BoxModelControl
                label="Padding"
                allPrefix="p"
                allValue={state.padding}
                onAllChange={(v) => update("padding", v)}
                sides={[
                  { prefix: "pt", label: "Top", value: state.paddingTop, onChange: (v) => update("paddingTop", v) },
                  { prefix: "pr", label: "Right", value: state.paddingRight, onChange: (v) => update("paddingRight", v) },
                  { prefix: "pb", label: "Bottom", value: state.paddingBottom, onChange: (v) => update("paddingBottom", v) },
                  { prefix: "pl", label: "Left", value: state.paddingLeft, onChange: (v) => update("paddingLeft", v) },
                ]}
                expanded={showPaddingSides}
                onToggleExpand={() => setShowPaddingSides((v) => !v)}
              />
            </ControlRow>

            <Separator className="my-1" />

            <ControlRow label="Margin">
              <BoxModelControl
                label="Margin"
                allPrefix="m"
                allValue={state.margin}
                onAllChange={(v) => update("margin", v)}
                sides={[
                  { prefix: "mt", label: "Top", value: state.marginTop, onChange: (v) => update("marginTop", v) },
                  { prefix: "mr", label: "Right", value: state.marginRight, onChange: (v) => update("marginRight", v) },
                  { prefix: "mb", label: "Bottom", value: state.marginBottom, onChange: (v) => update("marginBottom", v) },
                  { prefix: "ml", label: "Left", value: state.marginLeft, onChange: (v) => update("marginLeft", v) },
                ]}
                expanded={showMarginSides}
                onToggleExpand={() => setShowMarginSides((v) => !v)}
              />
            </ControlRow>
          </ControlSection>

          {/* ── Typography ───────────────────────────────── */}
          <ControlSection icon={Type} title="Typography">
            <ControlRow label="Size">
              <ToggleGroup
                type="single"
                value={state.fontSize}
                onValueChange={(v) => update("fontSize", v)}
                className="flex flex-wrap gap-1"
              >
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("text-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>

            <ControlRow label="Weight">
              <ToggleGroup
                type="single"
                value={state.fontWeight}
                onValueChange={(v) => update("fontWeight", v)}
                className="flex flex-wrap gap-1"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("font-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>

            <ControlRow label="Align">
              <ToggleGroup
                type="single"
                value={state.textAlign}
                onValueChange={(v) => update("textAlign", v)}
                className="flex gap-1"
              >
                <ToggleGroupItem value="text-left" className="h-6 px-2">
                  <AlignLeft className="size-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="text-center" className="h-6 px-2">
                  <AlignCenter className="size-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="text-right" className="h-6 px-2">
                  <AlignRight className="size-3" />
                </ToggleGroupItem>
              </ToggleGroup>
            </ControlRow>
          </ControlSection>

          {/* ── Colours ──────────────────────────────────── */}
          <ControlSection icon={Palette} title="Colours">
            <ColorSwatchGrid
              label="Text"
              options={TEXT_COLOR_OPTIONS}
              value={state.textColor}
              onChange={(v) => update("textColor", v)}
            />
            <ColorSwatchGrid
              label="Background"
              options={BG_COLOR_OPTIONS}
              value={state.bgColor}
              onChange={(v) => update("bgColor", v)}
            />
          </ControlSection>

          {/* ── Borders ──────────────────────────────────── */}
          <ControlSection icon={Square} title="Borders">
            <ControlRow label="Radius">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Select
                    value={state.borderRadius || "__none__"}
                    onValueChange={(v) => update("borderRadius", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-6 flex-1 text-[10px]">
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {RADIUS_VALUES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label} ({r.px})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ControlRow>

            <ControlRow label="Width">
              <ToggleGroup
                type="single"
                value={state.borderWidth}
                onValueChange={(v) => update("borderWidth", v)}
                className="flex flex-wrap gap-1"
              >
                {BORDER_WIDTH_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt === "border" ? "1" : opt.replace("border-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>
          </ControlSection>

          {/* ── Effects ──────────────────────────────────── */}
          <ControlSection icon={Sparkles} title="Effects">
            <ControlRow label="Shadow">
              <ToggleGroup
                type="single"
                value={state.shadow}
                onValueChange={(v) => update("shadow", v)}
                className="flex flex-wrap gap-1"
              >
                {SHADOW_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt}
                    value={opt}
                    className="h-6 px-2 text-[10px]"
                  >
                    {opt.replace("shadow-", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ControlRow>
          </ControlSection>
        </div>

      </ScrollArea>

      {/* ── Applied classes (pinned to bottom, collapsible) ── */}
      <AppliedClassesSection classes={allClasses} />
    </div>
  )
}

/* ── Applied classes with drag-to-resize ──────────────────────────── */

const MIN_HEIGHT = 28 // header only
const DEFAULT_HEIGHT = 120
const MAX_HEIGHT = 300

function AppliedClassesSection({ classes }: { classes: string[] }) {
  const [height, setHeight] = React.useState(DEFAULT_HEIGHT)
  const [isDragging, setIsDragging] = React.useState(false)
  const startY = React.useRef(0)
  const startHeight = React.useRef(0)
  const collapsed = height <= MIN_HEIGHT + 4

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startY.current = e.clientY
      startHeight.current = height
    },
    [height],
  )

  React.useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // Dragging up = increasing height (clientY decreases)
      const delta = startY.current - e.clientY
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, startHeight.current + delta),
      )
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const toggleCollapse = () => {
    setHeight(collapsed ? DEFAULT_HEIGHT : MIN_HEIGHT)
  }

  return (
    <div
      className="shrink-0 border-t"
      style={{ height: `${height}px` }}
    >
      {/* ── Drag handle ──────────────────────────────────── */}
      <div
        className={cn(
          "flex h-1.5 cursor-row-resize items-center justify-center",
          isDragging && "bg-blue-500/10",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="h-0.5 w-8 rounded-full bg-muted-foreground/30" />
      </div>

      {/* ── Header ───────────────────────────────────────── */}
      <button
        type="button"
        className="flex w-full items-center gap-1 px-3 py-1"
        onClick={toggleCollapse}
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Applied classes
        </span>
        <Badge
          variant="secondary"
          className="ml-1 h-4 px-1 text-[9px]"
        >
          {classes.length}
        </Badge>
        <div className="flex-1" />
        {collapsed ? (
          <ChevronRight className="size-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground" />
        )}
      </button>

      {/* ── Class badges ─────────────────────────────────── */}
      {!collapsed && (
        <div className="overflow-auto px-3 pb-2" style={{ maxHeight: `${height - 36}px` }}>
          <div className="flex flex-wrap gap-1">
            {classes.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No classes applied
              </span>
            )}
            {classes.map((cls) => (
              <Badge
                key={cls}
                variant="secondary"
                className="h-5 text-[10px]"
              >
                {cls}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
