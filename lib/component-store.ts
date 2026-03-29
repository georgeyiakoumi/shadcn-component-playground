// Component Store — client-side persistence for user-created components
// Uses localStorage until Supabase auth arrives in M4.

import type { ComponentTree } from "@/lib/component-tree"

/* ── Types ──────────────────────────────────────────────────────── */

export interface UserComponent {
  id: string
  name: string        // PascalCase, e.g. "MyCard"
  slug: string        // kebab-case, e.g. "my-card"
  source: string      // the .tsx source code
  tree?: ComponentTree // only for from-scratch components
  basedOn?: string    // slug of the component it was forked from
  createdAt: string   // ISO date
  updatedAt: string   // ISO date
}

/* ── Constants ──────────────────────────────────────────────────── */

const STORAGE_KEY = "playground-components"

/* ── Helpers ────────────────────────────────────────────────────── */

function readStore(): UserComponent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserComponent[]
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
