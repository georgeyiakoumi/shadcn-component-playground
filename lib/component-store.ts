// Component Store — client-side persistence for user-created components
// Uses localStorage until Supabase auth arrives in M5.

import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import {
  liftV1TreeToV2,
  type LegacyComponentTreeV1,
} from "@/lib/component-tree-v2-factories"

/* ── Types ──────────────────────────────────────────────────────── */

export interface UserComponent {
  id: string
  name: string         // PascalCase, e.g. "MyCard"
  slug: string         // kebab-case, e.g. "my-card"
  source: string       // the .tsx source code
  /** v2 tree, the canonical from-scratch shape. Always present for
   *  components created via the from-scratch builder. Undefined for
   *  legacy fork-from-stock entries that have a `source` but no tree. */
  treeV2?: ComponentTreeV2
  basedOn?: string     // slug of the component it was forked from
  createdAt: string    // ISO date
  updatedAt: string    // ISO date
}

/**
 * Legacy localStorage entry shape — `UserComponent` from before GEO-305
 * Step 5. Reads from disk may return entries with this shape. They are
 * upgraded to the modern shape on read via `liftV1TreeToV2`.
 *
 * Not exported — only the public `UserComponent` type leaks out of this
 * module. Inside, we read raw JSON, detect the legacy shape, and lift.
 */
interface LegacyUserComponent
  extends Omit<UserComponent, "treeV2"> {
  /** Legacy v1 tree from before Step 5. */
  tree?: LegacyComponentTreeV1
  /** May or may not be present in legacy entries created during Step 3. */
  treeV2?: ComponentTreeV2
}

/* ── Constants ──────────────────────────────────────────────────── */

const STORAGE_KEY = "playground-components"

/* ── Internals ──────────────────────────────────────────────────── */

/**
 * Lift a legacy entry to the modern shape. If the entry has only `tree`
 * (v1) and no `treeV2`, the v1 tree is upgraded via `liftV1TreeToV2`.
 * If the entry already has `treeV2`, the legacy `tree` is dropped. If
 * the entry has neither (a fork-from-stock legacy entry), nothing
 * changes.
 */
function liftEntry(entry: LegacyUserComponent): UserComponent {
  const { tree, treeV2, ...rest } = entry
  if (treeV2) {
    // Already on v2 — strip the legacy field if present
    return { ...rest, treeV2 }
  }
  if (tree) {
    // Lift v1 → v2
    return { ...rest, treeV2: liftV1TreeToV2(tree) }
  }
  // Fork-from-stock entry with no tree at all
  return rest
}

function readStore(): UserComponent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LegacyUserComponent[]
    return parsed.map(liftEntry)
  } catch {
    return []
  }
}

function writeStore(components: UserComponent[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(components))
}

/* ── Public API ─────────────────────────────────────────────────── */

/** Return all user-created components, sorted by updatedAt descending. */
export function getUserComponents(): UserComponent[] {
  return readStore().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

/** Return a single user component by slug, or undefined if not found. */
export function getUserComponent(slug: string): UserComponent | undefined {
  return readStore().find((c) => c.slug === slug)
}

/** Create or update a user component. Matches on `id`, removes slug duplicates. */
export function saveUserComponent(component: UserComponent): void {
  // Remove any existing component with the same slug (prevents duplicates)
  const all = readStore().filter(
    (c) => c.id !== component.id && c.slug !== component.slug,
  )
  all.push(component)
  writeStore(all)
}

/** Delete a user component by slug. */
export function deleteUserComponent(slug: string): void {
  writeStore(readStore().filter((c) => c.slug !== slug))
}

/** Generate a short unique id. */
export function generateId(): string {
  return `uc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Convert a PascalCase name to a kebab-case slug. */
export function toSlug(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}
