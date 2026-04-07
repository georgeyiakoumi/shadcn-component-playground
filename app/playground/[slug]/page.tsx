"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { registry } from "@/lib/registry"
import { componentSources } from "@/lib/component-source"
import { parseCvaVariants } from "@/lib/cva-parser"
import { ComponentEditProvider } from "@/lib/component-state"
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

  const handleClassChange = React.useCallback((classes: string[]) => {
    setSelectedElement((prev) => {
      if (!prev) return null
      // Apply classes directly to the DOM element for live preview
      if (prev.domElement && prev.domElement.isConnected) {
        prev.domElement.className = classes.join(" ")
      }
      return { ...prev, currentClasses: classes }
    })
  }, [])

  const handleDeselect = React.useCallback(() => {
    setSelectedElement(null)
  }, [])

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
    <ComponentEditProvider slug={slug}>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={component.name}
        slug={slug}
        source={source}
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
          {/* Pillar 5a (GEO-290) — proof-of-life surface for the M4 parser.
              Replaced in Pillar 5b by full visual editor integration. */}
          <div className="border-t px-3 py-2">
            <ParserV2Status slug={slug} />
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
          selectedElement={selectedElement}
          onClassChange={handleClassChange}
          onDeselect={handleDeselect}
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
    </ComponentEditProvider>
  )
}
