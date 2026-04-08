/**
 * UI-facing helpers for the Define view's props/variants management.
 *
 * The Define view (`components/playground/define-view.tsx`) presents
 * props and variants as flat editable lists — one card per prop, one
 * card per variant — and writes back through these helpers. v1's
 * `ComponentTree` exposed `props: ComponentProp[]` and
 * `variants: CustomVariantDef[]` directly, which is the UI's natural shape.
 *
 * v2's `ComponentTreeV2` represents the same information differently:
 * - Props live inside `subComponents[i].propsDecl` (an intersection of
 *   `PropsPart` kinds, with inline properties on the `inline` part)
 * - Variants live in `cvaExports` (per-sub-component cva references)
 *
 * This file provides the translation layer between the two shapes. It is
 * NOT a permanent v1↔v2 adapter — it's a UI-shape derivation specific to
 * the Define view's prop/variant management UX. The Define view never
 * hands these helper outputs back into the page state; it always writes
 * back through `setProps` / `setVariants` / etc, which mutate the v2 tree
 * in place via the helpers below.
 *
 * GEO-305 Step 4e.
 */

import type {
  ComponentTreeV2,
  CvaExport,
  InlineProperty,
  PropsDecl,
  PropsPart,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"

/* ── Read: derive flat lists from v2 ────────────────────────────── */

/**
 * Read the inline properties of a sub-component's propsDecl as a flat
 * `ComponentProp[]` for the Define view's prop list UI.
 *
 * Only inline `PropsPart`s contribute to the list. `component-props`,
 * `variant-props`, etc. are not user-editable in the prop list — they
 * come from the structural shape of the component.
 */
export function readPropsFromSub(sub: SubComponentV2): ComponentProp[] {
  const props: ComponentProp[] = []
  for (const part of propPartsOf(sub.propsDecl)) {
    if (part.kind !== "inline") continue
    for (const ip of part.properties) {
      props.push(inlinePropertyToComponentProp(ip))
    }
  }
  return props
}

/**
 * Read the variants of a sub-component as a flat `CustomVariantDef[]`
 * for the Define view's variant list UI. Looks up the cva export by
 * the sub-component's `variantStrategy.cvaRef`.
 */
export function readVariantsFromSub(
  sub: SubComponentV2,
  cvaExports: CvaExport[],
): CustomVariantDef[] {
  if (sub.variantStrategy.kind !== "cva") return []
  const cvaRef = sub.variantStrategy.cvaRef
  const cva = cvaExports.find((c) => c.name === cvaRef)
  if (!cva) return []

  const out: CustomVariantDef[] = []
  for (const [groupName, valueMap] of Object.entries(cva.variants)) {
    const valueNames = Object.keys(valueMap)
    // Detect boolean variant: exactly two values "true" and "false"
    if (
      valueNames.length === 2 &&
      valueNames.includes("true") &&
      valueNames.includes("false")
    ) {
      out.push({
        name: groupName,
        type: "boolean",
        options: [],
        defaultValue: cva.defaultVariants?.[groupName] ?? "false",
      })
    } else {
      out.push({
        name: groupName,
        type: "variant",
        options: valueNames,
        defaultValue: cva.defaultVariants?.[groupName] ?? valueNames[0] ?? "",
      })
    }
  }
  return out
}

/* ── Write: update v2 from flat lists ──────────────────────────── */

/**
 * Update a sub-component's propsDecl from a flat `ComponentProp[]`. The
 * `inline` part is replaced with the new list; other parts (e.g.
 * `component-props`, `variant-props`) are preserved.
 */
export function setPropsOnSub(
  sub: SubComponentV2,
  props: ComponentProp[],
): SubComponentV2 {
  const inlineProps: InlineProperty[] = props.map(componentPropToInlineProperty)

  const newDecl = upsertInlinePart(sub.propsDecl, inlineProps)
  return { ...sub, propsDecl: newDecl }
}

/**
 * Update a sub-component's variants by mutating the corresponding cva export.
 * If the sub-component has no cva export yet (variantStrategy.kind === "none"),
 * a new one is created and the strategy is updated.
 *
 * Returns `{ tree, sub }` so the caller can update both at once.
 */
export function setVariantsOnSub(
  tree: ComponentTreeV2,
  subIndex: number,
  variants: CustomVariantDef[],
): ComponentTreeV2 {
  const sub = tree.subComponents[subIndex]
  if (!sub) return tree

  // No variants → remove the cva export entirely if it was the only one
  // and reset the strategy.
  if (variants.length === 0) {
    if (sub.variantStrategy.kind !== "cva") return tree
    const cvaRef = sub.variantStrategy.cvaRef
    const newCvaExports = tree.cvaExports.filter((c) => c.name !== cvaRef)
    const newSubs = [...tree.subComponents]
    newSubs[subIndex] = {
      ...sub,
      variantStrategy: { kind: "none" },
      // Strip the variant-props part from propsDecl too
      propsDecl: stripVariantPropsPart(sub.propsDecl, cvaRef),
    }
    return { ...tree, subComponents: newSubs, cvaExports: newCvaExports }
  }

  const cvaRef =
    sub.variantStrategy.kind === "cva"
      ? sub.variantStrategy.cvaRef
      : `${sub.name.charAt(0).toLowerCase()}${sub.name.slice(1)}Variants`

  // Build the new cva.variants map from the flat list
  const variantsMap: Record<string, Record<string, string>> = {}
  const defaultVariants: Record<string, string> = {}
  for (const v of variants) {
    if (v.type === "boolean") {
      variantsMap[v.name] = { true: "", false: "" }
    } else {
      variantsMap[v.name] = {}
      for (const opt of v.options) {
        variantsMap[v.name][opt] = ""
      }
    }
    if (v.defaultValue) {
      defaultVariants[v.name] = v.defaultValue
    }
  }

  // Find or create the cva export
  const existingCvaIdx = tree.cvaExports.findIndex((c) => c.name === cvaRef)
  let newCvaExports: CvaExport[]
  if (existingCvaIdx === -1) {
    newCvaExports = [
      ...tree.cvaExports,
      {
        name: cvaRef,
        baseClasses: "",
        variants: variantsMap,
        defaultVariants:
          Object.keys(defaultVariants).length > 0 ? defaultVariants : undefined,
        exported: true,
      } satisfies CvaExport,
    ]
  } else {
    newCvaExports = [...tree.cvaExports]
    // Preserve existing class strings where the variant value still exists,
    // so the user doesn't lose work when adding/removing other variant values.
    const oldVariants = newCvaExports[existingCvaIdx].variants
    const mergedVariants: Record<string, Record<string, string>> = {}
    for (const [groupName, valueMap] of Object.entries(variantsMap)) {
      mergedVariants[groupName] = {}
      for (const valueName of Object.keys(valueMap)) {
        mergedVariants[groupName][valueName] =
          oldVariants[groupName]?.[valueName] ?? ""
      }
    }
    newCvaExports[existingCvaIdx] = {
      ...newCvaExports[existingCvaIdx],
      variants: mergedVariants,
      defaultVariants:
        Object.keys(defaultVariants).length > 0 ? defaultVariants : undefined,
    }
  }

  // Update the sub-component's variantStrategy and propsDecl
  const newSubs = [...tree.subComponents]
  newSubs[subIndex] = {
    ...sub,
    variantStrategy: { kind: "cva", cvaRef },
    propsDecl: ensureVariantPropsPart(sub.propsDecl, cvaRef),
  }

  return { ...tree, subComponents: newSubs, cvaExports: newCvaExports }
}

/* ── Sub-component CRUD helpers ─────────────────────────────────── */

/**
 * Update a sub-component's name + base tag. Renames the dataSlot, updates
 * the propsDecl's `component-props` target, and updates the part's html
 * base tag. Does NOT rename references to this sub-component in other
 * parts (e.g. assembly children with component-ref bases pointing here).
 */
export function renameSubComponent(
  tree: ComponentTreeV2,
  subIndex: number,
  newName: string,
  newBaseTag: string,
): ComponentTreeV2 {
  const sub = tree.subComponents[subIndex]
  if (!sub) return tree

  const oldName = sub.name
  const newDataSlot = toDataSlot(newName)

  const newSubs = [...tree.subComponents]
  newSubs[subIndex] = {
    ...sub,
    name: newName,
    dataSlot: newDataSlot,
    propsDecl: updateComponentPropsTarget(sub.propsDecl, newBaseTag),
    parts: {
      root: {
        ...sub.parts.root,
        base: { kind: "html", tag: newBaseTag },
        dataSlot: newDataSlot,
      },
    },
  }

  // Rename component-ref bases pointing at the old name
  if (oldName !== newName) {
    for (let i = 0; i < newSubs.length; i++) {
      newSubs[i] = {
        ...newSubs[i],
        parts: {
          root: renameComponentRefsInPart(newSubs[i].parts.root, oldName, newName),
        },
      }
    }
  }

  return { ...tree, subComponents: newSubs }
}

/**
 * Add a new sub-component to the tree. Returns a new tree with an empty
 * sub-component appended at the end.
 */
export function addSubComponent(
  tree: ComponentTreeV2,
  name: string,
  baseTag: string,
): ComponentTreeV2 {
  const newSub: SubComponentV2 = {
    name,
    dataSlot: toDataSlot(name),
    exportOrder: tree.subComponents.length,
    isDefaultExport: false,
    jsdoc: null,
    propsDecl: {
      kind: "single",
      part: { kind: "component-props", target: baseTag },
    },
    variantStrategy: { kind: "none" },
    passthrough: [],
    parts: {
      root: {
        base: { kind: "html", tag: baseTag },
        dataSlot: toDataSlot(name),
        className: { kind: "cn-call", args: ['""', "className"] },
        propsSpread: true,
        attributes: {},
        asChild: false,
        children: [],
      },
    },
  }
  return { ...tree, subComponents: [...tree.subComponents, newSub] }
}

/**
 * Remove a sub-component from the tree. The sub-component at index 0
 * (the root) cannot be removed.
 */
export function removeSubComponent(
  tree: ComponentTreeV2,
  subIndex: number,
): ComponentTreeV2 {
  if (subIndex === 0) return tree
  const sub = tree.subComponents[subIndex]
  if (!sub) return tree

  const removedName = sub.name
  let newCvaExports = tree.cvaExports
  if (sub.variantStrategy.kind === "cva") {
    const cvaRef = sub.variantStrategy.cvaRef
    newCvaExports = tree.cvaExports.filter((c) => c.name !== cvaRef)
  }

  const newSubs = tree.subComponents.filter((_, i) => i !== subIndex)

  // Remove component-ref bases pointing at the removed sub-component
  // (otherwise the canvas would render an "Unknown component-ref" placeholder)
  const cleanedSubs = newSubs.map((s) => ({
    ...s,
    parts: {
      root: removeComponentRefsInPart(s.parts.root, removedName),
    },
  }))

  return {
    ...tree,
    subComponents: cleanedSubs,
    cvaExports: newCvaExports,
  }
}

/**
 * Reorder sub-components. Takes a new ordered array (must contain exactly
 * the same set of sub-components, just in a different order) and updates
 * `exportOrder` to match.
 */
export function reorderSubComponents(
  tree: ComponentTreeV2,
  newOrder: SubComponentV2[],
): ComponentTreeV2 {
  return {
    ...tree,
    subComponents: newOrder.map((sub, i) => ({ ...sub, exportOrder: i })),
  }
}

/* ── Internals ──────────────────────────────────────────────────── */

/** Iterate over all PropsParts in a PropsDecl, regardless of kind. */
function propPartsOf(decl: PropsDecl): PropsPart[] {
  switch (decl.kind) {
    case "none":
      return []
    case "single":
      return [decl.part]
    case "intersection":
      return decl.parts
  }
}

/** Convert a v2 InlineProperty into a v1 ComponentProp. */
function inlinePropertyToComponentProp(ip: InlineProperty): ComponentProp {
  return {
    name: ip.name,
    type: parseInlineTypeToV1(ip.type),
    required: !ip.optional,
    defaultValue: ip.defaultValue ? unwrapDefaultValue(ip.defaultValue) : undefined,
  }
}

/** Convert a v1 ComponentProp into a v2 InlineProperty. */
function componentPropToInlineProperty(cp: ComponentProp): InlineProperty {
  return {
    name: cp.name,
    type:
      cp.type === "ReactNode"
        ? "React.ReactNode"
        : cp.type, // string | number | boolean
    optional: !cp.required,
    defaultValue:
      cp.defaultValue !== undefined && cp.defaultValue !== ""
        ? formatV1DefaultValue(cp.type, cp.defaultValue)
        : undefined,
  }
}

/** Best-effort parse of a v2 inline type string into a v1 ComponentProp.type. */
function parseInlineTypeToV1(typeStr: string): ComponentProp["type"] {
  if (typeStr === "string") return "string"
  if (typeStr === "number") return "number"
  if (typeStr === "boolean") return "boolean"
  if (typeStr === "React.ReactNode" || typeStr === "ReactNode") return "ReactNode"
  // Fallback: treat unknown types as string in the UI
  return "string"
}

/**
 * Strip the surrounding quotes from a default value string. v2's
 * InlineProperty.defaultValue is the verbatim source (e.g. `"Click me"`,
 * `false`, `42`); v1's ComponentProp.defaultValue is the bare value
 * (`Click me`, `false`, `42`).
 */
function unwrapDefaultValue(raw: string): string {
  if (raw.length < 2) return raw
  const first = raw[0]
  if ((first === '"' || first === "'") && raw[raw.length - 1] === first) {
    return raw.slice(1, -1)
  }
  return raw
}

/** Format a v1 default value into a v2 InlineProperty.defaultValue. */
function formatV1DefaultValue(
  type: ComponentProp["type"],
  raw: string,
): string {
  if (type === "string") return `"${raw}"`
  if (type === "boolean") return raw === "true" ? "true" : "false"
  if (type === "number") return raw
  return raw
}

/**
 * Insert or replace the inline `PropsPart` in a `PropsDecl`. If there's
 * no inline part yet, it's added as an additional element in an
 * intersection (or the decl is promoted from `single` to `intersection`).
 * If there are no inline properties, the inline part is removed.
 */
function upsertInlinePart(
  decl: PropsDecl,
  inlineProps: InlineProperty[],
): PropsDecl {
  const newInlinePart: PropsPart =
    inlineProps.length > 0
      ? { kind: "inline", properties: inlineProps }
      : ({ kind: "inline", properties: [] } as PropsPart)

  // Empty inline → remove from the decl
  if (inlineProps.length === 0) {
    if (decl.kind === "none") return decl
    if (decl.kind === "single") {
      return decl.part.kind === "inline" ? { kind: "none" } : decl
    }
    // intersection — remove inline part(s)
    const filtered = decl.parts.filter((p) => p.kind !== "inline")
    if (filtered.length === 0) return { kind: "none" }
    if (filtered.length === 1) return { kind: "single", part: filtered[0] }
    return { kind: "intersection", parts: filtered }
  }

  // Non-empty inline → upsert
  if (decl.kind === "none") {
    return { kind: "single", part: newInlinePart }
  }
  if (decl.kind === "single") {
    if (decl.part.kind === "inline") {
      return { kind: "single", part: newInlinePart }
    }
    return { kind: "intersection", parts: [decl.part, newInlinePart] }
  }
  // intersection — replace existing inline if present, else append
  const existingIdx = decl.parts.findIndex((p) => p.kind === "inline")
  if (existingIdx === -1) {
    return { kind: "intersection", parts: [...decl.parts, newInlinePart] }
  }
  const newParts = [...decl.parts]
  newParts[existingIdx] = newInlinePart
  return { kind: "intersection", parts: newParts }
}

/**
 * Strip the `variant-props` PropsPart with the given cvaRef from a
 * PropsDecl. Used when the user removes all variants from a sub-component.
 */
function stripVariantPropsPart(decl: PropsDecl, cvaRef: string): PropsDecl {
  if (decl.kind === "none") return decl
  if (decl.kind === "single") {
    return decl.part.kind === "variant-props" && decl.part.cvaRef === cvaRef
      ? { kind: "none" }
      : decl
  }
  const filtered = decl.parts.filter(
    (p) => !(p.kind === "variant-props" && p.cvaRef === cvaRef),
  )
  if (filtered.length === 0) return { kind: "none" }
  if (filtered.length === 1) return { kind: "single", part: filtered[0] }
  return { kind: "intersection", parts: filtered }
}

/**
 * Ensure the PropsDecl includes a `variant-props` part with the given
 * cvaRef. Used when the user adds variants to a sub-component.
 */
function ensureVariantPropsPart(
  decl: PropsDecl,
  cvaRef: string,
): PropsDecl {
  const variantPropsPart: PropsPart = { kind: "variant-props", cvaRef }

  if (decl.kind === "none") {
    return { kind: "single", part: variantPropsPart }
  }
  if (decl.kind === "single") {
    if (decl.part.kind === "variant-props" && decl.part.cvaRef === cvaRef) {
      return decl
    }
    return { kind: "intersection", parts: [decl.part, variantPropsPart] }
  }
  // intersection
  const exists = decl.parts.some(
    (p) => p.kind === "variant-props" && p.cvaRef === cvaRef,
  )
  if (exists) return decl
  return { kind: "intersection", parts: [...decl.parts, variantPropsPart] }
}

/**
 * Update the `target` of any `component-props` part in a propsDecl to a
 * new HTML tag. Used when the user changes a sub-component's base element.
 */
function updateComponentPropsTarget(
  decl: PropsDecl,
  newTarget: string,
): PropsDecl {
  const updatePart = (p: PropsPart): PropsPart =>
    p.kind === "component-props" ? { ...p, target: newTarget } : p

  if (decl.kind === "none") return decl
  if (decl.kind === "single") {
    return { kind: "single", part: updatePart(decl.part) }
  }
  return { kind: "intersection", parts: decl.parts.map(updatePart) }
}

/** Recursively rename component-ref bases in a part's children tree. */
function renameComponentRefsInPart(
  part: import("@/lib/component-tree-v2").PartNode,
  oldName: string,
  newName: string,
): import("@/lib/component-tree-v2").PartNode {
  const newBase =
    part.base.kind === "component-ref" && part.base.name === oldName
      ? { kind: "component-ref" as const, name: newName }
      : part.base
  return {
    ...part,
    base: newBase,
    children: part.children.map((child) =>
      child.kind === "part"
        ? { kind: "part", part: renameComponentRefsInPart(child.part, oldName, newName) }
        : child,
    ),
  }
}

/** Recursively remove children whose part has a component-ref base pointing at the removed sub-component. */
function removeComponentRefsInPart(
  part: import("@/lib/component-tree-v2").PartNode,
  removedName: string,
): import("@/lib/component-tree-v2").PartNode {
  return {
    ...part,
    children: part.children
      .filter((child) => {
        if (child.kind !== "part") return true
        return !(
          child.part.base.kind === "component-ref" &&
          child.part.base.name === removedName
        )
      })
      .map((child) =>
        child.kind === "part"
          ? { kind: "part", part: removeComponentRefsInPart(child.part, removedName) }
          : child,
      ),
  }
}

/** Local copy of toDataSlot to avoid a circular import with the factories. */
function toDataSlot(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}
