// Tailwind Class Parser — extracts and categorises all Tailwind classes from source code
// Analyses className attributes, cva() calls, cn() calls, and template literals.

/* ── Types ──────────────────────────────────────────────────────── */

export type TwCategory =
  | "spacing"
  | "typography"
  | "colour"
  | "layout"
  | "borders"
  | "effects"
  | "interactivity"
  | "other"

export interface TwClassInfo {
  /** The original class string, e.g. "hover:bg-accent" */
  raw: string
  /** The class without prefix, e.g. "bg-accent" */
  base: string
  /** Which design category this class belongs to */
  category: TwCategory
  /** State/breakpoint prefix, e.g. "hover" | "sm" | "focus-visible" */
  prefix?: string
  /** What kind of prefix this is */
  prefixType?: "state" | "breakpoint" | "group"
}

export interface TwAnalysis {
  /** All unique parsed classes */
  classes: TwClassInfo[]
  /** Classes grouped by category */
  byCategory: Record<TwCategory, TwClassInfo[]>
  /** Unique breakpoint prefixes found (e.g. ["sm", "md"]) */
  breakpoints: string[]
  /** Unique state prefixes found (e.g. ["hover", "focus-visible"]) */
  states: string[]
}

/* ── Constants ──────────────────────────────────────────────────── */

const BREAKPOINT_PREFIXES = new Set(["sm", "md", "lg", "xl", "2xl"])

const STATE_PREFIXES = new Set([
  "hover",
  "focus",
  "focus-visible",
  "focus-within",
  "active",
  "disabled",
  "visited",
  "checked",
  "first",
  "last",
  "odd",
  "even",
  "placeholder",
  "file",
  "open",
])

const GROUP_PREFIXES = new Set(["group", "group-hover", "group-focus", "peer", "peer-hover", "peer-focus"])

/**
 * Colour tokens from shadcn/ui design system. When a `text-` class uses
 * one of these tokens (or ends with `-foreground`), it is categorised as
 * colour rather than typography.
 */
const COLOUR_TEXT_TOKENS = new Set([
  "text-primary",
  "text-secondary",
  "text-destructive",
  "text-muted",
  "text-accent",
  "text-popover",
  "text-card",
  "text-foreground",
  "text-primary-foreground",
  "text-secondary-foreground",
  "text-destructive-foreground",
  "text-muted-foreground",
  "text-accent-foreground",
  "text-popover-foreground",
  "text-card-foreground",
  "text-current",
  "text-inherit",
  "text-transparent",
  "text-black",
  "text-white",
])

/* ── Prefix parsing ────────────────────────────────────────────── */

interface PrefixResult {
  base: string
  prefix?: string
  prefixType?: "state" | "breakpoint" | "group"
}

function parsePrefix(raw: string): PrefixResult {
  // Handle data-[state=...]: and arbitrary variant prefixes — skip them
  // Standard format: "prefix:base" or "prefix1:prefix2:base"
  const colonIndex = raw.indexOf(":")
  if (colonIndex === -1) return { base: raw }

  // Take everything before the FIRST colon as the prefix
  const prefix = raw.slice(0, colonIndex)
  const base = raw.slice(colonIndex + 1)

  // For chained prefixes like "data-[state=active]:bg-background",
  // the "prefix" will be "data-[state=active]" which we treat as state
  if (BREAKPOINT_PREFIXES.has(prefix)) {
    return { base, prefix, prefixType: "breakpoint" }
  }
  if (STATE_PREFIXES.has(prefix)) {
    return { base, prefix, prefixType: "state" }
  }
  if (GROUP_PREFIXES.has(prefix) || prefix.startsWith("group-") || prefix.startsWith("peer-")) {
    return { base, prefix, prefixType: "group" }
  }
  // data-* variants and arbitrary variants — treat as state
  if (prefix.startsWith("data-") || prefix.startsWith("[")) {
    return { base, prefix, prefixType: "state" }
  }

  // Unknown prefix — treat as state
  return { base, prefix, prefixType: "state" }
}

/* ── Categorisation ────────────────────────────────────────────── */

/** Returns true if `cls` starts with any of the given prefixes. */
function startsWith(cls: string, prefixes: string[]): boolean {
  return prefixes.some((p) => cls === p || cls.startsWith(p + "-") || cls.startsWith(p + "/"))
}

/** Returns true if this `text-*` class is a colour token. */
function isColourText(cls: string): boolean {
  if (COLOUR_TEXT_TOKENS.has(cls)) return true
  if (cls.match(/^text-.+-foreground$/)) return true
  // text-{color}/{opacity} patterns like text-primary/50
  if (cls.match(/^text-(primary|secondary|destructive|muted|accent|popover|card|foreground|black|white|inherit|current|transparent)(\/\d+)?$/)) return true
  return false
}

function categorise(base: string): TwCategory {
  // ── Interactivity (check first — catches pseudo-state classes) ──
  if (startsWith(base, ["cursor", "pointer-events", "select", "touch"])) return "interactivity"
  if (base === "sr-only" || base === "not-sr-only") return "interactivity"

  // ── Colour (check before typography to catch text-*-foreground) ──
  if (isColourText(base)) return "colour"
  if (startsWith(base, ["bg", "ring", "accent"])) return "colour"
  // border-{colour-token} — only specific colour borders
  if (base.match(/^border-(input|border|destructive|primary|secondary|transparent|current|inherit|black|white)/)) return "colour"
  if (base.match(/^border-[lrtb]-transparent$/)) return "colour"

  // ── Spacing ──
  if (startsWith(base, [
    "p", "px", "py", "pt", "pr", "pb", "pl",
    "m", "mx", "my", "mt", "mr", "mb", "ml",
    "gap", "space-x", "space-y",
  ])) {
    // Exclude false positives: "place-*", "grow", "grid-*" etc.
    if (base.match(/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)(-|$)/)) {
      return "spacing"
    }
  }

  // ── Typography ──
  if (startsWith(base, ["text"])) return "typography" // remaining text-* after colour check
  if (startsWith(base, ["font", "leading", "tracking", "line-clamp", "whitespace", "break"])) return "typography"
  if (base === "truncate" || base === "uppercase" || base === "lowercase" || base === "capitalize" || base === "normal-case") return "typography"
  if (base === "underline" || base === "overline" || base === "line-through" || base === "no-underline") return "typography"
  if (startsWith(base, ["underline-offset", "decoration"])) return "typography"
  if (base === "antialiased" || base === "subpixel-antialiased") return "typography"
  if (base === "italic" || base === "not-italic") return "typography"

  // ── Layout ──
  if (base === "flex" || base === "inline-flex" || base === "grid" || base === "inline-grid") return "layout"
  if (base === "block" || base === "inline-block" || base === "inline" || base === "hidden" || base === "contents" || base === "table") return "layout"
  if (startsWith(base, [
    "items", "justify", "self", "place",
    "w", "h", "min-w", "min-h", "max-w", "max-h", "size",
    "overflow", "overscroll",
    "absolute", "relative", "fixed", "sticky", "static",
    "top", "right", "bottom", "left", "inset",
    "z", "order",
    "grow", "shrink", "basis",
    "flex-col", "flex-row", "flex-wrap", "flex-nowrap", "flex-1", "flex-auto", "flex-initial", "flex-none", "flex-row-reverse", "flex-col-reverse", "flex-wrap-reverse",
    "grid-", "col-", "row-", "auto-cols", "auto-rows",
    "aspect",
    "float", "clear",
    "object",
    "columns",
    "isolate",
  ])) return "layout"
  if (base === "grow" || base === "shrink") return "layout"
  // Standalone layout keywords
  if (["relative", "absolute", "fixed", "sticky", "static"].includes(base)) return "layout"

  // ── Borders ──
  if (startsWith(base, ["border", "rounded", "outline", "divide", "ring"])) {
    // ring-* is colour when it's a colour token, borders otherwise
    if (base.match(/^ring-(ring|offset)/)) return "colour"
    if (base.match(/^ring-\d/)) return "borders"
    if (startsWith(base, ["rounded", "outline", "divide"])) return "borders"
    if (startsWith(base, ["border"])) return "borders"
    return "borders"
  }

  // ── Effects ──
  if (startsWith(base, [
    "shadow", "opacity", "transition", "duration", "ease", "delay",
    "animate", "blur", "brightness", "contrast", "drop-shadow",
    "grayscale", "hue-rotate", "invert", "saturate", "sepia",
    "backdrop", "scale", "rotate", "translate", "transform", "origin",
    "skew",
  ])) return "effects"
  if (base === "transform" || base === "transform-gpu" || base === "transform-none") return "effects"

  return "other"
}

/* ── String extraction ─────────────────────────────────────────── */

/**
 * Extracts all class-bearing strings from component source code.
 * Looks for className attributes, cva() base strings, cva variant
 * value strings, cn() call arguments, and template literals.
 */
function extractClassStrings(source: string): string[] {
  const strings: string[] = []

  // 1. className="..." or className='...'
  const classNameRegex = /className\s*=\s*["']([^"']+)["']/g
  let match: RegExpExecArray | null
  while ((match = classNameRegex.exec(source)) !== null) {
    strings.push(match[1])
  }

  // 2. cva("base classes", ...) — the first string argument
  const cvaBaseRegex = /cva\(\s*["'`]([^"'`]+)["'`]/g
  while ((match = cvaBaseRegex.exec(source)) !== null) {
    strings.push(match[1])
  }

  // 3. String values inside cva variant objects: `key: "classes"`
  //    Match quoted strings that look like Tailwind class lists
  //    (contain common TW patterns like bg-, text-, flex, etc.)
  const quotedStringRegex = /:\s*["']([^"']{2,})["']/g
  while ((match = quotedStringRegex.exec(source)) !== null) {
    const value = match[1]
    // Heuristic: contains at least one Tailwind-like token
    if (isTailwindClassList(value)) {
      strings.push(value)
    }
  }

  // 4. cn(...) call arguments — find strings inside cn() calls
  const cnCallRegex = /cn\(([^)]+)\)/g
  while ((match = cnCallRegex.exec(source)) !== null) {
    const cnBody = match[1]
    const innerStrings = /["']([^"']+)["']/g
    let innerMatch: RegExpExecArray | null
    while ((innerMatch = innerStrings.exec(cnBody)) !== null) {
      if (isTailwindClassList(innerMatch[1])) {
        strings.push(innerMatch[1])
      }
    }
  }

  // 5. Template literals containing TW classes (backtick strings)
  const templateRegex = /`([^`]+)`/g
  while ((match = templateRegex.exec(source)) !== null) {
    const value = match[1]
    // Skip template literals with ${...} interpolations for now
    if (!value.includes("${") && isTailwindClassList(value)) {
      strings.push(value)
    }
  }

  return strings
}

/**
 * Heuristic: does a string look like a Tailwind class list?
 * Must contain at least one token that matches common TW patterns.
 */
function isTailwindClassList(str: string): boolean {
  const twPatterns = /\b(flex|grid|block|inline|items-|justify-|bg-|text-|font-|p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|gap-|rounded-|border|shadow|ring-|transition|h-|w-|min-|max-|overflow|relative|absolute|fixed|sticky|hidden|opacity-|cursor-|z-|inset-|top-|right-|bottom-|left-|space-|leading-|tracking-|whitespace-|truncate|underline|outline|size-|shrink|grow|select-|pointer-events|sr-only|peer|group|touch-|accent-|animate-|duration-|scale-|rotate-|translate-|transform|antialiased|italic|uppercase|lowercase|capitalize|place-)\b/
  return twPatterns.test(str)
}

/* ── Main analyser ─────────────────────────────────────────────── */

/**
 * Analyses a component source code string and extracts all Tailwind
 * utility classes, categorised and deduplicated.
 */
export function analyseTailwindClasses(source: string): TwAnalysis {
  if (!source) {
    return {
      classes: [],
      byCategory: emptyCategories(),
      breakpoints: [],
      states: [],
    }
  }

  const classStrings = extractClassStrings(source)

  // Split into individual classes and deduplicate
  const seen = new Set<string>()
  const classes: TwClassInfo[] = []
  const breakpoints = new Set<string>()
  const states = new Set<string>()

  for (const str of classStrings) {
    const tokens = str.split(/\s+/).filter(Boolean)
    for (const token of tokens) {
      // Skip arbitrary selectors like [&_svg]:pointer-events-none
      const cleaned = cleanArbitrarySelector(token)
      if (!cleaned || seen.has(cleaned)) continue
      seen.add(cleaned)

      const { base, prefix, prefixType } = parsePrefix(cleaned)
      const category = categorise(base)

      const info: TwClassInfo = { raw: cleaned, base, category }
      if (prefix) {
        info.prefix = prefix
        info.prefixType = prefixType
        if (prefixType === "breakpoint") breakpoints.add(prefix)
        if (prefixType === "state") states.add(prefix)
      }

      classes.push(info)
    }
  }

  // Group by category
  const byCategory = emptyCategories()
  for (const cls of classes) {
    byCategory[cls.category].push(cls)
  }

  return {
    classes,
    byCategory,
    breakpoints: Array.from(breakpoints).sort(),
    states: Array.from(states).sort(),
  }
}

/* ── Helpers ────────────────────────────────────────────────────── */

function emptyCategories(): Record<TwCategory, TwClassInfo[]> {
  return {
    spacing: [],
    typography: [],
    colour: [],
    layout: [],
    borders: [],
    effects: [],
    interactivity: [],
    other: [],
  }
}

/**
 * Handles arbitrary selector variants like `[&_svg]:pointer-events-none`.
 * Extracts the class portion after `]:` for categorisation, but keeps
 * the full string as `raw`.
 */
function cleanArbitrarySelector(token: string): string | null {
  if (!token || token.length === 0) return null
  // Skip pure selectors with no class (e.g. "[&_svg]")
  if (token.startsWith("[") && !token.includes(":")) return null
  return token
}
