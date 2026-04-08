"use client"

/**
 * From-scratch component editor page.
 *
 * Shell that owns:
 *  - localStorage persistence (load on mount, autosave on change)
 *  - Mode toggle between Define (props/variants/sub-components) and
 *    Preview (visual editing of classes)
 *  - The "no tree" legacy fallback for old localStorage entries that
 *    didn't get lifted to v2
 *
 * The Preview-mode editing surface (code panel + canvas + assembly +
 * style editor) lives in `<UnifiedDashboard>`, which is also mounted
 * by the stock `/playground/[slug]` page. Edits flow through this
 * page's `handleTreeChange`, which both updates local tree state and
 * regenerates the source string for autosave.
 *
 * UnifiedDashboard extracted in a follow-up to PR #30 — see
 * `components/playground/unified-dashboard.tsx`.
 */

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import {
  getUserComponent,
  saveUserComponent,
} from "@/lib/component-store"
import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import { type PartPath } from "@/lib/parser/v2-tree-path"
import { getPartClasses } from "@/lib/parser/v2-tree-path"
import {
  PlaygroundToolbar,
  type Breakpoint,
  type PlaygroundMode,
} from "@/components/playground/toolbar"
import { ComponentCanvas } from "@/components/playground/component-canvas"
import { CodePanel } from "@/components/playground/code-panel"
import { StructurePanel } from "@/components/playground/structure-panel"
import { RightPanel } from "@/components/playground/right-panel"
import { DefineView } from "@/components/playground/define-view"
import { DragHandle } from "@/components/playground/drag-handle"
import { UnifiedDashboard } from "@/components/playground/unified-dashboard"

export default function CustomComponentPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  // Defer localStorage read to client only to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  const [userComponent, setUserComponent] = React.useState<
    ReturnType<typeof getUserComponent>
  >(undefined)
  const [source, setSource] = React.useState("")
  const [tree, setTree] = React.useState<ComponentTreeV2 | null>(null)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")
  const [mode, setMode] = React.useState<PlaygroundMode>("define")
  const [structurePanelWidth, setStructurePanelWidth] = React.useState(200)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [isDirty, setIsDirty] = React.useState(false)

  const hasTree = tree !== null

  /* ── Load from localStorage on mount (client only) ─────────── */

  function loadFromStore(slugToLoad: string) {
    const uc = getUserComponent(slugToLoad)
    setUserComponent(uc)
    setSource(uc?.source ?? "")
    // The store lifts legacy v1 entries to v2 on read (Step 5),
    // so we always read uc.treeV2 here.
    setTree(uc?.treeV2 ?? null)
  }

  React.useEffect(() => {
    loadFromStore(slug)
    const uc = getUserComponent(slug)
    setMode(uc?.treeV2 ? "define" : "inspect")
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Reload from store when slug changes after mount
  React.useEffect(() => {
    if (!mounted) return
    loadFromStore(slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  /* ── Has-styles check (controls whether Export is enabled) ── */

  const hasAnyStyles = React.useMemo(() => {
    if (!tree) return false
    return tree.subComponents.some((sc) => {
      const partClasses = getPartClasses(sc.parts.root)
      return partClasses.length > 0 || sc.parts.root.children.length > 0
    })
  }, [tree])

  /* ── Track dirty state ─────────────────────────────────────── */

  React.useEffect(() => {
    if (mounted && userComponent) setIsDirty(true)
  }, [source, tree, mounted, userComponent])

  /* ── Silent autosave to localStorage ───────────────────────── */

  React.useEffect(() => {
    if (!userComponent || !isDirty) return
    const timer = setTimeout(() => {
      const updated = {
        ...userComponent,
        name: tree?.name ?? userComponent.name,
        source,
        treeV2: tree ?? undefined,
        updatedAt: new Date().toISOString(),
      }
      saveUserComponent(updated)
      setUserComponent(updated)
      setIsDirty(false)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, tree])

  /* ── Tree change → regenerate source ───────────────────────── */

  const handleTreeChange = React.useCallback(
    (newTree: ComponentTreeV2) => {
      setTree(newTree)
      try {
        const newSource = generateFromTreeV2(newTree)
        setSource(newSource)
      } catch (err) {
        // Generator failed — leave the previous source in place.
        console.error("[generator] failed to emit from tree:", err)
      }
    },
    [],
  )

  // ── Early returns (after all hooks) ─────────────────────────────

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!userComponent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Custom component not found.{" "}
          <button
            type="button"
            className="underline hover:text-foreground"
            onClick={() => router.push("/playground")}
          >
            Go back
          </button>
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={tree?.name ?? userComponent.name}
        slug={hasAnyStyles ? slug : undefined}
        source={hasAnyStyles ? source : undefined}
        mode={mode}
        onModeChange={setMode}
        isCustom={hasTree}
      />

      {/* ── Main content area ────────────────────────────────── */}
      {/* ═══════════ DEFINE MODE ═══════════════════════════════ */}
      {mode === "define" && hasTree && tree && (
        <div className="flex flex-1 overflow-hidden">
          <DefineView tree={tree} onTreeChange={handleTreeChange} />
        </div>
      )}

      {/* ═══════════ PREVIEW MODE ═════════════════════════════ */}
      {mode === "preview" && hasTree && tree && (
        <UnifiedDashboard
          tree={tree}
          onTreeChange={handleTreeChange}
          slug={slug}
        />
      )}

      {/* ═══════════ INSPECT/EDIT (legacy non-tree components) ═══ */}
      {!hasTree && (
        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex shrink-0 flex-col border-r"
            style={{ width: `${structurePanelWidth}px` }}
          >
            <div className="flex items-center gap-1.5 border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                Outline
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <StructurePanel slug={slug} onNodeClick={() => {}} />
            </div>
          </div>

          <DragHandle
            width={structurePanelWidth}
            minWidth={150}
            maxWidth={350}
            onWidthChange={setStructurePanelWidth}
            side="left"
          />

          <div
            className="relative flex shrink-0 flex-col border-r"
            style={{ width: `${codePanelWidth}px` }}
          >
            <CodePanel code={source} />
          </div>

          <DragHandle
            width={codePanelWidth}
            minWidth={250}
            maxWidth={1200 - structurePanelWidth - 200}
            onWidthChange={setCodePanelWidth}
            side="left"
          />

          <ComponentCanvas
            slug={slug}
            componentName={userComponent.name}
            theme={theme}
            breakpoint={breakpoint}
            mode={mode}
          />

          <RightPanel
            isOpen={mode === "edit"}
            source={source}
            isCompound={false}
            selectedElement={null}
            onClassChange={() => {}}
            onDeselect={() => {}}
          />
        </div>
      )}
    </>
  )
}
