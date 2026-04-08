"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import {
  getUserComponent,
  saveUserComponent,
} from "@/lib/component-store"
import type {
  ComponentTreeV2,
  CvaExport,
  PartNode,
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
  PlaygroundToolbar,
  type Breakpoint,
  type PlaygroundMode,
  type PropSelector,
} from "@/components/playground/toolbar"
import { ComponentCanvas } from "@/components/playground/component-canvas"
import { CodePanel } from "@/components/playground/code-panel"
import { StructurePanel } from "@/components/playground/structure-panel"
import { StatusBar } from "@/components/playground/status-bar"
import { RightPanel } from "@/components/playground/right-panel"
import { DefineView } from "@/components/playground/define-view"
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
  const [propValues, setPropValues] = React.useState<Record<string, string>>({})
  const [mode, setMode] = React.useState<PlaygroundMode>("define")
  const [selectedPath, setSelectedPath] = React.useState<PartPath | null>(null)
  const [structurePanelWidth, setStructurePanelWidth] = React.useState(200)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [editPanelWidth, setEditPanelWidth] = React.useState(384)
  const [highlightLine, setHighlightLine] = React.useState<number | null>(null)
  const [focusRange, setFocusRange] = React.useState<{ start: number; end: number } | null>(null)
  const [hiddenPaths, setHiddenPaths] = React.useState<Set<PartPath>>(new Set())
  const [isDirty, setIsDirty] = React.useState(false)
  // Active contexts in the VisualEditor's ContextPicker. When one of these
  // is `variant:<group>:<value>` and matches the selected sub-component's
  // own cva, edits route into the cva slot instead of the base className.
  const [activeContexts, setActiveContexts] = React.useState<string[]>([])
  const contentRef = React.useRef<HTMLDivElement>(null)

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

  /* ── Variant defs derived from the v2 tree ─────────────────── */

  // Derive a flat variant list from the root sub-component's cva export
  // for the bottom-bar Variants popover.
  const variantDefs = React.useMemo(() => {
    if (!tree || tree.subComponents.length === 0) return []
    const root = tree.subComponents[0]
    if (root.variantStrategy.kind !== "cva") return []
    const cvaRef = root.variantStrategy.cvaRef
    const cva = tree.cvaExports.find((c) => c.name === cvaRef)
    if (!cva) return []
    return Object.entries(cva.variants).map(([groupName, valueMap]) => {
      const valueNames = Object.keys(valueMap)
      return {
        name: groupName,
        options: valueNames,
        defaultValue:
          cva.defaultVariants?.[groupName] ?? valueNames[0] ?? "",
      }
    })
  }, [tree])

  // Reset prop values when slug changes
  React.useEffect(() => {
    const defaults: Record<string, string> = {}
    variantDefs.forEach((v) => {
      defaults[v.name] = v.defaultValue
    })
    setPropValues(defaults)
  }, [slug, variantDefs])

  /* ── Has-styles check (controls whether Export is enabled) ── */

  const hasAnyStyles = React.useMemo(() => {
    if (!tree) return false
    return tree.subComponents.some((sc) => {
      const partClasses = getPartClasses(sc.parts.root)
      return partClasses.length > 0 || sc.parts.root.children.length > 0
    })
  }, [tree])

  /* ── Selection cleanup when leaving edit mode ──────────────── */

  React.useEffect(() => {
    if (mode !== "edit") {
      setSelectedPath(null)
    }
  }, [mode])

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
        // This shouldn't happen for from-scratch trees but the catch
        // protects against malformed states during the migration.
        console.error("[generator] failed to emit from tree:", err)
      }
    },
    [],
  )

  /* ── Variant prop value resolution ─────────────────────────── */

  // Active class string for a part: base classes + the active variant
  // values' class strings from any cva export the part's sub-component uses.
  function resolveActiveClasses(
    rawClasses: string[],
    sub: SubComponentV2 | null,
    cvaExports: CvaExport[],
  ): string[] {
    if (!sub || sub.variantStrategy.kind !== "cva") return rawClasses
    const cvaRef = sub.variantStrategy.cvaRef
    const cva = cvaExports.find((c) => c.name === cvaRef)
    if (!cva) return rawClasses

    const extra: string[] = []
    for (const [groupName, valueMap] of Object.entries(cva.variants)) {
      const activeValue =
        propValues[groupName] ?? cva.defaultVariants?.[groupName]
      if (!activeValue) continue
      const classString = valueMap[activeValue]
      if (classString) {
        extra.push(...classString.split(/\s+/).filter(Boolean))
      }
    }
    return [...rawClasses, ...extra]
  }

  // The render context's resolveVariantClasses needs the path to know which
  // sub-component the part belongs to. We close over the current tree and
  // pass it through.
  const renderContext: RenderContextV2 | null = React.useMemo(() => {
    if (!tree) return null
    return {
      tree,
      selectedPath,
      hiddenPaths,
      // The renderer calls resolveVariantClasses without sub-component
      // context. We need a "current sub-component" — the renderer walks
      // sub-components via component-ref bases, but it doesn't tell us
      // which sub it's currently in. For now, resolve against the root
      // sub-component's cva. A future iteration could thread sub context
      // through the renderer.
      resolveVariantClasses: (classes: string[]) =>
        resolveActiveClasses(classes, tree.subComponents[0] ?? null, tree.cvaExports),
      variantDataAttrs: {},
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, selectedPath, hiddenPaths, propValues])

  const customPreview = React.useMemo(() => {
    if (!renderContext) return null
    return renderTreePreviewV2(renderContext)
  }, [renderContext])

  const displaySource =
    source || `// Source code for ${userComponent?.name ?? "Component"}`

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

  /* ── Class edit handler (called when the user edits classes
        on the selected part in the visual editor) ─────────────

     The ContextPicker doubles as the variant slot picker on the
     custom page (Lesson #20 — don't split UIs that do the same job).
     When the active contexts include a `variant:<group>:<value>` that
     matches the selected sub-component's own variant, the write
     routes to the right slot:

     - cva strategy → mutate `tree.cvaExports[i].variants[g][v]`
     - data-attr strategy → mutate the cn() base via
       `setDataAttrSlotClasses` (writes `data-[g=v]:` prefixes)
     - no matching strategy → fall through to the base className edit

     Only the sub-component root carries variants. Body parts never
     have their own variant slots — they always edit the base. */

  const handlePartClassChange = React.useCallback(
    (path: PartPath, classes: string[]) => {
      if (!tree) return

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
            handleTreeChange(newTree)
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
            handleTreeChange(newTree)
            return
          }
        }
      }

      // Default path — write to the element's cn-call base.
      handleTreeChange(setPartClasses(tree, path, classes))
    },
    [tree, activeContexts, handleTreeChange],
  )

  /* ── Outline node click → highlight in code panel ──────────── */

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
    if (!selectedPath || !tree) {
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
      <div ref={contentRef} className="flex flex-1 overflow-hidden">
        {/* ═══════════ DEFINE MODE ═══════════════════════════════ */}
        {mode === "define" && hasTree && tree && (
          <DefineView tree={tree} onTreeChange={handleTreeChange} />
        )}

        {/* ═══════════ PREVIEW MODE ═════════════════════════════ */}
        {mode === "preview" && hasTree && tree && (
          <>
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

            {/* Canvas section (centre) — self-contained */}
            <div className="flex min-w-[200px] flex-1 flex-col">
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
                  const path = el?.getAttribute("data-node-id") as
                    | PartPath
                    | null
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

                {/* Floating assembly panel (bottom-left) */}
                <div
                  className="absolute bottom-3 left-3 z-10 w-72 rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AssemblyPanel
                    tree={tree}
                    onTreeChange={handleTreeChange}
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
            {/* GEO-305 Step 7 — `min-h-0` lets the inner ScrollArea constrain
                its own height instead of growing past the viewport. */}
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
                        This removes all Tailwind classes from every
                        sub-component in this component. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          if (!tree) return
                          // Wipe classes from EVERY surface that the user
                          // can write to:
                          //   1. Each sub-component's root part cn() base
                          //      (handles namedGroup/headingFont base + any
                          //      data-attr `data-[X=Y]:` classes since they
                          //      live in this same literal)
                          //   2. Each cva export's baseClasses + every
                          //      variants[group][value] string (cva
                          //      strategy slot classes — these live
                          //      separately in tree.cvaExports and were
                          //      previously untouched by Clear all,
                          //      reported by George after PR #30)
                          let cleared = tree
                          for (const sub of tree.subComponents) {
                            const path = makePartPath(sub.name, [])
                            cleared = setPartClasses(cleared, path, [])
                          }
                          // Strip every cva export's class strings to ""
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
                          handleTreeChange(cleared)
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
              {/* `min-h-0` is the load-bearing line — without it the
                  flex-1 doesn't constrain the ScrollArea's height and
                  the panel grows past the viewport. */}
              <ScrollArea className="min-h-0 flex-1">
                {selectedPath ? (() => {
                  const selectedPart = findPartByPath(tree, selectedPath)
                  const selectedSub = findSubByPath(tree, selectedPath)
                  if (!selectedPart || !selectedSub) return null

                  const tagName =
                    selectedPart.base.kind === "html"
                      ? selectedPart.base.tag
                      : "div"
                  const isRoot = isRootPath(selectedPath)

                  // Build the variants list the ContextPicker will surface
                  // for this selected element. Includes both cva and
                  // data-attr variants, in source order. The picker uses
                  // these to populate its own-variant rows; the routing
                  // layer (handlePartClassChange) decides whether each
                  // context maps to a cva slot or a data-attr slot when
                  // the user edits classes.
                  const subCva =
                    selectedSub.variantStrategy.kind === "cva"
                      ? tree.cvaExports.find(
                          (c) =>
                            c.name === (selectedSub.variantStrategy as { kind: "cva"; cvaRef: string }).cvaRef,
                        )
                      : undefined
                  const subVariants: Array<{ name: string; options: string[] }> = []
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

                  // If the active contexts point at an own-variant slot,
                  // load classes from that slot so the controls reflect
                  // the slot's current state. Body parts and unmatched
                  // contexts fall through to the element's base classes.
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
                })() : (
                  <div className="flex flex-1 items-center justify-center p-8">
                    <p className="text-xs text-muted-foreground text-center">
                      Select a component above to edit its styles.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}

        {/* ═══════════ INSPECT/EDIT (legacy non-tree components) ═══ */}
        {!hasTree && (
          <>
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
                <StructurePanel slug={slug} onNodeClick={handleOutlineNodeClick} />
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
              <CodePanel
                code={displaySource}
                highlightLine={highlightLine}
                focusRange={focusRange}
              />
            </div>

            <DragHandle
              width={codePanelWidth}
              minWidth={250}
              maxWidth={(contentRef.current?.offsetWidth ?? 1200) - structurePanelWidth - 200}
              onWidthChange={setCodePanelWidth}
              side="left"
            />

            <ComponentCanvas
              slug={slug}
              componentName={userComponent.name}
              theme={theme}
              breakpoint={breakpoint}
              previewProps={previewProps}
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
          </>
        )}
      </div>
    </>
  )
}
