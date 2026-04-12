import { describe, expect, test } from "vitest"

import {
  addSubComponent,
  readPropsFromSub,
  readVariantsFromSub,
  removeSubComponent,
  renameSubComponent,
  reorderSubComponents,
  setPropsOnSub,
  setVariantsOnSub,
} from "@/lib/parser/v2-tree-define"
import { createComponentTreeV2 } from "@/lib/component-tree-v2-factories"
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"

/* ── readPropsFromSub ───────────────────────────────────────────── */

describe("readPropsFromSub", () => {
  test("returns empty for a freshly-created sub-component", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    expect(readPropsFromSub(tree.subComponents[0])).toEqual([])
  })

  test("reads back inline props that were just written", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const props: ComponentProp[] = [
      { name: "label", type: "string", required: true, defaultValue: "Click me" },
      { name: "disabled", type: "boolean", required: false, defaultValue: "false" },
    ]
    const updated = setPropsOnSub(tree.subComponents[0], props)
    const readBack = readPropsFromSub(updated)

    expect(readBack).toHaveLength(2)
    expect(readBack[0]).toEqual({
      name: "label",
      type: "string",
      required: true,
      defaultValue: "Click me",
    })
    expect(readBack[1]).toEqual({
      name: "disabled",
      type: "boolean",
      required: false,
      defaultValue: "false",
    })
  })
})

/* ── setPropsOnSub ──────────────────────────────────────────────── */

describe("setPropsOnSub", () => {
  test("setting empty props removes the inline part from propsDecl", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withProps = setPropsOnSub(tree.subComponents[0], [
      { name: "label", type: "string", required: true },
    ])
    const cleared = setPropsOnSub(withProps, [])
    expect(readPropsFromSub(cleared)).toEqual([])
  })

  test("setting props twice replaces the inline part", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const first = setPropsOnSub(tree.subComponents[0], [
      { name: "a", type: "string", required: true },
    ])
    const second = setPropsOnSub(first, [
      { name: "b", type: "number", required: false },
    ])
    const readBack = readPropsFromSub(second)
    expect(readBack).toHaveLength(1)
    expect(readBack[0].name).toBe("b")
  })
})

/* ── setVariantsOnSub / readVariantsFromSub ─────────────────────── */

describe("setVariantsOnSub / readVariantsFromSub", () => {
  test("adds a cva export and points the strategy at it", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const variants: CustomVariantDef[] = [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ]
    const updated = setVariantsOnSub(tree, 0, variants)

    expect(updated.cvaExports).toHaveLength(1)
    expect(updated.cvaExports[0].name).toBe("myCardVariants")
    expect(updated.subComponents[0].variantStrategy).toEqual({
      kind: "cva",
      cvaRef: "myCardVariants",
    })
  })

  test("read-back round-trips a variant definition", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const variants: CustomVariantDef[] = [
      { name: "size", type: "variant", options: ["sm", "md", "lg"], defaultValue: "md" },
    ]
    const updated = setVariantsOnSub(tree, 0, variants)
    const readBack = readVariantsFromSub(
      updated.subComponents[0],
      updated.cvaExports,
    )
    expect(readBack).toHaveLength(1)
    expect(readBack[0].name).toBe("size")
    expect(readBack[0].options).toEqual(["sm", "md", "lg"])
    expect(readBack[0].defaultValue).toBe("md")
  })

  test("boolean variants round-trip as boolean type", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const variants: CustomVariantDef[] = [
      { name: "disabled", type: "boolean", options: [], defaultValue: "false" },
    ]
    const updated = setVariantsOnSub(tree, 0, variants)
    const readBack = readVariantsFromSub(
      updated.subComponents[0],
      updated.cvaExports,
    )
    expect(readBack[0].type).toBe("boolean")
    expect(readBack[0].defaultValue).toBe("false")
  })

  test("clearing variants removes the cva export", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withVariants = setVariantsOnSub(tree, 0, [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ])
    const cleared = setVariantsOnSub(withVariants, 0, [])
    expect(cleared.cvaExports).toHaveLength(0)
    expect(cleared.subComponents[0].variantStrategy).toEqual({ kind: "none" })
  })

  test("preserves existing class strings when adding a new variant value", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withVariants = setVariantsOnSub(tree, 0, [
      { name: "size", type: "variant", options: ["sm"], defaultValue: "sm" },
    ])
    // Manually populate the existing variant's class string
    withVariants.cvaExports[0].variants.size.sm = "p-2"

    // Now add a second value to the same group
    const expanded = setVariantsOnSub(withVariants, 0, [
      { name: "size", type: "variant", options: ["sm", "lg"], defaultValue: "sm" },
    ])
    expect(expanded.cvaExports[0].variants.size.sm).toBe("p-2")
    expect(expanded.cvaExports[0].variants.size.lg).toBe("")
  })
})

/* ── Sub-component CRUD ─────────────────────────────────────────── */

describe("addSubComponent / removeSubComponent / renameSubComponent", () => {
  test("addSubComponent appends a new sub-component", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const updated = addSubComponent(tree, "MyCardHeader", "div")

    expect(updated.subComponents).toHaveLength(2)
    expect(updated.subComponents[1].name).toBe("MyCardHeader")
    expect(updated.subComponents[1].dataSlot).toBe("my-card-header")
    expect(updated.subComponents[1].exportOrder).toBe(1)
  })

  test("removeSubComponent removes a sub-component by index", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withSub = addSubComponent(tree, "MyCardHeader", "div")
    const removed = removeSubComponent(withSub, 1)
    expect(removed.subComponents).toHaveLength(1)
    expect(removed.subComponents[0].name).toBe("MyCard")
  })

  test("removeSubComponent refuses to remove the root", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withSub = addSubComponent(tree, "MyCardHeader", "div")
    const result = removeSubComponent(withSub, 0)
    expect(result).toBe(withSub)
  })

  test("renameSubComponent updates name + dataSlot + base tag", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const renamed = renameSubComponent(tree, 0, "RenamedCard", "section")

    expect(renamed.subComponents[0].name).toBe("RenamedCard")
    expect(renamed.subComponents[0].dataSlot).toBe("renamed-card")
    expect(renamed.subComponents[0].parts.root.base).toEqual({
      kind: "html",
      tag: "section",
    })
  })

  test("renaming root cascades to child sub-component names", () => {
    let tree = createComponentTreeV2("Gege", "div")
    tree = addSubComponent(tree, "GegeSgds", "div")
    tree = addSubComponent(tree, "GegeSgs", "div")

    const renamed = renameSubComponent(tree, 0, "AnotheRard", "div")

    expect(renamed.subComponents[0].name).toBe("AnotheRard")
    expect(renamed.subComponents[1].name).toBe("AnotheRardSgds")
    expect(renamed.subComponents[1].dataSlot).toBe("anothe-rard-sgds")
    expect(renamed.subComponents[2].name).toBe("AnotheRardSgs")
    expect(renamed.subComponents[2].dataSlot).toBe("anothe-rard-sgs")
  })

  test("reorderSubComponents updates exportOrder", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    const withSubs = addSubComponent(
      addSubComponent(tree, "MyCardHeader", "div"),
      "MyCardFooter",
      "div",
    )
    // Reverse order
    const reordered = reorderSubComponents(
      withSubs,
      [...withSubs.subComponents].reverse(),
    )
    expect(reordered.subComponents[0].name).toBe("MyCardFooter")
    expect(reordered.subComponents[0].exportOrder).toBe(0)
    expect(reordered.subComponents[2].name).toBe("MyCard")
    expect(reordered.subComponents[2].exportOrder).toBe(2)
  })
})
