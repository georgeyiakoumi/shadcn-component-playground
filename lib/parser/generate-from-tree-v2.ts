/**
 * ComponentTreeV2 → source text generator.
 *
 * Has three execution paths:
 *
 * 1. **Escape-hatch path** (Pillar 1 D10) — `customHandling: true` trees
 *    re-emit `rawSource` verbatim. No structured emission, ever.
 * 2. **Fast path** (Pillar 3a, GEO-288) — `originalSource` is set and the
 *    tree has not been edited since parsing. Returns `originalSource`
 *    verbatim. Byte-equivalent by construction.
 * 3. **Slow path** (Pillar 3b, GEO-301) — `originalSource` is set and the
 *    tree HAS been edited. Walks the tree to find dirty fields (where the
 *    current value diverges from what `originalSource.slice(range)` would
 *    return) and surgically splices the new values back into the original
 *    source. Every byte that wasn't part of an edit is preserved exactly.
 *
 * Trees with no `originalSource` (e.g. built programmatically by the M3
 * from-scratch builder) currently throw `GeneratorError`. Pillar 3c will
 * add the template fallback for that path.
 *
 * Design philosophy: respect the source. Lesson #16 in the Notion Lessons
 * & Insights page explains why this generator never reformats and never
 * regenerates untouched regions, even under edit.
 *
 * Linear: GEO-288 (parent), GEO-301 (3b slow path)
 */

import type {
  ClassNameExpr,
  ComponentTreeV2,
  CvaExport,
  PartChild,
  PartNode,
  SourceRange,
  SubComponentV2,
} from "@/lib/component-tree-v2"

/**
 * Error thrown when the generator cannot emit a tree. Carries enough context
 * for the caller to understand why the generator gave up.
 */
export class GeneratorError extends Error {
  readonly name = "GeneratorError"
  constructor(reason: string) {
    super(`[generator] ${reason}`)
  }
}

/**
 * Generate source code from a `ComponentTreeV2`.
 */
export function generateFromTreeV2(tree: ComponentTreeV2): string {
  // 1. Escape-hatch path. Currently no in-registry component requires this
  // but the path exists for future unhandleable families.
  if (tree.customHandling && tree.rawSource !== undefined) {
    return tree.rawSource
  }

  // 2 & 3. Tree has originalSource — fast path or slow path depending on
  // whether any field has been edited.
  if (tree.originalSource !== undefined) {
    const splices = collectSplices(tree, tree.originalSource)
    if (splices.length === 0) {
      // Fast path: no edits detected, return source verbatim.
      return tree.originalSource
    }
    // Slow path: apply splices in descending start order so earlier splices
    // don't shift the offsets of later ones.
    return applySplices(tree.originalSource, splices)
  }

  // 4. No originalSource — programmatically-built tree. Pillar 3c will
  // implement template-based emission here.
  throw new GeneratorError(
    `Cannot generate source for "${tree.name}": no originalSource available. ` +
      `Template-based emission (Pillar 3c) is not yet implemented.`,
  )
}

/* ══════════════════════════════════════════════════════════════════════════
 * Slow path — splice collection + application
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A single edit to apply to the original source. `range` is the byte range
 * to replace; `value` is the new content to write into that range.
 */
interface Splice {
  range: SourceRange
  value: string
}

/**
 * Walk the tree, compare every value-with-a-range against what
 * `originalSource.slice(range.start, range.end)` produces, and collect a
 * `Splice` for every value that has diverged from the source.
 *
 * "Dirty" detection is byte comparison only — no mutation flags, no edit
 * tracking. This means an edit-then-revert returns the field to clean state
 * automatically (because the value matches the source again, no splice is
 * collected, and the fast path returns the source verbatim).
 */
function collectSplices(
  tree: ComponentTreeV2,
  source: string,
): Splice[] {
  const splices: Splice[] = []

  // cva exports — base classes and per-variant-value class strings.
  for (const cva of tree.cvaExports) {
    collectCvaSplices(cva, source, splices)
  }

  // Sub-components — walk every part's className expression.
  for (const sub of tree.subComponents) {
    collectPartSplices(sub.parts.root, source, splices)
  }

  return splices
}

/**
 * Collect splices for a `CvaExport`'s base class string and each variant
 * value's class string.
 */
function collectCvaSplices(
  cva: CvaExport,
  source: string,
  splices: Splice[],
): void {
  // Base classes
  if (cva.baseClassesRange) {
    const original = source.slice(
      cva.baseClassesRange.start,
      cva.baseClassesRange.end,
    )
    if (cva.baseClasses !== original) {
      splices.push({ range: cva.baseClassesRange, value: cva.baseClasses })
    }
  }

  // Per-variant-value class strings
  if (cva.variantRanges) {
    for (const groupName of Object.keys(cva.variants)) {
      const valueRanges = cva.variantRanges[groupName]
      if (!valueRanges) continue
      const valueMap = cva.variants[groupName]
      for (const valueName of Object.keys(valueMap)) {
        const range = valueRanges[valueName]
        if (!range) continue
        const currentValue = valueMap[valueName]
        const original = source.slice(range.start, range.end)
        if (currentValue !== original) {
          splices.push({ range, value: currentValue })
        }
      }
    }
  }
}

/**
 * Recursively walk a `PartNode` and collect splices for any className
 * expression that has a range and a diverged value.
 */
function collectPartSplices(
  part: PartNode,
  source: string,
  splices: Splice[],
): void {
  collectClassNameSplices(part.className, source, splices)

  for (const child of part.children) {
    collectChildSplices(child, source, splices)
  }
}

function collectChildSplices(
  child: PartChild,
  source: string,
  splices: Splice[],
): void {
  if (child.kind === "part") {
    collectPartSplices(child.part, source, splices)
  }
  // text, expression, jsx-comment, passthrough — no embedded class strings
  // we currently splice. (3c may add per-attribute ranges.)
}

/**
 * For a `ClassNameExpr`, collect splices for the editable string content.
 * Two shapes are currently supported:
 *
 * 1. `kind: "literal"` with a `range` — splice the inner string contents
 * 2. `kind: "cn-call"` with a `baseRange` — splice the first argument when
 *    it was originally a string literal (the most common shadcn shape:
 *    `cn("base classes", className)`)
 *
 * cva-call className expressions don't have ranges of their own — the
 * editable strings live in the cva export, which `collectCvaSplices` covers.
 */
function collectClassNameSplices(
  expr: ClassNameExpr,
  source: string,
  splices: Splice[],
): void {
  if (expr.kind === "literal" && expr.range) {
    const original = source.slice(expr.range.start, expr.range.end)
    if (expr.value !== original) {
      splices.push({ range: expr.range, value: expr.value })
    }
    return
  }

  if (expr.kind === "cn-call" && expr.baseRange) {
    // The first arg of cn() is the editable base. Its raw source includes
    // the surrounding quotes (because we stored it via `getText()`), so we
    // strip them before comparing to what's at the inner range.
    const firstArg = expr.args[0]
    if (firstArg === undefined) return
    const innerValue = stripStringQuotes(firstArg)
    if (innerValue === null) return // first arg isn't a string literal
    const original = source.slice(
      expr.baseRange.start,
      expr.baseRange.end,
    )
    if (innerValue !== original) {
      splices.push({ range: expr.baseRange, value: innerValue })
    }
  }
}

/**
 * Strip the surrounding quotes from a string literal source. Returns null
 * if the source isn't a recognised string literal shape.
 *
 * Examples:
 *   `"foo bar"` → `foo bar`
 *   `'foo bar'` → `foo bar`
 *   `\`foo bar\`` → `foo bar`
 *   `someExpression` → null
 */
function stripStringQuotes(source: string): string | null {
  if (source.length < 2) return null
  const first = source[0]
  const last = source[source.length - 1]
  if (first !== last) return null
  if (first !== '"' && first !== "'" && first !== "`") return null
  return source.slice(1, -1)
}

/**
 * Apply a list of splices to the source string. The splices are sorted by
 * `range.start` in descending order so earlier splices don't invalidate the
 * offsets of later ones.
 */
function applySplices(source: string, splices: Splice[]): string {
  // Sort descending by start so we can mutate the string back-to-front.
  const sorted = [...splices].sort((a, b) => b.range.start - a.range.start)

  // Validate non-overlapping ranges before applying. Overlapping splices
  // would corrupt the output; we'd rather throw a clear error than produce
  // garbage.
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    // a.start >= b.start (descending sort). Overlap means a.start < b.end.
    if (a.range.start < b.range.end) {
      throw new GeneratorError(
        `Overlapping splices at [${b.range.start}, ${b.range.end}) and ` +
          `[${a.range.start}, ${a.range.end}) — this is a parser bug.`,
      )
    }
  }

  let result = source
  for (const splice of sorted) {
    result =
      result.slice(0, splice.range.start) +
      splice.value +
      result.slice(splice.range.end)
  }
  return result
}

// Re-export type for tests that want to inspect splice collection directly.
export type { Splice }
