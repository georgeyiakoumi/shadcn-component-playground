/**
 * Path-based addressing for ComponentTreeV2 parts.
 *
 * The from-scratch editor (M3) needs to identify individual JSX elements in
 * the canvas so the user can click one and edit its classes. v1 used per-node
 * `id` strings stored on the `ElementNode` object directly. v2's `PartNode`
 * has no `id` field — the v2 schema is closer to JSX, where elements are
 * identified by their position in the tree.
 *
 * This file provides path-based addressing as a cheap, ephemeral substitute
 * for v1's `id`-based addressing. A "path" is a string of the form:
 *
 *     sub:<subComponentName>/<childIndexPath>
 *
 * where `<childIndexPath>` is an empty string for the sub-component's root
 * part, or a slash-separated list of zero-based child indices for a deeper
 * descendant. Examples:
 *
 *     sub:MyCard/                  → root part of the MyCard sub-component
 *     sub:MyCard/0                 → first child of MyCard's root
 *     sub:MyCard/0/2/1             → first child → 3rd child → 2nd child
 *     sub:MyCardHeader/            → root part of the MyCardHeader sub-component
 *
 * The "main" pseudo-path used by v1 to refer to the root component maps to
 * `sub:<rootName>/` in v2 (the root of the first sub-component).
 *
 * Selection state uses these strings as opaque identifiers. The renderer
 * sets `data-node-id` to the path so DOM event handlers can read it back.
 *
 * Path-based addressing is **not** stored anywhere — it's computed on demand
 * from the tree's structure. Edits that mutate the tree (e.g. inserting a
 * child) DO NOT invalidate other paths that point at unrelated parts.
 * Inserting a sibling DOES shift the indices of subsequent siblings, which
 * is fine because selection state is ephemeral (lives in React state, not
 * persisted).
 */

import type {
  ComponentTreeV2,
  PartChild,
  PartNode,
  SubComponentV2,
} from "@/lib/component-tree-v2"

/* ── Path encoding / decoding ───────────────────────────────────── */

/** A path identifier within a `ComponentTreeV2`. */
export type PartPath = string

/** Build a path string from a sub-component name and child indices. */
export function makePartPath(
  subComponentName: string,
  childIndices: number[] = [],
): PartPath {
  return `sub:${subComponentName}/${childIndices.join("/")}`
}

/**
 * Parse a path string into its components. Returns null for malformed input.
 */
export function parsePartPath(
  path: PartPath,
): { subComponentName: string; childIndices: number[] } | null {
  if (!path.startsWith("sub:")) return null
  const slashIdx = path.indexOf("/")
  if (slashIdx === -1) return null
  const subComponentName = path.slice("sub:".length, slashIdx)
  const indexStr = path.slice(slashIdx + 1)
  if (indexStr === "") {
    return { subComponentName, childIndices: [] }
  }
  const parts = indexStr.split("/")
  const childIndices: number[] = []
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isInteger(n) || n < 0) return null
    childIndices.push(n)
  }
  return { subComponentName, childIndices }
}

/** True if the path points at a sub-component's root part (no child indices). */
export function isRootPath(path: PartPath): boolean {
  const parsed = parsePartPath(path)
  return parsed !== null && parsed.childIndices.length === 0
}

/* ── Lookup ─────────────────────────────────────────────────────── */

/** Find the sub-component a path refers to. */
export function findSubByPath(
  tree: ComponentTreeV2,
  path: PartPath,
): SubComponentV2 | null {
  const parsed = parsePartPath(path)
  if (!parsed) return null
  return (
    tree.subComponents.find((sc) => sc.name === parsed.subComponentName) ?? null
  )
}

/**
 * Resolve a path to the part it points at. Returns null if any segment is
 * out of bounds, or if the path points at a non-part child (text/expression).
 */
export function findPartByPath(
  tree: ComponentTreeV2,
  path: PartPath,
): PartNode | null {
  const parsed = parsePartPath(path)
  if (!parsed) return null
  const sub = tree.subComponents.find(
    (sc) => sc.name === parsed.subComponentName,
  )
  if (!sub) return null

  let part: PartNode = sub.parts.root
  for (const idx of parsed.childIndices) {
    if (idx < 0 || idx >= part.children.length) return null
    const child = part.children[idx]
    if (child.kind !== "part") return null
    part = child.part
  }
  return part
}

/**
 * Walk the tree and call `visit` for every part with its path. Used by the
 * renderer (which needs to render each part with its path as the
 * `data-node-id`) and any future "find by predicate" helpers.
 */
export function walkPartsWithPaths(
  tree: ComponentTreeV2,
  visit: (part: PartNode, path: PartPath, parentPath: PartPath | null) => void,
): void {
  for (const sub of tree.subComponents) {
    const rootPath = makePartPath(sub.name, [])
    visit(sub.parts.root, rootPath, null)
    walkChildren(sub.parts.root, sub.name, [], visit)
  }
}

function walkChildren(
  parent: PartNode,
  subName: string,
  parentIndices: number[],
  visit: (part: PartNode, path: PartPath, parentPath: PartPath | null) => void,
): void {
  parent.children.forEach((child, i) => {
    if (child.kind !== "part") return
    const indices = [...parentIndices, i]
    const path = makePartPath(subName, indices)
    const parentPath = makePartPath(subName, parentIndices)
    visit(child.part, path, parentPath)
    walkChildren(child.part, subName, indices, visit)
  })
}

/* ── Mutation ───────────────────────────────────────────────────── */

/**
 * Return a new tree with the part at `path` replaced by `newPart`. Returns
 * the original tree unchanged if the path doesn't resolve.
 *
 * This is immutable mutation — no fields on the input tree are touched.
 * Sibling parts and unrelated sub-components reuse their original references
 * (structural sharing).
 */
export function replacePartByPath(
  tree: ComponentTreeV2,
  path: PartPath,
  newPart: PartNode,
): ComponentTreeV2 {
  const parsed = parsePartPath(path)
  if (!parsed) return tree

  return {
    ...tree,
    subComponents: tree.subComponents.map((sub) => {
      if (sub.name !== parsed.subComponentName) return sub
      return {
        ...sub,
        parts: {
          root:
            parsed.childIndices.length === 0
              ? newPart
              : replaceInChildren(sub.parts.root, parsed.childIndices, newPart),
        },
      }
    }),
  }
}

function replaceInChildren(
  parent: PartNode,
  indices: number[],
  newPart: PartNode,
): PartNode {
  if (indices.length === 0) return newPart
  const [head, ...rest] = indices
  if (head < 0 || head >= parent.children.length) return parent

  return {
    ...parent,
    children: parent.children.map((child, i) => {
      if (i !== head) return child
      if (child.kind !== "part") return child
      return {
        kind: "part",
        part:
          rest.length === 0
            ? newPart
            : replaceInChildren(child.part, rest, newPart),
      }
    }),
  }
}

/**
 * Replace the className expression of the part at `path`. Convenience wrapper
 * around `replacePartByPath` since className edits are the most common
 * mutation in the from-scratch editor.
 */
export function setPartClasses(
  tree: ComponentTreeV2,
  path: PartPath,
  classes: string[],
): ComponentTreeV2 {
  const part = findPartByPath(tree, path)
  if (!part) return tree

  // The from-scratch builder always uses cn-call className with an empty
  // base literal + the className override. Editing classes splices into
  // the literal first arg.
  const joined = classes.join(" ")
  const newPart: PartNode = {
    ...part,
    className:
      part.className.kind === "cn-call"
        ? {
            kind: "cn-call",
            args: [`"${joined}"`, ...part.className.args.slice(1)],
            baseRange: part.className.baseRange,
          }
        : { kind: "literal", value: joined },
  }
  return replacePartByPath(tree, path, newPart)
}

/**
 * Read the current classes from a part as an array. Inverse of
 * `setPartClasses`. Returns an empty array if the part has no className or
 * the className is in a shape we can't parse (e.g. cva-call).
 */
export function getPartClasses(part: PartNode): string[] {
  const expr = part.className
  if (expr.kind === "literal") {
    return expr.value.split(/\s+/).filter(Boolean)
  }
  if (expr.kind === "cn-call") {
    const first = expr.args[0]
    if (typeof first !== "string") return []
    // Strip surrounding quotes if present
    const stripped =
      first.length >= 2 &&
      (first[0] === '"' || first[0] === "'") &&
      first[first.length - 1] === first[0]
        ? first.slice(1, -1)
        : first
    return stripped.split(/\s+/).filter(Boolean)
  }
  // cva-call and passthrough don't expose editable classes here
  return []
}

/**
 * Read-only variant of `getPartClasses` that flattens ALL string-literal
 * arguments of a cn-call, not just the first. `getPartClasses` only
 * returns args[0] because that's the editable "base string" — all edits
 * route to arg 0 so that downstream cn-args (which often hold state-
 * specific or conditional classes) stay untouched.
 *
 * The preview-snippet renderer doesn't edit — it needs every class
 * that would appear on the real DOM node so that Tailwind selectors
 * like `data-[state=active]:bg-background` (which live in a LATER
 * cn-arg in shadcn TabsTrigger) take effect in the canvas preview.
 *
 * DO NOT use this for anything that writes classes back — use it
 * only in render-time code that consumes classes as strings.
 */
export function getAllPartClassesForRender(part: PartNode): string[] {
  const expr = part.className
  if (expr.kind === "literal") {
    return expr.value.split(/\s+/).filter(Boolean)
  }
  if (expr.kind === "cn-call") {
    const out: string[] = []
    for (const arg of expr.args) {
      if (typeof arg !== "string") continue
      const stripped =
        arg.length >= 2 &&
        (arg[0] === '"' || arg[0] === "'") &&
        arg[arg.length - 1] === arg[0]
          ? arg.slice(1, -1)
          : arg
      out.push(...stripped.split(/\s+/).filter(Boolean))
    }
    return out
  }
  return []
}

/* ── Sub-component lookups ──────────────────────────────────────── */

/** Find the parent sub-component (by name) of a given path. */
export function findSubNameByPath(path: PartPath): string | null {
  const parsed = parsePartPath(path)
  return parsed?.subComponentName ?? null
}

/**
 * Map of sub-component name → SubComponentV2 for quick `O(1)` lookup. The
 * v2 equivalent of v1's `subComponentMap`.
 */
export function buildSubComponentMap(
  tree: ComponentTreeV2,
): Map<string, SubComponentV2> {
  const map = new Map<string, SubComponentV2>()
  for (const sub of tree.subComponents) {
    map.set(sub.name, sub)
  }
  return map
}

/* ── Child management ───────────────────────────────────────────── */

/**
 * Append a new part child to the part at `path`. Returns a new tree with
 * the part inserted as the last child. Used by the AssemblyPanel when the
 * user adds a new element via the picker.
 */
export function appendChildAtPath(
  tree: ComponentTreeV2,
  path: PartPath,
  newChild: PartNode,
): ComponentTreeV2 {
  const part = findPartByPath(tree, path)
  if (!part) return tree
  const updatedPart: PartNode = {
    ...part,
    children: [
      ...part.children,
      { kind: "part", part: newChild } satisfies PartChild,
    ],
  }
  return replacePartByPath(tree, path, updatedPart)
}

/**
 * Remove the part at `path`. The path must point at a non-root part (you
 * can't delete a sub-component's root via this helper — that's a separate
 * sub-component-deletion operation).
 */
export function removePartAtPath(
  tree: ComponentTreeV2,
  path: PartPath,
): ComponentTreeV2 {
  const parsed = parsePartPath(path)
  if (!parsed || parsed.childIndices.length === 0) return tree

  const parentIndices = parsed.childIndices.slice(0, -1)
  const removeIdx = parsed.childIndices[parsed.childIndices.length - 1]
  const parentPath = makePartPath(parsed.subComponentName, parentIndices)
  const parentPart = findPartByPath(tree, parentPath)
  if (!parentPart) return tree

  const updatedParent: PartNode = {
    ...parentPart,
    children: parentPart.children.filter((_, i) => i !== removeIdx),
  }
  return replacePartByPath(tree, parentPath, updatedParent)
}

/**
 * Move a part from `dragPath` to a new location relative to `targetPath`.
 * Mirrors v1's `moveNode` API: `position` controls whether the dragged part
 * lands BEFORE the target, AFTER the target, or INSIDE it as a new child.
 *
 * The implementation removes the part first, then inserts it at the new
 * location. Cross-sub-component moves are not supported — if the drag and
 * target paths refer to different sub-components, the tree is returned
 * unchanged.
 */
export function movePartByPath(
  tree: ComponentTreeV2,
  dragPath: PartPath,
  targetPath: PartPath,
  position: "before" | "after" | "inside",
): ComponentTreeV2 {
  if (dragPath === targetPath) return tree

  const dragParsed = parsePartPath(dragPath)
  const targetParsed = parsePartPath(targetPath)
  if (!dragParsed || !targetParsed) return tree
  if (dragParsed.subComponentName !== targetParsed.subComponentName) return tree
  if (dragParsed.childIndices.length === 0) return tree // can't move a root

  // Find the part being dragged
  const dragPart = findPartByPath(tree, dragPath)
  if (!dragPart) return tree

  // Refuse to move a part inside itself or its descendants
  if (
    position === "inside" &&
    isAncestorOf(dragParsed.childIndices, targetParsed.childIndices)
  ) {
    return tree
  }

  // Remove the part from its current location first
  const treeWithoutDrag = removePartAtPath(tree, dragPath)

  // Recompute the target's path after the removal (indices shift if the
  // drag was earlier in the same parent's children)
  const adjustedTargetIndices = adjustIndicesAfterRemove(
    targetParsed.childIndices,
    dragParsed.childIndices,
  )

  if (position === "inside") {
    const adjustedTargetPath = makePartPath(
      targetParsed.subComponentName,
      adjustedTargetIndices,
    )
    return appendChildAtPath(treeWithoutDrag, adjustedTargetPath, dragPart)
  }

  // before / after — insert as a sibling of the target
  const targetParentIndices = adjustedTargetIndices.slice(0, -1)
  const targetIdx = adjustedTargetIndices[adjustedTargetIndices.length - 1]
  const insertIdx = position === "before" ? targetIdx : targetIdx + 1

  const parentPath = makePartPath(
    targetParsed.subComponentName,
    targetParentIndices,
  )
  const parentPart = findPartByPath(treeWithoutDrag, parentPath)
  if (!parentPart) return tree

  const newChildren = [...parentPart.children]
  newChildren.splice(insertIdx, 0, { kind: "part", part: dragPart })
  const updatedParent: PartNode = { ...parentPart, children: newChildren }
  return replacePartByPath(treeWithoutDrag, parentPath, updatedParent)
}

/** True if `ancestor` is an ancestor (or equal) of `descendant`. */
function isAncestorOf(ancestor: number[], descendant: number[]): boolean {
  if (ancestor.length > descendant.length) return false
  for (let i = 0; i < ancestor.length; i++) {
    if (ancestor[i] !== descendant[i]) return false
  }
  return true
}

/**
 * After removing a part at `removedIndices`, adjust an existing index path
 * so it still points to the same logical part. If a sibling earlier in the
 * same parent was removed, the target's last-shared-level index decrements.
 */
function adjustIndicesAfterRemove(
  target: number[],
  removed: number[],
): number[] {
  if (removed.length === 0) return target

  // Different parents — no adjustment needed
  const removedParent = removed.slice(0, -1)
  const removedIdx = removed[removed.length - 1]
  if (target.length < removedParent.length) return target
  for (let i = 0; i < removedParent.length; i++) {
    if (target[i] !== removedParent[i]) return target
  }

  // Same parent. If the target's index at this level is greater than the
  // removed index, decrement it.
  const adjusted = [...target]
  if (adjusted[removedParent.length] > removedIdx) {
    adjusted[removedParent.length]--
  }
  return adjusted
}
