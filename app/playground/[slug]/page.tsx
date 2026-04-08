"use client"

/**
 * Stock shadcn registry component editor page.
 *
 * Mounts the unified dashboard (the same one the from-scratch page uses)
 * with a parsed shadcn component tree. Was a separate "inspect/edit"
 * dashboard with `<StructurePanel>` + `<RightPanel>` + `<CvaSlotPicker>`
 * until 2026-04-08 when George rejected the old dashboard:
 *
 *   "Currently it's still rendering the old dashboard and I gotta be
 *    honest, I fucking hate it and I don't wanna see it again. I need
 *    you to use THIS dashboard (the one we have for 'create from
 *    scratch')."
 *
 * The unification: the parsed tree from `useParsedComponent` is held in
 * editable state, mutations flow through `<UnifiedDashboard onTreeChange>`,
 * and the slow-path generator (which detects parsed trees via the
 * `originalSource` field) handles the source splice on export.
 *
 * What this page owns:
 *  - Parsing the component slug into a v2 tree (one-shot via the
 *    /api/parse/[slug] route through useParsedComponent)
 *  - localStorage draft persistence for in-progress edits, scoped per
 *    slug. Keyed `m4-stock-edits-<slug>`.
 *  - Dirty tracking + Reset button to revert to the on-disk parsed tree
 *  - The toolbar (component name, Reset, Export)
 *
 * What lives in UnifiedDashboard:
 *  - Code panel (left) showing the regenerated source
 *  - Canvas (centre) with the floating AssemblyPanel
 *  - Style panel (right) with the unified ContextPicker for variant
 *    slot routing, breakpoints, pseudos, etc.
 *
 * Define mode is deliberately NOT exposed for parsed trees in v1.
 * Editing the structure of a shadcn registry component (adding props,
 * adding sub-components, changing variant strategies) is a bigger ask
 * than this PR aims to ship.
 */

import * as React from "react"
import { useParams } from "next/navigation"
import { RotateCcw } from "lucide-react"

import { registry } from "@/lib/registry"
import { PlaygroundToolbar } from "@/components/playground/toolbar"
import { UnifiedDashboard } from "@/components/playground/unified-dashboard"
import { Button } from "@/components/ui/button"

import { useParsedComponent } from "@/lib/parser/use-parsed-component"
import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"

export default function ComponentPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const parsedState = useParsedComponent(slug)
  const [editTree, setEditTree] = React.useState<ComponentTreeV2 | null>(null)

  // Hydrate the editable tree once the API call resolves. Deep-clone via
  // structuredClone so we own a separate copy from the hook's cached
  // state — mutations should not bleed back through the cache.
  //
  // Also restore any in-progress draft from localStorage so refresh /
  // navigate-away doesn't lose work. Autosave key is scoped per slug.
  React.useEffect(() => {
    if (parsedState.status === "ready") {
      const storageKey = `m4-stock-edits-${slug}`
      let restored: ComponentTreeV2 | null = null
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(storageKey)
          if (raw) {
            const parsed = JSON.parse(raw) as ComponentTreeV2
            // Sanity check: must be the same component the API just gave
            // us, and must still parse cleanly.
            if (
              parsed.slug === slug &&
              parsed.name === parsedState.tree.name
            ) {
              restored = parsed
            }
          }
        } catch {
          // Corrupt or stale entry — drop it.
        }
      }
      setEditTree(restored ?? structuredClone(parsedState.tree))
    } else {
      setEditTree(null)
    }
  }, [parsedState, slug])

  const component = registry.find((c) => c.slug === slug)

  // Source is regenerated from the tree on every render. The slow-path
  // generator splices into `originalSource` for parsed trees, so the
  // output is byte-equivalent to the on-disk source until the user
  // makes an edit.
  const source = React.useMemo(() => {
    if (!editTree) return ""
    try {
      return generateFromTreeV2(editTree)
    } catch (err) {
      console.error("[stock-page] generator failed:", err)
      return editTree.originalSource ?? ""
    }
  }, [editTree])

  // Dirty = the regenerated source differs from the on-disk source.
  const isDirty = React.useMemo(() => {
    if (!editTree?.originalSource) return false
    return source !== editTree.originalSource
  }, [editTree, source])

  // Silent autosave to localStorage. Skipped when the tree regenerates
  // to `originalSource` verbatim (clean state) so we don't pollute
  // storage with no-op drafts.
  React.useEffect(() => {
    if (!editTree || typeof window === "undefined") return
    const storageKey = `m4-stock-edits-${slug}`
    if (!isDirty) {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
      return
    }
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(editTree))
      } catch {
        // Quota exceeded or unavailable — silent fallback.
      }
    }, 500)
    return () => window.clearTimeout(handle)
  }, [editTree, isDirty, slug])

  const handleTreeChange = React.useCallback((newTree: ComponentTreeV2) => {
    setEditTree(newTree)
  }, [])

  const handleReset = React.useCallback(() => {
    if (parsedState.status !== "ready") return
    setEditTree(structuredClone(parsedState.tree))
  }, [parsedState])

  if (!component) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Component not found</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={component.name}
        slug={slug}
        source={source}
        mode="preview"
        hideModeToggle
        extraActions={
          isDirty ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={handleReset}
              data-testid="reset-edits-button"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          ) : null
        }
      />

      {/* ── Main content ─────────────────────────────────────── */}
      {parsedState.status === "loading" || parsedState.status === "idle" ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : parsedState.status === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Could not parse this component.
          </p>
          <p className="text-xs text-muted-foreground/60">
            {parsedState.reason}
          </p>
        </div>
      ) : editTree ? (
        <UnifiedDashboard
          tree={editTree}
          onTreeChange={handleTreeChange}
          slug={slug}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}
    </>
  )
}
