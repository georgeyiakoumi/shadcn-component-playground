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
  Move,
  SlidersHorizontal,
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
  /** Sub-component names (for has-[data-slot=...] selectors) */
  subComponentNames?: string[]
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
  subComponentNames?: string[],
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

  // States — pseudo-classes
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
      { value: "enabled", label: "enabled" },
      { value: "checked", label: "checked" },
      { value: "indeterminate", label: "indeterminate" },
      { value: "required", label: "required" },
      { value: "invalid", label: "invalid" },
      { value: "valid", label: "valid" },
      { value: "placeholder-shown", label: "placeholder-shown" },
      { value: "read-only", label: "read-only" },
      { value: "empty", label: "empty" },
      { value: "dark", label: "dark" },
    ],
  })

  // Structural selectors
  groups.push({
    label: "Structural",
    options: [
      { value: "first", label: "first" },
      { value: "last", label: "last" },
      { value: "only", label: "only" },
      { value: "odd", label: "odd" },
      { value: "even", label: "even" },
      { value: "first-of-type", label: "first-of-type" },
      { value: "last-of-type", label: "last-of-type" },
    ],
  })

  // Data attributes — Radix UI states
  groups.push({
    section: "Data attributes",
    label: "Radix state",
    options: [
      { value: "data-[state=open]", label: "state=open" },
      { value: "data-[state=closed]", label: "state=closed" },
      { value: "data-[state=active]", label: "state=active" },
      { value: "data-[state=inactive]", label: "state=inactive" },
      { value: "data-[state=checked]", label: "state=checked" },
      { value: "data-[state=unchecked]", label: "state=unchecked" },
      { value: "data-[state=on]", label: "state=on" },
      { value: "data-[state=off]", label: "state=off" },
    ],
  })

  groups.push({
    label: "Radix side/align",
    options: [
      { value: "data-[side=top]", label: "side=top" },
      { value: "data-[side=right]", label: "side=right" },
      { value: "data-[side=bottom]", label: "side=bottom" },
      { value: "data-[side=left]", label: "side=left" },
      { value: "data-[align=start]", label: "align=start" },
      { value: "data-[align=center]", label: "align=center" },
      { value: "data-[align=end]", label: "align=end" },
    ],
  })

  groups.push({
    label: "Radix misc",
    options: [
      { value: "data-[disabled]", label: "disabled" },
      { value: "data-[highlighted]", label: "highlighted" },
      { value: "data-[placeholder]", label: "placeholder" },
      { value: "data-[orientation=horizontal]", label: "orientation=horizontal" },
      { value: "data-[orientation=vertical]", label: "orientation=vertical" },
      { value: "data-[motion=from-start]", label: "motion=from-start" },
      { value: "data-[motion=from-end]", label: "motion=from-end" },
      { value: "data-[motion=to-start]", label: "motion=to-start" },
      { value: "data-[motion=to-end]", label: "motion=to-end" },
      { value: "data-[swipe=start]", label: "swipe=start" },
      { value: "data-[swipe=move]", label: "swipe=move" },
      { value: "data-[swipe=end]", label: "swipe=end" },
      { value: "data-[swipe=cancel]", label: "swipe=cancel" },
    ],
  })

  // ARIA attributes
  groups.push({
    section: "ARIA",
    label: "ARIA states",
    options: [
      { value: "aria-checked", label: "aria-checked" },
      { value: "aria-disabled", label: "aria-disabled" },
      { value: "aria-expanded", label: "aria-expanded" },
      { value: "aria-hidden", label: "aria-hidden" },
      { value: "aria-pressed", label: "aria-pressed" },
      { value: "aria-readonly", label: "aria-readonly" },
      { value: "aria-required", label: "aria-required" },
      { value: "aria-selected", label: "aria-selected" },
    ],
  })

  // Group states
  groups.push({
    section: "Group / Peer",
    label: "Group states",
    options: [
      { value: "group-hover", label: "group-hover" },
      { value: "group-focus", label: "group-focus" },
      { value: "group-focus-within", label: "group-focus-within" },
      { value: "group-active", label: "group-active" },
      { value: "group-disabled", label: "group-disabled" },
      { value: "group-data-[state=open]", label: "group-data-[state=open]" },
      { value: "group-data-[state=closed]", label: "group-data-[state=closed]" },
    ],
  })

  // Peer states
  groups.push({
    label: "Peer states",
    options: [
      { value: "peer-hover", label: "peer-hover" },
      { value: "peer-focus", label: "peer-focus" },
      { value: "peer-focus-visible", label: "peer-focus-visible" },
      { value: "peer-checked", label: "peer-checked" },
      { value: "peer-disabled", label: "peer-disabled" },
      { value: "peer-invalid", label: "peer-invalid" },
      { value: "peer-placeholder-shown", label: "peer-placeholder-shown" },
      { value: "peer-data-[state=open]", label: "peer-data-[state=open]" },
      { value: "peer-data-[state=closed]", label: "peer-data-[state=closed]" },
    ],
  })

  // Has selectors (slot-based conditional styling)
  const hasOptions: Array<{ value: string; label: string }> = []
  // Dynamic: generate from sub-component names
  if (subComponentNames && subComponentNames.length > 0) {
    for (const name of subComponentNames) {
      const slot = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
      hasOptions.push({
        value: `has-[data-slot=${slot}]`,
        label: `has-[data-slot=${slot}]`,
      })
    }
  }
  // Common structural has selectors
  hasOptions.push(
    { value: "has-[>svg]", label: "has-[>svg]" },
    { value: "has-[>img]", label: "has-[>img]" },
    { value: "has-[:focus]", label: "has-[:focus]" },
    { value: "has-[:checked]", label: "has-[:checked]" },
    { value: "has-[:disabled]", label: "has-[:disabled]" },
  )
  if (hasOptions.length > 0) {
    groups.push({
      section: "Has / Slot",
      label: "Has selectors",
      options: hasOptions,
    })
  }

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
  // Space reverse
  spaceXReverse: string
  spaceYReverse: string
  // Spacing
  padding: string
  paddingX: string
  paddingY: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  margin: string
  marginX: string
  marginY: string
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  // Typography
  fontSize: string
  fontWeight: string
  fontFamily: string
  fontStyle: string
  textAlign: string
  textDecoration: string
  textDecorationStyle: string
  textDecorationThickness: string
  textUnderlineOffset: string
  textTransform: string
  textOverflow: string
  textWrap: string
  textIndent: string
  lineHeight: string
  letterSpacing: string
  wordBreak: string
  whitespace: string
  hyphens: string
  lineClamp: string
  verticalAlign: string
  listStyleType: string
  listStylePosition: string
  fontVariantNumeric: string
  // Colours
  textColor: string
  bgColor: string
  borderColor: string
  ringColor: string
  ringOffsetColor: string
  outlineColor: string
  opacity: string
  gradientDirection: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  // Borders
  borderRadius: string
  borderRadiusTL: string
  borderRadiusTR: string
  borderRadiusBR: string
  borderRadiusBL: string
  borderWidth: string
  borderWidthT: string
  borderWidthR: string
  borderWidthB: string
  borderWidthL: string
  borderStyle: string
  ringWidth: string
  ringOffsetWidth: string
  outlineWidth: string
  outlineStyle: string
  outlineOffset: string
  divideX: string
  divideY: string
  divideStyle: string
  divideReverse: string
  // Effects
  shadow: string
  shadowColor: string
  mixBlend: string
  bgBlend: string
  // Filters
  blur: string
  brightness: string
  contrast: string
  grayscale: string
  hueRotate: string
  invert: string
  saturate: string
  sepia: string
  dropShadow: string
  backdropBlur: string
  backdropBrightness: string
  backdropContrast: string
  backdropGrayscale: string
  backdropHueRotate: string
  backdropInvert: string
  backdropOpacity: string
  backdropSaturate: string
  backdropSepia: string
  // Transitions & Animation
  transitionProperty: string
  transitionDuration: string
  transitionTiming: string
  transitionDelay: string
  animation: string
  // Transforms
  scale: string
  scaleX: string
  scaleY: string
  rotate: string
  translateX: string
  translateY: string
  skewX: string
  skewY: string
  transformOrigin: string
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
const SPACING_SCALE_FULL = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const
const SPACE_Y_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-y-${v}`)
const SPACE_X_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-x-${v}`)
const SPACE_X_REVERSE = "space-x-reverse"
const SPACE_Y_REVERSE = "space-y-reverse"

const WIDTH_OPTIONS = [
  "w-0", "w-0.5", "w-1", "w-1.5", "w-2", "w-2.5", "w-3", "w-3.5", "w-4", "w-5", "w-6", "w-7", "w-8", "w-9",
  "w-10", "w-11", "w-12", "w-14", "w-16", "w-20", "w-24", "w-28", "w-32", "w-36", "w-40", "w-44", "w-48",
  "w-52", "w-56", "w-60", "w-64", "w-72", "w-80", "w-96",
  "w-auto", "w-full", "w-screen", "w-svw", "w-lvw", "w-dvw", "w-min", "w-max", "w-fit",
  "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4", "w-1/5", "w-2/5", "w-3/5", "w-4/5",
]
const HEIGHT_OPTIONS = [
  "h-0", "h-0.5", "h-1", "h-1.5", "h-2", "h-2.5", "h-3", "h-3.5", "h-4", "h-5", "h-6", "h-7", "h-8", "h-9",
  "h-10", "h-11", "h-12", "h-14", "h-16", "h-20", "h-24", "h-28", "h-32", "h-36", "h-40", "h-44", "h-48",
  "h-52", "h-56", "h-60", "h-64", "h-72", "h-80", "h-96",
  "h-auto", "h-full", "h-screen", "h-svh", "h-lvh", "h-dvh", "h-min", "h-max", "h-fit",
  "h-1/2", "h-1/3", "h-2/3", "h-1/4", "h-3/4", "h-1/5", "h-2/5", "h-3/5", "h-4/5",
]
const MIN_WIDTH_OPTIONS = ["min-w-0", "min-w-full", "min-w-min", "min-w-max", "min-w-fit"]
const MAX_WIDTH_OPTIONS = [
  "max-w-none", "max-w-0", "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl",
  "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl", "max-w-7xl",
  "max-w-full", "max-w-min", "max-w-max", "max-w-fit", "max-w-prose", "max-w-screen-sm",
  "max-w-screen-md", "max-w-screen-lg", "max-w-screen-xl", "max-w-screen-2xl",
]
const MIN_HEIGHT_OPTIONS = ["min-h-0", "min-h-full", "min-h-screen", "min-h-svh", "min-h-lvh", "min-h-dvh", "min-h-min", "min-h-max", "min-h-fit"]
const MAX_HEIGHT_OPTIONS = [
  "max-h-none", "max-h-0", "max-h-full", "max-h-screen", "max-h-svh", "max-h-lvh", "max-h-dvh", "max-h-min", "max-h-max", "max-h-fit",
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px" && v !== "0.5").map((v) => `max-h-${v}`),
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
  "p-0", "p-px", "p-0.5", "p-1", "p-1.5", "p-2", "p-2.5", "p-3", "p-3.5",
  "p-4", "p-5", "p-6", "p-7", "p-8", "p-9", "p-10", "p-11", "p-12", "p-14", "p-16",
]
const MARGIN_SCALE = [
  "m-auto",
  "m-0", "m-px", "m-0.5", "m-1", "m-1.5", "m-2", "m-2.5", "m-3", "m-3.5",
  "m-4", "m-5", "m-6", "m-7", "m-8", "m-9", "m-10", "m-11", "m-12", "m-14", "m-16",
  // Negative margins
  "-m-0.5", "-m-1", "-m-1.5", "-m-2", "-m-2.5", "-m-3", "-m-3.5",
  "-m-4", "-m-5", "-m-6", "-m-7", "-m-8", "-m-9", "-m-10", "-m-11", "-m-12", "-m-14", "-m-16",
]

const PADDING_X_SCALE = SPACING_SCALE_FULL.map((v) => `px-${v}`)
const PADDING_Y_SCALE = SPACING_SCALE_FULL.map((v) => `py-${v}`)
const MARGIN_X_SCALE = [
  "mx-auto",
  ...SPACING_SCALE_FULL.map((v) => `mx-${v}`),
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px").map((v) => `-mx-${v}`),
]
const MARGIN_Y_SCALE = [
  "my-auto",
  ...SPACING_SCALE_FULL.map((v) => `my-${v}`),
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px").map((v) => `-my-${v}`),
]

const PADDING_SIDES = {
  paddingTop: ["pt-0", "pt-1", "pt-2", "pt-3", "pt-4", "pt-5", "pt-6", "pt-8", "pt-10", "pt-12"],
  paddingRight: ["pr-0", "pr-1", "pr-2", "pr-3", "pr-4", "pr-5", "pr-6", "pr-8", "pr-10", "pr-12"],
  paddingBottom: ["pb-0", "pb-1", "pb-2", "pb-3", "pb-4", "pb-5", "pb-6", "pb-8", "pb-10", "pb-12"],
  paddingLeft: ["pl-0", "pl-1", "pl-2", "pl-3", "pl-4", "pl-5", "pl-6", "pl-8", "pl-10", "pl-12"],
} as const

const MARGIN_SIDES = {
  marginTop: ["mt-auto", "mt-0", "mt-0.5", "mt-1", "mt-1.5", "mt-2", "mt-2.5", "mt-3", "mt-3.5", "mt-4", "mt-5", "mt-6", "mt-7", "mt-8", "mt-9", "mt-10", "mt-11", "mt-12", "mt-14", "mt-16",
    "-mt-0.5", "-mt-1", "-mt-1.5", "-mt-2", "-mt-2.5", "-mt-3", "-mt-3.5", "-mt-4", "-mt-5", "-mt-6", "-mt-8", "-mt-10", "-mt-12"],
  marginRight: ["mr-auto", "mr-0", "mr-0.5", "mr-1", "mr-1.5", "mr-2", "mr-2.5", "mr-3", "mr-3.5", "mr-4", "mr-5", "mr-6", "mr-7", "mr-8", "mr-9", "mr-10", "mr-11", "mr-12", "mr-14", "mr-16",
    "-mr-0.5", "-mr-1", "-mr-1.5", "-mr-2", "-mr-2.5", "-mr-3", "-mr-3.5", "-mr-4", "-mr-5", "-mr-6", "-mr-8", "-mr-10", "-mr-12"],
  marginBottom: ["mb-auto", "mb-0", "mb-0.5", "mb-1", "mb-1.5", "mb-2", "mb-2.5", "mb-3", "mb-3.5", "mb-4", "mb-5", "mb-6", "mb-7", "mb-8", "mb-9", "mb-10", "mb-11", "mb-12", "mb-14", "mb-16",
    "-mb-0.5", "-mb-1", "-mb-1.5", "-mb-2", "-mb-2.5", "-mb-3", "-mb-3.5", "-mb-4", "-mb-5", "-mb-6", "-mb-8", "-mb-10", "-mb-12"],
  marginLeft: ["ml-auto", "ml-0", "ml-0.5", "ml-1", "ml-1.5", "ml-2", "ml-2.5", "ml-3", "ml-3.5", "ml-4", "ml-5", "ml-6", "ml-7", "ml-8", "ml-9", "ml-10", "ml-11", "ml-12", "ml-14", "ml-16",
    "-ml-0.5", "-ml-1", "-ml-1.5", "-ml-2", "-ml-2.5", "-ml-3", "-ml-3.5", "-ml-4", "-ml-5", "-ml-6", "-ml-8", "-ml-10", "-ml-12"],
} as const

const FONT_SIZE_OPTIONS = [
  "text-xs", "text-sm", "text-base", "text-lg", "text-xl",
  "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl", "text-8xl", "text-9xl",
]
const FONT_WEIGHT_OPTIONS = [
  "font-thin", "font-extralight", "font-light", "font-normal", "font-medium",
  "font-semibold", "font-bold", "font-extrabold", "font-black",
]
const FONT_FAMILY_OPTIONS = ["font-sans", "font-serif", "font-mono"]
const FONT_STYLE_OPTIONS = ["italic", "not-italic"]
const TEXT_ALIGN_OPTIONS = ["text-left", "text-center", "text-right", "text-justify", "text-start", "text-end"]
const TEXT_DECORATION_OPTIONS = ["underline", "overline", "line-through", "no-underline"]
const TEXT_DECORATION_STYLE_OPTIONS = ["decoration-solid", "decoration-double", "decoration-dotted", "decoration-dashed", "decoration-wavy"]
const TEXT_DECORATION_THICKNESS_OPTIONS = ["decoration-auto", "decoration-from-font", "decoration-0", "decoration-1", "decoration-2", "decoration-4", "decoration-8"]
const TEXT_UNDERLINE_OFFSET_OPTIONS = ["underline-offset-auto", "underline-offset-0", "underline-offset-1", "underline-offset-2", "underline-offset-4", "underline-offset-8"]
const TEXT_TRANSFORM_OPTIONS = ["uppercase", "lowercase", "capitalize", "normal-case"]
const TEXT_OVERFLOW_OPTIONS = ["truncate", "text-ellipsis", "text-clip"]
const TEXT_WRAP_OPTIONS = ["text-wrap", "text-nowrap", "text-balance", "text-pretty"]
const TEXT_INDENT_OPTIONS = [
  "indent-0", "indent-px", "indent-0.5", "indent-1", "indent-1.5", "indent-2", "indent-4", "indent-6", "indent-8", "indent-10", "indent-12", "indent-16", "indent-20",
]
const LINE_HEIGHT_OPTIONS = [
  "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose",
  "leading-3", "leading-4", "leading-5", "leading-6", "leading-7", "leading-8", "leading-9", "leading-10",
]
const LETTER_SPACING_OPTIONS = ["tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest"]
const WORD_BREAK_OPTIONS = ["break-normal", "break-words", "break-all", "break-keep"]
const WHITESPACE_OPTIONS = ["whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-break-spaces"]
const HYPHENS_OPTIONS = ["hyphens-none", "hyphens-manual", "hyphens-auto"]
const LINE_CLAMP_OPTIONS = ["line-clamp-1", "line-clamp-2", "line-clamp-3", "line-clamp-4", "line-clamp-5", "line-clamp-6", "line-clamp-none"]
const VERTICAL_ALIGN_OPTIONS = ["align-baseline", "align-top", "align-middle", "align-bottom", "align-text-top", "align-text-bottom", "align-sub", "align-super"]
const LIST_STYLE_TYPE_OPTIONS = ["list-none", "list-disc", "list-decimal"]
const LIST_STYLE_POSITION_OPTIONS = ["list-inside", "list-outside"]
const FONT_VARIANT_NUMERIC_OPTIONS = ["normal-nums", "ordinal", "slashed-zero", "lining-nums", "oldstyle-nums", "proportional-nums", "tabular-nums"]

/* ── Full Tailwind colour palette ──────────────────────────────── */

const TW_COLOR_NAMES = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
  "fuchsia", "pink", "rose",
] as const

const TW_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const

/** Generate all Tailwind colour classes for a given prefix, e.g. "text", "bg", "border" */
function generateTwColorClasses(prefix: string): string[] {
  const classes: string[] = [
    `${prefix}-inherit`, `${prefix}-current`, `${prefix}-transparent`,
    `${prefix}-black`, `${prefix}-white`,
  ]
  for (const color of TW_COLOR_NAMES) {
    for (const shade of TW_SHADES) {
      classes.push(`${prefix}-${color}-${shade}`)
    }
  }
  return classes
}

/** shadcn semantic token options for a prefix */
const SHADCN_TEXT_TOKENS = [
  { label: "Foreground", value: "text-foreground" },
  { label: "Primary", value: "text-primary" },
  { label: "Secondary FG", value: "text-secondary-foreground" },
  { label: "Muted FG", value: "text-muted-foreground" },
  { label: "Destructive", value: "text-destructive" },
  { label: "Accent FG", value: "text-accent-foreground" },
]

const SHADCN_BG_TOKENS = [
  { label: "Background", value: "bg-background" },
  { label: "Primary", value: "bg-primary" },
  { label: "Secondary", value: "bg-secondary" },
  { label: "Muted", value: "bg-muted" },
  { label: "Accent", value: "bg-accent" },
  { label: "Destructive", value: "bg-destructive" },
  { label: "Card", value: "bg-card" },
  { label: "Popover", value: "bg-popover" },
]

const SHADCN_BORDER_TOKENS = [
  { label: "Border", value: "border-border" },
  { label: "Input", value: "border-input" },
  { label: "Ring", value: "border-ring" },
  { label: "Primary", value: "border-primary" },
  { label: "Destructive", value: "border-destructive" },
]

const SHADCN_RING_TOKENS = [
  { label: "Ring", value: "ring-ring" },
  { label: "Primary", value: "ring-primary" },
  { label: "Destructive", value: "ring-destructive" },
]

const TEXT_COLOR_OPTIONS = [
  ...SHADCN_TEXT_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("text"),
]

const BG_COLOR_OPTIONS = [
  ...SHADCN_BG_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("bg"),
]

const BORDER_COLOR_OPTIONS = [
  ...SHADCN_BORDER_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("border"),
]

const RING_COLOR_OPTIONS = [
  ...SHADCN_RING_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("ring"),
]

const RING_OFFSET_COLOR_OPTIONS = generateTwColorClasses("ring-offset")

const OUTLINE_COLOR_OPTIONS = generateTwColorClasses("outline")

const GRADIENT_FROM_OPTIONS = generateTwColorClasses("from")
const GRADIENT_VIA_OPTIONS = generateTwColorClasses("via")
const GRADIENT_TO_OPTIONS = generateTwColorClasses("to")

const GRADIENT_DIRECTION_OPTIONS = [
  "bg-gradient-to-t", "bg-gradient-to-tr", "bg-gradient-to-r", "bg-gradient-to-br",
  "bg-gradient-to-b", "bg-gradient-to-bl", "bg-gradient-to-l", "bg-gradient-to-tl",
]

const OPACITY_OPTIONS = [
  "opacity-0", "opacity-5", "opacity-10", "opacity-15", "opacity-20", "opacity-25",
  "opacity-30", "opacity-35", "opacity-40", "opacity-45", "opacity-50", "opacity-55",
  "opacity-60", "opacity-65", "opacity-70", "opacity-75", "opacity-80", "opacity-85",
  "opacity-90", "opacity-95", "opacity-100",
]

/** Swatch CSS colour mapping — maps Tailwind shade to actual hex for display */
const TW_SWATCH_COLORS: Record<string, Record<string, string>> = {
  slate: { "50": "#f8fafc", "100": "#f1f5f9", "200": "#e2e8f0", "300": "#cbd5e1", "400": "#94a3b8", "500": "#64748b", "600": "#475569", "700": "#334155", "800": "#1e293b", "900": "#0f172a", "950": "#020617" },
  gray: { "50": "#f9fafb", "100": "#f3f4f6", "200": "#e5e7eb", "300": "#d1d5db", "400": "#9ca3af", "500": "#6b7280", "600": "#4b5563", "700": "#374151", "800": "#1f2937", "900": "#111827", "950": "#030712" },
  zinc: { "50": "#fafafa", "100": "#f4f4f5", "200": "#e4e4e7", "300": "#d4d4d8", "400": "#a1a1aa", "500": "#71717a", "600": "#52525b", "700": "#3f3f46", "800": "#27272a", "900": "#18181b", "950": "#09090b" },
  neutral: { "50": "#fafafa", "100": "#f5f5f5", "200": "#e5e5e5", "300": "#d4d4d4", "400": "#a3a3a3", "500": "#737373", "600": "#525252", "700": "#404040", "800": "#262626", "900": "#171717", "950": "#0a0a0a" },
  stone: { "50": "#fafaf9", "100": "#f5f5f4", "200": "#e7e5e4", "300": "#d6d3d1", "400": "#a8a29e", "500": "#78716c", "600": "#57534e", "700": "#44403c", "800": "#292524", "900": "#1c1917", "950": "#0c0a09" },
  red: { "50": "#fef2f2", "100": "#fee2e2", "200": "#fecaca", "300": "#fca5a5", "400": "#f87171", "500": "#ef4444", "600": "#dc2626", "700": "#b91c1c", "800": "#991b1b", "900": "#7f1d1d", "950": "#450a0a" },
  orange: { "50": "#fff7ed", "100": "#ffedd5", "200": "#fed7aa", "300": "#fdba74", "400": "#fb923c", "500": "#f97316", "600": "#ea580c", "700": "#c2410c", "800": "#9a3412", "900": "#7c2d12", "950": "#431407" },
  amber: { "50": "#fffbeb", "100": "#fef3c7", "200": "#fde68a", "300": "#fcd34d", "400": "#fbbf24", "500": "#f59e0b", "600": "#d97706", "700": "#b45309", "800": "#92400e", "900": "#78350f", "950": "#451a03" },
  yellow: { "50": "#fefce8", "100": "#fef9c3", "200": "#fef08a", "300": "#fde047", "400": "#facc15", "500": "#eab308", "600": "#ca8a04", "700": "#a16207", "800": "#854d0e", "900": "#713f12", "950": "#422006" },
  lime: { "50": "#f7fee7", "100": "#ecfccb", "200": "#d9f99d", "300": "#bef264", "400": "#a3e635", "500": "#84cc16", "600": "#65a30d", "700": "#4d7c0f", "800": "#3f6212", "900": "#365314", "950": "#1a2e05" },
  green: { "50": "#f0fdf4", "100": "#dcfce7", "200": "#bbf7d0", "300": "#86efac", "400": "#4ade80", "500": "#22c55e", "600": "#16a34a", "700": "#15803d", "800": "#166534", "900": "#14532d", "950": "#052e16" },
  emerald: { "50": "#ecfdf5", "100": "#d1fae5", "200": "#a7f3d0", "300": "#6ee7b7", "400": "#34d399", "500": "#10b981", "600": "#059669", "700": "#047857", "800": "#065f46", "900": "#064e3b", "950": "#022c22" },
  teal: { "50": "#f0fdfa", "100": "#ccfbf1", "200": "#99f6e4", "300": "#5eead4", "400": "#2dd4bf", "500": "#14b8a6", "600": "#0d9488", "700": "#0f766e", "800": "#115e59", "900": "#134e4a", "950": "#042f2e" },
  cyan: { "50": "#ecfeff", "100": "#cffafe", "200": "#a5f3fc", "300": "#67e8f9", "400": "#22d3ee", "500": "#06b6d4", "600": "#0891b2", "700": "#0e7490", "800": "#155e75", "900": "#164e63", "950": "#083344" },
  sky: { "50": "#f0f9ff", "100": "#e0f2fe", "200": "#bae6fd", "300": "#7dd3fc", "400": "#38bdf8", "500": "#0ea5e9", "600": "#0284c7", "700": "#0369a1", "800": "#075985", "900": "#0c4a6e", "950": "#082f49" },
  blue: { "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe", "300": "#93c5fd", "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8", "800": "#1e40af", "900": "#1e3a8a", "950": "#172554" },
  indigo: { "50": "#eef2ff", "100": "#e0e7ff", "200": "#c7d2fe", "300": "#a5b4fc", "400": "#818cf8", "500": "#6366f1", "600": "#4f46e5", "700": "#4338ca", "800": "#3730a3", "900": "#312e81", "950": "#1e1b4b" },
  violet: { "50": "#f5f3ff", "100": "#ede9fe", "200": "#ddd6fe", "300": "#c4b5fd", "400": "#a78bfa", "500": "#8b5cf6", "600": "#7c3aed", "700": "#6d28d9", "800": "#5b21b6", "900": "#4c1d95", "950": "#2e1065" },
  purple: { "50": "#faf5ff", "100": "#f3e8ff", "200": "#e9d5ff", "300": "#d8b4fe", "400": "#c084fc", "500": "#a855f7", "600": "#9333ea", "700": "#7e22ce", "800": "#6b21a8", "900": "#581c87", "950": "#3b0764" },
  fuchsia: { "50": "#fdf4ff", "100": "#fae8ff", "200": "#f5d0fe", "300": "#f0abfc", "400": "#e879f9", "500": "#d946ef", "600": "#c026d3", "700": "#a21caf", "800": "#86198f", "900": "#701a75", "950": "#4a044e" },
  pink: { "50": "#fdf2f8", "100": "#fce7f3", "200": "#fbcfe8", "300": "#f9a8d4", "400": "#f472b6", "500": "#ec4899", "600": "#db2777", "700": "#be185d", "800": "#9d174d", "900": "#831843", "950": "#500724" },
  rose: { "50": "#fff1f2", "100": "#ffe4e6", "200": "#fecdd3", "300": "#fda4af", "400": "#fb7185", "500": "#f43f5e", "600": "#e11d48", "700": "#be123c", "800": "#9f1239", "900": "#881337", "950": "#4c0519" },
}

/** Parse a Tailwind colour class like "text-blue-500" into { color, shade } */
function parseTwColorClass(cls: string, prefix: string): { color: string; shade: string } | null {
  const withoutPrefix = cls.startsWith(`${prefix}-`) ? cls.slice(prefix.length + 1) : null
  if (!withoutPrefix) return null
  const lastDash = withoutPrefix.lastIndexOf("-")
  if (lastDash === -1) return null
  const color = withoutPrefix.slice(0, lastDash)
  const shade = withoutPrefix.slice(lastDash + 1)
  if (TW_SWATCH_COLORS[color]?.[shade]) return { color, shade }
  return null
}

/** Get hex colour for a Tailwind class */
function getSwatchHex(cls: string, prefix: string): string | null {
  if (cls === `${prefix}-black`) return "#000000"
  if (cls === `${prefix}-white`) return "#ffffff"
  if (cls === `${prefix}-transparent`) return null
  if (cls === `${prefix}-current`) return null
  if (cls === `${prefix}-inherit`) return null
  const parsed = parseTwColorClass(cls, prefix)
  if (!parsed) return null
  return TW_SWATCH_COLORS[parsed.color]?.[parsed.shade] ?? null
}

const BORDER_RADIUS_OPTIONS = [
  "rounded-none",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-full",
]
const BORDER_WIDTH_OPTIONS = ["border-0", "border", "border-2", "border-4", "border-8"]
const BORDER_WIDTH_T_OPTIONS = ["border-t-0", "border-t", "border-t-2", "border-t-4", "border-t-8"]
const BORDER_WIDTH_R_OPTIONS = ["border-r-0", "border-r", "border-r-2", "border-r-4", "border-r-8"]
const BORDER_WIDTH_B_OPTIONS = ["border-b-0", "border-b", "border-b-2", "border-b-4", "border-b-8"]
const BORDER_WIDTH_L_OPTIONS = ["border-l-0", "border-l", "border-l-2", "border-l-4", "border-l-8"]
const BORDER_STYLE_OPTIONS = ["border-solid", "border-dashed", "border-dotted", "border-double", "border-hidden", "border-none"]
const BORDER_RADIUS_TL_OPTIONS = ["rounded-tl-none", "rounded-tl-sm", "rounded-tl-md", "rounded-tl-lg", "rounded-tl-xl", "rounded-tl-2xl", "rounded-tl-full"]
const BORDER_RADIUS_TR_OPTIONS = ["rounded-tr-none", "rounded-tr-sm", "rounded-tr-md", "rounded-tr-lg", "rounded-tr-xl", "rounded-tr-2xl", "rounded-tr-full"]
const BORDER_RADIUS_BR_OPTIONS = ["rounded-br-none", "rounded-br-sm", "rounded-br-md", "rounded-br-lg", "rounded-br-xl", "rounded-br-2xl", "rounded-br-full"]
const BORDER_RADIUS_BL_OPTIONS = ["rounded-bl-none", "rounded-bl-sm", "rounded-bl-md", "rounded-bl-lg", "rounded-bl-xl", "rounded-bl-2xl", "rounded-bl-full"]
const RING_WIDTH_OPTIONS = ["ring-0", "ring-1", "ring-2", "ring-4", "ring-8", "ring"]
const RING_OFFSET_WIDTH_OPTIONS = ["ring-offset-0", "ring-offset-1", "ring-offset-2", "ring-offset-4", "ring-offset-8"]
const OUTLINE_WIDTH_OPTIONS = ["outline-0", "outline-1", "outline-2", "outline-4", "outline-8"]
const OUTLINE_STYLE_OPTIONS = ["outline-none", "outline", "outline-dashed", "outline-dotted", "outline-double"]
const OUTLINE_OFFSET_OPTIONS = ["outline-offset-0", "outline-offset-1", "outline-offset-2", "outline-offset-4", "outline-offset-8"]
const DIVIDE_X_OPTIONS = ["divide-x-0", "divide-x", "divide-x-2", "divide-x-4", "divide-x-8"]
const DIVIDE_Y_OPTIONS = ["divide-y-0", "divide-y", "divide-y-2", "divide-y-4", "divide-y-8"]
const DIVIDE_STYLE_OPTIONS = ["divide-solid", "divide-dashed", "divide-dotted", "divide-double", "divide-none"]
const DIVIDE_REVERSE_OPTIONS = ["divide-x-reverse", "divide-y-reverse"]

const SHADOW_OPTIONS = [
  "shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-inner",
]
const MIX_BLEND_OPTIONS = [
  "mix-blend-normal", "mix-blend-multiply", "mix-blend-screen", "mix-blend-overlay",
  "mix-blend-darken", "mix-blend-lighten", "mix-blend-color-dodge", "mix-blend-color-burn",
  "mix-blend-hard-light", "mix-blend-soft-light", "mix-blend-difference", "mix-blend-exclusion",
  "mix-blend-hue", "mix-blend-saturation", "mix-blend-color", "mix-blend-luminosity",
  "mix-blend-plus-darker", "mix-blend-plus-lighter",
]
const BG_BLEND_OPTIONS = [
  "bg-blend-normal", "bg-blend-multiply", "bg-blend-screen", "bg-blend-overlay",
  "bg-blend-darken", "bg-blend-lighten", "bg-blend-color-dodge", "bg-blend-color-burn",
  "bg-blend-hard-light", "bg-blend-soft-light", "bg-blend-difference", "bg-blend-exclusion",
  "bg-blend-hue", "bg-blend-saturation", "bg-blend-color", "bg-blend-luminosity",
]

// Filters
const BLUR_OPTIONS = ["blur-none", "blur-sm", "blur", "blur-md", "blur-lg", "blur-xl", "blur-2xl", "blur-3xl"]
const BRIGHTNESS_OPTIONS = ["brightness-0", "brightness-50", "brightness-75", "brightness-90", "brightness-95", "brightness-100", "brightness-105", "brightness-110", "brightness-125", "brightness-150", "brightness-200"]
const CONTRAST_OPTIONS = ["contrast-0", "contrast-50", "contrast-75", "contrast-100", "contrast-125", "contrast-150", "contrast-200"]
const GRAYSCALE_OPTIONS = ["grayscale-0", "grayscale"]
const HUE_ROTATE_OPTIONS = ["hue-rotate-0", "hue-rotate-15", "hue-rotate-30", "hue-rotate-60", "hue-rotate-90", "hue-rotate-180"]
const INVERT_OPTIONS = ["invert-0", "invert"]
const SATURATE_OPTIONS = ["saturate-0", "saturate-50", "saturate-100", "saturate-150", "saturate-200"]
const SEPIA_OPTIONS = ["sepia-0", "sepia"]
const DROP_SHADOW_OPTIONS = ["drop-shadow-none", "drop-shadow-sm", "drop-shadow", "drop-shadow-md", "drop-shadow-lg", "drop-shadow-xl", "drop-shadow-2xl"]

// Backdrop filters
const BACKDROP_BLUR_OPTIONS = ["backdrop-blur-none", "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl", "backdrop-blur-2xl", "backdrop-blur-3xl"]
const BACKDROP_BRIGHTNESS_OPTIONS = ["backdrop-brightness-0", "backdrop-brightness-50", "backdrop-brightness-75", "backdrop-brightness-90", "backdrop-brightness-95", "backdrop-brightness-100", "backdrop-brightness-105", "backdrop-brightness-110", "backdrop-brightness-125", "backdrop-brightness-150", "backdrop-brightness-200"]
const BACKDROP_CONTRAST_OPTIONS = ["backdrop-contrast-0", "backdrop-contrast-50", "backdrop-contrast-75", "backdrop-contrast-100", "backdrop-contrast-125", "backdrop-contrast-150", "backdrop-contrast-200"]
const BACKDROP_GRAYSCALE_OPTIONS = ["backdrop-grayscale-0", "backdrop-grayscale"]
const BACKDROP_HUE_ROTATE_OPTIONS = ["backdrop-hue-rotate-0", "backdrop-hue-rotate-15", "backdrop-hue-rotate-30", "backdrop-hue-rotate-60", "backdrop-hue-rotate-90", "backdrop-hue-rotate-180"]
const BACKDROP_INVERT_OPTIONS = ["backdrop-invert-0", "backdrop-invert"]
const BACKDROP_OPACITY_OPTIONS = ["backdrop-opacity-0", "backdrop-opacity-5", "backdrop-opacity-10", "backdrop-opacity-20", "backdrop-opacity-25", "backdrop-opacity-30", "backdrop-opacity-40", "backdrop-opacity-50", "backdrop-opacity-60", "backdrop-opacity-70", "backdrop-opacity-75", "backdrop-opacity-80", "backdrop-opacity-90", "backdrop-opacity-95", "backdrop-opacity-100"]
const BACKDROP_SATURATE_OPTIONS = ["backdrop-saturate-0", "backdrop-saturate-50", "backdrop-saturate-100", "backdrop-saturate-150", "backdrop-saturate-200"]
const BACKDROP_SEPIA_OPTIONS = ["backdrop-sepia-0", "backdrop-sepia"]

// Transitions & Animation
const TRANSITION_PROPERTY_OPTIONS = ["transition-none", "transition-all", "transition", "transition-colors", "transition-opacity", "transition-shadow", "transition-transform"]
const TRANSITION_DURATION_OPTIONS = ["duration-0", "duration-75", "duration-100", "duration-150", "duration-200", "duration-300", "duration-500", "duration-700", "duration-1000"]
const TRANSITION_TIMING_OPTIONS = ["ease-linear", "ease-in", "ease-out", "ease-in-out"]
const TRANSITION_DELAY_OPTIONS = ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-300", "delay-500", "delay-700", "delay-1000"]
const ANIMATION_OPTIONS = ["animate-none", "animate-spin", "animate-ping", "animate-pulse", "animate-bounce"]

// Transforms
const SCALE_OPTIONS = ["scale-0", "scale-50", "scale-75", "scale-90", "scale-95", "scale-100", "scale-105", "scale-110", "scale-125", "scale-150"]
const SCALE_X_OPTIONS = ["scale-x-0", "scale-x-50", "scale-x-75", "scale-x-90", "scale-x-95", "scale-x-100", "scale-x-105", "scale-x-110", "scale-x-125", "scale-x-150"]
const SCALE_Y_OPTIONS = ["scale-y-0", "scale-y-50", "scale-y-75", "scale-y-90", "scale-y-95", "scale-y-100", "scale-y-105", "scale-y-110", "scale-y-125", "scale-y-150"]
const ROTATE_OPTIONS = ["rotate-0", "rotate-1", "rotate-2", "rotate-3", "rotate-6", "rotate-12", "rotate-45", "rotate-90", "rotate-180"]
const TRANSLATE_X_OPTIONS = [
  "translate-x-0", "translate-x-px", "translate-x-0.5", "translate-x-1", "translate-x-1.5", "translate-x-2", "translate-x-2.5", "translate-x-3", "translate-x-3.5", "translate-x-4",
  "translate-x-5", "translate-x-6", "translate-x-7", "translate-x-8", "translate-x-9", "translate-x-10", "translate-x-11", "translate-x-12",
  "translate-x-14", "translate-x-16", "translate-x-20", "translate-x-24", "translate-x-28", "translate-x-32", "translate-x-36", "translate-x-40", "translate-x-44", "translate-x-48",
  "translate-x-52", "translate-x-56", "translate-x-60", "translate-x-64", "translate-x-72", "translate-x-80", "translate-x-96",
  "translate-x-1/2", "translate-x-1/3", "translate-x-2/3", "translate-x-1/4", "translate-x-3/4", "translate-x-full",
  "-translate-x-0", "-translate-x-px", "-translate-x-0.5", "-translate-x-1", "-translate-x-1.5", "-translate-x-2", "-translate-x-2.5", "-translate-x-3", "-translate-x-3.5", "-translate-x-4",
  "-translate-x-5", "-translate-x-6", "-translate-x-7", "-translate-x-8", "-translate-x-9", "-translate-x-10", "-translate-x-11", "-translate-x-12",
  "-translate-x-14", "-translate-x-16", "-translate-x-20", "-translate-x-24", "-translate-x-28", "-translate-x-32", "-translate-x-36", "-translate-x-40", "-translate-x-44", "-translate-x-48",
  "-translate-x-52", "-translate-x-56", "-translate-x-60", "-translate-x-64", "-translate-x-72", "-translate-x-80", "-translate-x-96",
  "-translate-x-1/2", "-translate-x-1/3", "-translate-x-2/3", "-translate-x-1/4", "-translate-x-3/4", "-translate-x-full",
]
const TRANSLATE_Y_OPTIONS = [
  "translate-y-0", "translate-y-px", "translate-y-0.5", "translate-y-1", "translate-y-1.5", "translate-y-2", "translate-y-2.5", "translate-y-3", "translate-y-3.5", "translate-y-4",
  "translate-y-5", "translate-y-6", "translate-y-7", "translate-y-8", "translate-y-9", "translate-y-10", "translate-y-11", "translate-y-12",
  "translate-y-14", "translate-y-16", "translate-y-20", "translate-y-24", "translate-y-28", "translate-y-32", "translate-y-36", "translate-y-40", "translate-y-44", "translate-y-48",
  "translate-y-52", "translate-y-56", "translate-y-60", "translate-y-64", "translate-y-72", "translate-y-80", "translate-y-96",
  "translate-y-1/2", "translate-y-1/3", "translate-y-2/3", "translate-y-1/4", "translate-y-3/4", "translate-y-full",
  "-translate-y-0", "-translate-y-px", "-translate-y-0.5", "-translate-y-1", "-translate-y-1.5", "-translate-y-2", "-translate-y-2.5", "-translate-y-3", "-translate-y-3.5", "-translate-y-4",
  "-translate-y-5", "-translate-y-6", "-translate-y-7", "-translate-y-8", "-translate-y-9", "-translate-y-10", "-translate-y-11", "-translate-y-12",
  "-translate-y-14", "-translate-y-16", "-translate-y-20", "-translate-y-24", "-translate-y-28", "-translate-y-32", "-translate-y-36", "-translate-y-40", "-translate-y-44", "-translate-y-48",
  "-translate-y-52", "-translate-y-56", "-translate-y-60", "-translate-y-64", "-translate-y-72", "-translate-y-80", "-translate-y-96",
  "-translate-y-1/2", "-translate-y-1/3", "-translate-y-2/3", "-translate-y-1/4", "-translate-y-3/4", "-translate-y-full",
]
const SKEW_X_OPTIONS = ["skew-x-0", "skew-x-1", "skew-x-2", "skew-x-3", "skew-x-6", "skew-x-12", "-skew-x-1", "-skew-x-2", "-skew-x-3", "-skew-x-6", "-skew-x-12"]
const SKEW_Y_OPTIONS = ["skew-y-0", "skew-y-1", "skew-y-2", "skew-y-3", "skew-y-6", "skew-y-12", "-skew-y-1", "-skew-y-2", "-skew-y-3", "-skew-y-6", "-skew-y-12"]
const TRANSFORM_ORIGIN_OPTIONS = [
  "origin-center", "origin-top", "origin-top-right", "origin-right", "origin-bottom-right",
  "origin-bottom", "origin-bottom-left", "origin-left", "origin-top-left",
]

/* ── Pixel value mapping for spacing labels ──────────────────────── */

const SPACING_PX: Record<string, string> = {
  "0": "0px",
  "px": "1px",
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

/** Known colour suffixes — shadcn tokens, Tailwind specials, and palette colours */
const COLOR_SUFFIXES = new Set([
  "inherit", "current", "transparent", "black", "white",
  // shadcn tokens
  "foreground", "primary", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "accent", "accent-foreground",
  "destructive", "destructive-foreground", "background",
  "card", "card-foreground", "popover", "popover-foreground",
  "border", "input", "ring",
  "primary-foreground",
])

/** Check if a class suffix is a valid Tailwind colour (token, special, or palette shade) */
function isColorSuffix(suffix: string): boolean {
  if (COLOR_SUFFIXES.has(suffix)) return true
  // Check for palette: {color}-{shade}
  const lastDash = suffix.lastIndexOf("-")
  if (lastDash === -1) return false
  const color = suffix.slice(0, lastDash)
  const shade = suffix.slice(lastDash + 1)
  return !!TW_SWATCH_COLORS[color]?.[shade]
}

/** Find a colour class by prefix — matches prefix-based (e.g. any "text-" colour class) */
function findPrefixColorMatch(classes: string[], prefix: string): string {
  return classes.find((c) => {
    if (!c.startsWith(`${prefix}-`)) return false
    const suffix = c.slice(prefix.length + 1)
    return isColorSuffix(suffix)
  }) ?? ""
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
    spaceXReverse: findMatch(classes, [SPACE_X_REVERSE]),
    spaceYReverse: findMatch(classes, [SPACE_Y_REVERSE]),
    padding: findMatch(classes, PADDING_SCALE),
    paddingX: findMatch(classes, PADDING_X_SCALE),
    paddingY: findMatch(classes, PADDING_Y_SCALE),
    paddingTop: findMatch(classes, [...PADDING_SIDES.paddingTop]),
    paddingRight: findMatch(classes, [...PADDING_SIDES.paddingRight]),
    paddingBottom: findMatch(classes, [...PADDING_SIDES.paddingBottom]),
    paddingLeft: findMatch(classes, [...PADDING_SIDES.paddingLeft]),
    margin: findMatch(classes, MARGIN_SCALE),
    marginX: findMatch(classes, MARGIN_X_SCALE),
    marginY: findMatch(classes, MARGIN_Y_SCALE),
    marginTop: findMatch(classes, [...MARGIN_SIDES.marginTop]),
    marginRight: findMatch(classes, [...MARGIN_SIDES.marginRight]),
    marginBottom: findMatch(classes, [...MARGIN_SIDES.marginBottom]),
    marginLeft: findMatch(classes, [...MARGIN_SIDES.marginLeft]),
    fontSize: findMatch(classes, FONT_SIZE_OPTIONS),
    fontWeight: findMatch(classes, FONT_WEIGHT_OPTIONS),
    fontFamily: findMatch(classes, FONT_FAMILY_OPTIONS),
    fontStyle: findMatch(classes, FONT_STYLE_OPTIONS),
    textAlign: findMatch(classes, TEXT_ALIGN_OPTIONS),
    textDecoration: findMatch(classes, TEXT_DECORATION_OPTIONS),
    textDecorationStyle: findMatch(classes, TEXT_DECORATION_STYLE_OPTIONS),
    textDecorationThickness: findMatch(classes, TEXT_DECORATION_THICKNESS_OPTIONS),
    textUnderlineOffset: findMatch(classes, TEXT_UNDERLINE_OFFSET_OPTIONS),
    textTransform: findMatch(classes, TEXT_TRANSFORM_OPTIONS),
    textOverflow: findMatch(classes, TEXT_OVERFLOW_OPTIONS),
    textWrap: findMatch(classes, TEXT_WRAP_OPTIONS),
    textIndent: findMatch(classes, TEXT_INDENT_OPTIONS),
    lineHeight: findMatch(classes, LINE_HEIGHT_OPTIONS),
    letterSpacing: findMatch(classes, LETTER_SPACING_OPTIONS),
    wordBreak: findMatch(classes, WORD_BREAK_OPTIONS),
    whitespace: findMatch(classes, WHITESPACE_OPTIONS),
    hyphens: findMatch(classes, HYPHENS_OPTIONS),
    lineClamp: findMatch(classes, LINE_CLAMP_OPTIONS),
    verticalAlign: findMatch(classes, VERTICAL_ALIGN_OPTIONS),
    listStyleType: findMatch(classes, LIST_STYLE_TYPE_OPTIONS),
    listStylePosition: findMatch(classes, LIST_STYLE_POSITION_OPTIONS),
    fontVariantNumeric: findMatch(classes, FONT_VARIANT_NUMERIC_OPTIONS),
    textColor: findPrefixColorMatch(classes, "text"),
    bgColor: findPrefixColorMatch(classes, "bg"),
    borderColor: findPrefixColorMatch(classes, "border"),
    ringColor: findPrefixColorMatch(classes, "ring"),
    ringOffsetColor: findPrefixColorMatch(classes, "ring-offset"),
    outlineColor: findPrefixColorMatch(classes, "outline"),
    opacity: findMatch(classes, OPACITY_OPTIONS),
    gradientDirection: findMatch(classes, GRADIENT_DIRECTION_OPTIONS),
    gradientFrom: findPrefixColorMatch(classes, "from"),
    gradientVia: findPrefixColorMatch(classes, "via"),
    gradientTo: findPrefixColorMatch(classes, "to"),
    borderRadius: findMatch(classes, BORDER_RADIUS_OPTIONS),
    borderRadiusTL: findMatch(classes, BORDER_RADIUS_TL_OPTIONS),
    borderRadiusTR: findMatch(classes, BORDER_RADIUS_TR_OPTIONS),
    borderRadiusBR: findMatch(classes, BORDER_RADIUS_BR_OPTIONS),
    borderRadiusBL: findMatch(classes, BORDER_RADIUS_BL_OPTIONS),
    borderWidth: findMatch(classes, BORDER_WIDTH_OPTIONS),
    borderWidthT: findMatch(classes, BORDER_WIDTH_T_OPTIONS),
    borderWidthR: findMatch(classes, BORDER_WIDTH_R_OPTIONS),
    borderWidthB: findMatch(classes, BORDER_WIDTH_B_OPTIONS),
    borderWidthL: findMatch(classes, BORDER_WIDTH_L_OPTIONS),
    borderStyle: findMatch(classes, BORDER_STYLE_OPTIONS),
    ringWidth: findMatch(classes, RING_WIDTH_OPTIONS),
    ringOffsetWidth: findMatch(classes, RING_OFFSET_WIDTH_OPTIONS),
    outlineWidth: findMatch(classes, OUTLINE_WIDTH_OPTIONS),
    outlineStyle: findMatch(classes, OUTLINE_STYLE_OPTIONS),
    outlineOffset: findMatch(classes, OUTLINE_OFFSET_OPTIONS),
    divideX: findMatch(classes, DIVIDE_X_OPTIONS),
    divideY: findMatch(classes, DIVIDE_Y_OPTIONS),
    divideStyle: findMatch(classes, DIVIDE_STYLE_OPTIONS),
    divideReverse: findMatch(classes, DIVIDE_REVERSE_OPTIONS),
    shadow: findMatch(classes, SHADOW_OPTIONS),
    shadowColor: findPrefixColorMatch(classes, "shadow"),
    mixBlend: findMatch(classes, MIX_BLEND_OPTIONS),
    bgBlend: findMatch(classes, BG_BLEND_OPTIONS),
    blur: findMatch(classes, BLUR_OPTIONS),
    brightness: findMatch(classes, BRIGHTNESS_OPTIONS),
    contrast: findMatch(classes, CONTRAST_OPTIONS),
    grayscale: findMatch(classes, GRAYSCALE_OPTIONS),
    hueRotate: findMatch(classes, HUE_ROTATE_OPTIONS),
    invert: findMatch(classes, INVERT_OPTIONS),
    saturate: findMatch(classes, SATURATE_OPTIONS),
    sepia: findMatch(classes, SEPIA_OPTIONS),
    dropShadow: findMatch(classes, DROP_SHADOW_OPTIONS),
    backdropBlur: findMatch(classes, BACKDROP_BLUR_OPTIONS),
    backdropBrightness: findMatch(classes, BACKDROP_BRIGHTNESS_OPTIONS),
    backdropContrast: findMatch(classes, BACKDROP_CONTRAST_OPTIONS),
    backdropGrayscale: findMatch(classes, BACKDROP_GRAYSCALE_OPTIONS),
    backdropHueRotate: findMatch(classes, BACKDROP_HUE_ROTATE_OPTIONS),
    backdropInvert: findMatch(classes, BACKDROP_INVERT_OPTIONS),
    backdropOpacity: findMatch(classes, BACKDROP_OPACITY_OPTIONS),
    backdropSaturate: findMatch(classes, BACKDROP_SATURATE_OPTIONS),
    backdropSepia: findMatch(classes, BACKDROP_SEPIA_OPTIONS),
    transitionProperty: findMatch(classes, TRANSITION_PROPERTY_OPTIONS),
    transitionDuration: findMatch(classes, TRANSITION_DURATION_OPTIONS),
    transitionTiming: findMatch(classes, TRANSITION_TIMING_OPTIONS),
    transitionDelay: findMatch(classes, TRANSITION_DELAY_OPTIONS),
    animation: findMatch(classes, ANIMATION_OPTIONS),
    scale: findMatch(classes, SCALE_OPTIONS),
    scaleX: findMatch(classes, SCALE_X_OPTIONS),
    scaleY: findMatch(classes, SCALE_Y_OPTIONS),
    rotate: findMatch(classes, ROTATE_OPTIONS),
    translateX: findMatch(classes, TRANSLATE_X_OPTIONS),
    translateY: findMatch(classes, TRANSLATE_Y_OPTIONS),
    skewX: findMatch(classes, SKEW_X_OPTIONS),
    skewY: findMatch(classes, SKEW_Y_OPTIONS),
    transformOrigin: findMatch(classes, TRANSFORM_ORIGIN_OPTIONS),
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
  SPACE_X_REVERSE,
  SPACE_Y_REVERSE,
  ...WIDTH_OPTIONS,
  ...HEIGHT_OPTIONS,
  ...MIN_WIDTH_OPTIONS,
  ...MAX_WIDTH_OPTIONS,
  ...MIN_HEIGHT_OPTIONS,
  ...MAX_HEIGHT_OPTIONS,
  ...SIZE_OPTIONS,
  ...PADDING_SCALE,
  ...PADDING_X_SCALE,
  ...PADDING_Y_SCALE,
  ...Object.values(PADDING_SIDES).flat(),
  ...MARGIN_SCALE,
  ...MARGIN_X_SCALE,
  ...MARGIN_Y_SCALE,
  ...Object.values(MARGIN_SIDES).flat(),
  ...FONT_SIZE_OPTIONS,
  ...FONT_WEIGHT_OPTIONS,
  ...FONT_FAMILY_OPTIONS,
  ...FONT_STYLE_OPTIONS,
  ...TEXT_ALIGN_OPTIONS,
  ...TEXT_DECORATION_OPTIONS,
  ...TEXT_DECORATION_STYLE_OPTIONS,
  ...TEXT_DECORATION_THICKNESS_OPTIONS,
  ...TEXT_UNDERLINE_OFFSET_OPTIONS,
  ...TEXT_TRANSFORM_OPTIONS,
  ...TEXT_OVERFLOW_OPTIONS,
  ...TEXT_WRAP_OPTIONS,
  ...TEXT_INDENT_OPTIONS,
  ...LINE_HEIGHT_OPTIONS,
  ...LETTER_SPACING_OPTIONS,
  ...WORD_BREAK_OPTIONS,
  ...WHITESPACE_OPTIONS,
  ...HYPHENS_OPTIONS,
  ...LINE_CLAMP_OPTIONS,
  ...VERTICAL_ALIGN_OPTIONS,
  ...LIST_STYLE_TYPE_OPTIONS,
  ...LIST_STYLE_POSITION_OPTIONS,
  ...FONT_VARIANT_NUMERIC_OPTIONS,
  ...TEXT_COLOR_OPTIONS,
  ...BG_COLOR_OPTIONS,
  ...BORDER_COLOR_OPTIONS,
  ...RING_COLOR_OPTIONS,
  ...RING_OFFSET_COLOR_OPTIONS,
  ...OUTLINE_COLOR_OPTIONS,
  ...OPACITY_OPTIONS,
  ...GRADIENT_DIRECTION_OPTIONS,
  ...GRADIENT_FROM_OPTIONS,
  ...GRADIENT_VIA_OPTIONS,
  ...GRADIENT_TO_OPTIONS,
  ...BORDER_RADIUS_OPTIONS,
  ...BORDER_RADIUS_TL_OPTIONS,
  ...BORDER_RADIUS_TR_OPTIONS,
  ...BORDER_RADIUS_BR_OPTIONS,
  ...BORDER_RADIUS_BL_OPTIONS,
  ...BORDER_WIDTH_OPTIONS,
  ...BORDER_WIDTH_T_OPTIONS,
  ...BORDER_WIDTH_R_OPTIONS,
  ...BORDER_WIDTH_B_OPTIONS,
  ...BORDER_WIDTH_L_OPTIONS,
  ...BORDER_STYLE_OPTIONS,
  ...RING_WIDTH_OPTIONS,
  ...RING_OFFSET_WIDTH_OPTIONS,
  ...OUTLINE_WIDTH_OPTIONS,
  ...OUTLINE_STYLE_OPTIONS,
  ...OUTLINE_OFFSET_OPTIONS,
  ...DIVIDE_X_OPTIONS,
  ...DIVIDE_Y_OPTIONS,
  ...DIVIDE_STYLE_OPTIONS,
  ...DIVIDE_REVERSE_OPTIONS,
  ...SHADOW_OPTIONS,
  ...MIX_BLEND_OPTIONS,
  ...BG_BLEND_OPTIONS,
  ...BLUR_OPTIONS,
  ...BRIGHTNESS_OPTIONS,
  ...CONTRAST_OPTIONS,
  ...GRAYSCALE_OPTIONS,
  ...HUE_ROTATE_OPTIONS,
  ...INVERT_OPTIONS,
  ...SATURATE_OPTIONS,
  ...SEPIA_OPTIONS,
  ...DROP_SHADOW_OPTIONS,
  ...BACKDROP_BLUR_OPTIONS,
  ...BACKDROP_BRIGHTNESS_OPTIONS,
  ...BACKDROP_CONTRAST_OPTIONS,
  ...BACKDROP_GRAYSCALE_OPTIONS,
  ...BACKDROP_HUE_ROTATE_OPTIONS,
  ...BACKDROP_INVERT_OPTIONS,
  ...BACKDROP_OPACITY_OPTIONS,
  ...BACKDROP_SATURATE_OPTIONS,
  ...BACKDROP_SEPIA_OPTIONS,
  ...TRANSITION_PROPERTY_OPTIONS,
  ...TRANSITION_DURATION_OPTIONS,
  ...TRANSITION_TIMING_OPTIONS,
  ...TRANSITION_DELAY_OPTIONS,
  ...ANIMATION_OPTIONS,
  ...SCALE_OPTIONS,
  ...SCALE_X_OPTIONS,
  ...SCALE_Y_OPTIONS,
  ...ROTATE_OPTIONS,
  ...TRANSLATE_X_OPTIONS,
  ...TRANSLATE_Y_OPTIONS,
  ...SKEW_X_OPTIONS,
  ...SKEW_Y_OPTIONS,
  ...TRANSFORM_ORIGIN_OPTIONS,
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
  push(state.spaceXReverse)
  push(state.spaceYReverse)
  push(state.width)
  push(state.height)
  push(state.minWidth)
  push(state.maxWidth)
  push(state.minHeight)
  push(state.maxHeight)
  push(state.size)
  push(state.padding)
  push(state.paddingX)
  push(state.paddingY)
  push(state.paddingTop)
  push(state.paddingRight)
  push(state.paddingBottom)
  push(state.paddingLeft)
  push(state.margin)
  push(state.marginX)
  push(state.marginY)
  push(state.marginTop)
  push(state.marginRight)
  push(state.marginBottom)
  push(state.marginLeft)
  push(state.fontSize)
  push(state.fontWeight)
  push(state.fontFamily)
  push(state.fontStyle)
  push(state.textAlign)
  push(state.textDecoration)
  push(state.textDecorationStyle)
  push(state.textDecorationThickness)
  push(state.textUnderlineOffset)
  push(state.textTransform)
  push(state.textOverflow)
  push(state.textWrap)
  push(state.textIndent)
  push(state.lineHeight)
  push(state.letterSpacing)
  push(state.wordBreak)
  push(state.whitespace)
  push(state.hyphens)
  push(state.lineClamp)
  push(state.verticalAlign)
  push(state.listStyleType)
  push(state.listStylePosition)
  push(state.fontVariantNumeric)
  push(state.textColor)
  push(state.bgColor)
  push(state.borderColor)
  push(state.ringColor)
  push(state.ringOffsetColor)
  push(state.outlineColor)
  push(state.opacity)
  push(state.gradientDirection)
  push(state.gradientFrom)
  push(state.gradientVia)
  push(state.gradientTo)
  push(state.borderRadius)
  push(state.borderRadiusTL)
  push(state.borderRadiusTR)
  push(state.borderRadiusBR)
  push(state.borderRadiusBL)
  push(state.borderWidth)
  push(state.borderWidthT)
  push(state.borderWidthR)
  push(state.borderWidthB)
  push(state.borderWidthL)
  push(state.borderStyle)
  push(state.ringWidth)
  push(state.ringOffsetWidth)
  push(state.outlineWidth)
  push(state.outlineStyle)
  push(state.outlineOffset)
  push(state.divideX)
  push(state.divideY)
  push(state.divideStyle)
  push(state.divideReverse)
  push(state.shadow)
  push(state.shadowColor)
  push(state.mixBlend)
  push(state.bgBlend)
  push(state.blur)
  push(state.brightness)
  push(state.contrast)
  push(state.grayscale)
  push(state.hueRotate)
  push(state.invert)
  push(state.saturate)
  push(state.sepia)
  push(state.dropShadow)
  push(state.backdropBlur)
  push(state.backdropBrightness)
  push(state.backdropContrast)
  push(state.backdropGrayscale)
  push(state.backdropHueRotate)
  push(state.backdropInvert)
  push(state.backdropOpacity)
  push(state.backdropSaturate)
  push(state.backdropSepia)
  push(state.transitionProperty)
  push(state.transitionDuration)
  push(state.transitionTiming)
  push(state.transitionDelay)
  push(state.animation)
  push(state.scale)
  push(state.scaleX)
  push(state.scaleY)
  push(state.rotate)
  push(state.translateX)
  push(state.translateY)
  push(state.skewX)
  push(state.skewY)
  push(state.transformOrigin)

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
  "px-", "py-", "mx-", "my-",
  "font-", "leading-", "tracking-", "indent-", "decoration-", "underline-offset-",
  "line-clamp-", "align-", "list-", "whitespace-", "hyphens-",
  "-m-", "-mt-", "-mr-", "-mb-", "-ml-", "-mx-", "-my-",
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
  "ring-offset-",
  "opacity-",
  "bg-gradient-to-",
  "from-", "via-", "to-",
  "rounded-tl-", "rounded-tr-", "rounded-br-", "rounded-bl-",
  "border-t-", "border-r-", "border-b-", "border-l-",
  "ring-",
  "outline-offset-",
  "divide-x-", "divide-y-",
  "shadow-",
  "mix-blend-", "bg-blend-",
  "blur-", "brightness-", "contrast-", "grayscale-", "hue-rotate-", "invert-", "saturate-", "sepia-",
  "drop-shadow-",
  "backdrop-blur-", "backdrop-brightness-", "backdrop-contrast-", "backdrop-grayscale-",
  "backdrop-hue-rotate-", "backdrop-invert-", "backdrop-opacity-", "backdrop-saturate-", "backdrop-sepia-",
  "duration-", "delay-", "ease-",
  "animate-",
  "scale-", "scale-x-", "scale-y-",
  "rotate-",
  "translate-x-", "translate-y-",
  "-translate-x-", "-translate-y-",
  "skew-x-", "skew-y-",
  "-skew-x-", "-skew-y-",
  "origin-",
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
  defaultOpen = false,
  hasValues,
  onClear,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  /** Whether any values are set in this section (shows indicator dot) */
  hasValues?: boolean
  /** Called when the user clicks "Clear" — clears all values in this section */
  onClear?: () => void
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
        {hasValues && (
          <span className="size-1.5 rounded-full bg-blue-500" />
        )}
        {open && onClear && hasValues && (
          <span
            role="button"
            tabIndex={0}
            className="rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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

const SPACING_VALUES = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const

const NEGATIVE_SPACING_VALUES = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const

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
    <div className="flex items-center gap-1">
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
      <div className="flex items-center gap-1">
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

/* ── Colour picker ────────────────────────────────────────────────── */

/** shadcn semantic token swatch map — maps token class to its CSS bg class for display */
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
    <ControlRow label={label}>
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
                  <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Special</p>
                  <div className="flex flex-wrap gap-1">
                    {["inherit", "current", "transparent"].map((s) => {
                      const cls = `${prefix}-${s}`
                      return (
                        <Badge
                          key={s}
                          variant={value === cls ? "default" : "outline"}
                          className="cursor-pointer text-[10px]"
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
                    <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">shadcn tokens</p>
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
                    <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Black & White</p>
                    <div className="flex gap-1">
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
                    <p className="mb-1 text-[10px] font-medium capitalize text-muted-foreground">{colorName}</p>
                    <div className="flex gap-0.5">
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
  subComponentNames,
}: {
  contexts: string[]
  onContextsChange: (ctxs: string[]) => void
  variants?: Array<{ name: string; options: string[] }>
  props?: Array<{ name: string; type: string }>
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>
  subComponentNames?: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const groups = React.useMemo(() => buildContextGroups(variants, props, parentVariants, subComponentNames), [variants, props, parentVariants, subComponentNames])

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
    // Data attributes with values — mutually exclusive within same key
    // e.g. data-[state=open] and data-[state=closed] can't coexist
    else if (value.match(/^data-\[(\w+)=\w+\]$/)) {
      const key = value.match(/^data-\[(\w+)=/)?.[1]
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = key
          ? contexts.filter((c) => !c.startsWith(`data-[${key}=`))
          : contexts
        onContextsChange([...filtered, value])
      }
    }
    // States, dark, group-*, peer-*, aria-*, has-*, data-[attr] (no value) are stackable
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
                    const isDataAttrWithValue = !!opt.value.match(/^data-\[\w+=\w+\]$/)
                    const isRadio = isVariant || isBreakpoint || isDataAttrWithValue
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
  subComponentNames,
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

  // Section key groups for hasValues / clear
  const SECTION_KEYS: Record<string, (keyof ControlState)[]> = React.useMemo(() => ({
    layout: [
      "display", "direction", "justify", "align", "gap", "gapX", "gapY",
      "flexWrap", "alignContent", "gridCols", "gridRows", "gridFlow", "autoRows", "autoCols",
      "justifyItems", "justifySelf", "colSpan", "rowSpan", "colStart", "colEnd", "rowStart", "rowEnd",
      "flexShorthand", "flexGrow", "flexShrink", "flexBasis", "alignSelf", "order",
      "position", "overflow", "zIndex", "inset", "insetX", "insetY", "top", "right", "bottom", "left",
      "visibility", "aspectRatio", "float", "clear", "isolation", "objectFit", "objectPosition",
      "spaceY", "spaceX", "spaceXReverse", "spaceYReverse",
      "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "size",
    ],
    spacing: [
      "padding", "paddingX", "paddingY", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "margin", "marginX", "marginY", "marginTop", "marginRight", "marginBottom", "marginLeft",
    ],
    typography: [
      "fontSize", "fontWeight", "fontFamily", "fontStyle", "textAlign",
      "textDecoration", "textDecorationStyle", "textDecorationThickness", "textUnderlineOffset",
      "textTransform", "textOverflow", "textWrap", "textIndent",
      "lineHeight", "letterSpacing", "wordBreak", "whitespace", "hyphens", "lineClamp",
      "verticalAlign", "listStyleType", "listStylePosition", "fontVariantNumeric",
    ],
    colours: [
      "textColor", "bgColor", "borderColor", "ringColor", "ringOffsetColor", "outlineColor",
      "opacity", "gradientDirection", "gradientFrom", "gradientVia", "gradientTo",
    ],
    borders: [
      "borderRadius", "borderRadiusTL", "borderRadiusTR", "borderRadiusBR", "borderRadiusBL",
      "borderWidth", "borderWidthT", "borderWidthR", "borderWidthB", "borderWidthL", "borderStyle",
      "ringWidth", "ringOffsetWidth", "outlineWidth", "outlineStyle", "outlineOffset",
      "divideX", "divideY", "divideStyle", "divideReverse",
    ],
    effects: ["shadow", "shadowColor", "mixBlend", "bgBlend"],
    filters: [
      "blur", "brightness", "contrast", "grayscale", "hueRotate", "invert", "saturate", "sepia", "dropShadow",
      "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale",
      "backdropHueRotate", "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia",
    ],
    motion: [
      "transitionProperty", "transitionDuration", "transitionTiming", "transitionDelay", "animation",
      "scale", "scaleX", "scaleY", "rotate", "translateX", "translateY", "skewX", "skewY", "transformOrigin",
    ],
  }), [])

  const sectionHasValues = React.useCallback(
    (section: string) => SECTION_KEYS[section]?.some((k) => !!state[k]) ?? false,
    [state, SECTION_KEYS],
  )

  const clearSection = React.useCallback(
    (section: string) => {
      isUserChange.current = true
      setState((prev) => {
        const next = { ...prev }
        for (const k of SECTION_KEYS[section] ?? []) {
          next[k] = ""
        }
        return next
      })
    },
    [SECTION_KEYS],
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
        <ContextPicker contexts={contexts} onContextsChange={setContexts} variants={variants} props={props} parentVariants={parentVariants} subComponentNames={subComponentNames} />
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
          <ControlSection icon={Layout} title="Layout" defaultOpen hasValues={sectionHasValues("layout")} onClear={() => clearSection("layout")}>
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
          <ControlSection icon={Box} title="Spacing" hasValues={sectionHasValues("spacing")} onClear={() => clearSection("spacing")}>
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
                    {/* Padding axes */}
                    <div className="mt-1 flex gap-2 pl-6">
                      <SpacingValueInput prefix="px" value={state.paddingX} onChange={(v) => update("paddingX", v)} />
                      <SpacingValueInput prefix="py" value={state.paddingY} onChange={(v) => update("paddingY", v)} />
                    </div>
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
                      allowNegative
                      allowAuto
                    />
                    {/* Margin axes */}
                    <div className="mt-1 flex gap-2 pl-6">
                      <SpacingValueInput prefix="mx" value={state.marginX} onChange={(v) => update("marginX", v)} allowNegative allowAuto />
                      <SpacingValueInput prefix="my" value={state.marginY} onChange={(v) => update("marginY", v)} allowNegative allowAuto />
                    </div>
                  </ControlRow>

                  {/* Space between — conditional on display/direction */}
                  {isFlexRow && (
                    <ControlRow label="Space-X">
                      <div className="flex items-center gap-2">
                        <Select value={state.spaceX ? state.spaceX.replace("space-x-", "") : "__none__"} onValueChange={(v) => update("spaceX", v === "__none__" ? "" : `space-x-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <TextToggle value="space-x-reverse" label="rev" tooltip="space-x-reverse" isActive={!!state.spaceXReverse} onClick={() => update("spaceXReverse", state.spaceXReverse ? "" : "space-x-reverse")} />
                      </div>
                    </ControlRow>
                  )}
                  {(isBlockDisplay || isFlexCol) && (
                    <ControlRow label="Space-Y">
                      <div className="flex items-center gap-2">
                        <Select value={state.spaceY ? state.spaceY.replace("space-y-", "") : "__none__"} onValueChange={(v) => update("spaceY", v === "__none__" ? "" : `space-y-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <TextToggle value="space-y-reverse" label="rev" tooltip="space-y-reverse" isActive={!!state.spaceYReverse} onClick={() => update("spaceYReverse", state.spaceYReverse ? "" : "space-y-reverse")} />
                      </div>
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
          <ControlSection icon={Type} title="Typography" hasValues={sectionHasValues("typography")} onClear={() => clearSection("typography")}>
            <ControlRow label="Family">
              <div className="flex gap-0.5">
                {FONT_FAMILY_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("font-", "")} tooltip={opt} isActive={state.fontFamily === opt} onClick={(v) => update("fontFamily", state.fontFamily === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Size">
              <Select value={state.fontSize || "__none__"} onValueChange={(v) => update("fontSize", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("text-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Weight">
              <Select value={state.fontWeight || "__none__"} onValueChange={(v) => update("fontWeight", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("font-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Style">
              <div className="flex gap-0.5">
                {FONT_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt} tooltip={opt} isActive={state.fontStyle === opt} onClick={(v) => update("fontStyle", state.fontStyle === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Align">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle value="text-left" icon={AlignLeft} tooltip="text-left" isActive={state.textAlign === "text-left"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-center" icon={AlignCenter} tooltip="text-center" isActive={state.textAlign === "text-center"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-right" icon={AlignRight} tooltip="text-right" isActive={state.textAlign === "text-right"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                {["text-justify", "text-start", "text-end"].map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textAlign === opt} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Decoration">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_DECORATION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("no-", "none").replace("line-through", "strike")} tooltip={opt} isActive={state.textDecoration === opt} onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            {state.textDecoration && state.textDecoration !== "no-underline" && (
              <>
                <ControlRow label="Dec. style">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_STYLE_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationStyle === opt} onClick={(v) => update("textDecorationStyle", state.textDecorationStyle === v ? "" : v)} />
                    ))}
                  </div>
                </ControlRow>
                <ControlRow label="Dec. thick">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_THICKNESS_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationThickness === opt} onClick={(v) => update("textDecorationThickness", state.textDecorationThickness === v ? "" : v)} />
                    ))}
                  </div>
                </ControlRow>
                <ControlRow label="Underline offset">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_UNDERLINE_OFFSET_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("underline-offset-", "")} tooltip={opt} isActive={state.textUnderlineOffset === opt} onClick={(v) => update("textUnderlineOffset", state.textUnderlineOffset === v ? "" : v)} />
                    ))}
                  </div>
                </ControlRow>
              </>
            )}

            <ControlRow label="Transform">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_TRANSFORM_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("normal-case", "none")} tooltip={opt} isActive={state.textTransform === opt} onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Line height">
              <Select value={state.lineHeight || "__none__"} onValueChange={(v) => update("lineHeight", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {LINE_HEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("leading-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Letter space">
              <div className="flex flex-wrap gap-0.5">
                {LETTER_SPACING_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("tracking-", "")} tooltip={opt} isActive={state.letterSpacing === opt} onClick={(v) => update("letterSpacing", state.letterSpacing === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Overflow">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_OVERFLOW_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textOverflow === opt} onClick={(v) => update("textOverflow", state.textOverflow === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Wrap">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_WRAP_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textWrap === opt} onClick={(v) => update("textWrap", state.textWrap === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Whitespace">
              <Select value={state.whitespace || "__none__"} onValueChange={(v) => update("whitespace", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {WHITESPACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("whitespace-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Word break">
              <div className="flex flex-wrap gap-0.5">
                {WORD_BREAK_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("break-", "")} tooltip={opt} isActive={state.wordBreak === opt} onClick={(v) => update("wordBreak", state.wordBreak === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Hyphens">
              <div className="flex flex-wrap gap-0.5">
                {HYPHENS_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("hyphens-", "")} tooltip={opt} isActive={state.hyphens === opt} onClick={(v) => update("hyphens", state.hyphens === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Line clamp">
              <div className="flex flex-wrap gap-0.5">
                {LINE_CLAMP_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("line-clamp-", "")} tooltip={opt} isActive={state.lineClamp === opt} onClick={(v) => update("lineClamp", state.lineClamp === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Indent">
              <Select value={state.textIndent || "__none__"} onValueChange={(v) => update("textIndent", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {TEXT_INDENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("indent-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="V-align">
              <Select value={state.verticalAlign || "__none__"} onValueChange={(v) => update("verticalAlign", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {VERTICAL_ALIGN_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("align-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="List type">
              <div className="flex flex-wrap gap-0.5">
                {LIST_STYLE_TYPE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("list-", "")} tooltip={opt} isActive={state.listStyleType === opt} onClick={(v) => update("listStyleType", state.listStyleType === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="List pos">
              <div className="flex gap-0.5">
                {LIST_STYLE_POSITION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("list-", "")} tooltip={opt} isActive={state.listStylePosition === opt} onClick={(v) => update("listStylePosition", state.listStylePosition === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <ControlRow label="Num variant">
              <Select value={state.fontVariantNumeric || "__none__"} onValueChange={(v) => update("fontVariantNumeric", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-32 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_VARIANT_NUMERIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
          </ControlSection>

          {/* ── Colours ──────────────────────────────────── */}
          <ControlSection icon={Palette} title="Colours" hasValues={sectionHasValues("colours")} onClear={() => clearSection("colours")}>
            <ColorPicker
              label="Text"
              prefix="text"
              shadcnTokens={SHADCN_TEXT_TOKENS}
              value={state.textColor}
              onChange={(v) => update("textColor", v)}
            />
            <ColorPicker
              label="Background"
              prefix="bg"
              shadcnTokens={SHADCN_BG_TOKENS}
              value={state.bgColor}
              onChange={(v) => update("bgColor", v)}
            />
            <ColorPicker
              label="Border"
              prefix="border"
              shadcnTokens={SHADCN_BORDER_TOKENS}
              value={state.borderColor}
              onChange={(v) => update("borderColor", v)}
            />
            <ColorPicker
              label="Ring"
              prefix="ring"
              shadcnTokens={SHADCN_RING_TOKENS}
              value={state.ringColor}
              onChange={(v) => update("ringColor", v)}
            />
            <ColorPicker
              label="Ring offset"
              prefix="ring-offset"
              value={state.ringOffsetColor}
              onChange={(v) => update("ringOffsetColor", v)}
            />
            <ColorPicker
              label="Outline"
              prefix="outline"
              value={state.outlineColor}
              onChange={(v) => update("outlineColor", v)}
            />

            <Separator className="my-1" />

            {/* Opacity */}
            <ControlRow label="Opacity">
              <div className="space-y-1.5">
                <Slider
                  value={[state.opacity ? parseInt(state.opacity.replace("opacity-", ""), 10) : 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) =>
                    update("opacity", v === 100 ? "" : `opacity-${v}`)
                  }
                />
                <div className="text-center text-[10px] text-muted-foreground">
                  {state.opacity ? state.opacity.replace("opacity-", "") + "%" : "100%"}
                </div>
              </div>
            </ControlRow>

            <Separator className="my-1" />

            {/* Gradient */}
            <ControlRow label="Gradient dir.">
              <div className="flex flex-wrap gap-0.5">
                {[
                  { value: "bg-gradient-to-t", label: "↑" },
                  { value: "bg-gradient-to-tr", label: "↗" },
                  { value: "bg-gradient-to-r", label: "→" },
                  { value: "bg-gradient-to-br", label: "↘" },
                  { value: "bg-gradient-to-b", label: "↓" },
                  { value: "bg-gradient-to-bl", label: "↙" },
                  { value: "bg-gradient-to-l", label: "←" },
                  { value: "bg-gradient-to-tl", label: "↖" },
                ].map((opt) => (
                  <TextToggle
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    tooltip={opt.value}
                    isActive={state.gradientDirection === opt.value}
                    onClick={(v) => update("gradientDirection", v)}
                  />
                ))}
              </div>
            </ControlRow>
            <ColorPicker
              label="From"
              prefix="from"
              value={state.gradientFrom}
              onChange={(v) => update("gradientFrom", v)}
            />
            <ColorPicker
              label="Via"
              prefix="via"
              value={state.gradientVia}
              onChange={(v) => update("gradientVia", v)}
            />
            <ColorPicker
              label="To"
              prefix="to"
              value={state.gradientTo}
              onChange={(v) => update("gradientTo", v)}
            />
          </ControlSection>

          {/* ── Borders ──────────────────────────────────── */}
          <ControlSection icon={Square} title="Borders" hasValues={sectionHasValues("borders")} onClear={() => clearSection("borders")}>
            {/* Radius — all */}
            <ControlRow label="Radius">
              <Select value={state.borderRadius || "__none__"} onValueChange={(v) => update("borderRadius", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 flex-1 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {RADIUS_VALUES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label} ({r.px})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            {/* Per-corner radius */}
            {[
              { label: "TL", key: "borderRadiusTL" as const, options: BORDER_RADIUS_TL_OPTIONS },
              { label: "TR", key: "borderRadiusTR" as const, options: BORDER_RADIUS_TR_OPTIONS },
              { label: "BR", key: "borderRadiusBR" as const, options: BORDER_RADIUS_BR_OPTIONS },
              { label: "BL", key: "borderRadiusBL" as const, options: BORDER_RADIUS_BL_OPTIONS },
            ].map((corner) => (
              <ControlRow key={corner.label} label={`Radius ${corner.label}`}>
                <div className="flex flex-wrap gap-0.5">
                  {corner.options.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.split("-").pop()!} tooltip={opt} isActive={state[corner.key] === opt} onClick={(v) => update(corner.key, state[corner.key] === v ? "" : v)} />
                  ))}
                </div>
              </ControlRow>
            ))}

            <Separator className="my-1" />

            {/* Border width — all */}
            <ControlRow label="Width">
              <div className="flex flex-wrap gap-0.5">
                {BORDER_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "border" ? "1" : opt.replace("border-", "")} tooltip={opt} isActive={state.borderWidth === opt} onClick={(v) => update("borderWidth", state.borderWidth === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            {/* Per-side border width */}
            {[
              { label: "Width T", key: "borderWidthT" as const, options: BORDER_WIDTH_T_OPTIONS, prefix: "border-t-" },
              { label: "Width R", key: "borderWidthR" as const, options: BORDER_WIDTH_R_OPTIONS, prefix: "border-r-" },
              { label: "Width B", key: "borderWidthB" as const, options: BORDER_WIDTH_B_OPTIONS, prefix: "border-b-" },
              { label: "Width L", key: "borderWidthL" as const, options: BORDER_WIDTH_L_OPTIONS, prefix: "border-l-" },
            ].map((side) => (
              <ControlRow key={side.label} label={side.label}>
                <div className="flex flex-wrap gap-0.5">
                  {side.options.map((opt) => {
                    const short = opt === `border-${side.label.split(" ")[1]?.toLowerCase()}` ? "1" : opt.replace(side.prefix, "").replace(/^border-[trbl]$/, "1")
                    return <TextToggle key={opt} value={opt} label={short} tooltip={opt} isActive={state[side.key] === opt} onClick={(v) => update(side.key, state[side.key] === v ? "" : v)} />
                  })}
                </div>
              </ControlRow>
            ))}

            {/* Border style */}
            <ControlRow label="Style">
              <div className="flex flex-wrap gap-0.5">
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("border-", "")} tooltip={opt} isActive={state.borderStyle === opt} onClick={(v) => update("borderStyle", state.borderStyle === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <Separator className="my-1" />

            {/* Ring */}
            <ControlRow label="Ring">
              <div className="flex flex-wrap gap-0.5">
                {RING_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "ring" ? "3" : opt.replace("ring-", "")} tooltip={opt} isActive={state.ringWidth === opt} onClick={(v) => update("ringWidth", state.ringWidth === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Ring offset">
              <div className="flex flex-wrap gap-0.5">
                {RING_OFFSET_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("ring-offset-", "")} tooltip={opt} isActive={state.ringOffsetWidth === opt} onClick={(v) => update("ringOffsetWidth", state.ringOffsetWidth === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <Separator className="my-1" />

            {/* Outline */}
            <ControlRow label="Outline W">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("outline-", "")} tooltip={opt} isActive={state.outlineWidth === opt} onClick={(v) => update("outlineWidth", state.outlineWidth === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Outline style">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "outline" ? "solid" : opt.replace("outline-", "")} tooltip={opt} isActive={state.outlineStyle === opt} onClick={(v) => update("outlineStyle", state.outlineStyle === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Outline offset">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_OFFSET_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("outline-offset-", "")} tooltip={opt} isActive={state.outlineOffset === opt} onClick={(v) => update("outlineOffset", state.outlineOffset === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <Separator className="my-1" />

            {/* Divide */}
            <ControlRow label="Divide X">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_X_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "divide-x" ? "1" : opt.replace("divide-x-", "")} tooltip={opt} isActive={state.divideX === opt} onClick={(v) => update("divideX", state.divideX === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Divide Y">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_Y_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "divide-y" ? "1" : opt.replace("divide-y-", "")} tooltip={opt} isActive={state.divideY === opt} onClick={(v) => update("divideY", state.divideY === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Divide style">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("divide-", "")} tooltip={opt} isActive={state.divideStyle === opt} onClick={(v) => update("divideStyle", state.divideStyle === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Divide rev.">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_REVERSE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("divide-", "")} tooltip={opt} isActive={state.divideReverse === opt} onClick={(v) => update("divideReverse", state.divideReverse === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
          </ControlSection>

          {/* ── Effects ──────────────────────────────────── */}
          <ControlSection icon={Sparkles} title="Effects" hasValues={sectionHasValues("effects")} onClear={() => clearSection("effects")}>
            <ControlRow label="Shadow">
              <div className="flex flex-wrap gap-0.5">
                {SHADOW_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "shadow" ? "base" : opt.replace("shadow-", "")} tooltip={opt} isActive={state.shadow === opt} onClick={(v) => update("shadow", state.shadow === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ColorPicker
              label="Shadow colour"
              prefix="shadow"
              value={state.shadowColor}
              onChange={(v) => update("shadowColor", v)}
            />

            <Separator className="my-1" />

            <ControlRow label="Mix blend">
              <Select value={state.mixBlend || "__none__"} onValueChange={(v) => update("mixBlend", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {MIX_BLEND_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("mix-blend-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="BG blend">
              <Select value={state.bgBlend || "__none__"} onValueChange={(v) => update("bgBlend", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BG_BLEND_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("bg-blend-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
          </ControlSection>

          {/* ── Filters ──────────────────────────────────── */}
          <ControlSection icon={SlidersHorizontal} title="Filters" hasValues={sectionHasValues("filters")} onClear={() => clearSection("filters")}>
            <ControlRow label="Blur">
              <div className="flex flex-wrap gap-0.5">
                {BLUR_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "blur" ? "base" : opt.replace("blur-", "")} tooltip={opt} isActive={state.blur === opt} onClick={(v) => update("blur", state.blur === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Brightness">
              <Select value={state.brightness || "__none__"} onValueChange={(v) => update("brightness", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BRIGHTNESS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("brightness-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Contrast">
              <Select value={state.contrast || "__none__"} onValueChange={(v) => update("contrast", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {CONTRAST_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("contrast-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Grayscale">
              <div className="flex flex-wrap gap-0.5">
                {GRAYSCALE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "grayscale" ? "on" : "off"} tooltip={opt} isActive={state.grayscale === opt} onClick={(v) => update("grayscale", state.grayscale === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Hue rotate">
              <div className="flex flex-wrap gap-0.5">
                {HUE_ROTATE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("hue-rotate-", "") + "°"} tooltip={opt} isActive={state.hueRotate === opt} onClick={(v) => update("hueRotate", state.hueRotate === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Invert">
              <div className="flex flex-wrap gap-0.5">
                {INVERT_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "invert" ? "on" : "off"} tooltip={opt} isActive={state.invert === opt} onClick={(v) => update("invert", state.invert === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Saturate">
              <Select value={state.saturate || "__none__"} onValueChange={(v) => update("saturate", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {SATURATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("saturate-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Sepia">
              <div className="flex flex-wrap gap-0.5">
                {SEPIA_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "sepia" ? "on" : "off"} tooltip={opt} isActive={state.sepia === opt} onClick={(v) => update("sepia", state.sepia === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Drop shadow">
              <div className="flex flex-wrap gap-0.5">
                {DROP_SHADOW_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "drop-shadow" ? "base" : opt.replace("drop-shadow-", "")} tooltip={opt} isActive={state.dropShadow === opt} onClick={(v) => update("dropShadow", state.dropShadow === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            <Separator className="my-1" />
            <p className="px-1 text-[10px] font-medium uppercase text-muted-foreground">Backdrop</p>

            <ControlRow label="Blur">
              <div className="flex flex-wrap gap-0.5">
                {BACKDROP_BLUR_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "backdrop-blur" ? "base" : opt.replace("backdrop-blur-", "")} tooltip={opt} isActive={state.backdropBlur === opt} onClick={(v) => update("backdropBlur", state.backdropBlur === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Brightness">
              <Select value={state.backdropBrightness || "__none__"} onValueChange={(v) => update("backdropBrightness", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BACKDROP_BRIGHTNESS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("backdrop-brightness-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Contrast">
              <Select value={state.backdropContrast || "__none__"} onValueChange={(v) => update("backdropContrast", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BACKDROP_CONTRAST_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("backdrop-contrast-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Grayscale">
              <div className="flex flex-wrap gap-0.5">
                {BACKDROP_GRAYSCALE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "backdrop-grayscale" ? "on" : "off"} tooltip={opt} isActive={state.backdropGrayscale === opt} onClick={(v) => update("backdropGrayscale", state.backdropGrayscale === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Hue rotate">
              <div className="flex flex-wrap gap-0.5">
                {BACKDROP_HUE_ROTATE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("backdrop-hue-rotate-", "") + "°"} tooltip={opt} isActive={state.backdropHueRotate === opt} onClick={(v) => update("backdropHueRotate", state.backdropHueRotate === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Invert">
              <div className="flex flex-wrap gap-0.5">
                {BACKDROP_INVERT_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "backdrop-invert" ? "on" : "off"} tooltip={opt} isActive={state.backdropInvert === opt} onClick={(v) => update("backdropInvert", state.backdropInvert === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Opacity">
              <Select value={state.backdropOpacity || "__none__"} onValueChange={(v) => update("backdropOpacity", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BACKDROP_OPACITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("backdrop-opacity-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Saturate">
              <Select value={state.backdropSaturate || "__none__"} onValueChange={(v) => update("backdropSaturate", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {BACKDROP_SATURATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("backdrop-saturate-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>
            <ControlRow label="Sepia">
              <div className="flex flex-wrap gap-0.5">
                {BACKDROP_SEPIA_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "backdrop-sepia" ? "on" : "off"} tooltip={opt} isActive={state.backdropSepia === opt} onClick={(v) => update("backdropSepia", state.backdropSepia === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
          </ControlSection>

          {/* ── Transitions & Animation ──────────────────── */}
          <ControlSection icon={Move} title="Motion" hasValues={sectionHasValues("motion")} onClear={() => clearSection("motion")}>
            <ControlRow label="Transition">
              <div className="flex flex-wrap gap-0.5">
                {TRANSITION_PROPERTY_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "transition" ? "default" : opt.replace("transition-", "")} tooltip={opt} isActive={state.transitionProperty === opt} onClick={(v) => update("transitionProperty", state.transitionProperty === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Duration">
              <div className="flex flex-wrap gap-0.5">
                {TRANSITION_DURATION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("duration-", "")} tooltip={opt} isActive={state.transitionDuration === opt} onClick={(v) => update("transitionDuration", state.transitionDuration === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Easing">
              <div className="flex flex-wrap gap-0.5">
                {TRANSITION_TIMING_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("ease-", "")} tooltip={opt} isActive={state.transitionTiming === opt} onClick={(v) => update("transitionTiming", state.transitionTiming === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>
            <ControlRow label="Delay">
              <div className="flex flex-wrap gap-0.5">
                {TRANSITION_DELAY_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("delay-", "")} tooltip={opt} isActive={state.transitionDelay === opt} onClick={(v) => update("transitionDelay", state.transitionDelay === v ? "" : v)} />
                ))}
              </div>
            </ControlRow>

            {/* Animation & Transforms are mutually exclusive */}
            <ControlRow label="Animation">
              {(state.scale || state.scaleX || state.scaleY || state.rotate || state.translateX || state.translateY || state.skewX || state.skewY) ? (
                <p className="text-[10px] text-muted-foreground">Disabled — clear transforms first</p>
              ) : (
                <div className="flex flex-wrap gap-0.5">
                  {ANIMATION_OPTIONS.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.replace("animate-", "")} tooltip={opt} isActive={state.animation === opt} onClick={(v) => update("animation", state.animation === v ? "" : v)} />
                  ))}
                </div>
              )}
            </ControlRow>

            <Separator className="my-1" />

            {(state.animation && state.animation !== "animate-none") ? (
              <p className="px-1 text-[10px] text-muted-foreground">Transforms disabled — clear animation first</p>
            ) : (
              <>
              <p className="px-1 text-[10px] font-medium uppercase text-muted-foreground">Transforms</p>
              <ControlRow label="Scale">
                <Select value={state.scale || "__none__"} onValueChange={(v) => update("scale", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {SCALE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("scale-", "")}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Scale X">
                <Select value={state.scaleX || "__none__"} onValueChange={(v) => update("scaleX", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {SCALE_X_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("scale-x-", "")}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Scale Y">
                <Select value={state.scaleY || "__none__"} onValueChange={(v) => update("scaleY", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {SCALE_Y_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("scale-y-", "")}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Rotate">
                <div className="flex flex-wrap gap-0.5">
                  {ROTATE_OPTIONS.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.replace("rotate-", "") + "°"} tooltip={opt} isActive={state.rotate === opt} onClick={(v) => update("rotate", state.rotate === v ? "" : v)} />
                  ))}
                </div>
              </ControlRow>
              <ControlRow label="Translate X">
                <Select value={state.translateX || "__none__"} onValueChange={(v) => update("translateX", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {TRANSLATE_X_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("translate-x-", "").replace("-translate-x-", "-")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Translate Y">
                <Select value={state.translateY || "__none__"} onValueChange={(v) => update("translateY", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {TRANSLATE_Y_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("translate-y-", "").replace("-translate-y-", "-")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              <ControlRow label="Skew X">
                <div className="flex flex-wrap gap-0.5">
                  {SKEW_X_OPTIONS.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.replace("skew-x-", "").replace("-skew-x-", "-") + "°"} tooltip={opt} isActive={state.skewX === opt} onClick={(v) => update("skewX", state.skewX === v ? "" : v)} />
                  ))}
                </div>
              </ControlRow>
              <ControlRow label="Skew Y">
                <div className="flex flex-wrap gap-0.5">
                  {SKEW_Y_OPTIONS.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.replace("skew-y-", "").replace("-skew-y-", "-") + "°"} tooltip={opt} isActive={state.skewY === opt} onClick={(v) => update("skewY", state.skewY === v ? "" : v)} />
                  ))}
                </div>
              </ControlRow>
              <ControlRow label="Origin">
                <Select value={state.transformOrigin || "__none__"} onValueChange={(v) => update("transformOrigin", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">–</SelectItem>
                    {TRANSFORM_ORIGIN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("origin-", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlRow>
              </>
            )}
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
