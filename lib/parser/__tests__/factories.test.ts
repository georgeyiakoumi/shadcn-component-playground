import { describe, expect, test } from "vitest"

import {
  createComponentTreeV2,
  createCvaExport,
  createPartNode,
  createSubComponentV2,
  toDataSlot,
  toSlug,
} from "@/lib/component-tree-v2-factories"

/* ── toDataSlot / toSlug ────────────────────────────────────────── */

describe("toDataSlot", () => {
  test("PascalCase → kebab-case", () => {
    expect(toDataSlot("Button")).toBe("button")
    expect(toDataSlot("MyCard")).toBe("my-card")
    expect(toDataSlot("MyCardHeader")).toBe("my-card-header")
  })

  test("acronyms in middle of name", () => {
    expect(toDataSlot("ItemHTMLContent")).toBe("item-html-content")
  })

  test("digits stay attached", () => {
    expect(toDataSlot("H1Title")).toBe("h1-title")
  })
})

describe("toSlug", () => {
  test("matches toDataSlot for the same kind of input", () => {
    expect(toSlug("Button")).toBe("button")
    expect(toSlug("AlertDialog")).toBe("alert-dialog")
  })
})

/* ── createPartNode ─────────────────────────────────────────────── */

describe("createPartNode", () => {
  test("wraps an HTML tag with sane defaults", () => {
    const part = createPartNode("div")

    expect(part.base).toEqual({ kind: "html", tag: "div" })
    expect(part.className).toEqual({ kind: "literal", value: "" })
    expect(part.propsSpread).toBe(false)
    expect(part.attributes).toEqual({})
    expect(part.asChild).toBe(false)
    expect(part.children).toEqual([])
  })

  test("handles arbitrary tags including button", () => {
    const part = createPartNode("button")
    expect(part.base.kind).toBe("html")
    if (part.base.kind === "html") {
      expect(part.base.tag).toBe("button")
    }
  })
})

/* ── createSubComponentV2 ───────────────────────────────────────── */

describe("createSubComponentV2", () => {
  test("produces a sub-component with the right shape", () => {
    const sub = createSubComponentV2("MyCard", "div", 0)

    expect(sub.name).toBe("MyCard")
    expect(sub.dataSlot).toBe("my-card")
    expect(sub.exportOrder).toBe(0)
    expect(sub.isDefaultExport).toBe(false)
    expect(sub.jsdoc).toBeNull()
    expect(sub.passthrough).toEqual([])
    expect(sub.variantStrategy).toEqual({ kind: "none" })
  })

  test("propsDecl wraps the base tag's component-props", () => {
    const sub = createSubComponentV2("MyButton", "button", 0)

    expect(sub.propsDecl.kind).toBe("single")
    if (sub.propsDecl.kind === "single") {
      expect(sub.propsDecl.part.kind).toBe("component-props")
      if (sub.propsDecl.part.kind === "component-props") {
        expect(sub.propsDecl.part.target).toBe("button")
      }
    }
  })

  test("parts.root is a fresh PartNode wrapping the base tag", () => {
    const sub = createSubComponentV2("MyCard", "div", 0)

    expect(sub.parts.root.base).toEqual({ kind: "html", tag: "div" })
    expect(sub.parts.root.children).toEqual([])
  })

  test("exportOrder is preserved as supplied", () => {
    const sub = createSubComponentV2("MyCardHeader", "div", 3)
    expect(sub.exportOrder).toBe(3)
  })
})

/* ── createComponentTreeV2 ──────────────────────────────────────── */

describe("createComponentTreeV2", () => {
  test("derives slug + filePath from name", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.name).toBe("MyCard")
    expect(tree.slug).toBe("my-card")
    expect(tree.filePath).toBe("components/ui/my-card.tsx")
  })

  test("starts in handleable state with no escape hatch", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.roundTripRisk).toBe("handleable")
    expect(tree.customHandling).toBe(false)
    expect(tree.rawSource).toBeUndefined()
  })

  test("does NOT have an originalSource (template emission required)", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    expect(tree.originalSource).toBeUndefined()
  })

  test("includes React + cn imports out of the box", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.imports).toHaveLength(2)
    expect(tree.imports[0]).toEqual({
      kind: "default-namespace",
      source: "react",
      localName: "React",
      namespaceImport: true,
    })
    expect(tree.imports[1]).toEqual({
      kind: "named",
      source: "@/lib/utils",
      names: ["cn"],
    })
  })

  test("starts with one root sub-component matching the parent name", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.subComponents).toHaveLength(1)
    expect(tree.subComponents[0].name).toBe("MyCard")
    expect(tree.subComponents[0].dataSlot).toBe("my-card")
    expect(tree.subComponents[0].exportOrder).toBe(0)
  })

  test("starts with no cva, context, or hook exports", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.cvaExports).toEqual([])
    expect(tree.contextExports).toEqual([])
    expect(tree.hookExports).toEqual([])
  })

  test("starts with empty directives + filePassthrough", () => {
    const tree = createComponentTreeV2("MyCard", "div")

    expect(tree.directives).toEqual([])
    expect(tree.filePassthrough).toEqual([])
  })
})

/* ── createCvaExport ────────────────────────────────────────────── */

describe("createCvaExport", () => {
  test("creates an empty exported cva", () => {
    const cva = createCvaExport("myCardVariants")

    expect(cva.name).toBe("myCardVariants")
    expect(cva.baseClasses).toBe("")
    expect(cva.variants).toEqual({})
    expect(cva.defaultVariants).toBeUndefined()
    expect(cva.exported).toBe(true)
  })
})
