"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { parseCvaVariants } from "@/lib/cva-parser"
import { generateFromTree } from "@/lib/code-generator"
import { ComponentEditProvider } from "@/lib/component-state"
import {
  getUserComponent,
  saveUserComponent,
} from "@/lib/component-store"
import type { ComponentTree, ElementNode } from "@/lib/component-tree"
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
import { BuilderPanel } from "@/components/playground/builder-panel"
import { DragHandle } from "@/components/playground/drag-handle"

export default function CustomComponentPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [userComponent, setUserComponent] = React.useState(() =>
    getUserComponent(slug),
  )
  const [source, setSource] = React.useState(userComponent?.source ?? "")
  const [componentTree, setComponentTree] = React.useState<
    ComponentTree | undefined
  >(userComponent?.tree)
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

  const hasTree = componentTree !== undefined

  // Reload from store when slug changes
  React.useEffect(() => {
    const uc = getUserComponent(slug)
    setUserComponent(uc)
    setSource(uc?.source ?? "")
    setComponentTree(uc?.tree)
  }, [slug])

  // Parse cva variants from source
  const variantDefs = React.useMemo(() => parseCvaVariants(source), [source])

  // Reset prop values when slug changes
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

  // Auto-save source changes back to the store (debounced)
  React.useEffect(() => {
    if (!userComponent) return
    const timer = setTimeout(() => {
      const updated = {
        ...userComponent,
        source,
        tree: componentTree,
        updatedAt: new Date().toISOString(),
      }
      saveUserComponent(updated)
      setUserComponent(updated)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, componentTree])

  // When the tree changes, regenerate source code
  const handleTreeChange = React.useCallback(
    (newTree: ComponentTree) => {
      setComponentTree(newTree)
      const newSource = generateFromTree(newTree)
      setSource(newSource)
    },
    [],
  )

  // Build a map of sub-component name → SubComponentDef for quick lookup
  const subComponentMap = React.useMemo(() => {
    const map = new Map<string, import("@/lib/component-tree").SubComponentDef>()
    componentTree?.subComponents.forEach((sc) => map.set(sc.name, sc))
    return map
  }, [componentTree])

  // Render the component tree as live JSX for the canvas preview
  const renderTreePreview = React.useCallback(
    (node: ElementNode): React.ReactNode => {
      const subComponent = subComponentMap.get(node.tag)

      // If this node is a sub-component, render its actual tree content
      if (subComponent) {
        return renderSubComponentPreview(subComponent, node.id)
      }

      const tag = node.tag as keyof React.JSX.IntrinsicElements
      const className = node.classes.length > 0
        ? node.classes.join(" ")
        : undefined

      const children: React.ReactNode[] = []

      if (node.text) {
        children.push(node.text)
      }

      children.push(...node.children.map(renderTreePreview))

      // Empty element placeholder
      if (children.length === 0) {
        children.push(
          React.createElement(
            "span",
            {
              key: "__empty__",
              className: "text-[10px] text-muted-foreground/40 select-none",
            },
            `<${node.tag}>`,
          ),
        )
      }

      return React.createElement(tag, { key: node.id, className }, ...children)
    },
    [subComponentMap],
  )

  // Render a sub-component using its own tree
  const renderSubComponentPreview = React.useCallback(
    (sc: import("@/lib/component-tree").SubComponentDef, key: string): React.ReactNode => {
      const tag = sc.baseElement as keyof React.JSX.IntrinsicElements
      const className = sc.classes.length > 0
        ? sc.classes.join(" ")
        : undefined

      const children: React.ReactNode[] = []

      // Render the sub-component's own tree children
      sc.tree.children.forEach((child) => {
        children.push(renderTreePreview(child))
      })

      // Sub-component's own text
      if (sc.tree.text) {
        children.unshift(sc.tree.text)
      }

      // Empty sub-component placeholder
      if (children.length === 0) {
        children.push(
          React.createElement(
            "span",
            {
              key: "__sc_empty__",
              className: "text-[10px] text-muted-foreground/40 select-none",
            },
            `<${sc.name}>`,
          ),
        )
      }

      return React.createElement(tag, { key, className }, ...children)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subComponentMap],
  )

  const customPreview = componentTree
    ? renderTreePreview(componentTree.assemblyTree)
    : null

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

  const displaySource = source || `// Source code for ${userComponent.name}`

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

  return (
    <ComponentEditProvider slug={slug}>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={userComponent.name}
        slug={slug}
        source={source}
        theme={theme}
        onThemeChange={setTheme}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        propSelectors={propSelectors}
        mode={mode}
        onModeChange={setMode}
      />

      {/* ── Main content area ────────────────────────────────── */}
      <div ref={contentRef} className="flex flex-1 overflow-hidden">
        {/* ── Structure / Outline panel ────────────────────────── */}
        <div
          className="flex shrink-0 flex-col border-r"
          style={{ width: `${structurePanelWidth}px` }}
        >
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Outline</span>
          </div>
          <div className="flex-1 overflow-auto">
            <StructurePanel slug={slug} customTree={componentTree} onNodeClick={handleOutlineNodeClick} />
          </div>
        </div>

        {/* ── Structure panel resize handle ───────────────────── */}
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

        {/* ── Code panel resize handle ────────────────────────── */}
        <DragHandle
          width={codePanelWidth}
          minWidth={250}
          maxWidth={
            (contentRef.current?.offsetWidth ?? 1200)
            - structurePanelWidth
            - 200
            - (hasTree || mode === "edit" ? 320 : 0)
          }
          onWidthChange={setCodePanelWidth}
          side="left"
        />

        {/* ── Centre: Component preview canvas ─────────────────── */}
        <ComponentCanvas
          slug={slug}
          componentName={userComponent.name}
          theme={theme}
          breakpoint={breakpoint}
          previewProps={previewProps}
          customPreview={customPreview}
          mode={mode}
          onElementSelect={setSelectedElement}
          onElementHover={() => {}}
        />

        {/* ── Right panel: Builder (tree) or generic edit panel ── */}
        {hasTree ? (
          <div
            className="flex shrink-0"
            style={{ width: "320px" }}
          >
            <BuilderPanel
              tree={componentTree}
              onTreeChange={handleTreeChange}
            />
          </div>
        ) : (
          <RightPanel
            isOpen={mode === "edit"}
            source={source}
            isCompound={false}
            selectedElement={selectedElement}
            onClassChange={handleClassChange}
            onDeselect={handleDeselect}
          />
        )}
      </div>

      {/* ── Bottom: Status bar ──────────────────────────────────── */}
      <StatusBar source={source} />
    </ComponentEditProvider>
  )
}
