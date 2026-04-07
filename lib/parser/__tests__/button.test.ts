/**
 * Pillar 2a — Button parser test.
 *
 * Reads the real `components/ui/button.tsx` from disk and asserts the parser
 * produces a structurally correct `ComponentTreeV2`.
 *
 * No round-trip assertion yet — the generator lives in Pillar 3. This test
 * only verifies that the parser can read Button's structure correctly.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseSource } from "@/lib/parser/parse-source-v2"
import { ParserError } from "@/lib/parser/parser-error"

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..")

function loadComponentSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf-8")
}

describe("parseSource — Button", () => {
  const source = loadComponentSource("components/ui/button.tsx")
  const tree = parseSource(source, "components/ui/button.tsx")

  it("identifies the component name and slug", () => {
    expect(tree.name).toBe("Button")
    expect(tree.slug).toBe("button")
    expect(tree.filePath).toBe("components/ui/button.tsx")
  })

  it("marks the component as handleable with no custom handling", () => {
    expect(tree.roundTripRisk).toBe("handleable")
    expect(tree.customHandling).toBe(false)
    expect(tree.rawSource).toBeUndefined()
  })

  it("has no directives (Button is not a client component)", () => {
    expect(tree.directives).toEqual([])
  })

  it("captures all four imports in source order", () => {
    expect(tree.imports).toHaveLength(4)

    // import * as React from "react"
    expect(tree.imports[0]).toEqual({
      kind: "default-namespace",
      source: "react",
      localName: "React",
      namespaceImport: true,
    })

    // import { cva, type VariantProps } from "class-variance-authority"
    expect(tree.imports[1]).toEqual({
      kind: "named",
      source: "class-variance-authority",
      names: ["cva"],
      typeNames: ["VariantProps"],
    })

    // import { Slot } from "radix-ui"
    expect(tree.imports[2]).toEqual({
      kind: "named",
      source: "radix-ui",
      names: ["Slot"],
    })

    // import { cn } from "@/lib/utils"
    expect(tree.imports[3]).toEqual({
      kind: "named",
      source: "@/lib/utils",
      names: ["cn"],
    })
  })

  describe("cvaExports", () => {
    it("has exactly one cva export named buttonVariants", () => {
      expect(tree.cvaExports).toHaveLength(1)
      expect(tree.cvaExports[0].name).toBe("buttonVariants")
      expect(tree.cvaExports[0].exported).toBe(true)
    })

    it("captures the base class string verbatim", () => {
      const base = tree.cvaExports[0].baseClasses
      expect(base).toContain("inline-flex")
      expect(base).toContain("shrink-0")
      expect(base).toContain(
        "[&_svg:not([class*='size-'])]:size-4",
      )
    })

    it("captures all 6 variant values", () => {
      const variantGroup = tree.cvaExports[0].variants.variant
      expect(Object.keys(variantGroup).sort()).toEqual(
        ["default", "destructive", "ghost", "link", "outline", "secondary"].sort(),
      )
      expect(variantGroup.default).toBe(
        "bg-primary text-primary-foreground hover:bg-primary/90",
      )
    })

    it("captures all 8 size values (including the quoted keys)", () => {
      const sizeGroup = tree.cvaExports[0].variants.size
      expect(Object.keys(sizeGroup).sort()).toEqual(
        [
          "default",
          "xs",
          "sm",
          "lg",
          "icon",
          "icon-xs",
          "icon-sm",
          "icon-lg",
        ].sort(),
      )
      expect(sizeGroup["icon-xs"]).toContain("size-6")
    })

    it("captures defaultVariants", () => {
      expect(tree.cvaExports[0].defaultVariants).toEqual({
        variant: "default",
        size: "default",
      })
    })
  })

  describe("subComponents", () => {
    it("has exactly one sub-component: Button", () => {
      expect(tree.subComponents).toHaveLength(1)
      expect(tree.subComponents[0].name).toBe("Button")
      expect(tree.subComponents[0].dataSlot).toBe("button")
      expect(tree.subComponents[0].exportOrder).toBe(0)
      expect(tree.subComponents[0].isDefaultExport).toBe(false)
    })

    it("uses the cva variant strategy pointing at buttonVariants", () => {
      expect(tree.subComponents[0].variantStrategy).toEqual({
        kind: "cva",
        cvaRef: "buttonVariants",
      })
    })

    it("captures the `const Comp = ...` line as body passthrough", () => {
      const passthrough = tree.subComponents[0].passthrough
      expect(passthrough).toHaveLength(1)
      expect(passthrough[0].kind).toBe("statement")
      expect(passthrough[0].source).toContain("const Comp")
      expect(passthrough[0].source).toContain("asChild")
      expect(passthrough[0].source).toContain("Slot.Root")
    })

    it("captures the intersection prop declaration with defaults folded in", () => {
      const propsDecl = tree.subComponents[0].propsDecl
      expect(propsDecl.kind).toBe("intersection")
      if (propsDecl.kind !== "intersection") return

      // Should have 3 parts: component-props<"button">, VariantProps, inline { asChild }
      expect(propsDecl.parts).toHaveLength(3)
      expect(propsDecl.parts[0]).toEqual({
        kind: "component-props",
        target: "button",
      })
      expect(propsDecl.parts[1]).toEqual({
        kind: "variant-props",
        cvaRef: "buttonVariants",
      })

      const inlinePart = propsDecl.parts[2]
      expect(inlinePart.kind).toBe("inline")
      if (inlinePart.kind !== "inline") return
      expect(inlinePart.properties).toHaveLength(1)
      expect(inlinePart.properties[0]).toMatchObject({
        name: "asChild",
        type: "boolean",
        optional: true,
        defaultValue: "false",
      })
    })
  })

  describe("root part", () => {
    const root = tree.subComponents[0].parts.root

    it("uses the dynamic-ref base pointing at Comp", () => {
      expect(root.base).toEqual({ kind: "dynamic-ref", localName: "Comp" })
    })

    it("has the button data-slot promoted to the structured field", () => {
      expect(root.dataSlot).toBe("button")
    })

    it("captures the className as a cn-call wrapping a cva-call", () => {
      // The real className is `cn(buttonVariants({ variant, size, className }))`
      // which gets captured as `cva-call` (our cn-unwrap heuristic picks the
      // inner buttonVariants call and surfaces it directly).
      expect(root.className.kind).toBe("cva-call")
      if (root.className.kind !== "cva-call") return
      expect(root.className.cvaRef).toBe("buttonVariants")
      expect(root.className.args.sort()).toEqual(
        ["className", "size", "variant"].sort(),
      )
    })

    it("captures data-variant and data-size as attributes", () => {
      expect(root.attributes["data-variant"]).toBe("{variant}")
      expect(root.attributes["data-size"]).toBe("{size}")
    })

    it("spreads props and does not mark asChild (that's body logic)", () => {
      expect(root.propsSpread).toBe(true)
      expect(root.asChild).toBe(false)
      expect(root.children).toEqual([])
    })
  })
})

describe("parseSource — error handling", () => {
  // Accordion uses `<AccordionPrimitive.Root>` which is a qualified JSX tag
  // name. Pillar 2a's `resolveBase` deliberately rejects these — Radix
  // primitive recognition lands in Pillar 2b.
  it("throws a ParserError (not a raw crash) for constructs outside Pillar 2a scope", () => {
    const source = loadComponentSource("components/ui/accordion.tsx")
    expect(() => parseSource(source, "components/ui/accordion.tsx")).toThrow(
      ParserError,
    )
  })

  it("the error includes file path and line information", () => {
    const source = loadComponentSource("components/ui/accordion.tsx")
    try {
      parseSource(source, "components/ui/accordion.tsx")
      throw new Error("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ParserError)
      if (!(err instanceof ParserError)) return
      expect(err.filePath).toBe("components/ui/accordion.tsx")
      expect(err.line).toBeGreaterThan(0)
      expect(err.column).toBeGreaterThan(0)
      expect(err.reason.length).toBeGreaterThan(0)
    }
  })
})

describe("parseSource — happy accident: Card also parses", () => {
  // Card is pure function components over plain <div> with cn() className
  // and `React.ComponentProps<"div">` props. Pillar 2a's code path handles
  // every piece of that incidentally. Documenting the behaviour here so the
  // 2b ticket can formally include Card in the easy bucket without surprise.
  it("successfully parses Card even though it was not a 2a target", () => {
    const source = loadComponentSource("components/ui/card.tsx")
    const tree = parseSource(source, "components/ui/card.tsx")
    expect(tree.name).toBe("Card")
    expect(tree.subComponents.length).toBeGreaterThanOrEqual(1)
    expect(tree.subComponents[0].parts.root.base).toEqual({
      kind: "html",
      tag: "div",
    })
  })
})
