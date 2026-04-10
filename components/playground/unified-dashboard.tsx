"use client"

/**
 * UnifiedDashboard — the single editing surface for both from-scratch
 * components and parsed shadcn registry components.
 *
 * ## Why this exists
 *
 * Until 2026-04-08, the playground had two parallel dashboards:
 *
 * - `app/playground/[slug]/page.tsx` — the "stock" dashboard for browsing
 *   shadcn registry components. Used `<StructurePanel>`, `<RightPanel>`,
 *   `<CvaSlotPicker>`, and a real-React-module canvas (`renderComponent(slug)`).
 *   Edits flowed through `applyClassEditToTree` keyed off `data-slot` lookups.
 *
 * - `app/playground/custom/[slug]/page.tsx` — the "from-scratch" dashboard
 *   that George built with the AssemblyPanel + ContextPicker + tree-driven
 *   canvas + unified slot routing. PR #29/#30 stabilised this surface.
 *
 * George's verdict on the stock dashboard: *"I fucking hate it and I don't
 * wanna see it again."* The from-scratch dashboard is the one to keep.
 * This component extracts that dashboard so both routes can mount it.
 *
 * ## Architecture
 *
 * The dashboard is **tree-driven**: it takes a `ComponentTreeV2` and an
 * `onTreeChange` callback, and derives everything else (source code,
 * canvas preview, variant lists, edit routing) from the tree. The two
 * pages differ only in where the tree comes from:
 *
 * - From-scratch page: tree is built via `createV2TreeFromScratch` and
 *   persisted to localStorage. The page wraps `onTreeChange` to autosave.
 * - Stock page: tree is fetched via `useParsedComponent` (server parse)
 *   and held in `editTree` state. The page wraps `onTreeChange` to drive
 *   the slow-path source splicer for export.
 *
 * The dashboard itself is unaware of which path the tree came from. The
 * generator's slow-path automatically activates for trees that carry an
 * `originalSource` field (parsed) and the template-emission path activates
 * for trees that don't (factory-built).
 *
 * ## What's NOT in this component
 *
 * - The `<PlaygroundToolbar>` at the top of each page (mode toggle,
 *   component name, export button). The pages mount that themselves
 *   because they have different toolbar configurations.
 * - The `<DefineView>` (props/variants/sub-components editor). Only the
 *   from-scratch page mounts that, gated behind `mode === "define"`.
 *   Parsed shadcn trees don't get a Define mode in v1 — editing the
 *   structure of a parsed component is out of scope for this PR.
 * - Persistence (localStorage / Supabase). Pages handle their own.
 * - Source regeneration for autosave. Pages can call
 *   `generateFromTreeV2(tree)` themselves — the dashboard derives the
 *   display source internally for the CodePanel only.
 *
 * GEO-XXX — extracted in a follow-up to PR #30.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import type {
  ComponentTreeV2,
  CvaExport,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import {
  findPartByPath,
  findSubByPath,
  getPartClasses,
  isRootPath,
  makePartPath,
  setPartClasses,
  type PartPath,
} from "@/lib/parser/v2-tree-path"
import {
  getDataAttrSlotClasses,
  setDataAttrSlotClasses,
} from "@/lib/parser/data-attr-slot"
import {
  renderTreePreviewV2,
  type RenderContextV2,
} from "@/lib/parser/render-tree-preview-v2"
import {
  type Breakpoint,
  type PropSelector,
} from "@/components/playground/toolbar"
import {
  findParentInRule,
  lookupRule,
} from "@/lib/parser/preview-snippets"
import { ComponentCanvas } from "@/components/playground/component-canvas"
import { CodePanel } from "@/components/playground/code-panel"
import { StatusBar } from "@/components/playground/status-bar"
import { VisualEditor } from "@/components/playground/visual-editor"
import { DragHandle } from "@/components/playground/drag-handle"
import { AssemblyPanel } from "@/components/playground/assembly-panel"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface UnifiedDashboardProps {
  /** The v2 tree being edited. Owned by the parent page. */
  tree: ComponentTreeV2

  /** Called whenever the tree changes (selection, slot edit, clear all). */
  onTreeChange: (tree: ComponentTreeV2) => void

  /**
   * The component slug — used for the canvas's slug-based registry
   * lookup fallback (when no `customPreview` is supplied — currently
   * always supplied since we always have a tree). Kept as a prop in
   * case the canvas evolves to use it for things like keyed React
   * fast-refresh.
   */
  slug: string
}

export function UnifiedDashboard({
  tree,
  onTreeChange,
  slug,
}: UnifiedDashboardProps) {
  /* ── Local UI state ────────────────────────────────────────── */

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")
  const [propValues, setPropValues] = React.useState<Record<string, string>>({})
  const [selectedPath, setSelectedPath] = React.useState<PartPath | null>(null)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [editPanelWidth, setEditPanelWidth] = React.useState(384)
  const [highlightLine, setHighlightLine] = React.useState<number | null>(null)
  const [focusRange, setFocusRange] = React.useState<{
    start: number
    end: number
  } | null>(null)
  const [hiddenPaths, setHiddenPaths] = React.useState<Set<PartPath>>(new Set())
  // Active contexts in the VisualEditor's ContextPicker. When one of these
  // is `variant:<group>:<value>` and matches the selected sub-component's
  // own variant, edits route into the slot instead of the base.
  const [activeContexts, setActiveContexts] = React.useState<string[]>([])
  const contentRef = React.useRef<HTMLDivElement>(null)

  /* ── Source (derived from tree) ────────────────────────────── */

  const source = React.useMemo(() => {
    try {
      return generateFromTreeV2(tree)
    } catch (err) {
      console.error("[unified-dashboard] generator failed:", err)
      return tree.originalSource ?? ""
    }
  }, [tree])

  const displaySource =
    source || `// Source code for ${tree.name}`

  /* ── Variant defs derived from the v2 tree ─────────────────── */

  // Derive a flat variant list from ALL sub-components for the
  // bottom-bar Variants popover. Surfaces BOTH strategies:
  //
  // - cva: read groups from `tree.cvaExports[i].variants`
  // - data-attr: read variants from `sub.variantStrategy.variants`
  //
  // GEO-374: previously only read from subComponents[0]. Now walks
  // every sub-component so Item's variant/size (which live on the
  // Item sub-component, not on the root ItemGroup) are surfaced.
  // Deduplicates by prop name — if multiple sub-components declare
  // the same prop, the first one wins.
  const variantDefs = React.useMemo(() => {
    if (tree.subComponents.length === 0) return []
    const out: Array<{ name: string; options: string[]; defaultValue: string }> = []
    const seen = new Set<string>()

    for (const sub of tree.subComponents) {
      if (sub.variantStrategy.kind === "cva") {
        const cvaRef = sub.variantStrategy.cvaRef
        const cva = tree.cvaExports.find((c) => c.name === cvaRef)
        if (cva) {
          for (const [groupName, valueMap] of Object.entries(cva.variants)) {
            if (seen.has(groupName)) continue
            seen.add(groupName)
            const valueNames = Object.keys(valueMap)
            out.push({
              name: groupName,
              options: valueNames,
              defaultValue:
                cva.defaultVariants?.[groupName] ?? valueNames[0] ?? "",
            })
          }
        }
      }

      if (sub.variantStrategy.kind === "data-attr") {
        for (const dav of sub.variantStrategy.variants) {
          if (seen.has(dav.propName)) continue
          seen.add(dav.propName)
          out.push({
            name: dav.propName,
            options: dav.values.slice(),
            defaultValue: dav.defaultValue,
          })
        }
      }
    }

    return out
  }, [tree])

  // Reset prop values when the variant defs change.
  React.useEffect(() => {
    const defaults: Record<string, string> = {}
    variantDefs.forEach((v) => {
      defaults[v.name] = v.defaultValue
    })
    setPropValues(defaults)
  }, [variantDefs])

  /* ── Variant prop value resolution (canvas preview) ──────────
   *
   * Two strategies, two resolution paths:
   *
   * 1. cva — `getPartClasses` returns [] for cva-call className
   *    shapes (it can't read the cva-call structure). We synthesise
   *    the active class list by combining `cva.baseClasses` with each
   *    variant group's active value's class string. The active value
   *    comes from `propValues` (bottom-bar Variants popover), with
   *    `cva.defaultVariants` as the fallback.
   *
   * 2. data-attr — `getPartClasses` DOES return the full cn-call
   *    base for data-attr sub-components, INCLUDING the user's
   *    `data-[X=Y]:cls` prefixed classes. Tailwind v4 can't safelist
   *    arbitrary user-typed `data-[…]:` prefixes (the variant names
   *    are user-defined and the safelist needs concrete strings at
   *    build time).
   *
   *    Solution: STRIP the prefix at render time. For each class with
   *    a `data-[X=Y]:` prefix:
   *      - If `Y` matches the active value for variant `X`, the class
   *        becomes the bare form (`bg-destructive` instead of
   *        `data-[size=sm]:bg-destructive`). Tailwind already knows
   *        the bare form.
   *      - If `Y` matches a non-active value, the class is dropped
   *        (it would never apply at the rendered DOM since we only
   *        render the active state).
   *      - Bare classes (no prefix) are kept as-is.
   *
   *    Originally solved in v1 commit `deeefb8`, lost during the
   *    v1→v2 migration, rediscovered when George caught the canvas
   *    not updating on `size=sm` toggles. See
   *    `feedback_runtime_class_resolution_for_data_attr.md` for the
   *    full lesson.
   */

  const resolveActiveClasses = React.useCallback(
    (
      rawClasses: string[],
      sub: SubComponentV2 | null,
      cvaExports: CvaExport[],
    ): string[] => {
      if (!sub) return rawClasses

      // ── cva strategy ───────────────────────────────────────
      if (sub.variantStrategy.kind === "cva") {
        const cvaRef = sub.variantStrategy.cvaRef
        const cva = cvaExports.find((c) => c.name === cvaRef)
        if (!cva) return rawClasses

        const result: string[] = []
        if (cva.baseClasses) {
          result.push(...cva.baseClasses.split(/\s+/).filter(Boolean))
        }
        for (const [groupName, valueMap] of Object.entries(cva.variants)) {
          const activeValue =
            propValues[groupName] ?? cva.defaultVariants?.[groupName]
          if (!activeValue) continue
          const classString = valueMap[activeValue]
          if (classString) {
            result.push(...classString.split(/\s+/).filter(Boolean))
          }
        }
        return [...result, ...rawClasses]
      }

      // ── data-attr strategy: strip prefixes at render time ──
      if (sub.variantStrategy.kind === "data-attr") {
        // Build the set of active and inactive prefixes from the
        // variant declarations + active values.
        const activePrefixes = new Set<string>()
        const inactivePrefixes = new Set<string>()
        for (const v of sub.variantStrategy.variants) {
          const activeValue = propValues[v.propName] ?? v.defaultValue
          const attrBody = v.attrName.startsWith("data-")
            ? v.attrName.slice("data-".length)
            : v.attrName
          for (const opt of v.values) {
            const prefix = `data-[${attrBody}=${opt}]:`
            if (opt === activeValue) {
              activePrefixes.add(prefix)
            } else {
              inactivePrefixes.add(prefix)
            }
          }
        }

        const result: string[] = []
        for (const cls of rawClasses) {
          // Active prefix → strip and keep
          let stripped: string | null = null
          for (const prefix of activePrefixes) {
            if (cls.startsWith(prefix)) {
              stripped = cls.slice(prefix.length)
              break
            }
          }
          if (stripped !== null) {
            result.push(stripped)
            continue
          }
          // Inactive prefix → drop
          let isInactive = false
          for (const prefix of inactivePrefixes) {
            if (cls.startsWith(prefix)) {
              isInactive = true
              break
            }
          }
          if (isInactive) continue
          // Bare class → keep
          result.push(cls)
        }
        return result
      }

      // ── none / unknown → pass-through ───────────────────────
      return rawClasses
    },
    [propValues],
  )

  // Build the data-* attribute map the renderer applies to the root
  // element. For data-attr sub-components (the newer shadcn pattern,
  // e.g. Card with `size: "default" | "sm"`), Tailwind selectors like
  // `data-[size=sm]:bg-destructive` only activate when the rendered DOM
  // actually has `data-size="sm"`. We synthesise that attribute here
  // from the active values in `propValues` so the canvas previews
  // variant changes live as the user toggles them in the bottom-bar
  // Variants popover.
  //
  // Pre-fix this object was always empty and the data-attr prefixed
  // classes never activated — toggling size in the popover did
  // nothing visible on the canvas.
  // GEO-374: aggregate data-attr variants from ALL sub-components so
  // the canvas preview reflects the active variant values regardless
  // of which sub-component declares them.
  const variantDataAttrs = React.useMemo(() => {
    const attrs: Record<string, string> = {}
    for (const sub of tree.subComponents) {
      if (sub.variantStrategy.kind !== "data-attr") continue
      for (const v of sub.variantStrategy.variants) {
        const activeValue = propValues[v.propName] ?? v.defaultValue
        attrs[v.attrName] = activeValue
      }
    }
    return attrs
  }, [tree, propValues])

  const renderContext: RenderContextV2 = React.useMemo(
    () => ({
      tree,
      selectedPath,
      hiddenPaths,
      // The renderer calls resolveVariantClasses without sub-component
      // context. We resolve against the root sub-component's cva — a
      // future iteration could thread sub context through the renderer.
      resolveVariantClasses: (classes: string[]) =>
        resolveActiveClasses(
          classes,
          tree.subComponents[0] ?? null,
          tree.cvaExports,
        ),
      resolveClassesForSub: (sub: SubComponentV2, classes: string[]) =>
        resolveActiveClasses(classes, sub, tree.cvaExports),
      variantDataAttrs,
    }),
    [tree, selectedPath, hiddenPaths, resolveActiveClasses, variantDataAttrs],
  )

  const customPreview = React.useMemo(
    () => renderTreePreviewV2(renderContext),
    [renderContext],
  )

  /* ── Prop selectors (bottom-bar Variants popover) ──────────── */

  const propSelectors: PropSelector[] | undefined =
    variantDefs.length > 0
      ? variantDefs.map((v) => ({
          label: v.name.charAt(0).toUpperCase() + v.name.slice(1),
          options: v.options,
          value: propValues[v.name] ?? v.defaultValue,
          onChange: (value: string) =>
            setPropValues((prev) => ({ ...prev, [v.name]: value })),
        }))
      : undefined

  // Build preview props from current prop values (for the canvas)
  const previewProps: Record<string, string> | undefined =
    Object.keys(propValues).length > 0 ? propValues : undefined

  /* ── Class edit handler ────────────────────────────────────── */

  const handlePartClassChange = React.useCallback(
    (path: PartPath, classes: string[]) => {
      const sub = findSubByPath(tree, path)
      const ownVariantContext = activeContexts.find((c) =>
        c.startsWith("variant:"),
      )

      if (sub && ownVariantContext && isRootPath(path)) {
        const parts = ownVariantContext.split(":")
        const group = parts[1]
        const value = parts[2]

        // cva strategy: write into the cva slot
        if (sub.variantStrategy.kind === "cva" && group && value) {
          const cvaRef = sub.variantStrategy.cvaRef
          const cva = tree.cvaExports.find((c) => c.name === cvaRef)
          if (cva && cva.variants[group] && value in cva.variants[group]) {
            const newTree: ComponentTreeV2 = {
              ...tree,
              cvaExports: tree.cvaExports.map((ce) => {
                if (ce.name !== cvaRef) return ce
                return {
                  ...ce,
                  variants: {
                    ...ce.variants,
                    [group]: {
                      ...ce.variants[group],
                      [value]: classes.join(" "),
                    },
                  },
                }
              }),
            }
            onTreeChange(newTree)
            return
          }
        }

        // data-attr strategy: write to the cn() base via the slot helper
        if (sub.variantStrategy.kind === "data-attr" && group && value) {
          const matches = sub.variantStrategy.variants.find(
            (v) => v.propName === group && v.values.includes(value),
          )
          if (matches) {
            const newTree = setDataAttrSlotClasses(
              tree,
              sub.name,
              group,
              value,
              classes,
            )
            onTreeChange(newTree)
            return
          }
        }
      }

      // Default path — write to the element's cn-call base.
      onTreeChange(setPartClasses(tree, path, classes))
    },
    [tree, activeContexts, onTreeChange],
  )

  /* ── Outline navigation: scroll code panel to selected node ── */

  const handleOutlineNodeClick = React.useCallback(
    (name: string) => {
      const lines = displaySource.split("\n")
      const lineIndex = lines.findIndex(
        (line) =>
          line.includes(`const ${name}`) ||
          line.includes(`function ${name}`) ||
          line.includes(`"${name}"`) ||
          line.includes(`${name} =`),
      )
      if (lineIndex !== -1) {
        setHighlightLine(null)
        requestAnimationFrame(() => setHighlightLine(lineIndex + 1))
      }
    },
    [displaySource],
  )

  // Scroll code panel to selected sub-component when path changes
  React.useEffect(() => {
    if (!selectedPath) {
      setFocusRange(null)
      return
    }
    const sub = findSubByPath(tree, selectedPath)
    const name = sub?.name
    if (!name) return

    handleOutlineNodeClick(name)

    // Find the function block range in the source
    const lines = displaySource.split("\n")
    const startIdx = lines.findIndex(
      (line) =>
        line.includes(`const ${name} =`) ||
        line.includes(`function ${name}(`) ||
        line.includes(`function ${name} (`),
    )
    if (startIdx !== -1) {
      let depth = 0
      let endIdx = startIdx
      let foundOpen = false
      for (let i = startIdx; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === "{") {
            depth++
            foundOpen = true
          }
          if (ch === "}") depth--
        }
        endIdx = i
        if (foundOpen && depth <= 0) break
      }
      setFocusRange({ start: startIdx + 1, end: endIdx + 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, displaySource])

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div ref={contentRef} className="flex flex-1 overflow-hidden">
      {/* Code panel (left) */}
      <div
        className="relative flex shrink-0 flex-col border-r"
        style={{ width: `${codePanelWidth}px` }}
      >
        <CodePanel
          code={displaySource}
          highlightLine={highlightLine}
          focusRange={focusRange}
        />
      </div>

      <DragHandle
        width={codePanelWidth}
        minWidth={250}
        maxWidth={(contentRef.current?.offsetWidth ?? 1200) - 200 - 320}
        onWidthChange={setCodePanelWidth}
        side="left"
      />

      {/* Canvas section (centre) — self-contained. `min-w-0` lets the
          column shrink below its content's intrinsic width so the
          StatusBar doesn't bleed into the right Style panel's hit-test
          area at narrow viewports. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Canvas + floating assembly panel */}
        <div
          className="relative flex flex-1 flex-col"
          onClick={(e) => {
            let el = e.target as HTMLElement | null
            while (el && !el.getAttribute("data-node-id")) {
              if (
                el.classList.contains("assembly-panel") ||
                el === e.currentTarget
              )
                break
              el = el.parentElement
            }
            const path = el?.getAttribute("data-node-id") as PartPath | null
            if (path) {
              setSelectedPath(selectedPath === path ? null : path)
            } else {
              setSelectedPath(null)
            }
          }}
        >
          <ComponentCanvas
            slug={slug}
            componentName={tree.name}
            theme={theme}
            breakpoint={breakpoint}
            previewProps={previewProps}
            customPreview={customPreview}
            mode="inspect"
          />

          {/* Floating assembly panel (bottom-left). z-40 keeps it
              above canvas content but below viewport-level overlays
              like the Export dialog (z-50). Canvas portals (Radix
              composition rule previews) are in a separate stacking
              context inside the overflow-hidden canvas container. */}
          <div
            className="absolute bottom-3 left-3 z-40 w-72 rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <AssemblyPanel
              tree={tree}
              onTreeChange={onTreeChange}
              onSelectPath={setSelectedPath}
              selectedPath={selectedPath}
              hiddenPaths={hiddenPaths}
              onHiddenChange={setHiddenPaths}
            />
          </div>
        </div>

        {/* Status bar with breakpoints + theme */}
        <StatusBar
          source={source}
          theme={theme}
          onThemeChange={setTheme}
          breakpoint={breakpoint}
          onBreakpointChange={setBreakpoint}
          propSelectors={propSelectors}
        />
      </div>

      {/* Right panel resize handle */}
      <DragHandle
        width={editPanelWidth}
        minWidth={384}
        maxWidth={600}
        onWidthChange={setEditPanelWidth}
        side="right"
      />

      {/* Right panel: visual styling per part */}
      {/* `min-h-0` lets the inner ScrollArea constrain its own height
          instead of growing past the viewport. */}
      <div
        className="flex min-h-0 shrink-0 flex-col border-l bg-background"
        style={{ width: `${editPanelWidth}px` }}
      >
        <div className="flex items-center gap-1.5 border-b px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Style
          </span>
          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all styles?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all Tailwind classes from every sub-component
                  in this component. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    // Wipe classes from EVERY surface that the user can
                    // write to:
                    //   1. Each sub-component's root part cn() base
                    //      (handles namedGroup/headingFont base + any
                    //      data-attr `data-[X=Y]:` classes since they
                    //      live in this same literal)
                    //   2. Each cva export's baseClasses + every
                    //      variants[group][value] string (cva strategy
                    //      slot classes — these live separately in
                    //      tree.cvaExports)
                    let cleared = tree
                    for (const sub of tree.subComponents) {
                      const path = makePartPath(sub.name, [])
                      cleared = setPartClasses(cleared, path, [])
                    }
                    if (cleared.cvaExports.length > 0) {
                      cleared = {
                        ...cleared,
                        cvaExports: cleared.cvaExports.map((cva) => ({
                          ...cva,
                          baseClasses: "",
                          variants: Object.fromEntries(
                            Object.entries(cva.variants).map(
                              ([groupName, valueMap]) => [
                                groupName,
                                Object.fromEntries(
                                  Object.entries(valueMap).map(
                                    ([valueName]) => [valueName, ""],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        })),
                      }
                    }
                    onTreeChange(cleared)
                    setSelectedPath(null)
                  }}
                >
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Sub-component pills */}
        <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
          {tree.subComponents.map((sc) => {
            const path = makePartPath(sc.name, [])
            const isSelected =
              selectedPath === path ||
              (selectedPath !== null &&
                selectedPath.startsWith(`sub:${sc.name}/`))
            return (
              <button
                key={sc.name}
                type="button"
                onClick={() => setSelectedPath(path)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-blue-500/10 text-blue-500"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {sc.name === tree.name
                  ? sc.name
                  : sc.name.replace(tree.name, "")}
              </button>
            )
          })}
        </div>

        {/* Visual editor for selected part */}
        {/* `min-h-0` is the load-bearing line — without it the flex-1
            doesn't constrain the ScrollArea's height and the panel grows
            past the viewport. */}
        <ScrollArea className="min-h-0 flex-1">
          {selectedPath ? (
            (() => {
              const selectedPart = findPartByPath(tree, selectedPath)
              const selectedSub = findSubByPath(tree, selectedPath)
              if (!selectedPart || !selectedSub) return null

              const tagName =
                selectedPart.base.kind === "html"
                  ? selectedPart.base.tag
                  : "div"
              const isRoot = isRootPath(selectedPath)

              // Build the variants list the ContextPicker will surface
              // for this selected element. Includes both cva and data-attr
              // variants, in source order.
              const subCva =
                selectedSub.variantStrategy.kind === "cva"
                  ? tree.cvaExports.find(
                      (c) =>
                        c.name ===
                        (
                          selectedSub.variantStrategy as {
                            kind: "cva"
                            cvaRef: string
                          }
                        ).cvaRef,
                    )
                  : undefined
              const subVariants: Array<{ name: string; options: string[] }> =
                []
              if (subCva) {
                for (const [n, vals] of Object.entries(subCva.variants)) {
                  subVariants.push({ name: n, options: Object.keys(vals) })
                }
              }
              if (selectedSub.variantStrategy.kind === "data-attr") {
                for (const dav of selectedSub.variantStrategy.variants) {
                  subVariants.push({
                    name: dav.propName,
                    options: dav.values.slice(),
                  })
                }
              }

              // If the active contexts point at an own-variant slot, load
              // classes from that slot so the controls reflect the slot's
              // current state.
              const ownVariantContext = activeContexts.find((c) =>
                c.startsWith("variant:"),
              )
              let partClasses: string[] = getPartClasses(selectedPart)
              if (ownVariantContext && isRoot) {
                const parts = ownVariantContext.split(":")
                const group = parts[1]
                const value = parts[2]
                if (subCva && group && value) {
                  const slotValue = subCva.variants[group]?.[value]
                  if (typeof slotValue === "string") {
                    partClasses = slotValue.split(/\s+/).filter(Boolean)
                  }
                } else if (
                  selectedSub.variantStrategy.kind === "data-attr" &&
                  group &&
                  value
                ) {
                  const slotClasses = getDataAttrSlotClasses(
                    selectedSub,
                    group,
                    value,
                  )
                  if (slotClasses !== null) {
                    partClasses = slotClasses
                  }
                }
              }

              // Parent discovery for child-placement controls
              // (justify-self / align-self / grid-column etc.).
              // Only the selected sub-component's *composition
              // parent* matters — we walk the active rule if the
              // tree is ruled, else the from-scratch `nestInside`
              // field.
              //
              // When the parent is a flex or grid container, the
              // VisualEditor's ChildPlacementSection renders its
              // controls. Without these props, the section never
              // shows — the regression George caught while styling
              // Card's CardHeader (a grid) children.
              let parentClasses: string[] | undefined
              let parentTag: string | undefined
              if (isRoot && selectedSub) {
                const rule = lookupRule(tree)
                let parentName: string | null = null
                if (rule) {
                  const parentNode = findParentInRule(
                    rule.composition,
                    selectedSub.name,
                  )
                  parentName = parentNode?.name ?? null
                } else if (selectedSub.nestInside) {
                  parentName = selectedSub.nestInside
                }
                if (parentName) {
                  const parentSub = tree.subComponents.find(
                    (sc) => sc.name === parentName,
                  )
                  if (parentSub) {
                    parentClasses = getPartClasses(parentSub.parts.root)
                    if (parentSub.parts.root.base.kind === "html") {
                      parentTag = parentSub.parts.root.base.tag
                    }
                  }
                }
              }

              return (
                <VisualEditor
                  key={selectedPath}
                  selectedElement={{
                    tagName,
                    textContent: isRoot ? selectedSub.name : tagName,
                    currentClasses: partClasses,
                    elementPath: "",
                    rect: new DOMRect(),
                    domElement: document.createElement("div"),
                  }}
                  parentClasses={parentClasses}
                  parentTag={parentTag}
                  onClassChange={(classes) => {
                    handlePartClassChange(selectedPath, classes)
                  }}
                  onDeselect={() => setSelectedPath(null)}
                  variants={subVariants}
                  props={[]}
                  subComponentNames={tree.subComponents.map((sc) => sc.name)}
                  onContextsChange={setActiveContexts}
                />
              )
            })()
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="text-xs text-muted-foreground text-center">
                Select a component above to edit its styles.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
