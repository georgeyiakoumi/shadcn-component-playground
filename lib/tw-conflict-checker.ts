// Tailwind Conflict Checker — detects conflicting or redundant Tailwind classes
// Used by the TwEditorPanel to highlight class conflicts.

/* ── Types ──────────────────────────────────────────────────────── */

export interface TwConflict {
  classes: [string, string]
  reason: string
  suggestion: string
}

/* ── Conflict group definitions ─────────────────────────────────── */

/**
 * A conflict group defines a set of classes that are mutually exclusive.
 * If two classes match the same group, they conflict.
 */
interface ConflictGroup {
  /** Human-readable property name, e.g. "display mode" */
  property: string
  /** Regex or prefix matcher — extracts a "key" from a class */
  match: (cls: string) => string | null
}

/**
 * Strips responsive/state prefixes from a class.
 * e.g. "hover:bg-red-500" → "bg-red-500", "sm:p-4" → "p-4"
 */
function stripPrefix(cls: string): string {
  const idx = cls.lastIndexOf(":")
  return idx === -1 ? cls : cls.slice(idx + 1)
}

/* ── Typography vs Colour disambiguation ────────────────────────── */

const TEXT_SIZE_VALUES = new Set([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl",
  "7xl", "8xl", "9xl",
])

const TEXT_ALIGNMENT_VALUES = new Set([
  "left", "center", "right", "justify", "start", "end",
])

function isTextSize(base: string): boolean {
  const m = base.match(/^text-(.+)$/)
  return m !== null && TEXT_SIZE_VALUES.has(m[1])
}

function isTextAlignment(base: string): boolean {
  const m = base.match(/^text-(.+)$/)
  return m !== null && TEXT_ALIGNMENT_VALUES.has(m[1])
}

function isTextColour(base: string): boolean {
  if (!base.startsWith("text-")) return false
  return !isTextSize(base) && !isTextAlignment(base)
}

/* ── Conflict groups ────────────────────────────────────────────── */

const DISPLAY_VALUES = new Set([
  "flex", "inline-flex", "grid", "inline-grid", "block", "inline-block",
  "inline", "hidden", "contents", "table",
])

const POSITION_VALUES = new Set([
  "static", "relative", "absolute", "fixed", "sticky",
])

const OVERFLOW_PREFIXES = ["overflow-x", "overflow-y", "overflow"]

const CONFLICT_GROUPS: ConflictGroup[] = [
  // Padding — all sides
  {
    property: "padding (all sides)",
    match: (cls) => {
      const m = cls.match(/^p-(.+)$/)
      // Ensure it's NOT px, py, pt, pr, pb, pl
      return m && !cls.match(/^p[xytblr]-/) ? "p" : null
    },
  },
  // Padding — horizontal
  {
    property: "horizontal padding",
    match: (cls) => cls.match(/^px-/) ? "px" : null,
  },
  // Padding — vertical
  {
    property: "vertical padding",
    match: (cls) => cls.match(/^py-/) ? "py" : null,
  },
  // Padding — individual sides
  { property: "top padding", match: (cls) => cls.match(/^pt-/) ? "pt" : null },
  { property: "right padding", match: (cls) => cls.match(/^pr-/) ? "pr" : null },
  { property: "bottom padding", match: (cls) => cls.match(/^pb-/) ? "pb" : null },
  { property: "left padding", match: (cls) => cls.match(/^pl-/) ? "pl" : null },

  // Margin — all sides
  {
    property: "margin (all sides)",
    match: (cls) => {
      const m = cls.match(/^m-(.+)$/)
      return m && !cls.match(/^m[xytblr]-/) ? "m" : null
    },
  },
  // Margin — horizontal
  {
    property: "horizontal margin",
    match: (cls) => cls.match(/^mx-/) ? "mx" : null,
  },
  // Margin — vertical
  {
    property: "vertical margin",
    match: (cls) => cls.match(/^my-/) ? "my" : null,
  },
  // Margin — individual sides
  { property: "top margin", match: (cls) => cls.match(/^mt-/) ? "mt" : null },
  { property: "right margin", match: (cls) => cls.match(/^mr-/) ? "mr" : null },
  { property: "bottom margin", match: (cls) => cls.match(/^mb-/) ? "mb" : null },
  { property: "left margin", match: (cls) => cls.match(/^ml-/) ? "ml" : null },

  // Gap
  { property: "gap", match: (cls) => cls.match(/^gap-/) ? "gap" : null },

  // Width
  {
    property: "width",
    match: (cls) => cls.match(/^w-/) ? "w" : null,
  },
  // Height
  {
    property: "height",
    match: (cls) => cls.match(/^h-/) ? "h" : null,
  },
  // Size (w + h shorthand)
  {
    property: "size (width + height)",
    match: (cls) => cls.match(/^size-/) ? "size" : null,
  },
  // Min/max width/height
  { property: "min-width", match: (cls) => cls.match(/^min-w-/) ? "min-w" : null },
  { property: "max-width", match: (cls) => cls.match(/^max-w-/) ? "max-w" : null },
  { property: "min-height", match: (cls) => cls.match(/^min-h-/) ? "min-h" : null },
  { property: "max-height", match: (cls) => cls.match(/^max-h-/) ? "max-h" : null },

  // Display
  {
    property: "display mode",
    match: (cls) => DISPLAY_VALUES.has(cls) ? "display" : null,
  },

  // Position
  {
    property: "position",
    match: (cls) => POSITION_VALUES.has(cls) ? "position" : null,
  },

  // Overflow (handles overflow, overflow-x, overflow-y)
  ...OVERFLOW_PREFIXES.map((prefix): ConflictGroup => ({
    property: prefix.replace("-", " "),
    match: (cls) => cls.startsWith(prefix + "-") || cls === prefix ? prefix : null,
  })),

  // Text size
  {
    property: "font size",
    match: (cls) => isTextSize(cls) ? "text-size" : null,
  },

  // Text alignment
  {
    property: "text alignment",
    match: (cls) => isTextAlignment(cls) ? "text-align" : null,
  },

  // Text colour (separate from size and alignment)
  {
    property: "text colour",
    match: (cls) => isTextColour(cls) ? "text-colour" : null,
  },

  // Font weight
  {
    property: "font weight",
    match: (cls) => cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/) ? "font-weight" : null,
  },

  // Font family
  {
    property: "font family",
    match: (cls) => cls.match(/^font-(sans|serif|mono)$/) ? "font-family" : null,
  },

  // Leading (line-height)
  {
    property: "line height",
    match: (cls) => cls.match(/^leading-/) ? "leading" : null,
  },

  // Tracking (letter-spacing)
  {
    property: "letter spacing",
    match: (cls) => cls.match(/^tracking-/) ? "tracking" : null,
  },

  // Border radius
  {
    property: "border radius",
    match: (cls) => {
      if (cls === "rounded" || cls.match(/^rounded-(none|sm|md|lg|xl|2xl|3xl|full)$/)) return "rounded"
      return null
    },
  },

  // Background colour
  {
    property: "background colour",
    match: (cls) => cls.match(/^bg-/) ? "bg" : null,
  },

  // Border width (overall)
  {
    property: "border width",
    match: (cls) => {
      if (cls === "border" || cls.match(/^border-(0|2|4|8)$/)) return "border-width"
      return null
    },
  },

  // Shadow
  {
    property: "box shadow",
    match: (cls) => {
      if (cls === "shadow" || cls.match(/^shadow-(sm|md|lg|xl|2xl|inner|none)$/)) return "shadow"
      return null
    },
  },

  // Opacity
  {
    property: "opacity",
    match: (cls) => cls.match(/^opacity-/) ? "opacity" : null,
  },

  // Flex direction
  {
    property: "flex direction",
    match: (cls) => cls.match(/^flex-(row|col|row-reverse|col-reverse)$/) ? "flex-dir" : null,
  },

  // Justify content
  {
    property: "justify content",
    match: (cls) => cls.match(/^justify-/) ? "justify" : null,
  },

  // Align items
  {
    property: "align items",
    match: (cls) => cls.match(/^items-/) ? "items" : null,
  },

  // Cursor
  {
    property: "cursor",
    match: (cls) => cls.match(/^cursor-/) ? "cursor" : null,
  },

  // Z-index
  {
    property: "z-index",
    match: (cls) => cls.match(/^z-/) ? "z" : null,
  },
]

/* ── Main checker ───────────────────────────────────────────────── */

/**
 * Finds conflicting Tailwind classes in a list.
 * Only compares classes with the same prefix context (e.g. "hover:" classes
 * only conflict with other "hover:" classes).
 */
export function findConflicts(classes: string[]): TwConflict[] {
  const conflicts: TwConflict[] = []
  const seen = new Set<string>()

  // Group classes by their prefix context (unprefixed, hover:, sm:, etc.)
  const byContext = new Map<string, string[]>()
  for (const cls of classes) {
    const colonIdx = cls.lastIndexOf(":")
    const context = colonIdx === -1 ? "" : cls.slice(0, colonIdx)
    const group = byContext.get(context) ?? []
    group.push(cls)
    byContext.set(context, group)
  }

  for (const [, contextClasses] of byContext) {
    // For each conflict group, find classes that match
    for (const group of CONFLICT_GROUPS) {
      const matched: string[] = []

      for (const cls of contextClasses) {
        const base = stripPrefix(cls)
        if (group.match(base) !== null) {
          matched.push(cls)
        }
      }

      // If 2+ classes match the same group, they conflict
      if (matched.length >= 2) {
        for (let i = 0; i < matched.length; i++) {
          for (let j = i + 1; j < matched.length; j++) {
            const key = `${matched[i]}|${matched[j]}`
            if (seen.has(key)) continue
            seen.add(key)

            conflicts.push({
              classes: [matched[i], matched[j]],
              reason: `Both set ${group.property}`,
              suggestion: `Remove ${matched[i]} or ${matched[j]}`,
            })
          }
        }
      }
    }
  }

  return conflicts
}
