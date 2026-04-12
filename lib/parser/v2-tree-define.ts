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
 * for the Define view's variant list UI.
 *
 * Surfaces both strategies in a single list:
 *
 * - **cva** variants: looked up via `variantStrategy.cvaRef` → cva export.
 *   Each variant is tagged with `strategy: "cva"` so the UI's edit
 *   popover starts on the right strategy.
 *
 * - **data-attr** variants: read from
 *   `variantStrategy.variants[].{propName, values, defaultValue}` and
 *   tagged with `strategy: "data-attr"`. Boolean data-attr variants
 *   (values `["true", "false"]`) are mapped back to `type: "boolean"`
 *   so the UI renders them with the boolean toggle, matching the
 *   creation experience.
 *
 * When a sub-component carries BOTH strategies (cva variants in an
 * export AND data-attr variants on the strategy field — see Button-like
 * components where cva owns the styling but data-attrs mirror to the
 * DOM), the cva variants are listed first, then the data-attr ones.
 * Order within each group is source order.
 */
export function readVariantsFromSub(
  sub: SubComponentV2,
  cvaExports: CvaExport[],
): CustomVariantDef[] {
  const out: CustomVariantDef[] = []

  // cva variants
  if (sub.variantStrategy.kind === "cva") {
    const cvaRef = sub.variantStrategy.cvaRef
    const cva = cvaExports.find((c) => c.name === cvaRef)
    if (cva) {
      for (const [groupName, valueMap] of Object.entries(cva.variants)) {
        const valueNames = Object.keys(valueMap)
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
            strategy: "cva",
          })
        } else {
          out.push({
            name: groupName,
            type: "variant",
            options: valueNames,
            defaultValue:
              cva.defaultVariants?.[groupName] ?? valueNames[0] ?? "",
            strategy: "cva",
          })
        }
      }
    }
  }

  // data-attr variants
  if (sub.variantStrategy.kind === "data-attr") {
    for (const dav of sub.variantStrategy.variants) {
      const isBooleanShape =
        dav.values.length === 2 &&
        dav.values.includes("true") &&
        dav.values.includes("false")
      if (isBooleanShape) {
        out.push({
          name: dav.propName,
          type: "boolean",
          options: [],
          defaultValue: dav.defaultValue,
          strategy: "data-attr",
        })
      } else {
        out.push({
          name: dav.propName,
          type: "variant",
          options: dav.values.slice(),
          defaultValue: dav.defaultValue,
          strategy: "data-attr",
        })
      }
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
 * Update a sub-component's variants from a flat `CustomVariantDef[]`.
 *
 * Partitions incoming variants by `strategy`:
 *
 * - **cva-strategy variants** are written into a cva export
 *   (`<subName>Variants` by convention, reusing an existing export if
 *   one is already attached). Existing class strings are preserved when
 *   the user adds/removes other values within the same group.
 *
 * - **data-attr-strategy variants** become inline prop properties on
 *   the sub-component's `propsDecl` and `data-<prop>={<prop>}` attribute
 *   bindings on the root element. They live entirely on the
 *   sub-component itself; no cva export is created.
 *
 * The sub-component's `variantStrategy` is set as follows:
 *
 *   - any cva variants present → `{ kind: "cva", cvaRef }` (cva claims
 *     the strategy field; data-attr inline props/attributes still flow
 *     through but the strategy field reflects the cva-as-source-of-
 *     styling fact, matching parsed Button-style components)
 *   - else any data-attr variants present → `{ kind: "data-attr", variants }`
 *   - else `{ kind: "none" }`
 *
 * Strategy-aware cleanup also runs: previously-data-attr inline props
 * and root attributes that no longer correspond to a current variant
 * are removed, so flipping a variant from data-attr to cva (or back) or
 * deleting a variant entirely cleans up the orphaned declarations.
 *
 * Absent `strategy` on an incoming variant defaults to `"cva"` for
 * backwards compatibility with pre-strategy localStorage entries (the
 * same rule applied by `translateVariantsToV2Cva`).
 */
export function setVariantsOnSub(
  tree: ComponentTreeV2,
  subIndex: number,
  variants: CustomVariantDef[],
): ComponentTreeV2 {
  const sub = tree.subComponents[subIndex]
  if (!sub) return tree

  const cvaRefForSub =
    sub.variantStrategy.kind === "cva"
      ? sub.variantStrategy.cvaRef
      : `${sub.name.charAt(0).toLowerCase()}${sub.name.slice(1)}Variants`

  // Partition incoming variants by strategy. Absent strategy = cva
  // (backwards compat with pre-this-PR localStorage entries).
  const cvaVariants = variants.filter(
    (v) => v.strategy === "cva" || v.strategy === undefined,
  )
  const dataAttrVariants = variants.filter((v) => v.strategy === "data-attr")

  /* ── 1. cva exports — rebuild or strip ─────────────────────── */

  let newCvaExports = tree.cvaExports
  const hadCvaExport = sub.variantStrategy.kind === "cva"

  if (cvaVariants.length === 0 && hadCvaExport) {
    // Remove the cva export entirely
    newCvaExports = tree.cvaExports.filter((c) => c.name !== cvaRefForSub)
  } else if (cvaVariants.length > 0) {
    const variantsMap: Record<string, Record<string, string>> = {}
    const defaultVariants: Record<string, string> = {}
    for (const v of cvaVariants) {
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

    const existingCvaIdx = tree.cvaExports.findIndex(
      (c) => c.name === cvaRefForSub,
    )
    if (existingCvaIdx === -1) {
      newCvaExports = [
        ...tree.cvaExports,
        {
          name: cvaRefForSub,
          baseClasses: "",
          variants: variantsMap,
          defaultVariants:
            Object.keys(defaultVariants).length > 0
              ? defaultVariants
              : undefined,
          exported: true,
        } satisfies CvaExport,
      ]
    } else {
      newCvaExports = [...tree.cvaExports]
      // Preserve existing class strings where the variant value still
      // exists, so the user doesn't lose work when adding/removing other
      // values in the same group.
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
  }

  /* ── 2. Build the data-attr variant list for the strategy field ── */

  const dataAttrVariantList = dataAttrVariants.map((v) => {
    const propName = v.name
    const attrName = `data-${propName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`
    if (v.type === "boolean") {
      return {
        propName,
        values: ["true", "false"],
        defaultValue: v.defaultValue || "false",
        attrName,
      }
    }
    return {
      propName,
      values: v.options.slice(),
      defaultValue: v.defaultValue || v.options[0] || "",
      attrName,
    }
  })

  /* ── 3. Compute the new variant strategy ───────────────────── */

  const newStrategy: SubComponentV2["variantStrategy"] =
    cvaVariants.length > 0
      ? { kind: "cva", cvaRef: cvaRefForSub }
      : dataAttrVariantList.length > 0
        ? { kind: "data-attr", variants: dataAttrVariantList }
        : { kind: "none" }

  /* ── 4. Update propsDecl ───────────────────────────────────── */

  // a) variant-props part for cva (added when cva variants exist, stripped otherwise)
  let nextDecl = sub.propsDecl
  if (cvaVariants.length > 0) {
    nextDecl = ensureVariantPropsPart(nextDecl, cvaRefForSub)
  } else if (hadCvaExport) {
    nextDecl = stripVariantPropsPart(nextDecl, cvaRefForSub)
  }

  // b) Inline prop properties for data-attr variants. Replace ALL inline
  //    properties whose names match a CURRENT or PREVIOUS data-attr
  //    variant, leaving any unrelated inline properties (e.g. `asChild`)
  //    alone.
  const previousDataAttrPropNames = new Set<string>()
  if (sub.variantStrategy.kind === "data-attr") {
    for (const v of sub.variantStrategy.variants) {
      previousDataAttrPropNames.add(v.propName)
    }
  }
  const currentDataAttrPropNames = new Set(dataAttrVariantList.map((v) => v.propName))
  // Anything that was a data-attr prop before OR is one now should be
  // managed by this function. Other inline props (set by `setPropsOnSub`)
  // pass through untouched.
  const managedNames = new Set([
    ...previousDataAttrPropNames,
    ...currentDataAttrPropNames,
  ])

  const newDataAttrInlineProps: InlineProperty[] = dataAttrVariantList.map(
    (v) => {
      // Look up the source CustomVariantDef to recover the user-facing
      // type (variant vs boolean) for the inline prop type string.
      const source = dataAttrVariants.find((src) => src.name === v.propName)!
      if (source.type === "boolean") {
        return {
          name: v.propName,
          type: "boolean",
          optional: true,
          defaultValue: v.defaultValue,
        }
      }
      return {
        name: v.propName,
        type: v.values.map((val) => `"${val}"`).join(" | "),
        optional: true,
        defaultValue: `"${v.defaultValue}"`,
      }
    },
  )

  nextDecl = replaceManagedInlineProps(
    nextDecl,
    managedNames,
    newDataAttrInlineProps,
  )

  /* ── 5. Update root element attributes ──────────────────────── */

  const newRootAttributes = { ...sub.parts.root.attributes }
  // Remove previous data-attr bindings that no longer apply
  for (const propName of previousDataAttrPropNames) {
    if (currentDataAttrPropNames.has(propName)) continue
    const attrName = `data-${propName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`
    delete newRootAttributes[attrName]
  }
  // Add bindings for current data-attr variants
  for (const v of dataAttrVariantList) {
    newRootAttributes[v.attrName] = `{${v.propName}}`
  }

  /* ── 6. Compose the new sub-component ───────────────────────── */

  const newSubs = [...tree.subComponents]
  newSubs[subIndex] = {
    ...sub,
    variantStrategy: newStrategy,
    propsDecl: nextDecl,
    parts: {
      root: {
        ...sub.parts.root,
        attributes: newRootAttributes,
      },
    },
  }

  return { ...tree, subComponents: newSubs, cvaExports: newCvaExports }
}

/**
 * Replace inline properties whose names are in `managed` with the new
 * `replacements` list. Inline properties NOT in `managed` are preserved
 * verbatim. The replacements are appended after the surviving managed
 * names' positions are removed; if no inline part exists, one is
 * created with just the replacements.
 *
 * This is the surgical edit `setVariantsOnSub` needs so it can rewrite
 * data-attr variant props without disturbing user-defined props that
 * came in via `setPropsOnSub`.
 */
function replaceManagedInlineProps(
  decl: PropsDecl,
  managed: Set<string>,
  replacements: InlineProperty[],
): PropsDecl {
  const filterAndAppend = (props: InlineProperty[]): InlineProperty[] => {
    const surviving = props.filter((p) => !managed.has(p.name))
    return [...surviving, ...replacements]
  }

  if (decl.kind === "single") {
    if (decl.part.kind === "inline") {
      const next = filterAndAppend(decl.part.properties)
      if (next.length === 0) return { kind: "none" }
      return {
        kind: "single",
        part: { kind: "inline", properties: next } satisfies PropsPart,
      }
    }
    if (replacements.length === 0) return decl
    return {
      kind: "intersection",
      parts: [
        decl.part,
        { kind: "inline", properties: replacements } satisfies PropsPart,
      ],
    }
  }

  if (decl.kind === "intersection") {
    const inlineIdx = decl.parts.findIndex((p) => p.kind === "inline")
    if (inlineIdx !== -1) {
      const inlinePart = decl.parts[inlineIdx]
      if (inlinePart.kind !== "inline") return decl
      const next = filterAndAppend(inlinePart.properties)
      const newParts = [...decl.parts]
      if (next.length === 0) {
        newParts.splice(inlineIdx, 1)
      } else {
        newParts[inlineIdx] = {
          kind: "inline",
          properties: next,
        } satisfies PropsPart
      }
      if (newParts.length === 0) return { kind: "none" }
      if (newParts.length === 1) return { kind: "single", part: newParts[0] }
      return { kind: "intersection", parts: newParts }
    }
    if (replacements.length === 0) return decl
    return {
      kind: "intersection",
      parts: [
        ...decl.parts,
        { kind: "inline", properties: replacements } satisfies PropsPart,
      ],
    }
  }

  // none
  if (replacements.length === 0) return decl
  return {
    kind: "single",
    part: { kind: "inline", properties: replacements } satisfies PropsPart,
  }
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

  // When renaming the root (index 0), also rename child sub-components
  // whose names are prefixed with the old root name.
  // e.g. MyCardHeader → GegeHeader when MyCard → Gege
  if (subIndex === 0 && oldName !== newName) {
    for (let i = 1; i < newSubs.length; i++) {
      const childSub = newSubs[i]
      if (childSub.name.startsWith(oldName)) {
        const suffix = childSub.name.slice(oldName.length)
        const renamedChildName = newName + suffix
        const renamedChildSlot = toDataSlot(renamedChildName)
        newSubs[i] = {
          ...childSub,
          name: renamedChildName,
          dataSlot: renamedChildSlot,
          parts: {
            root: {
              ...childSub.parts.root,
              dataSlot: renamedChildSlot,
            },
          },
        }
      }
    }
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
 * sub-component appended at the end. Optional convention flags
 * (`nestInside`, `namedGroup`, `headingFont`) mirror the v1 builder's
 * compose-time settings.
 */
export interface AddSubComponentOptions {
  nestInside?: string
  namedGroup?: boolean
  headingFont?: boolean
}

export function addSubComponent(
  tree: ComponentTreeV2,
  name: string,
  baseTag: string,
  options: AddSubComponentOptions = {},
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
    nestInside: options.nestInside,
    namedGroup: options.namedGroup,
    headingFont: options.headingFont,
  }
  return { ...tree, subComponents: [...tree.subComponents, newSub] }
}

/**
 * Update the convention flags on an existing sub-component.
 */
export function updateSubComponentFlags(
  tree: ComponentTreeV2,
  subIndex: number,
  flags: AddSubComponentOptions,
): ComponentTreeV2 {
  const sub = tree.subComponents[subIndex]
  if (!sub) return tree
  const newSubs = [...tree.subComponents]
  newSubs[subIndex] = {
    ...sub,
    nestInside: flags.nestInside,
    namedGroup: flags.namedGroup,
    headingFont: flags.headingFont,
  }
  return { ...tree, subComponents: newSubs }
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
