import { describe, expect, test } from "vitest"

import {
  createComponentTreeV2,
  createCvaExport,
  createPartNode,
  createSubComponentV2,
  createV2TreeFromScratch,
  liftV1TreeToV2,
  toDataSlot,
  toSlug,
  translatePropsToV2Inline,
  translateVariantsToV2Cva,
  translateVariantsToV2DataAttr,
  type LegacyComponentTreeV1,
} from "@/lib/component-tree-v2-factories"
import type {
  ComponentProp,
  CustomVariantDef,
} from "@/lib/component-state"

/* ── Test helpers — minimal v1 tree construction ─────────────────
 *
 * GEO-305 Step 6 deleted `lib/component-tree.ts`. The lift tests below
 * still need v1-shaped input, so we synthesize legacy trees inline
 * using the `LegacyComponentTreeV1` shape exported from the factories.
 */

let legacyIdCounter = 0
function legacyId(): string {
  legacyIdCounter++
  return `el_${Date.now().toString(36)}_${legacyIdCounter.toString(36)}`
}

function legacyElementNode(
  tag: string,
): LegacyComponentTreeV1["assemblyTree"] {
  return { id: legacyId(), tag, children: [], classes: [] }
}

function legacyComponentTree(
  name: string,
  baseElement: string,
): LegacyComponentTreeV1 {
  return {
    name,
    baseElement,
    dataSlot: name
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase(),
    classes: [],
    assemblyTree: legacyElementNode(baseElement),
    props: [],
    variants: [],
    subComponents: [],
  }
}

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

  test("parts.root carries the same dataSlot as the sub-component", () => {
    const sub = createSubComponentV2("MyCard", "div", 0)
    expect(sub.parts.root.dataSlot).toBe("my-card")
  })

  test("parts.root spreads {...props} so the JSX forwards everything", () => {
    const sub = createSubComponentV2("MyCard", "div", 0)
    expect(sub.parts.root.propsSpread).toBe(true)
  })

  test("parts.root className is a cn-call so the visual editor can splice", () => {
    const sub = createSubComponentV2("MyCard", "div", 0)
    expect(sub.parts.root.className.kind).toBe("cn-call")
    if (sub.parts.root.className.kind === "cn-call") {
      // Empty base literal + className override is the canonical shadcn shape
      expect(sub.parts.root.className.args).toEqual(['""', "className"])
    }
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

/* ── translatePropsToV2Inline ───────────────────────────────────── */

describe("translatePropsToV2Inline", () => {
  test("translates string props with default values", () => {
    const props: ComponentProp[] = [
      { name: "label", type: "string", required: true, defaultValue: "Click me" },
    ]
    const result = translatePropsToV2Inline(props)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: "label",
      type: "string",
      optional: false,
      defaultValue: '"Click me"',
    })
  })

  test("translates boolean props", () => {
    const props: ComponentProp[] = [
      { name: "disabled", type: "boolean", required: false, defaultValue: "false" },
    ]
    const result = translatePropsToV2Inline(props)
    expect(result[0].type).toBe("boolean")
    expect(result[0].optional).toBe(true)
    expect(result[0].defaultValue).toBe("false")
  })

  test("translates ReactNode props to React.ReactNode", () => {
    const props: ComponentProp[] = [
      { name: "icon", type: "ReactNode", required: false },
    ]
    const result = translatePropsToV2Inline(props)
    expect(result[0].type).toBe("React.ReactNode")
    expect(result[0].defaultValue).toBeUndefined()
  })

  test("optional flag inverts the v1 required flag", () => {
    const props: ComponentProp[] = [
      { name: "a", type: "string", required: true },
      { name: "b", type: "string", required: false },
    ]
    const result = translatePropsToV2Inline(props)
    expect(result[0].optional).toBe(false)
    expect(result[1].optional).toBe(true)
  })
})

/* ── translateVariantsToV2Cva ───────────────────────────────────── */

describe("translateVariantsToV2Cva", () => {
  test("returns null when there are no variants", () => {
    expect(translateVariantsToV2Cva([], "MyCard")).toBeNull()
  })

  test("translates a variant group with options", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["sm", "md", "lg"],
        defaultValue: "md",
      },
    ]
    const result = translateVariantsToV2Cva(variants, "MyCard")
    expect(result).not.toBeNull()
    if (!result) return

    expect(result.cvaRef).toBe("myCardVariants")
    expect(result.cva.name).toBe("myCardVariants")
    expect(result.cva.variants).toEqual({
      size: { sm: "", md: "", lg: "" },
    })
    expect(result.cva.defaultVariants).toEqual({ size: "md" })
    expect(result.cva.exported).toBe(true)
  })

  test("translates a boolean variant as a true/false group", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "disabled",
        type: "boolean",
        options: [],
        defaultValue: "false",
      },
    ]
    const result = translateVariantsToV2Cva(variants, "MyButton")
    expect(result).not.toBeNull()
    if (!result) return

    expect(result.cva.variants).toEqual({
      disabled: { true: "", false: "" },
    })
    expect(result.cva.defaultVariants).toEqual({ disabled: "false" })
  })

  test("merges multiple variant groups", () => {
    const variants: CustomVariantDef[] = [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
      { name: "tone", type: "variant", options: ["light", "dark"], defaultValue: "light" },
    ]
    const result = translateVariantsToV2Cva(variants, "MyCard")
    expect(result).not.toBeNull()
    if (!result) return

    expect(Object.keys(result.cva.variants)).toEqual(["size", "tone"])
    expect(result.cva.defaultVariants).toEqual({ size: "sm", tone: "light" })
  })

  test("ignores variants with strategy: data-attr", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    expect(translateVariantsToV2Cva(variants, "MyCard")).toBeNull()
  })

  test("absent strategy defaults to cva for backwards compatibility", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["sm", "lg"],
        defaultValue: "sm",
        // no strategy field — mirrors existing localStorage entries
      },
    ]
    const result = translateVariantsToV2Cva(variants, "MyCard")
    expect(result).not.toBeNull()
  })

  test("mixes cva + data-attr variants: only cva-strategy ones land here", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "variant",
        type: "variant",
        options: ["default", "outline"],
        defaultValue: "default",
        strategy: "cva",
      },
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const result = translateVariantsToV2Cva(variants, "MyButton")
    expect(result).not.toBeNull()
    if (!result) return
    expect(Object.keys(result.cva.variants)).toEqual(["variant"])
  })
})

/* ── translateVariantsToV2DataAttr ──────────────────────────────── */

describe("translateVariantsToV2DataAttr", () => {
  test("returns empty for variants with absent strategy (backwards compat)", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["sm", "lg"],
        defaultValue: "sm",
      },
    ]
    const result = translateVariantsToV2DataAttr(variants)
    expect(result.dataAttrVariants).toEqual([])
    expect(result.inlineProperties).toEqual([])
  })

  test("translates a string-union data-attr variant", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const result = translateVariantsToV2DataAttr(variants)
    expect(result.dataAttrVariants).toEqual([
      {
        propName: "size",
        values: ["default", "sm"],
        defaultValue: "default",
        attrName: "data-size",
      },
    ])
    expect(result.inlineProperties).toEqual([
      {
        name: "size",
        type: '"default" | "sm"',
        optional: true,
        defaultValue: '"default"',
      },
    ])
  })

  test("translates a boolean data-attr variant to a true/false union prop", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "disabled",
        type: "boolean",
        options: [],
        defaultValue: "false",
        strategy: "data-attr",
      },
    ]
    const result = translateVariantsToV2DataAttr(variants)
    expect(result.dataAttrVariants[0]).toEqual({
      propName: "disabled",
      values: ["true", "false"],
      defaultValue: "false",
      attrName: "data-disabled",
    })
    expect(result.inlineProperties[0]).toEqual({
      name: "disabled",
      type: "boolean",
      optional: true,
      defaultValue: "false",
    })
  })

  test("converts camelCase prop names to kebab-case for the data attribute", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "menuSize",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const result = translateVariantsToV2DataAttr(variants)
    expect(result.dataAttrVariants[0].attrName).toBe("data-menu-size")
    expect(result.dataAttrVariants[0].propName).toBe("menuSize")
  })

  test("ignores cva-strategy variants", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "cva",
      },
    ]
    const result = translateVariantsToV2DataAttr(variants)
    expect(result.dataAttrVariants).toEqual([])
  })
})

/* ── createV2TreeFromScratch ────────────────────────────────────── */

describe("createV2TreeFromScratch", () => {
  test("with no props or variants, matches createComponentTreeV2", () => {
    const tree = createV2TreeFromScratch("MyCard", "div", [], [])

    expect(tree.name).toBe("MyCard")
    expect(tree.subComponents).toHaveLength(1)
    expect(tree.cvaExports).toEqual([])
    expect(tree.subComponents[0].propsDecl.kind).toBe("single")
    expect(tree.subComponents[0].variantStrategy).toEqual({ kind: "none" })
  })

  test("with props, promotes propsDecl to intersection", () => {
    const props: ComponentProp[] = [
      { name: "label", type: "string", required: true },
    ]
    const tree = createV2TreeFromScratch("MyCard", "div", props, [])

    const decl = tree.subComponents[0].propsDecl
    expect(decl.kind).toBe("intersection")
    if (decl.kind !== "intersection") return
    expect(decl.parts).toHaveLength(2)
    expect(decl.parts[0].kind).toBe("component-props")
    expect(decl.parts[1].kind).toBe("inline")
  })

  test("with variants, adds a cva export and points the strategy at it", () => {
    const variants: CustomVariantDef[] = [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ]
    const tree = createV2TreeFromScratch("MyCard", "div", [], variants)

    expect(tree.cvaExports).toHaveLength(1)
    expect(tree.cvaExports[0].name).toBe("myCardVariants")
    expect(tree.subComponents[0].variantStrategy).toEqual({
      kind: "cva",
      cvaRef: "myCardVariants",
    })

    // PropsDecl should also intersect the VariantProps type
    const decl = tree.subComponents[0].propsDecl
    expect(decl.kind).toBe("intersection")
    if (decl.kind !== "intersection") return
    expect(decl.parts.some((p) => p.kind === "variant-props")).toBe(true)
  })

  test("with both props AND variants, intersection contains all three parts", () => {
    const props: ComponentProp[] = [
      { name: "label", type: "string", required: true },
    ]
    const variants: CustomVariantDef[] = [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ]
    const tree = createV2TreeFromScratch("MyCard", "div", props, variants)

    const decl = tree.subComponents[0].propsDecl
    expect(decl.kind).toBe("intersection")
    if (decl.kind !== "intersection") return
    expect(decl.parts).toHaveLength(3)
    expect(decl.parts.map((p) => p.kind).sort()).toEqual([
      "component-props",
      "inline",
      "variant-props",
    ])
  })

  test("with a data-attr variant, sets variantStrategy + adds inline prop + adds root data attribute", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const tree = createV2TreeFromScratch("MyCard", "div", [], variants)
    const sub = tree.subComponents[0]

    // No cva export (that was the cva-strategy path)
    expect(tree.cvaExports).toEqual([])

    // variantStrategy is data-attr with the variant in its list
    expect(sub.variantStrategy).toEqual({
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

    // Inline prop was added to the propsDecl
    expect(sub.propsDecl.kind).toBe("intersection")
    if (sub.propsDecl.kind !== "intersection") return
    const inline = sub.propsDecl.parts.find((p) => p.kind === "inline")
    expect(inline).toBeDefined()
    if (!inline || inline.kind !== "inline") return
    expect(inline.properties).toEqual([
      {
        name: "size",
        type: '"default" | "sm"',
        optional: true,
        defaultValue: '"default"',
      },
    ])

    // Root element has the data-size={size} attribute binding
    expect(sub.parts.root.attributes).toEqual({
      "data-size": "{size}",
    })
  })

  test("with a data-attr variant + existing prop, inline prop part contains both", () => {
    const props: ComponentProp[] = [
      { name: "label", type: "string", required: true },
    ]
    const variants: CustomVariantDef[] = [
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const tree = createV2TreeFromScratch("MyCard", "div", props, variants)
    const sub = tree.subComponents[0]

    if (sub.propsDecl.kind !== "intersection") throw new Error("expected intersection")
    const inline = sub.propsDecl.parts.find((p) => p.kind === "inline")
    if (!inline || inline.kind !== "inline") throw new Error("expected inline part")
    expect(inline.properties.map((p) => p.name).sort()).toEqual(["label", "size"])
  })

  test("with cva + data-attr variants on the same sub-component, cva wins the strategy field", () => {
    const variants: CustomVariantDef[] = [
      {
        name: "variant",
        type: "variant",
        options: ["default", "outline"],
        defaultValue: "default",
        strategy: "cva",
      },
      {
        name: "size",
        type: "variant",
        options: ["default", "sm"],
        defaultValue: "default",
        strategy: "data-attr",
      },
    ]
    const tree = createV2TreeFromScratch("MyButton", "button", [], variants)
    const sub = tree.subComponents[0]

    // cva claims the strategy field
    expect(sub.variantStrategy.kind).toBe("cva")

    // cva export has only the cva-strategy variant
    expect(tree.cvaExports).toHaveLength(1)
    expect(Object.keys(tree.cvaExports[0].variants)).toEqual(["variant"])

    // Data-attr variant still becomes an inline prop + root attribute
    expect(sub.parts.root.attributes).toHaveProperty("data-size", "{size}")
    if (sub.propsDecl.kind !== "intersection") throw new Error("expected intersection")
    const inline = sub.propsDecl.parts.find((p) => p.kind === "inline")
    expect(inline && inline.kind === "inline" && inline.properties.some((p) => p.name === "size")).toBe(true)
  })
})

/* ── liftV1TreeToV2 ─────────────────────────────────────────────── */

describe("liftV1TreeToV2", () => {
  test("lifts a minimal v1 tree", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    const v2 = liftV1TreeToV2(v1)

    expect(v2.name).toBe("MyCard")
    expect(v2.slug).toBe("my-card")
    expect(v2.subComponents).toHaveLength(1)
    expect(v2.subComponents[0].name).toBe("MyCard")
    expect(v2.subComponents[0].parts.root.base).toEqual({
      kind: "html",
      tag: "div",
    })
  })

  test("lifts root classes onto the root part's cn-call", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    v1.classes = ["p-4", "bg-blue-500"]
    const v2 = liftV1TreeToV2(v1)

    const root = v2.subComponents[0].parts.root
    expect(root.className.kind).toBe("cn-call")
    if (root.className.kind === "cn-call") {
      expect(root.className.args[0]).toBe('"p-4 bg-blue-500"')
    }
  })

  test("lifts assemblyTree children to part children", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    const child1 = legacyElementNode("section")
    child1.classes = ["mt-4"]
    const child2 = legacyElementNode("p")
    child2.text = "Hello"
    v1.assemblyTree.children = [child1, child2]

    const v2 = liftV1TreeToV2(v1)
    const root = v2.subComponents[0].parts.root
    expect(root.children).toHaveLength(2)

    const c1 = root.children[0]
    expect(c1.kind).toBe("part")
    if (c1.kind !== "part") return
    expect(c1.part.base).toEqual({ kind: "html", tag: "section" })
    if (c1.part.className.kind === "cn-call") {
      expect(c1.part.className.args[0]).toBe('"mt-4"')
    }

    const c2 = root.children[1]
    if (c2.kind !== "part") return
    expect(c2.part.base).toEqual({ kind: "html", tag: "p" })
    // Text gets prepended as a text child
    expect(c2.part.children[0]).toEqual({ kind: "text", value: "Hello" })
  })

  test("lifts v1 sub-components as additional v2 sub-components", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    v1.subComponents = [
      {
        id: "sc-1",
        name: "MyCardHeader",
        baseElement: "div",
        dataSlot: "my-card-header",
        classes: ["p-2", "bg-muted"],
        props: [],
        variants: [],
      },
    ]

    const v2 = liftV1TreeToV2(v1)
    expect(v2.subComponents).toHaveLength(2)
    expect(v2.subComponents[0].name).toBe("MyCard")
    expect(v2.subComponents[1].name).toBe("MyCardHeader")
    expect(v2.subComponents[1].dataSlot).toBe("my-card-header")
    if (v2.subComponents[1].parts.root.className.kind === "cn-call") {
      expect(v2.subComponents[1].parts.root.className.args[0]).toBe(
        '"p-2 bg-muted"',
      )
    }
  })

  test("lifts v1 props into the propsDecl as an intersection", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    v1.props = [{ name: "label", type: "string", required: true }]
    const v2 = liftV1TreeToV2(v1)

    const decl = v2.subComponents[0].propsDecl
    expect(decl.kind).toBe("intersection")
    if (decl.kind !== "intersection") return
    const inlinePart = decl.parts.find((p) => p.kind === "inline")
    expect(inlinePart).toBeDefined()
  })

  test("lifts v1 variants into a cva export + variant-props intersection", () => {
    const v1 = legacyComponentTree("MyCard", "div")
    v1.variants = [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ]
    const v2 = liftV1TreeToV2(v1)

    expect(v2.cvaExports).toHaveLength(1)
    expect(v2.cvaExports[0].name).toBe("myCardVariants")
    expect(v2.subComponents[0].variantStrategy).toEqual({
      kind: "cva",
      cvaRef: "myCardVariants",
    })
  })
})
