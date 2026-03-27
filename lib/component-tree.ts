// Component Tree — data model for from-scratch component building
// Represents the DOM structure, props, and sub-components of a user-created component.

import type { CustomVariantDef } from "@/lib/component-state"

/* ── Types ──────────────────────────────────────────────────────── */

export interface ElementNode {
  id: string
  tag: string
  children: ElementNode[]
  classes: string[]
  text?: string
  props?: Record<string, string>
}

export interface ComponentProp {
  name: string
  type: "string" | "number" | "boolean" | "ReactNode"
  required: boolean
  defaultValue?: string
}

export interface SubComponentDef {
  id: string
  name: string
  baseElement: string
  tree: ElementNode
  classes: string[]
  props: ComponentProp[]
  variants: CustomVariantDef[]
}

export interface ComponentTree {
  name: string
  baseElement: string
  tree: ElementNode
  props: ComponentProp[]
  variants: CustomVariantDef[]
  subComponents: SubComponentDef[]
}

/* ── ID generation ──────────────────────────────────────────────── */

let counter = 0

export function generateId(): string {
  counter++
  return `el_${Date.now().toString(36)}_${counter.toString(36)}`
}

/* ── Factory helpers ────────────────────────────────────────────── */

export function createElementNode(tag: string): ElementNode {
  return {
    id: generateId(),
    tag,
    children: [],
    classes: [],
  }
}

export function createComponentTree(
  name: string,
  baseElement: string,
): ComponentTree {
  return {
    name,
    baseElement,
    tree: createElementNode(baseElement),
    props: [],
    variants: [],
    subComponents: [],
  }
}

export function createSubComponent(
  parentName: string,
  name: string,
  baseElement: string,
): SubComponentDef {
  return {
    id: generateId(),
    name: `${parentName}${name}`,
    baseElement,
    tree: createElementNode(baseElement),
    classes: [],
    props: [],
    variants: [],
  }
}

/* ── Tree manipulation ──────────────────────────────────────────── */

/** Add a child to a specific node in the tree (identified by parentId). */
export function addChild(
  tree: ElementNode,
  parentId: string,
  child: ElementNode,
): ElementNode {
  if (tree.id === parentId) {
    return { ...tree, children: [...tree.children, child] }
  }
  return {
    ...tree,
    children: tree.children.map((c) => addChild(c, parentId, child)),
  }
}

/** Remove a node (and its subtree) from the tree by nodeId. */
export function removeNode(
  tree: ElementNode,
  nodeId: string,
): ElementNode {
  return {
    ...tree,
    children: tree.children
      .filter((c) => c.id !== nodeId)
      .map((c) => removeNode(c, nodeId)),
  }
}

/** Update the Tailwind classes on a specific node. */
export function updateNodeClasses(
  tree: ElementNode,
  nodeId: string,
  classes: string[],
): ElementNode {
  if (tree.id === nodeId) {
    return { ...tree, classes }
  }
  return {
    ...tree,
    children: tree.children.map((c) =>
      updateNodeClasses(c, nodeId, classes),
    ),
  }
}

/** Update the text content on a specific node. */
export function updateNodeText(
  tree: ElementNode,
  nodeId: string,
  text: string | undefined,
): ElementNode {
  if (tree.id === nodeId) {
    return { ...tree, text }
  }
  return {
    ...tree,
    children: tree.children.map((c) =>
      updateNodeText(c, nodeId, text),
    ),
  }
}

/** Update the tag on a specific node. */
export function updateNodeTag(
  tree: ElementNode,
  nodeId: string,
  tag: string,
): ElementNode {
  if (tree.id === nodeId) {
    return { ...tree, tag }
  }
  return {
    ...tree,
    children: tree.children.map((c) =>
      updateNodeTag(c, nodeId, tag),
    ),
  }
}

/** Find a node by id. Returns undefined if not found. */
export function findNode(
  tree: ElementNode,
  nodeId: string,
): ElementNode | undefined {
  if (tree.id === nodeId) return tree
  for (const child of tree.children) {
    const found = findNode(child, nodeId)
    if (found) return found
  }
  return undefined
}

/** Move a node up or down among its siblings. */
export function reorderNode(
  tree: ElementNode,
  nodeId: string,
  direction: "up" | "down",
): ElementNode {
  const idx = tree.children.findIndex((c) => c.id === nodeId)
  if (idx !== -1) {
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= tree.children.length) return tree
    const newChildren = [...tree.children]
    const [moved] = newChildren.splice(idx, 1)
    newChildren.splice(newIdx, 0, moved)
    return { ...tree, children: newChildren }
  }
  return {
    ...tree,
    children: tree.children.map((c) =>
      reorderNode(c, nodeId, direction),
    ),
  }
}
