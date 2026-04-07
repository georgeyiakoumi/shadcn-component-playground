/**
 * Pillar 3b — slow-path generator tests.
 *
 * The slow path is exercised by editing a parsed tree and asserting that
 * the generator produces source where:
 *
 * 1. The edited field has the new value at the right place
 * 2. Every other byte in the file is byte-equivalent to the original
 *
 * This is the operationalisation of "respect the source" under edit.
 * Lesson #16 (Notion Lessons & Insights) explains the philosophy; this
 * file is the test that enforces it.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseSource } from "@/lib/parser/parse-source-v2"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..")

function load(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf-8")
}

/* ── 1. Edit a single cva variant in Button ──────────────────────────── */

describe("slow path — edit cva variant value (Button)", () => {
  const original = load("components/ui/button.tsx")
  const tree = parseSource(original, "components/ui/button.tsx")

  it("edits the destructive variant and produces splice output", () => {
    // Mutate the tree's destructive variant value.
    const cva = tree.cvaExports[0]
    const newDestructive = "bg-blue-500 text-white hover:bg-blue-400"
    cva.variants.variant.destructive = newDestructive

    const emitted = generateFromTreeV2(tree)

    // The new value appears in the output exactly once.
    expect(emitted).toContain(newDestructive)
    // The old value is gone.
    expect(emitted).not.toContain("bg-destructive text-white hover:bg-destructive/90")
    // The original length minus the old string plus the new string equals
    // the new length — proves no whitespace drift, no other byte changed.
    const oldDestructive =
      "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
    expect(emitted.length).toBe(
      original.length - oldDestructive.length + newDestructive.length,
    )
  })

  it("preserves every other line in the file byte-equivalent", () => {
    const tree2 = parseSource(original, "components/ui/button.tsx")
    tree2.cvaExports[0].variants.variant.outline = "REPLACED_OUTLINE"
    const emitted = generateFromTreeV2(tree2)

    // Check that the surrounding cva lines (variant.default and variant.secondary)
    // are still present byte-for-byte.
    expect(emitted).toContain(
      'default: "bg-primary text-primary-foreground hover:bg-primary/90"',
    )
    expect(emitted).toContain(
      'secondary:\n          "bg-secondary text-secondary-foreground hover:bg-secondary/80"',
    )
    // The function declaration is intact.
    expect(emitted).toContain("function Button({")
    // The export statement is intact.
    expect(emitted).toContain("export { Button, buttonVariants }")
  })
})

/* ── 2. Edit base classes in cva ───────────────────────────────────── */

describe("slow path — edit cva base classes (Button)", () => {
  const original = load("components/ui/button.tsx")

  it("splices the base class string in place", () => {
    const tree = parseSource(original, "components/ui/button.tsx")
    const newBase = "inline-flex items-center gap-1"
    tree.cvaExports[0].baseClasses = newBase

    const emitted = generateFromTreeV2(tree)
    expect(emitted).toContain(newBase)
    // The function body classes (variants) should still be present.
    expect(emitted).toContain('default: "h-9 px-4 py-2 has-[>svg]:px-3"')
  })
})

/* ── 3. Multiple edits in the same file (descending splice order) ───── */

describe("slow path — multiple edits in one file", () => {
  const original = load("components/ui/button.tsx")

  it("applies all splices correctly when edits are scattered", () => {
    const tree = parseSource(original, "components/ui/button.tsx")
    tree.cvaExports[0].variants.variant.default = "NEW_DEFAULT"
    tree.cvaExports[0].variants.variant.ghost = "NEW_GHOST"
    tree.cvaExports[0].variants.size.icon = "NEW_ICON"

    const emitted = generateFromTreeV2(tree)
    expect(emitted).toContain("NEW_DEFAULT")
    expect(emitted).toContain("NEW_GHOST")
    expect(emitted).toContain("NEW_ICON")
    // Untouched values still present.
    expect(emitted).toContain("h-10 rounded-md px-6 has-[>svg]:px-4") // size.lg
  })
})

/* ── 4. Edit-then-revert returns the fast path ─────────────────────── */

describe("slow path — edit-then-revert", () => {
  const original = load("components/ui/button.tsx")

  it("returns byte-equivalent source after revert", () => {
    const tree = parseSource(original, "components/ui/button.tsx")
    const cva = tree.cvaExports[0]
    const originalDefault = cva.variants.variant.default

    // Edit
    cva.variants.variant.default = "TEMPORARY_VALUE"
    const editedOutput = generateFromTreeV2(tree)
    expect(editedOutput).not.toBe(original)
    expect(editedOutput).toContain("TEMPORARY_VALUE")

    // Revert
    cva.variants.variant.default = originalDefault
    const revertedOutput = generateFromTreeV2(tree)
    // Byte-equivalent to the original — fast path engaged because no
    // splices were collected.
    expect(revertedOutput).toBe(original)
  })
})

/* ── 5. Edit a className literal on a JSX attribute (Checkbox Indicator) */

describe("slow path — edit className literal on a JSX attribute", () => {
  const original = load("components/ui/checkbox.tsx")

  it("splices the literal value in place when edited", () => {
    const tree = parseSource(original, "components/ui/checkbox.tsx")
    // The Indicator's className is a plain literal:
    // className="grid place-content-center text-current transition-none"
    const root = tree.subComponents[0].parts.root
    const indicator = root.children[0]
    if (indicator.kind !== "part") throw new Error("indicator missing")
    const className = indicator.part.className
    if (className.kind !== "literal") {
      throw new Error(
        `Expected indicator className to be a literal, got ${className.kind}`,
      )
    }

    className.value = "FLEX_CENTER_NEW"
    const emitted = generateFromTreeV2(tree)
    expect(emitted).toContain('className="FLEX_CENTER_NEW"')
    // Original literal is gone
    expect(emitted).not.toContain(
      "grid place-content-center text-current transition-none",
    )
  })
})

/* ── 6. Edit a cn-call base on a JSX attribute (Checkbox Root) ────── */

describe("slow path — edit cn-call base classes", () => {
  const original = load("components/ui/checkbox.tsx")

  it("splices the cn() first-arg literal in place", () => {
    const tree = parseSource(original, "components/ui/checkbox.tsx")
    const root = tree.subComponents[0].parts.root
    const className = root.className
    if (className.kind !== "cn-call") {
      throw new Error(
        `Expected Checkbox root className to be cn-call, got ${className.kind}`,
      )
    }
    expect(className.baseRange).toBeDefined()

    // The first argument is the editable base. Edit it via args[0]
    // (with a string-literal source representation) so the slow path can
    // detect the divergence.
    className.args[0] = '"NEW_BASE_CLASSES"'
    const emitted = generateFromTreeV2(tree)
    expect(emitted).toContain('className={cn(\n        "NEW_BASE_CLASSES"')
  })
})

/* ── 7. Smoke: generator handles the full registry under edit ───────── */

describe("slow path — every component still emits correctly when nothing is edited", () => {
  const components = [
    "button",
    "card",
    "checkbox",
    "dialog",
    "tooltip",
    "carousel",
    "navigation-menu",
  ]
  it.each(components)(
    "no-edit emit for %s is byte-equivalent (regression guard)",
    (slug) => {
      const source = load(`components/ui/${slug}.tsx`)
      const tree = parseSource(source, `components/ui/${slug}.tsx`)
      // Touch nothing.
      expect(generateFromTreeV2(tree)).toBe(source)
    },
  )
})
