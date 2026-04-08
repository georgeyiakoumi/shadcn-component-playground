/**
 * Tests for the data-attribute variant strategy — the newer shadcn
 * authoring pattern used by Card, Accordion, etc.
 *
 * Coverage:
 * - Parser recogniser sets variantStrategy to `{ kind: "data-attr", ... }`
 *   on a Card-shaped source
 * - Round-trip byte-equivalence (parse → generate) for the Card fixture
 * - Recogniser correctly declines to match Button (which is cva + DOM
 *   mirror, not pure data-attr)
 *
 * The fixture lives next to this file in `fixtures/card-data-attr.tsx.txt`.
 * `.txt` extension to keep it out of the normal TS compilation sweep.
 *
 * GEO-XXX — post-PR#29 data-attribute variant strategy.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseSource } from "@/lib/parser/parse-source-v2"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import { recogniseDataAttrVariants } from "@/lib/parser/data-attr-variant-recogniser"
import { createV2TreeFromScratch } from "@/lib/component-tree-v2-factories"
import { setDataAttrSlotClasses } from "@/lib/parser/data-attr-slot"
import type { CustomVariantDef } from "@/lib/component-state"

const FIXTURES_DIR = path.resolve(__dirname, "fixtures")

function loadFixture(name: string): string {
  return readFileSync(path.join(FIXTURES_DIR, name), "utf-8")
}

describe("data-attr variant recogniser — Card fixture", () => {
  const source = loadFixture("card-data-attr.tsx.txt")
  const tree = parseSource(source, "components/ui/card.tsx")

  it("round-trips byte-equivalently through parse → generate", () => {
    expect(generateFromTreeV2(tree)).toBe(source)
  })

  it("detects a data-attr variant on the root Card sub-component", () => {
    const cardSub = tree.subComponents.find((s) => s.name === "Card")
    expect(cardSub).toBeDefined()
    expect(cardSub!.variantStrategy).toEqual({
      kind: "data-attr",
      variants: [
        {
          propName: "size",
          values: ["default", "sm"],
          defaultValue: "default",
          attrName: "data-size",
        },
      ],
    })
  })

  it("leaves the child sub-components as variantStrategy: none", () => {
    // CardHeader, CardTitle, etc. don't declare their own variants; they
    // react to the parent's via `group-data-[size=sm]/card:` classes
    // inside their cn() base strings. That classification stays `none`
    // because the strategy is a sub-component-local concept.
    const childNames = [
      "CardHeader",
      "CardTitle",
      "CardDescription",
      "CardAction",
      "CardContent",
      "CardFooter",
    ]
    for (const name of childNames) {
      const sub = tree.subComponents.find((s) => s.name === name)
      expect(sub, `expected sub-component ${name}`).toBeDefined()
      expect(sub!.variantStrategy).toEqual({ kind: "none" })
    }
  })

  it("preserves the cn() base string with all data-[size=sm]: classes verbatim", () => {
    const cardSub = tree.subComponents.find((s) => s.name === "Card")!
    const className = cardSub.parts.root.className
    expect(className.kind).toBe("cn-call")
    if (className.kind === "cn-call") {
      const first = className.args[0]
      expect(first).toContain("data-[size=sm]:gap-3")
      expect(first).toContain("data-[size=sm]:py-3")
      expect(first).toContain(
        "data-[size=sm]:has-data-[slot=card-footer]:pb-0",
      )
      expect(first).toContain("group/card")
    }
  })
})

describe("data-attr variant recogniser — Button (cva + DOM mirror)", () => {
  it("does NOT classify Button as data-attr even though it has data-variant + data-size", () => {
    // Button has `data-variant={variant}` and `data-size={size}` attributes
    // on the root, and `variant` / `size` inline props with unions and
    // defaults. BUT its className is `cn(buttonVariants(...))` — a cva-call
    // — so the variant strategy must be `cva`. The cva export is where the
    // classes live; the data-attr mirrors are downstream decoration only.
    const source = readFileSync(
      path.resolve(__dirname, "..", "..", "..", "components/ui/button.tsx"),
      "utf-8",
    )
    const tree = parseSource(source, "components/ui/button.tsx")
    const buttonSub = tree.subComponents.find((s) => s.name === "Button")!
    expect(buttonSub.variantStrategy.kind).toBe("cva")
  })
})

describe("data-attr variant recogniser — unit edge cases", () => {
  it("returns empty list for a sub-component with no inline props", () => {
    // A minimal PartNode + PropsDecl with no inline properties.
    const result = recogniseDataAttrVariants(
      { kind: "single", part: { kind: "component-props", target: "div" } },
      {
        base: { kind: "html", tag: "div" },
        className: { kind: "cn-call", args: ['"p-4"', "className"] },
        propsSpread: true,
        attributes: {},
        asChild: false,
        children: [],
      },
    )
    expect(result).toEqual([])
  })

  it("returns empty when the inline prop union has no default value", () => {
    const result = recogniseDataAttrVariants(
      {
        kind: "intersection",
        parts: [
          { kind: "component-props", target: "div" },
          {
            kind: "inline",
            properties: [
              {
                name: "size",
                type: '"default" | "sm"',
                optional: true,
                // no defaultValue
              },
            ],
          },
        ],
      },
      {
        base: { kind: "html", tag: "div" },
        className: {
          kind: "cn-call",
          args: ['"data-[size=sm]:p-2"', "className"],
        },
        propsSpread: true,
        attributes: { "data-size": "{size}" },
        asChild: false,
        children: [],
      },
    )
    expect(result).toEqual([])
  })

  it("returns empty when the root has no matching data-* attribute", () => {
    const result = recogniseDataAttrVariants(
      {
        kind: "intersection",
        parts: [
          { kind: "component-props", target: "div" },
          {
            kind: "inline",
            properties: [
              {
                name: "size",
                type: '"default" | "sm"',
                optional: true,
                defaultValue: '"default"',
              },
            ],
          },
        ],
      },
      {
        base: { kind: "html", tag: "div" },
        className: {
          kind: "cn-call",
          args: ['"data-[size=sm]:p-2"', "className"],
        },
        propsSpread: true,
        attributes: {}, // no data-size binding
        asChild: false,
        children: [],
      },
    )
    expect(result).toEqual([])
  })

  it("returns empty when the cn() base has no data-[prop=value]: prefix", () => {
    const result = recogniseDataAttrVariants(
      {
        kind: "intersection",
        parts: [
          { kind: "component-props", target: "div" },
          {
            kind: "inline",
            properties: [
              {
                name: "size",
                type: '"default" | "sm"',
                optional: true,
                defaultValue: '"default"',
              },
            ],
          },
        ],
      },
      {
        base: { kind: "html", tag: "div" },
        className: { kind: "cn-call", args: ['"p-4"', "className"] }, // no size prefixes
        propsSpread: true,
        attributes: { "data-size": "{size}" },
        asChild: false,
        children: [],
      },
    )
    expect(result).toEqual([])
  })

  it("matches a well-formed data-attr variant", () => {
    const result = recogniseDataAttrVariants(
      {
        kind: "intersection",
        parts: [
          { kind: "component-props", target: "div" },
          {
            kind: "inline",
            properties: [
              {
                name: "size",
                type: '"default" | "sm"',
                optional: true,
                defaultValue: '"default"',
              },
            ],
          },
        ],
      },
      {
        base: { kind: "html", tag: "div" },
        className: {
          kind: "cn-call",
          args: ['"p-4 data-[size=sm]:p-2"', "className"],
        },
        propsSpread: true,
        attributes: { "data-size": "{size}" },
        asChild: false,
        children: [],
      },
    )
    expect(result).toEqual([
      {
        propName: "size",
        values: ["default", "sm"],
        defaultValue: "default",
        attrName: "data-size",
      },
    ])
  })
})

/* ── End-to-end: factory → slot edit → generate ─────────────────── */

describe("from-scratch data-attr: factory → slot edit → generate", () => {
  function makeCardFactoryTree() {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    return createV2TreeFromScratch("MyCard", "div", [], variants)
  }

  it("generates a function signature with inline destructured size prop", () => {
    const tree = makeCardFactoryTree()
    const out = generateFromTreeV2(tree)
    expect(out).toContain('size = "default"')
    expect(out).toContain('"default" | "sm"')
  })

  it("emits data-size={size} on the root element", () => {
    const tree = makeCardFactoryTree()
    const out = generateFromTreeV2(tree)
    expect(out).toContain("data-size={size}")
  })

  it("does NOT emit a cva import when the variant is data-attr only", () => {
    const tree = makeCardFactoryTree()
    const out = generateFromTreeV2(tree)
    expect(out).not.toContain('from "class-variance-authority"')
    expect(out).not.toContain("cva(")
  })

  it("writing default-slot classes emits them in the cn() base unprefixed", () => {
    const before = makeCardFactoryTree()
    const after = setDataAttrSlotClasses(before, "MyCard", "size", "default", [
      "p-4",
      "bg-muted",
    ])
    const out = generateFromTreeV2(after)
    expect(out).toContain('cn("p-4 bg-muted", className)')
    expect(out).not.toContain("data-[size=default]:")
  })

  it("writing sm-slot classes emits them with data-[size=sm]: prefix", () => {
    const before = makeCardFactoryTree()
    const after = setDataAttrSlotClasses(before, "MyCard", "size", "sm", [
      "p-2",
      "gap-2",
    ])
    const out = generateFromTreeV2(after)
    expect(out).toContain("data-[size=sm]:p-2")
    expect(out).toContain("data-[size=sm]:gap-2")
  })

  it("writing both default and sm slots coexists in the cn() base", () => {
    let tree = makeCardFactoryTree()
    tree = setDataAttrSlotClasses(tree, "MyCard", "size", "default", ["p-4"])
    tree = setDataAttrSlotClasses(tree, "MyCard", "size", "sm", ["p-2"])
    const out = generateFromTreeV2(tree)
    expect(out).toContain('cn("p-4 data-[size=sm]:p-2", className)')
  })

  it("produces a parseable, round-trip-safe .tsx file end-to-end", () => {
    // This is the critical invariant: the output of the generator on a
    // factory-built data-attr tree must itself parse and re-generate
    // byte-equivalently. Confirms the template emission path is on the
    // same semantic grounding as the slow-path splicer.
    let tree = makeCardFactoryTree()
    tree = setDataAttrSlotClasses(tree, "MyCard", "size", "default", [
      "p-4",
      "rounded-xl",
    ])
    tree = setDataAttrSlotClasses(tree, "MyCard", "size", "sm", ["p-2"])
    const out = generateFromTreeV2(tree)

    const reparsed = parseSource(out, "components/ui/my-card.tsx")
    const regenerated = generateFromTreeV2(reparsed)
    expect(regenerated).toBe(out)

    // The reparsed tree should also recognise the data-attr variant
    const reSub = reparsed.subComponents.find((s) => s.name === "MyCard")!
    expect(reSub.variantStrategy).toEqual({
      kind: "data-attr",
      variants: [
        {
          propName: "size",
          values: ["default", "sm"],
          defaultValue: "default",
          attrName: "data-size",
        },
      ],
    })
  })
})
