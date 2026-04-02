/**
 * Tailwind CSS option constants for the visual editor.
 *
 * Extracted from components/playground/visual-editor.tsx to keep the
 * data layer separate from the UI layer.
 */

/* ── Native element defaults ────────────────────────────────────── */

/** Maps HTML elements to their native CSS display value */
export const NATIVE_DISPLAY: Record<string, string> = {
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
export const NATIVE_POSITION: Record<string, string> = {
  // All elements default to static
}

/** Get the native display for an element tag */
export function getNativeDisplay(tag: string): string {
  return NATIVE_DISPLAY[tag] ?? "block"
}

/* ── Class-to-state mapping ──────────────────────────────────────── */

export const DISPLAY_OPTIONS = [
  "block", "inline-block", "inline", "flex", "inline-flex",
  "grid", "inline-grid", "contents", "hidden",
]
export const POSITION_OPTIONS = ["static", "relative", "absolute", "fixed", "sticky"]
export const Z_INDEX_OPTIONS = ["z-0", "z-10", "z-20", "z-30", "z-40", "z-50", "z-auto"]
export const INSET_SCALE = [
  "0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9",
  "10", "11", "12", "14", "16", "20", "24", "28", "32", "36", "40", "44", "48",
  "52", "56", "60", "64", "72", "80", "96", "auto", "1/2", "1/3", "2/3", "1/4", "3/4", "full",
]
export const INSET_OPTIONS = INSET_SCALE.map((v) => `inset-${v}`)
export const INSET_X_OPTIONS = INSET_SCALE.map((v) => `inset-x-${v}`)
export const INSET_Y_OPTIONS = INSET_SCALE.map((v) => `inset-y-${v}`)
export const TOP_OPTIONS = INSET_SCALE.map((v) => `top-${v}`)
export const RIGHT_OPTIONS = INSET_SCALE.map((v) => `right-${v}`)
export const BOTTOM_OPTIONS = INSET_SCALE.map((v) => `bottom-${v}`)
export const LEFT_OPTIONS = INSET_SCALE.map((v) => `left-${v}`)
export const VISIBILITY_OPTIONS = ["visible", "invisible", "collapse"]
export const ASPECT_RATIO_OPTIONS = ["aspect-auto", "aspect-square", "aspect-video"]
export const FLOAT_OPTIONS = ["float-left", "float-right", "float-none"]
export const CLEAR_OPTIONS = ["clear-left", "clear-right", "clear-both", "clear-none"]
export const ISOLATION_OPTIONS = ["isolate", "isolation-auto"]
export const OBJECT_FIT_OPTIONS = ["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"]
export const OBJECT_POSITION_OPTIONS = [
  "object-center", "object-top", "object-right", "object-bottom", "object-left",
  "object-left-top", "object-right-top", "object-left-bottom", "object-right-bottom",
]
export const OVERFLOW_OPTIONS = ["overflow-visible", "overflow-hidden", "overflow-scroll", "overflow-auto"]
export const SPACING_SCALE_FULL = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const
export const SPACE_Y_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-y-${v}`)
export const SPACE_X_OPTIONS = SPACING_SCALE_FULL.map((v) => `space-x-${v}`)
export const SPACE_X_REVERSE = "space-x-reverse"
export const SPACE_Y_REVERSE = "space-y-reverse"

export const WIDTH_OPTIONS = [
  "w-0", "w-0.5", "w-1", "w-1.5", "w-2", "w-2.5", "w-3", "w-3.5", "w-4", "w-5", "w-6", "w-7", "w-8", "w-9",
  "w-10", "w-11", "w-12", "w-14", "w-16", "w-20", "w-24", "w-28", "w-32", "w-36", "w-40", "w-44", "w-48",
  "w-52", "w-56", "w-60", "w-64", "w-72", "w-80", "w-96",
  "w-auto", "w-full", "w-screen", "w-svw", "w-lvw", "w-dvw", "w-min", "w-max", "w-fit",
  "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4", "w-1/5", "w-2/5", "w-3/5", "w-4/5",
]
export const HEIGHT_OPTIONS = [
  "h-0", "h-0.5", "h-1", "h-1.5", "h-2", "h-2.5", "h-3", "h-3.5", "h-4", "h-5", "h-6", "h-7", "h-8", "h-9",
  "h-10", "h-11", "h-12", "h-14", "h-16", "h-20", "h-24", "h-28", "h-32", "h-36", "h-40", "h-44", "h-48",
  "h-52", "h-56", "h-60", "h-64", "h-72", "h-80", "h-96",
  "h-auto", "h-full", "h-screen", "h-svh", "h-lvh", "h-dvh", "h-min", "h-max", "h-fit",
  "h-1/2", "h-1/3", "h-2/3", "h-1/4", "h-3/4", "h-1/5", "h-2/5", "h-3/5", "h-4/5",
]
export const MIN_WIDTH_OPTIONS = ["min-w-0", "min-w-full", "min-w-min", "min-w-max", "min-w-fit"]
export const MAX_WIDTH_OPTIONS = [
  "max-w-none", "max-w-0", "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl",
  "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl", "max-w-7xl",
  "max-w-full", "max-w-min", "max-w-max", "max-w-fit", "max-w-prose", "max-w-screen-sm",
  "max-w-screen-md", "max-w-screen-lg", "max-w-screen-xl", "max-w-screen-2xl",
]
export const MIN_HEIGHT_OPTIONS = ["min-h-0", "min-h-full", "min-h-screen", "min-h-svh", "min-h-lvh", "min-h-dvh", "min-h-min", "min-h-max", "min-h-fit"]
export const MAX_HEIGHT_OPTIONS = [
  "max-h-none", "max-h-0", "max-h-full", "max-h-screen", "max-h-svh", "max-h-lvh", "max-h-dvh", "max-h-min", "max-h-max", "max-h-fit",
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px" && v !== "0.5").map((v) => `max-h-${v}`),
]
export const SIZE_OPTIONS = [
  "size-0", "size-0.5", "size-1", "size-1.5", "size-2", "size-2.5", "size-3", "size-3.5",
  "size-4", "size-5", "size-6", "size-7", "size-8", "size-9", "size-10", "size-11", "size-12",
  "size-14", "size-16", "size-20", "size-24", "size-28", "size-32", "size-36", "size-40",
  "size-auto", "size-full", "size-min", "size-max", "size-fit",
]

export const GRID_COLS_OPTIONS = [
  "grid-cols-none", ...Array.from({ length: 12 }, (_, i) => `grid-cols-${i + 1}`),
  "grid-cols-subgrid",
]
export const GRID_ROWS_OPTIONS = [
  "grid-rows-none", ...Array.from({ length: 12 }, (_, i) => `grid-rows-${i + 1}`),
  "grid-rows-subgrid",
]
export const GRID_FLOW_OPTIONS = ["grid-flow-row", "grid-flow-col", "grid-flow-dense", "grid-flow-row-dense", "grid-flow-col-dense"]
export const COL_SPAN_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `col-span-${i + 1}`),
  "col-span-full",
]
export const ROW_SPAN_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => `row-span-${i + 1}`),
  "row-span-full",
]

export const AUTO_ROWS_OPTIONS = ["auto-rows-auto", "auto-rows-min", "auto-rows-max", "auto-rows-fr"]
export const AUTO_COLS_OPTIONS = ["auto-cols-auto", "auto-cols-min", "auto-cols-max", "auto-cols-fr"]
export const JUSTIFY_ITEMS_OPTIONS = ["justify-items-start", "justify-items-center", "justify-items-end", "justify-items-stretch"]
export const JUSTIFY_SELF_OPTIONS = ["justify-self-auto", "justify-self-start", "justify-self-center", "justify-self-end", "justify-self-stretch"]
export const COL_START_OPTIONS = [...Array.from({ length: 13 }, (_, i) => `col-start-${i + 1}`), "col-start-auto"]
export const COL_END_OPTIONS = [...Array.from({ length: 13 }, (_, i) => `col-end-${i + 1}`), "col-end-auto"]
export const ROW_START_OPTIONS = [...Array.from({ length: 7 }, (_, i) => `row-start-${i + 1}`), "row-start-auto"]
export const ROW_END_OPTIONS = [...Array.from({ length: 7 }, (_, i) => `row-end-${i + 1}`), "row-end-auto"]

export const FLEX_WRAP_OPTIONS = ["flex-wrap", "flex-wrap-reverse", "flex-nowrap"]
export const FLEX_SHORTHAND_OPTIONS = ["flex-1", "flex-auto", "flex-initial", "flex-none"]
export const ALIGN_CONTENT_OPTIONS = [
  "content-start", "content-center", "content-end",
  "content-between", "content-around", "content-evenly", "content-stretch",
]
export const FLEX_GROW_OPTIONS = ["grow", "grow-0"]
export const FLEX_SHRINK_OPTIONS = ["shrink", "shrink-0"]
export const FLEX_BASIS_OPTIONS = [
  "basis-0", "basis-auto", "basis-full",
  "basis-1/2", "basis-1/3", "basis-2/3", "basis-1/4", "basis-3/4",
  "basis-1/5", "basis-2/5", "basis-3/5", "basis-4/5",
  "basis-1/6", "basis-5/6", "basis-1/12",
]
export const ALIGN_SELF_OPTIONS = ["self-auto", "self-start", "self-center", "self-end", "self-stretch", "self-baseline"]
export const ORDER_OPTIONS = [
  "order-first", "order-last", "order-none",
  "order-1", "order-2", "order-3", "order-4", "order-5", "order-6",
  "order-7", "order-8", "order-9", "order-10", "order-11", "order-12",
]
export const GAP_SLIDER_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16]
export const GAP_X_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-x-${v}`)
export const GAP_Y_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-y-${v}`)

export const DIRECTION_OPTIONS = [
  "flex-row",
  "flex-col",
  "flex-row-reverse",
  "flex-col-reverse",
]
export const JUSTIFY_OPTIONS = [
  "justify-start",
  "justify-center",
  "justify-end",
  "justify-between",
  "justify-around",
  "justify-evenly",
]
export const ALIGN_OPTIONS = [
  "items-start",
  "items-center",
  "items-end",
  "items-stretch",
  "items-baseline",
]
export const GAP_OPTIONS = GAP_SLIDER_VALUES.map((v) => `gap-${v}`)

export const PADDING_SCALE = [
  "p-0", "p-px", "p-0.5", "p-1", "p-1.5", "p-2", "p-2.5", "p-3", "p-3.5",
  "p-4", "p-5", "p-6", "p-7", "p-8", "p-9", "p-10", "p-11", "p-12", "p-14", "p-16",
]
export const MARGIN_SCALE = [
  "m-auto",
  "m-0", "m-px", "m-0.5", "m-1", "m-1.5", "m-2", "m-2.5", "m-3", "m-3.5",
  "m-4", "m-5", "m-6", "m-7", "m-8", "m-9", "m-10", "m-11", "m-12", "m-14", "m-16",
  // Negative margins
  "-m-0.5", "-m-1", "-m-1.5", "-m-2", "-m-2.5", "-m-3", "-m-3.5",
  "-m-4", "-m-5", "-m-6", "-m-7", "-m-8", "-m-9", "-m-10", "-m-11", "-m-12", "-m-14", "-m-16",
]

export const PADDING_X_SCALE = SPACING_SCALE_FULL.map((v) => `px-${v}`)
export const PADDING_Y_SCALE = SPACING_SCALE_FULL.map((v) => `py-${v}`)
export const MARGIN_X_SCALE = [
  "mx-auto",
  ...SPACING_SCALE_FULL.map((v) => `mx-${v}`),
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px").map((v) => `-mx-${v}`),
]
export const MARGIN_Y_SCALE = [
  "my-auto",
  ...SPACING_SCALE_FULL.map((v) => `my-${v}`),
  ...SPACING_SCALE_FULL.filter((v) => v !== "0" && v !== "px").map((v) => `-my-${v}`),
]

export const PADDING_SIDES = {
  paddingTop: ["pt-0", "pt-1", "pt-2", "pt-3", "pt-4", "pt-5", "pt-6", "pt-8", "pt-10", "pt-12"],
  paddingRight: ["pr-0", "pr-1", "pr-2", "pr-3", "pr-4", "pr-5", "pr-6", "pr-8", "pr-10", "pr-12"],
  paddingBottom: ["pb-0", "pb-1", "pb-2", "pb-3", "pb-4", "pb-5", "pb-6", "pb-8", "pb-10", "pb-12"],
  paddingLeft: ["pl-0", "pl-1", "pl-2", "pl-3", "pl-4", "pl-5", "pl-6", "pl-8", "pl-10", "pl-12"],
} as const

export const MARGIN_SIDES = {
  marginTop: ["mt-auto", "mt-0", "mt-0.5", "mt-1", "mt-1.5", "mt-2", "mt-2.5", "mt-3", "mt-3.5", "mt-4", "mt-5", "mt-6", "mt-7", "mt-8", "mt-9", "mt-10", "mt-11", "mt-12", "mt-14", "mt-16",
    "-mt-0.5", "-mt-1", "-mt-1.5", "-mt-2", "-mt-2.5", "-mt-3", "-mt-3.5", "-mt-4", "-mt-5", "-mt-6", "-mt-8", "-mt-10", "-mt-12"],
  marginRight: ["mr-auto", "mr-0", "mr-0.5", "mr-1", "mr-1.5", "mr-2", "mr-2.5", "mr-3", "mr-3.5", "mr-4", "mr-5", "mr-6", "mr-7", "mr-8", "mr-9", "mr-10", "mr-11", "mr-12", "mr-14", "mr-16",
    "-mr-0.5", "-mr-1", "-mr-1.5", "-mr-2", "-mr-2.5", "-mr-3", "-mr-3.5", "-mr-4", "-mr-5", "-mr-6", "-mr-8", "-mr-10", "-mr-12"],
  marginBottom: ["mb-auto", "mb-0", "mb-0.5", "mb-1", "mb-1.5", "mb-2", "mb-2.5", "mb-3", "mb-3.5", "mb-4", "mb-5", "mb-6", "mb-7", "mb-8", "mb-9", "mb-10", "mb-11", "mb-12", "mb-14", "mb-16",
    "-mb-0.5", "-mb-1", "-mb-1.5", "-mb-2", "-mb-2.5", "-mb-3", "-mb-3.5", "-mb-4", "-mb-5", "-mb-6", "-mb-8", "-mb-10", "-mb-12"],
  marginLeft: ["ml-auto", "ml-0", "ml-0.5", "ml-1", "ml-1.5", "ml-2", "ml-2.5", "ml-3", "ml-3.5", "ml-4", "ml-5", "ml-6", "ml-7", "ml-8", "ml-9", "ml-10", "ml-11", "ml-12", "ml-14", "ml-16",
    "-ml-0.5", "-ml-1", "-ml-1.5", "-ml-2", "-ml-2.5", "-ml-3", "-ml-3.5", "-ml-4", "-ml-5", "-ml-6", "-ml-8", "-ml-10", "-ml-12"],
} as const

/* ── Typography ──────────────────────────────────────────────────── */

export const FONT_SIZE_OPTIONS = [
  "text-xs", "text-sm", "text-base", "text-lg", "text-xl",
  "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl", "text-8xl", "text-9xl",
]
export const FONT_WEIGHT_OPTIONS = [
  "font-thin", "font-extralight", "font-light", "font-normal", "font-medium",
  "font-semibold", "font-bold", "font-extrabold", "font-black",
]
export const FONT_FAMILY_OPTIONS = ["font-sans", "font-serif", "font-mono"]
export const FONT_STYLE_OPTIONS = ["italic", "not-italic"]
export const TEXT_ALIGN_OPTIONS = ["text-left", "text-center", "text-right", "text-justify", "text-start", "text-end"]
export const TEXT_DECORATION_OPTIONS = ["underline", "overline", "line-through", "no-underline"]
export const TEXT_DECORATION_STYLE_OPTIONS = ["decoration-solid", "decoration-double", "decoration-dotted", "decoration-dashed", "decoration-wavy"]
export const TEXT_DECORATION_THICKNESS_OPTIONS = ["decoration-auto", "decoration-from-font", "decoration-0", "decoration-1", "decoration-2", "decoration-4", "decoration-8"]
export const TEXT_UNDERLINE_OFFSET_OPTIONS = ["underline-offset-auto", "underline-offset-0", "underline-offset-1", "underline-offset-2", "underline-offset-4", "underline-offset-8"]
export const TEXT_TRANSFORM_OPTIONS = ["uppercase", "lowercase", "capitalize", "normal-case"]
export const TEXT_OVERFLOW_OPTIONS = ["truncate", "text-ellipsis", "text-clip"]
export const TEXT_WRAP_OPTIONS = ["text-wrap", "text-nowrap", "text-balance", "text-pretty"]
export const TEXT_INDENT_OPTIONS = [
  "indent-0", "indent-px", "indent-0.5", "indent-1", "indent-1.5", "indent-2", "indent-4", "indent-6", "indent-8", "indent-10", "indent-12", "indent-16", "indent-20",
]
export const LINE_HEIGHT_OPTIONS = [
  "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose",
  "leading-3", "leading-4", "leading-5", "leading-6", "leading-7", "leading-8", "leading-9", "leading-10",
]
export const LETTER_SPACING_OPTIONS = ["tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest"]
export const WORD_BREAK_OPTIONS = ["break-normal", "break-words", "break-all", "break-keep"]
export const WHITESPACE_OPTIONS = ["whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-break-spaces"]
export const HYPHENS_OPTIONS = ["hyphens-none", "hyphens-manual", "hyphens-auto"]
export const LINE_CLAMP_OPTIONS = ["line-clamp-1", "line-clamp-2", "line-clamp-3", "line-clamp-4", "line-clamp-5", "line-clamp-6", "line-clamp-none"]
export const VERTICAL_ALIGN_OPTIONS = ["align-baseline", "align-top", "align-middle", "align-bottom", "align-text-top", "align-text-bottom", "align-sub", "align-super"]
export const LIST_STYLE_TYPE_OPTIONS = ["list-none", "list-disc", "list-decimal"]
export const LIST_STYLE_POSITION_OPTIONS = ["list-inside", "list-outside"]
export const FONT_VARIANT_NUMERIC_OPTIONS = ["normal-nums", "ordinal", "slashed-zero", "lining-nums", "oldstyle-nums", "proportional-nums", "tabular-nums"]

/* ── Full Tailwind colour palette ──────────────────────────────── */

export const TW_COLOR_NAMES = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
  "fuchsia", "pink", "rose",
] as const

export const TW_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const

/** Generate all Tailwind colour classes for a given prefix, e.g. "text", "bg", "border" */
export function generateTwColorClasses(prefix: string): string[] {
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

/** shadcn semantic token options for text colour */
export const SHADCN_TEXT_TOKENS = [
  { label: "Foreground", value: "text-foreground" },
  { label: "Primary", value: "text-primary" },
  { label: "Secondary FG", value: "text-secondary-foreground" },
  { label: "Muted FG", value: "text-muted-foreground" },
  { label: "Destructive", value: "text-destructive" },
  { label: "Accent FG", value: "text-accent-foreground" },
]

export const SHADCN_BG_TOKENS = [
  { label: "Background", value: "bg-background" },
  { label: "Primary", value: "bg-primary" },
  { label: "Secondary", value: "bg-secondary" },
  { label: "Muted", value: "bg-muted" },
  { label: "Accent", value: "bg-accent" },
  { label: "Destructive", value: "bg-destructive" },
  { label: "Card", value: "bg-card" },
  { label: "Popover", value: "bg-popover" },
]

export const SHADCN_BORDER_TOKENS = [
  { label: "Border", value: "border-border" },
  { label: "Input", value: "border-input" },
  { label: "Ring", value: "border-ring" },
  { label: "Primary", value: "border-primary" },
  { label: "Destructive", value: "border-destructive" },
]

export const SHADCN_RING_TOKENS = [
  { label: "Ring", value: "ring-ring" },
  { label: "Primary", value: "ring-primary" },
  { label: "Destructive", value: "ring-destructive" },
]

export const TEXT_COLOR_OPTIONS = [
  ...SHADCN_TEXT_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("text"),
]

export const BG_COLOR_OPTIONS = [
  ...SHADCN_BG_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("bg"),
]

export const BORDER_COLOR_OPTIONS = [
  ...SHADCN_BORDER_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("border"),
]

export const RING_COLOR_OPTIONS = [
  ...SHADCN_RING_TOKENS.map((t) => t.value),
  ...generateTwColorClasses("ring"),
]

export const RING_OFFSET_COLOR_OPTIONS = generateTwColorClasses("ring-offset")

export const OUTLINE_COLOR_OPTIONS = generateTwColorClasses("outline")

export const GRADIENT_FROM_OPTIONS = generateTwColorClasses("from")
export const GRADIENT_VIA_OPTIONS = generateTwColorClasses("via")
export const GRADIENT_TO_OPTIONS = generateTwColorClasses("to")

export const GRADIENT_DIRECTION_OPTIONS = [
  "bg-gradient-to-t", "bg-gradient-to-tr", "bg-gradient-to-r", "bg-gradient-to-br",
  "bg-gradient-to-b", "bg-gradient-to-bl", "bg-gradient-to-l", "bg-gradient-to-tl",
]

export const OPACITY_OPTIONS = [
  "opacity-0", "opacity-5", "opacity-10", "opacity-15", "opacity-20", "opacity-25",
  "opacity-30", "opacity-35", "opacity-40", "opacity-45", "opacity-50", "opacity-55",
  "opacity-60", "opacity-65", "opacity-70", "opacity-75", "opacity-80", "opacity-85",
  "opacity-90", "opacity-95", "opacity-100",
]

/** Swatch CSS colour mapping -- maps Tailwind shade to actual hex for display */
export const TW_SWATCH_COLORS: Record<string, Record<string, string>> = {
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
export function parseTwColorClass(cls: string, prefix: string): { color: string; shade: string } | null {
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
export function getSwatchHex(cls: string, prefix: string): string | null {
  if (cls === `${prefix}-black`) return "#000000"
  if (cls === `${prefix}-white`) return "#ffffff"
  if (cls === `${prefix}-transparent`) return null
  if (cls === `${prefix}-current`) return null
  if (cls === `${prefix}-inherit`) return null
  const parsed = parseTwColorClass(cls, prefix)
  if (!parsed) return null
  return TW_SWATCH_COLORS[parsed.color]?.[parsed.shade] ?? null
}

/* ── Borders ─────────────────────────────────────────────────────── */

export const BORDER_RADIUS_OPTIONS = [
  "rounded-none",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-full",
]
export const BORDER_WIDTH_OPTIONS = ["border-0", "border", "border-2", "border-4", "border-8"]
export const BORDER_WIDTH_T_OPTIONS = ["border-t-0", "border-t", "border-t-2", "border-t-4", "border-t-8"]
export const BORDER_WIDTH_R_OPTIONS = ["border-r-0", "border-r", "border-r-2", "border-r-4", "border-r-8"]
export const BORDER_WIDTH_B_OPTIONS = ["border-b-0", "border-b", "border-b-2", "border-b-4", "border-b-8"]
export const BORDER_WIDTH_L_OPTIONS = ["border-l-0", "border-l", "border-l-2", "border-l-4", "border-l-8"]
export const BORDER_STYLE_OPTIONS = ["border-solid", "border-dashed", "border-dotted", "border-double", "border-hidden", "border-none"]
export const BORDER_RADIUS_TL_OPTIONS = ["rounded-tl-none", "rounded-tl-sm", "rounded-tl-md", "rounded-tl-lg", "rounded-tl-xl", "rounded-tl-2xl", "rounded-tl-full"]
export const BORDER_RADIUS_TR_OPTIONS = ["rounded-tr-none", "rounded-tr-sm", "rounded-tr-md", "rounded-tr-lg", "rounded-tr-xl", "rounded-tr-2xl", "rounded-tr-full"]
export const BORDER_RADIUS_BR_OPTIONS = ["rounded-br-none", "rounded-br-sm", "rounded-br-md", "rounded-br-lg", "rounded-br-xl", "rounded-br-2xl", "rounded-br-full"]
export const BORDER_RADIUS_BL_OPTIONS = ["rounded-bl-none", "rounded-bl-sm", "rounded-bl-md", "rounded-bl-lg", "rounded-bl-xl", "rounded-bl-2xl", "rounded-bl-full"]
export const RING_WIDTH_OPTIONS = ["ring-0", "ring-1", "ring-2", "ring-4", "ring-8", "ring"]
export const RING_OFFSET_WIDTH_OPTIONS = ["ring-offset-0", "ring-offset-1", "ring-offset-2", "ring-offset-4", "ring-offset-8"]
export const OUTLINE_WIDTH_OPTIONS = ["outline-0", "outline-1", "outline-2", "outline-4", "outline-8"]
export const OUTLINE_STYLE_OPTIONS = ["outline-none", "outline", "outline-dashed", "outline-dotted", "outline-double"]
export const OUTLINE_OFFSET_OPTIONS = ["outline-offset-0", "outline-offset-1", "outline-offset-2", "outline-offset-4", "outline-offset-8"]
export const DIVIDE_X_OPTIONS = ["divide-x-0", "divide-x", "divide-x-2", "divide-x-4", "divide-x-8"]
export const DIVIDE_Y_OPTIONS = ["divide-y-0", "divide-y", "divide-y-2", "divide-y-4", "divide-y-8"]
export const DIVIDE_STYLE_OPTIONS = ["divide-solid", "divide-dashed", "divide-dotted", "divide-double", "divide-none"]
export const DIVIDE_REVERSE_OPTIONS = ["divide-x-reverse", "divide-y-reverse"]

/* ── Effects ─────────────────────────────────────────────────────── */

export const SHADOW_OPTIONS = [
  "shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-inner",
]
export const MIX_BLEND_OPTIONS = [
  "mix-blend-normal", "mix-blend-multiply", "mix-blend-screen", "mix-blend-overlay",
  "mix-blend-darken", "mix-blend-lighten", "mix-blend-color-dodge", "mix-blend-color-burn",
  "mix-blend-hard-light", "mix-blend-soft-light", "mix-blend-difference", "mix-blend-exclusion",
  "mix-blend-hue", "mix-blend-saturation", "mix-blend-color", "mix-blend-luminosity",
  "mix-blend-plus-darker", "mix-blend-plus-lighter",
]
export const BG_BLEND_OPTIONS = [
  "bg-blend-normal", "bg-blend-multiply", "bg-blend-screen", "bg-blend-overlay",
  "bg-blend-darken", "bg-blend-lighten", "bg-blend-color-dodge", "bg-blend-color-burn",
  "bg-blend-hard-light", "bg-blend-soft-light", "bg-blend-difference", "bg-blend-exclusion",
  "bg-blend-hue", "bg-blend-saturation", "bg-blend-color", "bg-blend-luminosity",
]

/* ── Filters ─────────────────────────────────────────────────────── */

export const BLUR_OPTIONS = ["blur-none", "blur-sm", "blur", "blur-md", "blur-lg", "blur-xl", "blur-2xl", "blur-3xl"]
export const BRIGHTNESS_OPTIONS = ["brightness-0", "brightness-50", "brightness-75", "brightness-90", "brightness-95", "brightness-100", "brightness-105", "brightness-110", "brightness-125", "brightness-150", "brightness-200"]
export const CONTRAST_OPTIONS = ["contrast-0", "contrast-50", "contrast-75", "contrast-100", "contrast-125", "contrast-150", "contrast-200"]
export const GRAYSCALE_OPTIONS = ["grayscale-0", "grayscale"]
export const HUE_ROTATE_OPTIONS = ["hue-rotate-0", "hue-rotate-15", "hue-rotate-30", "hue-rotate-60", "hue-rotate-90", "hue-rotate-180"]
export const INVERT_OPTIONS = ["invert-0", "invert"]
export const SATURATE_OPTIONS = ["saturate-0", "saturate-50", "saturate-100", "saturate-150", "saturate-200"]
export const SEPIA_OPTIONS = ["sepia-0", "sepia"]
export const DROP_SHADOW_OPTIONS = ["drop-shadow-none", "drop-shadow-sm", "drop-shadow", "drop-shadow-md", "drop-shadow-lg", "drop-shadow-xl", "drop-shadow-2xl"]

/* ── Backdrop filters ────────────────────────────────────────────── */

export const BACKDROP_BLUR_OPTIONS = ["backdrop-blur-none", "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl", "backdrop-blur-2xl", "backdrop-blur-3xl"]
export const BACKDROP_BRIGHTNESS_OPTIONS = ["backdrop-brightness-0", "backdrop-brightness-50", "backdrop-brightness-75", "backdrop-brightness-90", "backdrop-brightness-95", "backdrop-brightness-100", "backdrop-brightness-105", "backdrop-brightness-110", "backdrop-brightness-125", "backdrop-brightness-150", "backdrop-brightness-200"]
export const BACKDROP_CONTRAST_OPTIONS = ["backdrop-contrast-0", "backdrop-contrast-50", "backdrop-contrast-75", "backdrop-contrast-100", "backdrop-contrast-125", "backdrop-contrast-150", "backdrop-contrast-200"]
export const BACKDROP_GRAYSCALE_OPTIONS = ["backdrop-grayscale-0", "backdrop-grayscale"]
export const BACKDROP_HUE_ROTATE_OPTIONS = ["backdrop-hue-rotate-0", "backdrop-hue-rotate-15", "backdrop-hue-rotate-30", "backdrop-hue-rotate-60", "backdrop-hue-rotate-90", "backdrop-hue-rotate-180"]
export const BACKDROP_INVERT_OPTIONS = ["backdrop-invert-0", "backdrop-invert"]
export const BACKDROP_OPACITY_OPTIONS = ["backdrop-opacity-0", "backdrop-opacity-5", "backdrop-opacity-10", "backdrop-opacity-20", "backdrop-opacity-25", "backdrop-opacity-30", "backdrop-opacity-40", "backdrop-opacity-50", "backdrop-opacity-60", "backdrop-opacity-70", "backdrop-opacity-75", "backdrop-opacity-80", "backdrop-opacity-90", "backdrop-opacity-95", "backdrop-opacity-100"]
export const BACKDROP_SATURATE_OPTIONS = ["backdrop-saturate-0", "backdrop-saturate-50", "backdrop-saturate-100", "backdrop-saturate-150", "backdrop-saturate-200"]
export const BACKDROP_SEPIA_OPTIONS = ["backdrop-sepia-0", "backdrop-sepia"]

/* ── Transitions & Animation ─────────────────────────────────────── */

export const TRANSITION_PROPERTY_OPTIONS = ["transition-none", "transition-all", "transition", "transition-colors", "transition-opacity", "transition-shadow", "transition-transform"]
export const TRANSITION_BEHAVIOR_OPTIONS = ["transition-normal", "transition-discrete"]
export const TRANSITION_DURATION_OPTIONS = ["duration-0", "duration-75", "duration-100", "duration-150", "duration-200", "duration-300", "duration-500", "duration-700", "duration-1000"]
export const TRANSITION_TIMING_OPTIONS = ["ease-linear", "ease-in", "ease-out", "ease-in-out"]
export const TRANSITION_DELAY_OPTIONS = ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-300", "delay-500", "delay-700", "delay-1000"]
export const ANIMATION_OPTIONS = ["animate-none", "animate-spin", "animate-ping", "animate-pulse", "animate-bounce"]

/* ── Transforms ──────────────────────────────────────────────────── */

export const SCALE_OPTIONS = ["scale-0", "scale-50", "scale-75", "scale-90", "scale-95", "scale-100", "scale-105", "scale-110", "scale-125", "scale-150"]
export const SCALE_X_OPTIONS = ["scale-x-0", "scale-x-50", "scale-x-75", "scale-x-90", "scale-x-95", "scale-x-100", "scale-x-105", "scale-x-110", "scale-x-125", "scale-x-150"]
export const SCALE_Y_OPTIONS = ["scale-y-0", "scale-y-50", "scale-y-75", "scale-y-90", "scale-y-95", "scale-y-100", "scale-y-105", "scale-y-110", "scale-y-125", "scale-y-150"]
export const ROTATE_OPTIONS = ["rotate-0", "rotate-1", "rotate-2", "rotate-3", "rotate-6", "rotate-12", "rotate-45", "rotate-90", "rotate-180"]
export const TRANSLATE_X_OPTIONS = [
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
export const TRANSLATE_Y_OPTIONS = [
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
export const SKEW_X_OPTIONS = ["skew-x-0", "skew-x-1", "skew-x-2", "skew-x-3", "skew-x-6", "skew-x-12", "-skew-x-1", "-skew-x-2", "-skew-x-3", "-skew-x-6", "-skew-x-12"]
export const SKEW_Y_OPTIONS = ["skew-y-0", "skew-y-1", "skew-y-2", "skew-y-3", "skew-y-6", "skew-y-12", "-skew-y-1", "-skew-y-2", "-skew-y-3", "-skew-y-6", "-skew-y-12"]
export const TRANSFORM_ORIGIN_OPTIONS = [
  "origin-center", "origin-top", "origin-top-right", "origin-right", "origin-bottom-right",
  "origin-bottom", "origin-bottom-left", "origin-left", "origin-top-left",
]

/* ── Pixel value mapping for spacing labels ──────────────────────── */

export const SPACING_PX: Record<string, string> = {
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

/* ── Position grid (Figma-style justify x align) ─────────────────── */

export const JUSTIFY_KEYS = ["justify-start", "justify-center", "justify-end"] as const
export const ALIGN_KEYS = ["items-start", "items-center", "items-end"] as const

/** Maps matching justify+align pairs to place-items shorthand (grid only) */
export const PLACE_ITEMS_MAP: Record<string, Record<string, string>> = {
  "justify-start": { "items-start": "place-items-start" },
  "justify-center": { "items-center": "place-items-center" },
  "justify-end": { "items-end": "place-items-end" },
  "justify-stretch": { "items-stretch": "place-items-stretch" },
}

/* ── Object position grid (3x3 spatial picker) ───────────────────── */

export const OBJECT_POSITION_GRID = [
  ["object-left-top", "object-top", "object-right-top"],
  ["object-left", "object-center", "object-right"],
  ["object-left-bottom", "object-bottom", "object-right-bottom"],
] as const

/* ── Spacing value input (Figma-style) ──────────────────────────── */

export const SPACING_VALUES = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const

export const NEGATIVE_SPACING_VALUES = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16"] as const

/* ── Border radius control (Figma-style) ─────────────────────────── */

export const RADIUS_VALUES = [
  { value: "rounded-none", label: "none", px: "0" },
  { value: "rounded-sm", label: "sm", px: "2px" },
  { value: "rounded-md", label: "md", px: "6px" },
  { value: "rounded-lg", label: "lg", px: "8px" },
  { value: "rounded-xl", label: "xl", px: "12px" },
  { value: "rounded-2xl", label: "2xl", px: "16px" },
  { value: "rounded-full", label: "full", px: "9999px" },
] as const

export const RADIUS_SIDES = [
  { prefix: "rounded-tl", label: "TL" },
  { prefix: "rounded-tr", label: "TR" },
  { prefix: "rounded-bl", label: "BL" },
  { prefix: "rounded-br", label: "BR" },
] as const
