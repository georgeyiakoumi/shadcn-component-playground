"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { registry } from "@/lib/registry"
import { componentSources } from "@/lib/component-source"
import { parseCvaVariants } from "@/lib/cva-parser"
import type { ElementInfo } from "@/components/playground/element-selector"
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
import { DragHandle } from "@/components/playground/drag-handle"
import { CanvasToolbar } from "@/components/playground/canvas-toolbar"
import { ParserV2Status } from "@/components/playground/parser-v2-status"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw } from "lucide-react"

import { useParsedComponent } from "@/lib/parser/use-parsed-component"
import type { ComponentTreeV2 } from "@/lib/component-tree-v2"
import {
  applyClassEditToTree,
  getCvaSlotsForDataSlot,
  readBaseClassesForDataSlot,
  type CvaEditSlot,
  type CvaSlotInfo,
} from "@/lib/parser/apply-class-edit"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import { downloadTsx } from "@/lib/download-tsx"
import { CvaSlotPicker } from "@/components/playground/cva-slot-picker"

export default function ComponentPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")
  const [propValues, setPropValues] = React.useState<Record<string, string>>({})
  const [mode, setMode] = React.useState<PlaygroundMode>("inspect")
  const [selectedElement, setSelectedElement] =
    React.useState<ElementInfo | null>(null)
  const [structurePanelWidth, setStructurePanelWidth] = React.useState(200)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [highlightLine, setHighlightLine] = React.useState<number | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // ── Pillar 5b (GEO-302) + 5c (GEO-303) — parsed v2 tree + edit state
  const parsedState = useParsedComponent(slug)
  const [editTree, setEditTree] = React.useState<ComponentTreeV2 | null>(null)
  const [editVersion, setEditVersion] = React.useState(0)
  // Pillar 5c — currently-selected cva slot for the visual editor's edits.
  // Resets to "base" whenever the user selects a new element. Independent
  // of the toolbar's preview state — the canvas keeps showing whatever
  // the toolbar dropdowns describe; this only controls where edits land.
  const [cvaSlot, setCvaSlot] = React.useState<CvaEditSlot>({ kind: "base" })

  // Hydrate the editable tree once the API call resolves. Deep-clone via
  // structuredClone so we own a separate copy from the hook's cached
  // state — mutations should not bleed back through the cache.
  React.useEffect(() => {
    if (parsedState.status === "ready") {
      setEditTree(structuredClone(parsedState.tree))
      setEditVersion(0)
    } else {
      setEditTree(null)
    }
  }, [parsedState.status, slug])

  const component = registry.find((c) => c.slug === slug)

  // Parse cva variants from the actual component source code
  const source = componentSources[slug] ?? ""
  const variantDefs = React.useMemo(() => parseCvaVariants(source), [source])

  // Reset prop values when slug changes, using defaults from parser
  React.useEffect(() => {
    const defaults: Record<string, string> = {}
    variantDefs.forEach((v) => {
      defaults[v.name] = v.defaultValue
    })
    setPropValues(defaults)
  }, [slug, variantDefs])

  // Clear selection when leaving edit mode
  React.useEffect(() => {
    if (mode !== "edit") {
      setSelectedElement(null)
    }
  }, [mode])

  // Pillar 5c — reset the cva slot to "base" whenever the user selects a
  // different element. The picker's default is always "Base classes" on
  // a fresh selection.
  React.useEffect(() => {
    setCvaSlot({ kind: "base" })
  }, [selectedElement?.elementPath])

  if (!component) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Component not found</p>
      </div>
    )
  }

  const displaySource =
    source || `// Source code for ${component.name} coming soon`

  // Build prop selectors from parsed variant definitions
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

  // Build preview props from current prop values
  const previewProps: Record<string, string> | undefined =
    Object.keys(propValues).length > 0 ? propValues : undefined

  // Pillar 5c — compute the cva slot info for the currently-selected
  // element (null when the element isn't a cva-call component or no
  // element is selected). The picker only renders when this is non-null.
  const cvaSlotInfo: CvaSlotInfo | null = React.useMemo(() => {
    if (!editTree || !selectedElement?.domElement) return null
    const dataSlot = selectedElement.domElement.getAttribute("data-slot")
    if (!dataSlot) return null
    return getCvaSlotsForDataSlot(editTree, dataSlot)
  }, [editTree, selectedElement])

  // Pillar 5c — when the slot picker is active and the user picks a new
  // slot, the visual editor needs to display the classes from that slot
  // (not from the live DOM element, which is showing the toolbar's
  // preview state). Build a synthetic ElementInfo whose currentClasses
  // come from the chosen cva slot.
  const editorElement: ElementInfo | null = React.useMemo(() => {
    if (!selectedElement) return null
    if (!cvaSlotInfo || !editTree) return selectedElement
    const dataSlot = selectedElement.domElement?.getAttribute("data-slot")
    if (!dataSlot) return selectedElement
    const slotClasses = readBaseClassesForDataSlot(editTree, dataSlot, cvaSlot)
    if (slotClasses === null) return selectedElement
    return {
      ...selectedElement,
      currentClasses: slotClasses.split(/\s+/).filter(Boolean),
    }
    // editVersion participation: when the user mutates a slot via the
    // editor, re-derive currentClasses from the freshly-mutated tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement, cvaSlotInfo, editTree, cvaSlot, editVersion])

  const handleClassChange = React.useCallback(
    (classes: string[]) => {
      setSelectedElement((prev) => {
        if (!prev) return null
        // Apply classes directly to the DOM element for live preview.
        // For cva slot edits this isn't quite right (the DOM merges base
        // + variant + size classes at runtime), but it gives immediate
        // visual feedback for the most common case where the user is
        // editing the slot the canvas is currently previewing.
        if (prev.domElement && prev.domElement.isConnected) {
          prev.domElement.className = classes.join(" ")
        }
        return { ...prev, currentClasses: classes }
      })

      if (!editTree || !selectedElement?.domElement) return
      const dataSlot = selectedElement.domElement.getAttribute("data-slot")
      if (!dataSlot) return
      // Pillar 5c — pass the current cva slot. cn-call paths ignore it.
      const result = applyClassEditToTree(editTree, dataSlot, classes, cvaSlot)
      if (result.ok) {
        setEditVersion((v) => v + 1)
      }
    },
    [editTree, selectedElement, cvaSlot],
  )

  const handleDeselect = React.useCallback(() => {
    setSelectedElement(null)
  }, [])

  // ── Pillar 5b — export + reset handlers ──────────────────────────
  // `editVersion` is referenced so React re-evaluates `isDirty` after
  // each in-place tree mutation. The generator's slow path detects edits
  // via byte comparison, so the tree object identity doesn't change.
  const isDirty = React.useMemo(() => {
    if (!editTree?.originalSource) return false
    // Touch editVersion so the memo recomputes after each edit.
    void editVersion
    return generateFromTreeV2(editTree) !== editTree.originalSource
  }, [editTree, editVersion])

  const handleDownload = React.useCallback(() => {
    if (!editTree) return
    const source = generateFromTreeV2(editTree)
    downloadTsx(`${slug}.tsx`, source)
  }, [editTree, slug])

  const handleReset = React.useCallback(() => {
    if (parsedState.status !== "ready") return
    setEditTree(structuredClone(parsedState.tree))
    setEditVersion(0)
    // Also reset the live DOM by clearing the selection. The next click
    // will re-select against the now-pristine canvas.
    setSelectedElement(null)
  }, [parsedState])

  const handleOutlineNodeClick = React.useCallback(
    (name: string) => {
      // Find the line in source where this component is defined
      const lines = displaySource.split("\n")
      // Look for patterns like: const Name =, function Name, export const Name
      const lineIndex = lines.findIndex(
        (line) =>
          line.includes(`const ${name}`) ||
          line.includes(`function ${name}`) ||
          line.includes(`"${name}"`) ||
          line.includes(`${name} =`),
      )
      if (lineIndex !== -1) {
        // Use a unique value each time to retrigger the effect even for the same line
        setHighlightLine(null)
        requestAnimationFrame(() => setHighlightLine(lineIndex + 1))
      }
    },
    [displaySource],
  )

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={component.name}
        slug={slug}
        // Pillar 6 (GEO-291) — the toolbar's M2 Export button is gated
        // behind `source`. Stock components now use the v2 Download .tsx
        // button in the right panel; the toolbar export is M3-only.
        // Passing no source disables the toolbar export branch.
        mode={mode}
        onModeChange={setMode}
      />

      {/* ── Main content area ────────────────────────────────── */}
      <div ref={contentRef} className="flex flex-1 overflow-hidden">
        {/* ── Structure / Outline panel ──────────────────────── */}
        <div
          className="flex shrink-0 flex-col border-r"
          style={{ width: `${structurePanelWidth}px` }}
        >
          <div className="flex items-center justify-between gap-1.5 border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Outline</span>
          </div>
          <div className="flex-1 overflow-auto">
            <StructurePanel slug={slug} onNodeClick={handleOutlineNodeClick} />
          </div>
          {/* Pillar 5a (GEO-290) status surface + Pillar 5b (GEO-302)
              edit-export controls. The status line is kept for now as
              a debug aid; Pillar 6 will trim or move it. */}
          <div className="flex flex-col gap-2 border-t px-3 py-2">
            <ParserV2Status slug={slug} />

            {/* Edit-export controls — only meaningful in edit mode */}
            {mode === "edit" && (
              <>
                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="default"
                    className="h-7 flex-1 gap-1.5"
                    onClick={handleDownload}
                    disabled={!editTree}
                    data-testid="download-tsx-button"
                    data-dirty={isDirty ? "true" : "false"}
                  >
                    <Download className="size-3" />
                    Download .tsx
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="h-7 gap-1.5"
                    disabled={!isDirty}
                    onClick={handleReset}
                    data-testid="reset-edits-button"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Structure panel resize handle ─────────────────── */}
        <DragHandle
          width={structurePanelWidth}
          minWidth={150}
          maxWidth={350}
          onWidthChange={setStructurePanelWidth}
          side="left"
        />

        {/* ── Code panel ─────────────────────────────────────── */}
        <div
          className="relative flex shrink-0 flex-col border-r"
          style={{ width: `${codePanelWidth}px` }}
        >
          <CodePanel code={displaySource} highlightLine={highlightLine} />
        </div>

        {/* ── Code panel resize handle ──────────────────────── */}
        <DragHandle
          width={codePanelWidth}
          minWidth={250}
          maxWidth={
            (contentRef.current?.offsetWidth ?? 1200)
            - structurePanelWidth
            - 200  // min canvas gap
            - (mode === "edit" ? 320 : 0) // right panel
          }
          onWidthChange={setCodePanelWidth}
          side="left"
        />

        {/* ── Centre: Canvas with toolbar ──────────────────────── */}
        <div className="flex min-w-[100px] flex-1 flex-col">
          <CanvasToolbar
            propSelectors={propSelectors}
          />
          <ComponentCanvas
            slug={slug}
            componentName={component.name}
            theme={theme}
            breakpoint={breakpoint}
            previewProps={previewProps}
            mode={mode}
            onElementSelect={setSelectedElement}
            onElementHover={() => {}}
          />
        </div>

        {/* ── Right: Edit panels (slides in when edit mode) ──── */}
        <RightPanel
          isOpen={mode === "edit"}
          source={source}
          isCompound={component.isCompound}
          selectedElement={editorElement}
          onClassChange={handleClassChange}
          onDeselect={handleDeselect}
          editorHeader={
            cvaSlotInfo ? (
              <CvaSlotPicker
                info={cvaSlotInfo}
                selected={cvaSlot}
                onChange={setCvaSlot}
              />
            ) : null
          }
        />
      </div>

      {/* ── Bottom: A11y + Semantic status bar ────────────────── */}
      <StatusBar
        source={source}
        theme={theme}
        onThemeChange={setTheme}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
      />
    </>
  )
}
