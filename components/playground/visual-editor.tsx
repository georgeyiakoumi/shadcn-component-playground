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
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  StretchVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  StretchHorizontal,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Minus,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Columns3,
  LayoutGrid,
  EyeOff,
  Minus as MinusIcon,
  PanelTop,
  WrapText,
  Maximize2,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ElementInfo } from "@/components/playground/element-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
// ToggleGroup no longer used — replaced with custom IconToggle/TextToggle
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* ── Types ──────────────────────────────────────────────────────── */

interface VariantOption {
  variantName: string
  optionValue: string
}

interface VisualEditorProps {
  selectedElement: ElementInfo | null
  onClassChange: (classes: string[]) => void
  onDeselect: () => void
  /** Component's own defined variants for the context picker */
  variants?: Array<{ name: string; options: string[] }>
  /** Component's defined props for the context picker (boolean props become modifiers) */
  props?: Array<{ name: string; type: string }>
  /** Parent component's variants (for group-data-[variant=value]/parent: cascading) */
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>
}

/* ── Context (prefix) types ──────────────────────────────────────── */

type StyleContext = string // "default", "sm", "hover", or "variant:size:sm" etc.

interface ContextGroup {
  label: string
  section?: string // top-level section heading (shown as separator)
  options: Array<{ value: string; label: string }>
}

function buildContextGroups(
  variants?: Array<{ name: string; options: string[] }>,
  props?: Array<{ name: string; type: string }>,
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>,
): ContextGroup[] {
  const groups: ContextGroup[] = []

  // Own variants
  if (variants && variants.length > 0) {
    let first = true
    for (const v of variants) {
      groups.push({
        section: first ? "Own variants" : undefined,
        label: v.name,
        options: v.options.map((opt) => ({
          value: `variant:${v.name}:${opt}`,
          label: opt,
        })),
      })
      first = false
    }
  }

  // Parent variants (cascade via group-data-[variant=value]/parentName:)
  if (parentVariants && parentVariants.length > 0) {
    let first = true
    for (const v of parentVariants) {
      const parentSlug = v.parentName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
      groups.push({
        section: first ? `${v.parentName} variants` : undefined,
        label: v.name,
        options: v.options.map((opt) => ({
          value: `group-data-[${v.name}=${opt}]/${parentSlug}`,
          label: `${v.name}=${opt}`,
        })),
      })
      first = false
    }
  }

  // Props (boolean props become data-attribute modifiers)
  const boolProps = (props ?? []).filter((p) => p.type === "boolean")
  if (boolProps.length > 0) {
    groups.push({
      section: "Props",
      label: "Boolean props",
      options: boolProps.flatMap((p) => [
        { value: `data-[${p.name}=true]`, label: `${p.name}=true` },
        { value: `data-[${p.name}=false]`, label: `${p.name}=false` },
      ]),
    })
  }

  // Responsive
  groups.push({
    section: "Responsive",
    label: "Breakpoints",
    options: [
      { value: "bp-none", label: "None" },
      { value: "sm", label: "sm" },
      { value: "md", label: "md" },
      { value: "lg", label: "lg" },
      { value: "xl", label: "xl" },
      { value: "2xl", label: "2xl" },
    ],
  })

  // States
  groups.push({
    section: "States",
    label: "Pseudo-classes",
    options: [
      { value: "hover", label: "hover" },
      { value: "focus", label: "focus" },
      { value: "focus-visible", label: "focus-visible" },
      { value: "focus-within", label: "focus-within" },
      { value: "active", label: "active" },
      { value: "disabled", label: "disabled" },
      { value: "dark", label: "dark" },
    ],
  })

  // Group states
  groups.push({
    label: "Group states",
    options: [
      { value: "group-hover", label: "group-hover" },
      { value: "group-focus", label: "group-focus" },
    ],
  })

  return groups
}

/** Get the CSS prefix for a context. Variant contexts become data-attribute selectors. */
function getCssPrefix(context: string): string {
  if (context === "default") return "default"
  if (context.startsWith("variant:")) {
    // variant:size:default → data-[size=default]
    const parts = context.split(":")
    return `data-[${parts[1]}=${parts[2]}]`
  }
  return context
}

/** Strip a context prefix from a class, e.g. "hover:bg-muted" → "bg-muted" */
function stripPrefix(cls: string, prefix: string): string | null {
  const cssPrefix = getCssPrefix(prefix)
  if (cssPrefix === "default") return cls.includes(":") ? null : cls
  if (cls.startsWith(`${cssPrefix}:`)) return cls.slice(cssPrefix.length + 1)
  return null
}

/** Add a context prefix to a class, e.g. "bg-muted" + "hover" → "hover:bg-muted" */
function addPrefix(cls: string, prefix: string): string {
  const cssPrefix = getCssPrefix(prefix)
  if (cssPrefix === "default") return cls
  return `${cssPrefix}:${cls}`
}

/** Check if a class belongs to a specific context */
function hasPrefix(cls: string, prefix: string): boolean {
  const cssPrefix = getCssPrefix(prefix)
  if (cssPrefix === "default") return !cls.includes(":")
  return cls.startsWith(`${cssPrefix}:`)
}

/* ── Native element defaults ────────────────────────────────────── */

/** Maps HTML elements to their native CSS display value */
const NATIVE_DISPLAY: Record<string, string> = {
  div: "block",
  section: "block",
  article: "block",
  header: "block",
  footer: "block",
  main: "block",
  nav: "block",
  aside: "block",
  form: "block",
  p: "block",
  h1: "block", h2: "block", h3: "block", h4: "block", h5: "block", h6: "block",
  ul: "block", ol: "block",
  li: "list-item",
  span: "inline",
  a: "inline",
  strong: "inline",
  em: "inline",
  label: "inline",
  button: "inline-block",
  input: "inline-block",
  textarea: "inline-block",
  select: "inline-block",
  img: "inline",
  table: "table",
}

/** Maps HTML elements to their native CSS position value */
const NATIVE_POSITION: Record<string, string> = {
  // All elements default to static
}

/** Get the native display for an element tag */
function getNativeDisplay(tag: string): string {
  return NATIVE_DISPLAY[tag] ?? "block"
}

interface ControlState {
  // Layout — shared
  display: string
  // Layout — flex/grid only
  direction: string
  justify: string
  align: string
  gap: string
  gapX: string
  gapY: string
  // Layout — flex container
  flexWrap: string
  alignContent: string
  // Layout — grid container
  gridCols: string
  gridRows: string
  gridFlow: string
  autoRows: string
  autoCols: string
  justifyItems: string
  // Layout — child (flex OR grid — always available)
  justifySelf: string
  // Layout — child (flex OR grid — always available)
  colSpan: string
  rowSpan: string
  colStart: string
  colEnd: string
  rowStart: string
  rowEnd: string
  // Layout — flex child
  flexShorthand: string
  flexGrow: string
  flexShrink: string
  flexBasis: string
  alignSelf: string
  order: string
  // Layout — positioning
  position: string
  overflow: string
  zIndex: string
  inset: string
  insetX: string
  insetY: string
  top: string
  right: string
  bottom: string
  left: string
  // Layout — visibility + misc
  visibility: string
  aspectRatio: string
  float: string
  clear: string
  isolation: string
  objectFit: string
  objectPosition: string
  // Layout — block children / flex spacing
  spaceY: string
  spaceX: string
  // Sizing
  width: string
  height: string
  minWidth: string
  maxWidth: string
  minHeight: string
  maxHeight: string
  size: string
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

const DISPLAY_OPTIONS = [
  "block", "inline-block", "inline", "flex", "inline-flex",
  "grid", "inline-grid", "contents", "hidden",
]
const POSITION_OPTIONS = ["static", "relative", "absolute", "fixed", "sticky"]
const Z_INDEX_OPTIONS = ["z-0", "z-10", "z-20", "z-30", "z-40", "z-50", "z-auto"]
const INSET_SCALE = [
  "0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9",
  "10", "11", "12", "14", "16", "20", "24", "28", "32", "36", "40", "44", "48",
  "52", "56", "60", "64", "72", "80", "96", "auto", "1/2", "1/3", "2/3", "1/4", "3/4", "full",
]
const INSET_OPTIONS = INSET_SCALE.map((v) => `inset-${v}`)
const INSET_X_OPTIONS = INSET_SCALE.map((v) => `inset-x-${v}`)
const INSET_Y_OPTIONS = INSET_SCALE.map((v) => `inset-y-${v}`)
const TOP_OPTIONS = INSET_SCALE.map((v) => `top-${v}`)
const RIGHT_OPTIONS = INSET_SCALE.map((v) => `right-${v}`)
const BOTTOM_OPTIONS = INSET_SCALE.map((v) => `bottom-${v}`)
const LEFT_OPTIONS = INSET_SCALE.map((v) => `left-${v}`)
const VISIBILITY_OPTIONS = ["visible", "invisible", "collapse"]
const ASPECT_RATIO_OPTIONS = ["aspect-auto", "aspect-square", "aspect-video"]
const FLOAT_OPTIONS = ["float-left", "float-right", "float-none"]
const CLEAR_OPTIONS = ["clear-left", "clear-right", "clear-both", "clear-none"]
const ISOLATION_OPTIONS = ["isolate", "isolation-auto"]
const OBJECT_FIT_OPTIONS = ["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"]
const OBJECT_POSITION_OPTIONS = [
  "object-center", "object-top", "object-right", "object-bottom", "object-left",
  "object-left-top", "object-right-top", "object-left-bottom", "object-right-bottom",
]
const OVERFLOW_OPTIONS = ["overflow-visible", "overflow-hidden", "overflow-scroll", "overflow-auto"]
const SPACING_SCALE_FULL = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16]
const SPACE_Y_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-y-${v}`)
const SPACE_X_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-x-${v}`)

const WIDTH_OPTIONS = [
  "w-0", "w-0.5", "w-1", "w-1.5", "w-2", "w-2.5", "w-3", "w-3.5", "w-4", "w-5", "w-6", "w-7", "w-8", "w-9",
  "w-10", "w-11", "w-12", "w-14", "w-16", "w-20", "w-24", "w-28", "w-32", "w-36", "w-40", "w-44", "w-48",
  "w-52", "w-56", "w-60", "w-64", "w-72", "w-80", "w-96",
  "w-auto", "w-full", "w-screen", "w-min", "w-max", "w-fit",
  "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4", "w-1/5", "w-2/5", "w-3/5", "w-4/5",
]
const HEIGHT_OPTIONS = [
  "h-0", "h-0.5", "h-1", "h-1.5", "h-2", "h-2.5", "h-3", "h-3.5", "h-4", "h-5", "h-6", "h-7", "h-8", "h-9",
  "h-10", "h-11", "h-12", "h-14", "h-16", "h-20", "h-24", "h-28", "h-32", "h-36", "h-40", "h-44", "h-48",
  "h-52", "h-56", "h-60", "h-64", "h-72", "h-80", "h-96",
  "h-auto", "h-full", "h-screen", "h-min", "h-max", "h-fit",
  "h-1/2", "h-1/3", "h-2/3", "h-1/4", "h-3/4", "h-1/5", "h-2/5", "h-3/5", "h-4/5",
]
const MIN_WIDTH_OPTIONS = ["min-w-0", "min-w-full", "min-w-min", "min-w-max", "min-w-fit"]
const MAX_WIDTH_OPTIONS = [
  "max-w-none", "max-w-0", "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl",
  "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl", "max-w-7xl",
  "max-w-full", "max-w-min", "max-w-max", "max-w-fit", "max-w-prose", "max-w-screen-sm",
  "max-w-screen-md", "max-w-screen-lg", "max-w-screen-xl", "max-w-screen-2xl",
]
const MIN_HEIGHT_OPTIONS = ["min-h-0", "min-h-full", "min-h-screen", "min-h-min", "min-h-max", "min-h-fit"]
const MAX_HEIGHT_OPTIONS = [
  "max-h-none", "max-h-0", "max-h-full", "max-h-screen", "max-h-min", "max-h-max", "max-h-fit",
  ...SPACING_SCALE_FULL.filter((v) => v >= 1).map((v) => `max-h-${v}`),
]
const SIZE_OPTIONS = [
  "size-0", "size-0.5", "size-1", "size-1.5", "size-2", "size-2.5", "size-3", "size-3.5",
  "size-4", "size-5", "size-6", "size-7", "size-8", "size-9", "size-10", "size-11", "size-12",
  "size-14", "size-16", "size-20", "size-24", "size-28", "size-32", "size-36", "size-40",
  "size-auto", "size-full", "size-min", "size-max", "size-fit",
]

const GRID_COLS_OPTIONS = [
  "grid-cols-none", ...Array.from({ length: 12 }, (_, i) => `grid-cols-${i + 1}`),
  "grid-cols-subgrid",
]
const GRID_ROWS_OPTIONS = [
  "grid-rows-none", ...Array.from({ length: 12 }, (_, i) => `grid-rows-${i + 1}`),
  "grid-rows-subgrid",
]
const GRID_FLOW_OPTIONS = ["grid-flow-row", "grid-flow-col", "grid-flow-dense", "grid-flow-row-dense", "grid-flow-col-dense"]
const COL_SPAN_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `col-span-${i + 1}`),
  "col-span-full",
]
const ROW_SPAN_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `row-span-${i + 1}`),
  "row-span-full",
]

const AUTO_ROWS_OPTIONS = ["auto-rows-auto", "auto-rows-min", "auto-rows-max", "auto-rows-fr"]
const AUTO_COLS_OPTIONS = ["auto-cols-auto", "auto-cols-min", "auto-cols-max", "auto-cols-fr"]
const JUSTIFY_ITEMS_OPTIONS = ["justify-items-start", "justify-items-center", "justify-items-end", "justify-items-stretch"]
const JUSTIFY_SELF_OPTIONS = ["justify-self-auto", "justify-self-start", "justify-self-center", "justify-self-end", "justify-self-stretch"]
const COL_START_OPTIONS = [...Array.from({ length: 13 }, (_, i) => `col-start-${i + 1}`), "col-start-auto"]
const COL_END_OPTIONS = [...Array.from({ length: 13 }, (_, i) => `col-end-${i + 1}`), "col-end-auto"]
const ROW_START_OPTIONS = [...Array.from({ length: 7 }, (_, i) => `row-start-${i + 1}`), "row-start-auto"]
const ROW_END_OPTIONS = [...Array.from({ length: 7 }, (_, i) => `row-end-${i + 1}`), "row-end-auto"]

const FLEX_WRAP_OPTIONS = ["flex-wrap", "flex-wrap-reverse", "flex-nowrap"]
const FLEX_SHORTHAND_OPTIONS = ["flex-1", "flex-auto", "flex-initial", "flex-none"]
const ALIGN_CONTENT_OPTIONS = [
  "content-start", "content-center", "content-end",
  "content-between", "content-around", "content-evenly", "content-stretch",
]
const FLEX_GROW_OPTIONS = ["grow", "grow-0"]
const FLEX_SHRINK_OPTIONS = ["shrink", "shrink-0"]
const FLEX_BASIS_OPTIONS = [
  "basis-0", "basis-auto", "basis-full",
  "basis-1/2", "basis-1/3", "basis-2/3", "basis-1/4", "basis-3/4",
  "basis-1/5", "basis-2/5", "basis-3/5", "basis-4/5",
  "basis-1/6", "basis-5/6", "basis-1/12",
]
const ALIGN_SELF_OPTIONS = ["self-auto", "self-start", "self-center", "self-end", "self-stretch", "self-baseline"]
const ORDER_OPTIONS = [
  "order-first", "order-last", "order-none",
  "order-1", "order-2", "order-3", "order-4", "order-5", "order-6",
  "order-7", "order-8", "order-9", "order-10", "order-11", "order-12",
]
const GAP_SLIDER_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16]
const GAP_X_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-x-${v}`)
const GAP_Y_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-y-${v}`)

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
  "justify-around",
  "justify-evenly",
]
const ALIGN_OPTIONS = [
  "items-start",
  "items-center",
  "items-end",
  "items-stretch",
  "items-baseline",
]
const GAP_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-${v}`)

const PADDING_SCALE = [
  "p-0", "p-0.5", "p-1", "p-1.5", "p-2", "p-2.5", "p-3", "p-3.5",
  "p-4", "p-5", "p-6", "p-7", "p-8", "p-9", "p-10", "p-11", "p-12", "p-14", "p-16",
]
const MARGIN_SCALE = [
  "m-0", "m-0.5", "m-1", "m-1.5", "m-2", "m-2.5", "m-3", "m-3.5",
  "m-4", "m-5", "m-6", "m-7", "m-8", "m-9", "m-10", "m-11", "m-12", "m-14", "m-16",
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

function classesToControlState(classes: string[], context: StyleContext = "default"): ControlState {
  // Filter to only classes matching the current context, then strip the prefix
  classes = classes
    .map((c) => stripPrefix(c, context))
    .filter((c): c is string => c !== null)
  // Parse place-items shorthand back into justify + align
  const placeItems = classes.find((c) => c.startsWith("place-items-"))
  let parsedJustify = findMatch(classes, JUSTIFY_OPTIONS)
  let parsedAlign = findMatch(classes, ALIGN_OPTIONS)

  if (placeItems && !parsedJustify && !parsedAlign) {
    const axis = placeItems.replace("place-items-", "")
    parsedJustify = `justify-${axis}`
    parsedAlign = `items-${axis}`
  }

  return {
    display: findMatch(classes, DISPLAY_OPTIONS),
    direction: findMatch(classes, DIRECTION_OPTIONS),
    justify: parsedJustify,
    align: parsedAlign,
    gap: findMatch(classes, GAP_OPTIONS),
    gapX: findMatch(classes, GAP_X_OPTIONS),
    gapY: findMatch(classes, GAP_Y_OPTIONS),
    flexWrap: findMatch(classes, FLEX_WRAP_OPTIONS),
    alignContent: findMatch(classes, ALIGN_CONTENT_OPTIONS),
    gridCols: findMatch(classes, GRID_COLS_OPTIONS),
    gridRows: findMatch(classes, GRID_ROWS_OPTIONS),
    gridFlow: findMatch(classes, GRID_FLOW_OPTIONS),
    autoRows: findMatch(classes, AUTO_ROWS_OPTIONS),
    autoCols: findMatch(classes, AUTO_COLS_OPTIONS),
    justifyItems: findMatch(classes, JUSTIFY_ITEMS_OPTIONS),
    justifySelf: findMatch(classes, JUSTIFY_SELF_OPTIONS),
    colSpan: findMatch(classes, COL_SPAN_OPTIONS),
    rowSpan: findMatch(classes, ROW_SPAN_OPTIONS),
    colStart: findMatch(classes, COL_START_OPTIONS),
    colEnd: findMatch(classes, COL_END_OPTIONS),
    rowStart: findMatch(classes, ROW_START_OPTIONS),
    rowEnd: findMatch(classes, ROW_END_OPTIONS),
    flexShorthand: findMatch(classes, FLEX_SHORTHAND_OPTIONS),
    flexGrow: findMatch(classes, FLEX_GROW_OPTIONS),
    flexShrink: findMatch(classes, FLEX_SHRINK_OPTIONS),
    flexBasis: findMatch(classes, FLEX_BASIS_OPTIONS),
    alignSelf: findMatch(classes, ALIGN_SELF_OPTIONS),
    order: findMatch(classes, ORDER_OPTIONS),
    position: findMatch(classes, POSITION_OPTIONS),
    overflow: findMatch(classes, OVERFLOW_OPTIONS),
    zIndex: findMatch(classes, Z_INDEX_OPTIONS),
    inset: findMatch(classes, INSET_OPTIONS),
    insetX: findMatch(classes, INSET_X_OPTIONS),
    insetY: findMatch(classes, INSET_Y_OPTIONS),
    top: findMatch(classes, TOP_OPTIONS),
    right: findMatch(classes, RIGHT_OPTIONS),
    bottom: findMatch(classes, BOTTOM_OPTIONS),
    left: findMatch(classes, LEFT_OPTIONS),
    visibility: findMatch(classes, VISIBILITY_OPTIONS),
    aspectRatio: findMatch(classes, ASPECT_RATIO_OPTIONS),
    float: findMatch(classes, FLOAT_OPTIONS),
    clear: findMatch(classes, CLEAR_OPTIONS),
    isolation: findMatch(classes, ISOLATION_OPTIONS),
    objectFit: findMatch(classes, OBJECT_FIT_OPTIONS),
    objectPosition: findMatch(classes, OBJECT_POSITION_OPTIONS),
    spaceY: findMatch(classes, SPACE_Y_OPTIONS),
    spaceX: findMatch(classes, SPACE_X_OPTIONS),
    width: findMatch(classes, WIDTH_OPTIONS),
    height: findMatch(classes, HEIGHT_OPTIONS),
    minWidth: findMatch(classes, MIN_WIDTH_OPTIONS),
    maxWidth: findMatch(classes, MAX_WIDTH_OPTIONS),
    minHeight: findMatch(classes, MIN_HEIGHT_OPTIONS),
    maxHeight: findMatch(classes, MAX_HEIGHT_OPTIONS),
    size: findMatch(classes, SIZE_OPTIONS),
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
  ...GAP_X_OPTIONS,
  ...GAP_Y_OPTIONS,
  ...GRID_COLS_OPTIONS,
  ...GRID_ROWS_OPTIONS,
  ...GRID_FLOW_OPTIONS,
  ...AUTO_ROWS_OPTIONS,
  ...AUTO_COLS_OPTIONS,
  ...JUSTIFY_ITEMS_OPTIONS,
  ...JUSTIFY_SELF_OPTIONS,
  ...COL_SPAN_OPTIONS,
  ...ROW_SPAN_OPTIONS,
  ...COL_START_OPTIONS,
  ...COL_END_OPTIONS,
  ...ROW_START_OPTIONS,
  ...ROW_END_OPTIONS,
  ...FLEX_WRAP_OPTIONS,
  ...FLEX_SHORTHAND_OPTIONS,
  ...ALIGN_CONTENT_OPTIONS,
  ...FLEX_GROW_OPTIONS,
  ...FLEX_SHRINK_OPTIONS,
  ...FLEX_BASIS_OPTIONS,
  ...ALIGN_SELF_OPTIONS,
  ...ORDER_OPTIONS,
  ...POSITION_OPTIONS,
  ...OVERFLOW_OPTIONS,
  ...Z_INDEX_OPTIONS,
  ...INSET_OPTIONS,
  ...INSET_X_OPTIONS,
  ...INSET_Y_OPTIONS,
  ...TOP_OPTIONS,
  ...RIGHT_OPTIONS,
  ...BOTTOM_OPTIONS,
  ...LEFT_OPTIONS,
  ...VISIBILITY_OPTIONS,
  ...ASPECT_RATIO_OPTIONS,
  ...FLOAT_OPTIONS,
  ...CLEAR_OPTIONS,
  ...ISOLATION_OPTIONS,
  ...OBJECT_FIT_OPTIONS,
  ...OBJECT_POSITION_OPTIONS,
  ...SPACE_Y_OPTIONS,
  ...SPACE_X_OPTIONS,
  ...WIDTH_OPTIONS,
  ...HEIGHT_OPTIONS,
  ...MIN_WIDTH_OPTIONS,
  ...MAX_WIDTH_OPTIONS,
  ...MIN_HEIGHT_OPTIONS,
  ...MAX_HEIGHT_OPTIONS,
  ...SIZE_OPTIONS,
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
  "place-items-start",
  "place-items-center",
  "place-items-end",
  "place-items-stretch",
]

function controlStateToClasses(state: ControlState, context: StyleContext = "default", elementTag?: string): string[] {
  const result: string[] = []
  const push = (v: string) => {
    if (v) result.push(addPrefix(v, context))
  }

  // Don't emit display class if it matches the element's native default
  const nativeDisplay = elementTag ? getNativeDisplay(elementTag) : "block"
  if (state.display && state.display !== nativeDisplay) {
    push(state.display)
  }
  push(state.direction)

  // Use place-items shorthand on grid when both axes match
  const placeShorthand =
    state.display === "grid"
      ? PLACE_ITEMS_MAP[state.justify]?.[state.align]
      : undefined

  if (placeShorthand) {
    push(placeShorthand)
  } else {
    push(state.justify)
    push(state.align)
  }
  push(state.gap)
  push(state.gapX)
  push(state.gapY)
  push(state.flexWrap)
  push(state.alignContent)
  push(state.gridCols)
  push(state.gridRows)
  push(state.gridFlow)
  push(state.autoRows)
  push(state.autoCols)
  push(state.justifyItems)
  push(state.justifySelf)
  push(state.colSpan)
  push(state.rowSpan)
  push(state.colStart)
  push(state.colEnd)
  push(state.rowStart)
  push(state.rowEnd)
  push(state.flexShorthand)
  push(state.flexGrow)
  push(state.flexShrink)
  push(state.flexBasis)
  push(state.alignSelf)
  push(state.order)
  // Positioning (don't emit "static" — it's the default)
  if (state.position && state.position !== "static") push(state.position)
  push(state.overflow)
  push(state.zIndex)
  push(state.inset)
  push(state.insetX)
  push(state.insetY)
  push(state.top)
  push(state.right)
  push(state.bottom)
  push(state.left)
  push(state.visibility)
  push(state.aspectRatio)
  push(state.float)
  push(state.clear)
  push(state.isolation)
  push(state.objectFit)
  push(state.objectPosition)
  push(state.spaceY)
  push(state.spaceX)
  push(state.width)
  push(state.height)
  push(state.minWidth)
  push(state.maxWidth)
  push(state.minHeight)
  push(state.maxHeight)
  push(state.size)
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
/**
 * Property group prefixes — if a new class starts with one of these,
 * any existing class with the same prefix gets removed (including arbitrary values).
 * e.g. grid-cols-[1fr_auto] replaces grid-cols-3 and vice versa.
 */
const PROPERTY_GROUP_PREFIXES = [
  "w-", "h-", "min-w-", "max-w-", "min-h-", "max-h-", "size-",
  "space-x-", "space-y-",
  "z-",
  "inset-x-", "inset-y-", "inset-",
  "top-", "right-", "bottom-", "left-",
  "aspect-", "float-", "clear-",
  "object-",
  "grid-cols-", "grid-rows-", "grid-flow-",
  "auto-rows-", "auto-cols-",
  "col-span-", "row-span-",
  "col-start-", "col-end-", "row-start-", "row-end-",
  "gap-x-", "gap-y-",
  "justify-items-", "justify-self-",
  "content-",
]

function mergeClasses(
  original: string[],
  state: ControlState,
  context: StyleContext = "default",
  elementTag?: string,
): string[] {
  const managed = new Set(MANAGED_PREFIXES)
  const editorClasses = controlStateToClasses(state, context, elementTag)
  const editorSet = new Set(editorClasses)

  // Build a set of active property group prefixes from editor output
  const activeGroupPrefixes = new Set<string>()
  for (const cls of editorClasses) {
    const stripped = stripPrefix(cls, context)
    if (stripped) {
      for (const gp of PROPERTY_GROUP_PREFIXES) {
        if (stripped.startsWith(gp)) {
          activeGroupPrefixes.add(gp)
          break
        }
      }
    }
  }

  const kept = original.filter((c) => {
    if (editorSet.has(c)) return false
    if (!hasPrefix(c, context)) return true

    const stripped = stripPrefix(c, context)
    if (!stripped) return true

    // Check exact match in managed set
    if (managed.has(stripped)) return false

    // Check property group prefix — if the editor is emitting a class in the
    // same group, remove the old one (handles arbitrary values)
    for (const gp of activeGroupPrefixes) {
      if (stripped.startsWith(gp)) return false
    }

    return true
  })

  return [...new Set([...kept, ...editorClasses])]
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
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

/* ── Position grid (Figma-style justify × align) ─────────────────── */

const JUSTIFY_KEYS = ["justify-start", "justify-center", "justify-end"] as const
const ALIGN_KEYS = ["items-start", "items-center", "items-end"] as const

/** Maps matching justify+align pairs to place-items shorthand (grid only) */
const PLACE_ITEMS_MAP: Record<string, Record<string, string>> = {
  "justify-start": { "items-start": "place-items-start" },
  "justify-center": { "items-center": "place-items-center" },
  "justify-end": { "items-end": "place-items-end" },
  "justify-stretch": { "items-stretch": "place-items-stretch" },
}

function PositionGrid({
  justify,
  align,
  display,
  onJustifyChange,
  onAlignChange,
}: {
  justify: string
  align: string
  display: string
  onJustifyChange: (v: string) => void
  onAlignChange: (v: string) => void
}) {
  const isGrid = display === "grid"
  const isBetween = justify === "justify-between" || justify === "justify-around" || justify === "justify-evenly"
  const isStretch = align === "items-stretch" || align === "items-baseline"

  function getTooltip(j: string, a: string): string {
    if (isGrid) {
      const shorthand = PLACE_ITEMS_MAP[j]?.[a]
      if (shorthand) return shorthand
    }
    return `${j} ${a}`
  }

  return (
    <div className="space-y-1.5">
      {/* 3×3 grid */}
      <div className="inline-grid grid-cols-3 gap-0.5 rounded-md border p-0.5">
        {ALIGN_KEYS.map((a) =>
          JUSTIFY_KEYS.map((j) => {
            // Determine active state considering between/stretch overrides
            const justifyMatch = isBetween || justify === j
            const alignMatch = isStretch || align === a
            const isActive = justifyMatch && alignMatch && !isBetween && !isStretch
            // When between is on, highlight the full row for the active align
            const isRowHighlight = isBetween && !isStretch && align === a
            // When stretch is on, highlight the full column for the active justify
            const isColHighlight = isStretch && !isBetween && justify === j
            // When both are on, all cells get a subtle highlight
            const isBothHighlight = isBetween && isStretch
            const highlighted = isActive || isRowHighlight || isColHighlight || isBothHighlight

            // Grid cell is disabled when between/stretch override that axis
            const isDisabled = (isBetween && !isStretch) || (isStretch && !isBetween)

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
                      // When between is active, clicking a cell only sets align
                      // When stretch is active, clicking a cell only sets justify
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
                    {/* Dot shape changes based on between/stretch */}
                    {isBetween && isStretch ? (
                      // Both: show a stretched horizontal bar
                      <div className="h-1 w-3 rounded-full bg-current" />
                    ) : isBetween ? (
                      // Between: show 3 small dots in a row (spread)
                      <div className="flex w-3 items-center justify-between">
                        <div className="size-1 rounded-full bg-current" />
                        <div className="size-1 rounded-full bg-current" />
                        <div className="size-1 rounded-full bg-current" />
                      </div>
                    ) : isStretch ? (
                      // Stretch: show a vertical bar
                      <div className="h-3 w-1 rounded-full bg-current" />
                    ) : (
                      // Normal: single dot
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

      {/* Justify extras (between, around, evenly) */}
      <div className="flex flex-wrap gap-1">
        {([
          { value: "justify-between", label: "between", icon: StretchHorizontal },
          { value: "justify-around", label: "around" },
          { value: "justify-evenly", label: "evenly" },
        ] as const).map((opt) => {
          const isActive = justify === opt.value
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-6 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                    isActive
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => onJustifyChange(isActive ? "justify-start" : opt.value)}
                >
                  {"icon" in opt && opt.icon && <opt.icon className="size-3" />}
                  {opt.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-mono">
                {opt.value}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Align axis extras (stretch, baseline) */}
        {([
          { value: "items-stretch", label: "stretch", icon: StretchVertical },
          { value: "items-baseline", label: "baseline" },
        ] as const).map((opt) => {
          const isActive = align === opt.value
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-6 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                    isActive
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => onAlignChange(isActive ? "items-start" : opt.value)}
                >
                  {"icon" in opt && opt.icon && <opt.icon className="size-3" />}
                  {opt.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-mono">
                {opt.value}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

/* ── Icon toggle item with tooltip ────────────────────────────────── */

function IconToggle({
  value,
  icon: Icon,
  tooltip,
  isActive,
  onClick,
}: {
  value: string
  icon: React.ElementType
  tooltip: string
  isActive?: boolean
  onClick?: (value: string) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            isActive
              ? "bg-blue-500/10 text-blue-500"
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
  onClick,
}: {
  value: string
  label: string
  tooltip: string
  isActive?: boolean
  onClick?: (value: string) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
            isActive
              ? "bg-blue-500/10 text-blue-500"
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
      <span className="w-5 text-xs text-muted-foreground">{prefix}</span>
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
        <SelectTrigger className="h-6 w-14 text-xs">
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
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
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

/* ── Context picker (Command-based) ──────────────────────────────── */

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
      <div className="flex items-center gap-1">
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
    <div className="flex items-center gap-1">
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

/* ── Gap control with slider + split toggle ────────────────────── */

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

  return (
    <ControlRow label="Gap">
      <div className="space-y-2">
        {!split ? (
          <div className="flex items-center gap-2">
            <Slider
              value={[gapValueToIndex(gap, "gap")]}
              onValueChange={([v]) => onGapChange(indexToGapValue(v, "gap"))}
              max={GAP_SLIDER_VALUES.length - 1}
              step={1}
              className="flex-1"
            />
            <span className="w-8 text-right text-xs text-muted-foreground">
              {gap ? gap.replace("gap-", "") : "0"}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 text-xs text-muted-foreground">x</span>
              <Slider
                value={[gapValueToIndex(gapX, "gap-x")]}
                onValueChange={([v]) => onGapXChange(indexToGapValue(v, "gap-x"))}
                max={GAP_SLIDER_VALUES.length - 1}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs text-muted-foreground">
                {gapX ? gapX.replace("gap-x-", "") : "0"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 text-xs text-muted-foreground">y</span>
              <Slider
                value={[gapValueToIndex(gapY, "gap-y")]}
                onValueChange={([v]) => onGapYChange(indexToGapValue(v, "gap-y"))}
                max={GAP_SLIDER_VALUES.length - 1}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs text-muted-foreground">
                {gapY ? gapY.replace("gap-y-", "") : "0"}
              </span>
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
    </ControlRow>
  )
}

function ContextPicker({
  contexts,
  onContextsChange,
  variants,
  props,
  parentVariants,
}: {
  contexts: string[]
  onContextsChange: (ctxs: string[]) => void
  variants?: Array<{ name: string; options: string[] }>
  props?: Array<{ name: string; type: string }>
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>
}) {
  const [open, setOpen] = React.useState(false)
  const groups = React.useMemo(() => buildContextGroups(variants, props, parentVariants), [variants, props, parentVariants])

  const isDefault = contexts.length === 0

  // Display label
  const contextLabel = React.useMemo(() => {
    if (isDefault) return "Default"
    return contexts.map((c) => {
      if (c.startsWith("variant:")) {
        const parts = c.split(":")
        return `${parts[1]}:${parts[2]}`
      }
      return c
    }).join(":") + ":"
  }, [contexts, isDefault])

  const BREAKPOINTS = new Set(["sm", "md", "lg", "xl", "2xl"])

  function toggleContext(value: string) {
    // Variant options are mutually exclusive within their variant group
    if (value.startsWith("variant:")) {
      const parts = value.split(":")
      const variantGroup = `variant:${parts[1]}:`

      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = contexts.filter((c) => !c.startsWith(variantGroup))
        onContextsChange([...filtered, value])
      }
    }
    // Breakpoints are mutually exclusive (can't be sm AND md)
    // "bp-none" clears any breakpoint
    else if (value === "bp-none") {
      onContextsChange(contexts.filter((c) => !BREAKPOINTS.has(c)))
    }
    else if (BREAKPOINTS.has(value)) {
      if (contexts.includes(value)) {
        // Deselecting a breakpoint — back to none
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = contexts.filter((c) => !BREAKPOINTS.has(c))
        onContextsChange([...filtered, value])
      }
    }
    // States, dark, group-* are stackable
    else {
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        onContextsChange([...contexts, value])
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 max-w-[180px] gap-1 truncate text-xs",
            !isDefault && "border-blue-500/50 text-blue-500",
          )}
        >
          <code className="truncate font-mono">{contextLabel}</code>
          <ChevronDown className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command className="[&_[cmdk-list]]:max-h-[320px]">
          <CommandInput placeholder="Search..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-xs">No match.</CommandEmpty>

            {/* Default / clear */}
            <CommandItem
              value="default clear"
              onSelect={() => {
                onContextsChange([])
                setOpen(false)
              }}
              className={cn(
                "gap-2 text-xs",
                isDefault && "bg-blue-500/10 text-blue-500",
              )}
            >
              <code className="font-mono text-xs">Default</code>
              {!isDefault && (
                <span className="ml-auto text-xs text-muted-foreground">clear all</span>
              )}
            </CommandItem>

            {/* Groups with section separators */}
            {groups.map((group, gi) => (
              <React.Fragment key={`${group.label}-${gi}`}>
                {group.section && (
                  <div className="px-2 pb-1 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.section}
                    </p>
                  </div>
                )}
                <CommandGroup heading={group.section ? group.label : group.label}>
                  {group.options.map((opt) => {
                    const isVariant = opt.value.startsWith("variant:")
                    const isBreakpoint = BREAKPOINTS.has(opt.value) || opt.value === "bp-none"
                    const isRadio = isVariant || isBreakpoint
                    let isActive = opt.value === "bp-none"
                      ? !contexts.some((c) => BREAKPOINTS.has(c))
                      : contexts.includes(opt.value)

                    // For variants: if none in this group is selected, highlight the default
                    if (isVariant && !isActive) {
                      const parts = opt.value.split(":")
                      const groupPrefix = `variant:${parts[1]}:`
                      const anyInGroupSelected = contexts.some((c) => c.startsWith(groupPrefix))
                      if (!anyInGroupSelected) {
                        const variantDef = variants?.find((v) => v.name === parts[1])
                        if (variantDef && parts[2] === variantDef.options[0]) {
                          isActive = true
                        }
                      }
                    }
                    return (
                      <CommandItem
                        key={opt.value}
                        value={`${opt.label} ${group.label} ${group.section ?? ""}`}
                        onSelect={() => toggleContext(opt.value)}
                        className={cn(
                          "gap-2 text-xs",
                          isActive && "bg-blue-500/10 text-blue-500",
                        )}
                      >
                        {isRadio ? (
                          /* Radio for variants + breakpoints (mutually exclusive) */
                          <div className={cn(
                            "flex size-3.5 items-center justify-center rounded-full border",
                            isActive ? "border-blue-500" : "border-muted-foreground/30",
                          )}>
                            {isActive && <div className="size-2 rounded-full bg-blue-500" />}
                          </div>
                        ) : (
                          /* Checkbox for states (stackable) */
                          <div className={cn(
                            "flex size-3.5 items-center justify-center rounded-sm border",
                            isActive ? "border-blue-500 bg-blue-500 text-white" : "border-muted-foreground/30",
                          )}>
                            {isActive && <span className="text-xs leading-none">✓</span>}
                          </div>
                        )}
                        <code className="font-mono text-xs">{opt.label}</code>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ── Main component ──────────────────────────────────────────────── */

export function VisualEditor({
  selectedElement,
  onClassChange,
  onDeselect,
  variants,
  props,
  parentVariants,
}: VisualEditorProps) {
  const [contexts, setContexts] = React.useState<string[]>([])

  // Compute the combined CSS prefix from selected contexts
  const combinedPrefix = React.useMemo(() => {
    if (contexts.length === 0) return "default"
    // Filter out variant contexts (they don't produce CSS prefixes)
    const cssPrefixes = contexts
      .map(getCssPrefix)
      .filter((p) => p !== "default")
    if (cssPrefixes.length === 0) return "default"
    return cssPrefixes.join(":")
  }, [contexts])

  const [state, setState] = React.useState<ControlState>(() =>
    classesToControlState(selectedElement?.currentClasses ?? [], "default"),
  )
  const [showPaddingSides, setShowPaddingSides] = React.useState(false)
  const [showMarginSides, setShowMarginSides] = React.useState(false)

  // Original classes that the editor does not manage
  const originalClasses = React.useRef<string[]>([])

  // Track whether state changes are from user interaction
  const isUserChange = React.useRef(false)

  // Sync state when selected element or context changes
  React.useEffect(() => {
    isUserChange.current = false
    const classes = selectedElement?.currentClasses ?? []
    originalClasses.current = classes
    setState(classesToControlState(classes, combinedPrefix))
    setShowPaddingSides(false)
    setShowMarginSides(false)
  }, [selectedElement, combinedPrefix])

  // Emit class changes only when user interacts with controls
  React.useEffect(() => {
    if (!isUserChange.current) return
    onClassChange(mergeClasses(originalClasses.current, state, combinedPrefix, selectedElement?.tagName))
  }, [state, combinedPrefix, onClassChange])

  const update = React.useCallback(
    <K extends keyof ControlState>(key: K, value: ControlState[K]) => {
      isUserChange.current = true
      setState((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const toggleValue = React.useCallback(
    <K extends keyof ControlState>(
      key: K,
      value: string,
    ) => {
      isUserChange.current = true
      setState((prev) => ({
        ...prev,
        [key]: prev[key] === value ? "" : value,
      }))
    },
    [],
  )

  if (!selectedElement) return null

  const nativeDisplay = getNativeDisplay(selectedElement.tagName)
  const effectiveDisplay = state.display || nativeDisplay
  const isFlex = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex"
  const isGrid = effectiveDisplay === "grid" || effectiveDisplay === "inline-grid"

  const allClasses = mergeClasses(originalClasses.current, state)

  return (
    <div className="flex h-full w-full flex-col">
      {/* ── Header with context selector ────────────────── */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {"<"}
            {selectedElement.tagName}
            {">"}
            {selectedElement.textContent && (
              <span className="ml-1 font-normal text-muted-foreground">
                {selectedElement.textContent.slice(0, 15)}
              </span>
            )}
          </p>
        </div>
        <ContextPicker contexts={contexts} onContextsChange={setContexts} variants={variants} props={props} parentVariants={parentVariants} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onDeselect}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <TooltipProvider delayDuration={200}>
        <div className="divide-y">
          {/* ── Layout ────────────────────────────────────── */}
          <ControlSection icon={Layout} title="Layout">
            <ControlRow label="Display">
              <div className="flex flex-wrap gap-0.5">
                {(() => {
                  const nativeDisp = getNativeDisplay(selectedElement.tagName)
                  // The "effective" display: either explicitly set or native
                  const effectiveDisplay = state.display || nativeDisp
                  return (
                    <>
                      <IconToggle value="block" icon={PanelTop} tooltip="block" isActive={effectiveDisplay === "block"} onClick={() => update("display", nativeDisp === "block" ? "" : "block")} />
                      <IconToggle value="inline-block" icon={Box} tooltip="inline-block" isActive={effectiveDisplay === "inline-block"} onClick={() => update("display", nativeDisp === "inline-block" ? "" : "inline-block")} />
                      <IconToggle value="inline" icon={Minus} tooltip="inline" isActive={effectiveDisplay === "inline"} onClick={() => update("display", nativeDisp === "inline" ? "" : "inline")} />
                      <IconToggle value="flex" icon={Columns3} tooltip="flex" isActive={effectiveDisplay === "flex"} onClick={() => update("display", nativeDisp === "flex" ? "" : "flex")} />
                      <IconToggle value="inline-flex" icon={Columns3} tooltip="inline-flex" isActive={effectiveDisplay === "inline-flex"} onClick={() => update("display", nativeDisp === "inline-flex" ? "" : "inline-flex")} />
                      <IconToggle value="grid" icon={LayoutGrid} tooltip="grid" isActive={effectiveDisplay === "grid"} onClick={() => update("display", nativeDisp === "grid" ? "" : "grid")} />
                      <IconToggle value="inline-grid" icon={LayoutGrid} tooltip="inline-grid" isActive={effectiveDisplay === "inline-grid"} onClick={() => update("display", nativeDisp === "inline-grid" ? "" : "inline-grid")} />
                      <IconToggle value="contents" icon={Box} tooltip="contents" isActive={effectiveDisplay === "contents"} onClick={() => update("display", nativeDisp === "contents" ? "" : "contents")} />
                      <IconToggle value="hidden" icon={EyeOff} tooltip="hidden" isActive={effectiveDisplay === "hidden"} onClick={() => update("display", nativeDisp === "hidden" ? "" : "hidden")} />
                    </>
                  )
                })()}
              </div>
            </ControlRow>

            {/* ── Controls below are conditional on display type ── */}
            {(() => {
              const isHidden = effectiveDisplay === "hidden"
              const isContents = effectiveDisplay === "contents"
              const isInline = effectiveDisplay === "inline"
              const isBlock = effectiveDisplay === "block" || effectiveDisplay === "inline-block"
              const showPosition = !isHidden && !isContents
              const showOverflow = !isHidden && !isContents && !isInline

              return (
                <>
                  {/* ── Position (not hidden/contents) ──────── */}
                  {showPosition && (
                    <ControlRow label="Position">
                      <div className="flex gap-0.5">
                        {POSITION_OPTIONS.map((pos) => (
                          <TextToggle
                            key={pos}
                            value={pos}
                            label={pos}
                            tooltip={pos === "static" ? "static (default)" : pos}
                            isActive={state.position ? state.position === pos : pos === "static"}
                            onClick={() => update("position", pos === "static" ? "" : (state.position === pos ? "" : pos))}
                          />
                        ))}
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Overflow (not hidden/contents/inline) ─ */}
                  {showOverflow && (
                    <ControlRow label="Overflow">
                      <div className="flex gap-0.5">
                        {(["visible", "hidden", "scroll", "auto"] as const).map((ov) => (
                          <TextToggle
                            key={ov}
                            value={`overflow-${ov}`}
                            label={ov}
                            tooltip={`overflow-${ov}`}
                            isActive={state.overflow === `overflow-${ov}`}
                            onClick={() => update("overflow", state.overflow === `overflow-${ov}` ? "" : `overflow-${ov}`)}
                          />
                        ))}
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Z-index (when positioned) ──────────── */}
                  {showPosition && state.position && state.position !== "static" && (
                    <ControlRow label="Z-index">
                      <div className="flex items-center gap-1">
                        <ZIndexInput value={state.zIndex} onChange={(v) => update("zIndex", v)} />
                        {[10, 20, 30, 40, 50].map((n) => (
                          <TextToggle key={n} value={`z-${n}`} label={String(n)} tooltip={`z-${n}`} isActive={state.zIndex === `z-${n}`} onClick={(v) => update("zIndex", state.zIndex === v ? "" : v)} />
                        ))}
                        <TextToggle value="z-auto" label="auto" tooltip="z-auto — uses browser stacking order" isActive={state.zIndex === "z-auto"} onClick={(v) => update("zIndex", state.zIndex === v ? "" : v)} />
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Inset (when positioned, not static) ─── */}
                  {showPosition && state.position && state.position !== "static" && (
                    <>
                      <ControlRow label="Inset">
                        <Select value={state.inset ? state.inset.replace("inset-", "") : "__none__"} onValueChange={(v) => update("inset", v === "__none__" ? "" : `inset-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                      <ControlRow label="Top">
                        <Select value={state.top ? state.top.replace("top-", "") : "__none__"} onValueChange={(v) => update("top", v === "__none__" ? "" : `top-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                      <ControlRow label="Right">
                        <Select value={state.right ? state.right.replace("right-", "") : "__none__"} onValueChange={(v) => update("right", v === "__none__" ? "" : `right-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                      <ControlRow label="Bottom">
                        <Select value={state.bottom ? state.bottom.replace("bottom-", "") : "__none__"} onValueChange={(v) => update("bottom", v === "__none__" ? "" : `bottom-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                      <ControlRow label="Left">
                        <Select value={state.left ? state.left.replace("left-", "") : "__none__"} onValueChange={(v) => update("left", v === "__none__" ? "" : `left-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                    </>
                  )}

                  {/* ── Visibility (not hidden/contents) ────── */}
                  {showPosition && (
                    <ControlRow label="Visibility">
                      <div className="flex gap-0.5">
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <TextToggle key={opt} value={opt} label={opt} tooltip={opt} isActive={state.visibility === opt} onClick={(v) => update("visibility", state.visibility === v ? "" : v)} />
                        ))}
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Aspect ratio ────────────────────────── */}
                  {showPosition && (
                    <ControlRow label="Aspect">
                      <div className="flex gap-0.5">
                        {ASPECT_RATIO_OPTIONS.map((opt) => (
                          <TextToggle key={opt} value={opt} label={opt.replace("aspect-", "")} tooltip={opt} isActive={state.aspectRatio === opt} onClick={(v) => update("aspectRatio", state.aspectRatio === v ? "" : v)} />
                        ))}
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Float + Clear (block-level) ─────────── */}
                  {isBlock && (
                    <>
                      <ControlRow label="Float">
                        <div className="flex gap-0.5">
                          {FLOAT_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("float-", "")} tooltip={opt} isActive={state.float === opt} onClick={(v) => update("float", state.float === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>
                      <ControlRow label="Clear">
                        <div className="flex gap-0.5">
                          {CLEAR_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("clear-", "")} tooltip={opt} isActive={state.clear === opt} onClick={(v) => update("clear", state.clear === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>
                    </>
                  )}

                  {/* ── Isolation ────────────────────────────── */}
                  {showPosition && (
                    <ControlRow label="Isolation">
                      <div className="flex gap-0.5">
                        {ISOLATION_OPTIONS.map((opt) => (
                          <TextToggle key={opt} value={opt} label={opt.replace("isolation-", "")} tooltip={opt} isActive={state.isolation === opt} onClick={(v) => update("isolation", state.isolation === v ? "" : v)} />
                        ))}
                      </div>
                    </ControlRow>
                  )}

                  {/* ── Object fit + position (for images/replaced elements) ── */}
                  {showPosition && (
                    <>
                      <ControlRow label="Object fit">
                        <div className="flex flex-wrap gap-0.5">
                          {OBJECT_FIT_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("object-", "")} tooltip={opt} isActive={state.objectFit === opt} onClick={(v) => update("objectFit", state.objectFit === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>
                      <ControlRow label="Object pos">
                        <div className="flex flex-wrap gap-0.5">
                          {OBJECT_POSITION_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("object-", "")} tooltip={opt} isActive={state.objectPosition === opt} onClick={(v) => update("objectPosition", state.objectPosition === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>
                    </>
                  )}

                  {/* ══════ FLEX-SPECIFIC ═══════════════════ */}
                  {isFlex && (
                    <>
                      {/* ── Flex container controls ────────────── */}
                      <ControlRow label="Direction">
                        <div className="flex gap-0.5">
                          <IconToggle value="flex-row" icon={ArrowRight} tooltip="flex-row (default)" isActive={state.direction === "flex-row" || !state.direction} onClick={() => update("direction", "")} />
                          <IconToggle value="flex-col" icon={ArrowDown} tooltip="flex-col" isActive={state.direction === "flex-col"} onClick={(v) => update("direction", v)} />
                          <IconToggle value="flex-row-reverse" icon={ArrowLeft} tooltip="flex-row-reverse" isActive={state.direction === "flex-row-reverse"} onClick={(v) => update("direction", v)} />
                          <IconToggle value="flex-col-reverse" icon={ArrowUp} tooltip="flex-col-reverse" isActive={state.direction === "flex-col-reverse"} onClick={(v) => update("direction", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Wrap">
                        <div className="flex gap-0.5">
                          <IconToggle value="flex-nowrap" icon={X} tooltip="flex-nowrap (default)" isActive={!state.flexWrap || state.flexWrap === "flex-nowrap"} onClick={() => update("flexWrap", "")} />
                          <IconToggle value="flex-wrap" icon={WrapText} tooltip="flex-wrap" isActive={state.flexWrap === "flex-wrap"} onClick={(v) => update("flexWrap", v)} />
                          <TextToggle value="flex-wrap-reverse" label="reverse" tooltip="flex-wrap-reverse" isActive={state.flexWrap === "flex-wrap-reverse"} onClick={(v) => update("flexWrap", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Alignment">
                        <PositionGrid
                          justify={state.justify}
                          align={state.align}
                          display={effectiveDisplay}
                          onJustifyChange={(v) => update("justify", v)}
                          onAlignChange={(v) => update("align", v)}
                        />
                      </ControlRow>

                      {/* Align content — only relevant when wrapping */}
                      {(state.flexWrap === "flex-wrap" || state.flexWrap === "flex-wrap-reverse") && (
                        <ControlRow label="Content">
                          <div className="flex flex-wrap gap-0.5">
                            {ALIGN_CONTENT_OPTIONS.map((opt) => (
                              <TextToggle
                                key={opt}
                                value={opt}
                                label={opt.replace("content-", "")}
                                tooltip={opt}
                                isActive={state.alignContent === opt}
                                onClick={(v) => update("alignContent", state.alignContent === v ? "" : v)}
                              />
                            ))}
                          </div>
                        </ControlRow>
                      )}

                      <GapControl
                        gap={state.gap}
                        gapX={state.gapX}
                        gapY={state.gapY}
                        onGapChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gap: v, gapX: "", gapY: "" }))
                        }}
                        onGapXChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gapX: v, gap: "" }))
                        }}
                        onGapYChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gapY: v, gap: "" }))
                        }}
                      />

                    </>
                  )}

                  {/* ══════ GRID-SPECIFIC ═══════════════════ */}
                  {isGrid && (
                    <>
                      {/* ── Grid container controls ────────── */}
                      <ControlRow label="Columns">
                        <GridNumberPicker
                          value={state.gridCols}
                          prefix="grid-cols"
                          max={12}
                          allowCustom
                          extras={[
                            { value: "grid-cols-none", label: "auto" },
                            { value: "grid-cols-subgrid", label: "subgrid" },
                          ]}
                          onChange={(v) => update("gridCols", v)}
                        />
                      </ControlRow>

                      <ControlRow label="Rows">
                        <GridNumberPicker
                          value={state.gridRows}
                          prefix="grid-rows"
                          max={12}
                          allowCustom
                          extras={[
                            { value: "grid-rows-none", label: "auto" },
                            { value: "grid-rows-subgrid", label: "subgrid" },
                          ]}
                          onChange={(v) => update("gridRows", v)}
                        />
                      </ControlRow>

                      <ControlRow label="Flow">
                        <div className="flex flex-wrap gap-0.5">
                          <TextToggle value="grid-flow-row" label="row" tooltip="grid-flow-row (default)" isActive={!state.gridFlow || state.gridFlow === "grid-flow-row"} onClick={() => update("gridFlow", "")} />
                          <TextToggle value="grid-flow-col" label="col" tooltip="grid-flow-col" isActive={state.gridFlow === "grid-flow-col"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-dense" label="dense" tooltip="grid-flow-dense" isActive={state.gridFlow === "grid-flow-dense"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-row-dense" label="row+dense" tooltip="grid-flow-row-dense" isActive={state.gridFlow === "grid-flow-row-dense"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-col-dense" label="col+dense" tooltip="grid-flow-col-dense" isActive={state.gridFlow === "grid-flow-col-dense"} onClick={(v) => update("gridFlow", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Alignment">
                        <PositionGrid
                          justify={state.justify}
                          align={state.align}
                          display={effectiveDisplay}
                          onJustifyChange={(v) => update("justify", v)}
                          onAlignChange={(v) => update("align", v)}
                        />
                      </ControlRow>

                      <GapControl
                        gap={state.gap}
                        gapX={state.gapX}
                        gapY={state.gapY}
                        onGapChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gap: v, gapX: "", gapY: "" }))
                        }}
                        onGapXChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gapX: v, gap: "" }))
                        }}
                        onGapYChange={(v) => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, gapY: v, gap: "" }))
                        }}
                      />

                      <ControlRow label="Auto rows">
                        <div className="flex flex-wrap gap-0.5">
                          {AUTO_ROWS_OPTIONS.map((opt) => (
                            <TextToggle
                              key={opt}
                              value={opt}
                              label={opt.replace("auto-rows-", "")}
                              tooltip={opt}
                              isActive={state.autoRows === opt}
                              onClick={(v) => update("autoRows", state.autoRows === v ? "" : v)}
                            />
                          ))}
                        </div>
                      </ControlRow>

                      <ControlRow label="Auto cols">
                        <div className="flex flex-wrap gap-0.5">
                          {AUTO_COLS_OPTIONS.map((opt) => (
                            <TextToggle
                              key={opt}
                              value={opt}
                              label={opt.replace("auto-cols-", "")}
                              tooltip={opt}
                              isActive={state.autoCols === opt}
                              onClick={(v) => update("autoCols", state.autoCols === v ? "" : v)}
                            />
                          ))}
                        </div>
                      </ControlRow>

                      <ControlRow label="Justify items">
                        <div className="flex flex-wrap gap-0.5">
                          {JUSTIFY_ITEMS_OPTIONS.map((opt) => (
                            <TextToggle
                              key={opt}
                              value={opt}
                              label={opt.replace("justify-items-", "")}
                              tooltip={opt}
                              isActive={state.justifyItems === opt}
                              onClick={(v) => update("justifyItems", state.justifyItems === v ? "" : v)}
                            />
                          ))}
                        </div>
                      </ControlRow>

                      <ControlRow label="Align content">
                        <div className="flex flex-wrap gap-0.5">
                          {ALIGN_CONTENT_OPTIONS.map((opt) => (
                            <TextToggle
                              key={opt}
                              value={opt}
                              label={opt.replace("content-", "")}
                              tooltip={opt}
                              isActive={state.alignContent === opt}
                              onClick={(v) => update("alignContent", state.alignContent === v ? "" : v)}
                            />
                          ))}
                        </div>
                      </ControlRow>
                    </>
                  )}

                  {/* ══════ CHILD PROPERTIES (always visible) ════ */}
                  {effectiveDisplay !== "hidden" && effectiveDisplay !== "contents" && (
                    <>
                      <div className="border-t px-3 py-1.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Child placement</p>
                      </div>

                      <ControlRow label="Col span">
                        <GridNumberPicker
                          value={state.colSpan}
                          prefix="col-span"
                          max={12}
                          extras={[{ value: "col-span-full", label: "full" }]}
                          onChange={(v) => update("colSpan", v)}
                        />
                      </ControlRow>

                      <ControlRow label="Row span">
                        <GridNumberPicker
                          value={state.rowSpan}
                          prefix="row-span"
                          max={12}
                          extras={[{ value: "row-span-full", label: "full" }]}
                          onChange={(v) => update("rowSpan", v)}
                        />
                      </ControlRow>

                      <ControlRow label="Col start">
                        <GridNumberPicker value={state.colStart} prefix="col-start" max={13} extras={[{ value: "col-start-auto", label: "auto" }]} onChange={(v) => update("colStart", v)} />
                      </ControlRow>

                      <ControlRow label="Col end">
                        <GridNumberPicker value={state.colEnd} prefix="col-end" max={13} extras={[{ value: "col-end-auto", label: "auto" }]} onChange={(v) => update("colEnd", v)} />
                      </ControlRow>

                      <ControlRow label="Row start">
                        <GridNumberPicker value={state.rowStart} prefix="row-start" max={7} extras={[{ value: "row-start-auto", label: "auto" }]} onChange={(v) => update("rowStart", v)} />
                      </ControlRow>

                      <ControlRow label="Row end">
                        <GridNumberPicker value={state.rowEnd} prefix="row-end" max={7} extras={[{ value: "row-end-auto", label: "auto" }]} onChange={(v) => update("rowEnd", v)} />
                      </ControlRow>

                      <ControlRow label="Flex">
                        <div className="flex gap-0.5">
                          <TextToggle value="" label="–" tooltip="default" isActive={!state.flexShorthand} onClick={() => update("flexShorthand", "")} />
                          <TextToggle value="flex-1" label="1" tooltip="flex-1" isActive={state.flexShorthand === "flex-1"} onClick={(v) => update("flexShorthand", v)} />
                          <TextToggle value="flex-auto" label="auto" tooltip="flex-auto" isActive={state.flexShorthand === "flex-auto"} onClick={(v) => update("flexShorthand", v)} />
                          <TextToggle value="flex-initial" label="initial" tooltip="flex-initial" isActive={state.flexShorthand === "flex-initial"} onClick={(v) => update("flexShorthand", v)} />
                          <TextToggle value="flex-none" label="none" tooltip="flex-none" isActive={state.flexShorthand === "flex-none"} onClick={(v) => update("flexShorthand", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Grow">
                        <div className="flex gap-0.5">
                          <TextToggle value="" label="–" tooltip="default" isActive={!state.flexGrow} onClick={() => update("flexGrow", "")} />
                          <IconToggle value="grow" icon={Maximize2} tooltip="grow" isActive={state.flexGrow === "grow"} onClick={(v) => update("flexGrow", v)} />
                          <TextToggle value="grow-0" label="0" tooltip="grow-0" isActive={state.flexGrow === "grow-0"} onClick={(v) => update("flexGrow", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Shrink">
                        <div className="flex gap-0.5">
                          <TextToggle value="" label="–" tooltip="default" isActive={!state.flexShrink} onClick={() => update("flexShrink", "")} />
                          <TextToggle value="shrink" label="shrink" tooltip="shrink" isActive={state.flexShrink === "shrink"} onClick={(v) => update("flexShrink", v)} />
                          <TextToggle value="shrink-0" label="0" tooltip="shrink-0" isActive={state.flexShrink === "shrink-0"} onClick={(v) => update("flexShrink", v)} />
                        </div>
                      </ControlRow>

                      <ControlRow label="Basis">
                        <Select value={state.flexBasis || "__none__"} onValueChange={(v) => update("flexBasis", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {FLEX_BASIS_OPTIONS.map((v) => (
                              <SelectItem key={v} value={v} className="text-xs">{v.replace("basis-", "")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Align self">
                        <div className="flex flex-wrap gap-0.5">
                          {ALIGN_SELF_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("self-", "")} tooltip={opt} isActive={state.alignSelf === opt} onClick={(v) => update("alignSelf", state.alignSelf === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>

                      <ControlRow label="Justify self">
                        <div className="flex flex-wrap gap-0.5">
                          {JUSTIFY_SELF_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("justify-self-", "")} tooltip={opt} isActive={state.justifySelf === opt} onClick={(v) => update("justifySelf", state.justifySelf === v ? "" : v)} />
                          ))}
                        </div>
                      </ControlRow>

                      <ControlRow label="Order">
                        <Select value={state.order || "__none__"} onValueChange={(v) => update("order", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {ORDER_OPTIONS.map((v) => (
                              <SelectItem key={v} value={v} className="text-xs">{v.replace("order-", "")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                    </>
                  )}

                  {/* ══════ BLOCK-SPECIFIC (space-y moved to Spacing section) ══ */}
                  {false && isBlock && (
                    <div />
                  )}
                </>
              )
            })()}
          </ControlSection>

          {/* ── Remaining sections hidden when display is hidden/contents ── */}
          {effectiveDisplay !== "hidden" && effectiveDisplay !== "contents" && (
          <>
          {/* ── Spacing ──────────────────────────────────── */}
          <ControlSection icon={Box} title="Spacing">
            {(() => {
              const isInline = effectiveDisplay === "inline"
              const isBlockDisplay = effectiveDisplay === "block" || effectiveDisplay === "inline-block"
              const acceptsSize = !isInline && effectiveDisplay !== "hidden" && effectiveDisplay !== "contents"
              const isFlexRow = isFlex && (state.direction === "flex-row" || state.direction === "flex-row-reverse" || !state.direction)
              const isFlexCol = isFlex && (state.direction === "flex-col" || state.direction === "flex-col-reverse")

              return (
                <>
                  {/* Padding */}
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

                  {/* Margin */}
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

                  {/* Space between — conditional on display/direction */}
                  {isFlexRow && (
                    <ControlRow label="Space-X">
                      <Select value={state.spaceX ? state.spaceX.replace("space-x-", "") : "__none__"} onValueChange={(v) => update("spaceX", v === "__none__" ? "" : `space-x-${v}`)}>
                        <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">–</SelectItem>
                          {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </ControlRow>
                  )}
                  {(isBlockDisplay || isFlexCol) && (
                    <ControlRow label="Space-Y">
                      <Select value={state.spaceY ? state.spaceY.replace("space-y-", "") : "__none__"} onValueChange={(v) => update("spaceY", v === "__none__" ? "" : `space-y-${v}`)}>
                        <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">–</SelectItem>
                          {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </ControlRow>
                  )}

                  {/* Width / Height — not for inline */}
                  {acceptsSize && (
                    <>
                      <Separator className="my-1" />
                      <ControlRow label="Width">
                        <Select value={state.width || "__none__"} onValueChange={(v) => update("width", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Height">
                        <Select value={state.height || "__none__"} onValueChange={(v) => update("height", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Size">
                        <Select value={state.size || "__none__"} onValueChange={(v) => update("size", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SIZE_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("size-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <Separator className="my-1" />

                      <ControlRow label="Min W">
                        <Select value={state.minWidth || "__none__"} onValueChange={(v) => update("minWidth", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MIN_WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("min-w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Max W">
                        <Select value={state.maxWidth || "__none__"} onValueChange={(v) => update("maxWidth", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MAX_WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("max-w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Min H">
                        <Select value={state.minHeight || "__none__"} onValueChange={(v) => update("minHeight", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MIN_HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("min-h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>

                      <ControlRow label="Max H">
                        <Select value={state.maxHeight || "__none__"} onValueChange={(v) => update("maxHeight", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MAX_HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("max-h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </ControlRow>
                    </>
                  )}
                </>
              )
            })()}
          </ControlSection>

          {/* ── Typography ───────────────────────────────── */}
          <ControlSection icon={Type} title="Typography">
            <ControlRow label="Size">
              <div className="flex flex-wrap gap-0.5">
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.fontSize === opt} onClick={(v) => update("fontSize", v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Weight">
              <div className="flex flex-wrap gap-0.5">
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("font-", "")} tooltip={opt} isActive={state.fontWeight === opt} onClick={(v) => update("fontWeight", v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Align">
              <div className="flex gap-0.5">
                <IconToggle value="text-left" icon={AlignLeft} tooltip="text-left" isActive={state.textAlign === "text-left"} onClick={(v) => update("textAlign", v)} />
                <IconToggle value="text-center" icon={AlignCenter} tooltip="text-center" isActive={state.textAlign === "text-center"} onClick={(v) => update("textAlign", v)} />
                <IconToggle value="text-right" icon={AlignRight} tooltip="text-right" isActive={state.textAlign === "text-right"} onClick={(v) => update("textAlign", v)} />
              </div>
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
                    <SelectTrigger className="h-6 flex-1 text-xs">
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
              <div className="flex flex-wrap gap-0.5">
                {BORDER_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "border" ? "1" : opt.replace("border-", "")} tooltip={opt} isActive={state.borderWidth === opt} onClick={(v) => update("borderWidth", v)} />
                ))}
              </div>
            </ControlRow>
          </ControlSection>

          {/* ── Effects ──────────────────────────────────── */}
          <ControlSection icon={Sparkles} title="Effects">
            <ControlRow label="Shadow">
              <div className="flex flex-wrap gap-0.5">
                {SHADOW_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("shadow-", "")} tooltip={opt} isActive={state.shadow === opt} onClick={(v) => update("shadow", v)} />
                ))}
              </div>
            </ControlRow>
          </ControlSection>
          </>
          )}
        </div>
        </TooltipProvider>
      </ScrollArea>

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
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Applied classes
        </span>
        <Badge
          variant="secondary"
          className="ml-1 h-4 px-1 text-xs"
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
            {classes.map((cls, idx) => (
              <Badge
                key={`${cls}-${idx}`}
                variant="secondary"
                className="h-5 text-xs"
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
