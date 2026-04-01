"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { parseCvaVariants } from "@/lib/cva-parser"
import { generateFromTree } from "@/lib/code-generator"
import { ComponentEditProvider } from "@/lib/component-state"
import {
  getUserComponent,
  saveUserComponent,
} from "@/lib/component-store"
import type { ComponentTree, ElementNode } from "@/lib/component-tree"
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
import { CanvasToolbar } from "@/components/playground/canvas-toolbar"
import { VisualEditor } from "@/components/playground/visual-editor"
import { DragHandle } from "@/components/playground/drag-handle"
import { AssemblyPanel } from "@/components/playground/assembly-panel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { shadcnPreviewMap } from "@/lib/shadcn-preview-map"

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
  const [componentTree, setComponentTree] = React.useState<
    ComponentTree | undefined
  >(undefined)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")
  const [propValues, setPropValues] = React.useState<Record<string, string>>({})
  const [mode, setMode] = React.useState<PlaygroundMode>("define")
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [structurePanelWidth, setStructurePanelWidth] = React.useState(200)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [highlightLine, setHighlightLine] = React.useState<number | null>(null)
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set())
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle")
  const [isDirty, setIsDirty] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const hasTree = componentTree !== undefined

  // Load from localStorage on mount (client only)
  React.useEffect(() => {
    const uc = getUserComponent(slug)
    setUserComponent(uc)
    setSource(uc?.source ?? "")
    setComponentTree(uc?.tree)
    setMode(uc?.tree ? "define" : "inspect")
    setMounted(true)
  }, [slug])

  // Reload from store when slug changes
  React.useEffect(() => {
    if (!mounted) return
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

  // Check if any component has styles applied (show Export only then)
  const hasAnyStyles = React.useMemo(() => {
    if (!componentTree) return false
    if ((componentTree.classes ?? []).length > 0) return true
    return componentTree.subComponents.some((sc) => (sc.classes ?? []).length > 0)
  }, [componentTree])

  // Clear selection when leaving edit mode
  React.useEffect(() => {
    if (mode !== "edit") {
      setSelectedNodeId(null)
    }
  }, [mode])

  // Track dirty state
  React.useEffect(() => {
    if (mounted && userComponent) setIsDirty(true)
  }, [source, componentTree])

  // Auto-save source changes back to the store (debounced)
  React.useEffect(() => {
    if (!userComponent || !isDirty) return
    setSaveState("saving")
    const timer = setTimeout(() => {
      const updated = {
        ...userComponent,
        name: componentTree?.name ?? userComponent.name,
        source,
        tree: componentTree,
        updatedAt: new Date().toISOString(),
      }
      saveUserComponent(updated)
      setUserComponent(updated)
      setIsDirty(false)
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 1500)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, componentTree])

  // Manual save (triggered by Save button)
  const handleManualSave = React.useCallback(() => {
    if (!userComponent) return
    setSaveState("saving")
    const updated = {
      ...userComponent,
      name: componentTree?.name ?? userComponent.name,
      source,
      tree: componentTree,
      updatedAt: new Date().toISOString(),
    }
    saveUserComponent(updated)
    setUserComponent(updated)
    setIsDirty(false)
    setSaveState("saved")
    toast.success("Session saved")
    setTimeout(() => setSaveState("idle"), 1500)
  }, [userComponent, componentTree, source])

  // When the tree changes, regenerate source code
  const handleTreeChange = React.useCallback(
    (newTree: ComponentTree) => {
      setComponentTree(newTree)
      const newSource = generateFromTree(newTree)
      setSource(newSource)
    },
    [],
  )

  // Resolve a selectedNodeId (which might be a node ID or sc.id or "main")
  // to find the sub-component definition it belongs to
  function findSubComponentForNodeId(nodeId: string | null): import("@/lib/component-tree").SubComponentDef | null {
    if (!nodeId || nodeId === "main" || !componentTree) return null
    // Direct match on sub-component ID
    const directMatch = componentTree.subComponents.find((sc) => sc.id === nodeId)
    if (directMatch) return directMatch
    // Check if this node ID is an assembly node whose tag matches a sub-component
    function findInTree(node: ElementNode): import("@/lib/component-tree").SubComponentDef | null {
      if (node.id === nodeId) {
        return componentTree!.subComponents.find((sc) => sc.name === node.tag) ?? null
      }
      for (const child of node.children) {
        const found = findInTree(child)
        if (found) return found
      }
      return null
    }
    return componentTree.assemblyTree ? findInTree(componentTree.assemblyTree) : null
  }

  // Build a map of sub-component name → SubComponentDef for quick lookup
  const subComponentMap = React.useMemo(() => {
    const map = new Map<string, import("@/lib/component-tree").SubComponentDef>()
    componentTree?.subComponents.forEach((sc) => map.set(sc.name, sc))
    return map
  }, [componentTree])

  // Render the component tree as live JSX for the canvas preview
  // Not memoized — needs to re-render when assemblyTree changes
  function renderTreePreview(node: ElementNode): React.ReactNode {
    // Skip hidden nodes
    if (hiddenIds.has(node.id)) return null

    const subComponent = subComponentMap.get(node.tag)

    // If this node is a sub-component, render its actual tree content
    // Pass assembly children (added via picker) so they render inside too
    if (subComponent) {
      return renderSubComponentPreview(subComponent, node.id, node.children)
    }

    // PascalCase tags that aren't sub-components are shadcn/preview-only elements
    const isPascalCase = /^[A-Z]/.test(node.tag)

    // If it's a known shadcn component, render the actual component
    if (isPascalCase && shadcnPreviewMap[node.tag]) {
      const isNodeSelected = selectedNodeId === node.id
      return React.createElement(
        "div",
        {
          key: node.id,
          "data-node-id": node.id,
          className: isNodeSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded" : undefined,
        },
        shadcnPreviewMap[node.tag](),
      )
    }

    const tag = (isPascalCase ? "div" : node.tag) as keyof React.JSX.IntrinsicElements
    const isNodeSelected = selectedNodeId === node.id ||
      (selectedNodeId === "main" && componentTree?.assemblyTree.id === node.id)
    const nodeClasses = [
      ...node.classes,
      isNodeSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
    ].filter(Boolean)
    const className = nodeClasses.length > 0
      ? nodeClasses.join(" ")
      : undefined

    const children: React.ReactNode[] = []

    if (node.text) {
      children.push(node.text)
    }

    // For PascalCase preview-only elements (shadcn), show a styled label
    if (isPascalCase && children.length === 0 && !node.text) {
      children.push(
        React.createElement(
          "span",
          {
            key: "__preview_label__",
            className: "rounded bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500",
          },
          node.tag,
        ),
      )
    }

    children.push(...node.children.map((child) => renderTreePreview(child)))

    // Empty element placeholder
    if (children.length === 0) {
      children.push(
        React.createElement(
          "span",
          {
            key: "__empty__",
            className: "text-xs text-muted-foreground/40 select-none",
          },
          `<${node.tag}>`,
        ),
      )
    }

    return React.createElement(tag, { key: node.id, className, "data-node-id": node.id }, ...children)
  }

  // Render a sub-component using its own tree
  function renderSubComponentPreview(
    sc: import("@/lib/component-tree").SubComponentDef,
    key: string,
    assemblyChildren?: ElementNode[],
  ): React.ReactNode {
    const tag = sc.baseElement as keyof React.JSX.IntrinsicElements
    const isScSelected = selectedNodeId === key
    const allClasses = [
      ...sc.classes.filter(Boolean),
      isScSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
    ].filter(Boolean)
    const className = allClasses.length > 0
      ? allClasses.join(" ")
      : undefined

    const children: React.ReactNode[] = []

    // Render assembly children first (elements added via picker — preview only)
    if (assemblyChildren && assemblyChildren.length > 0) {
      children.push(...assemblyChildren.map((child) => renderTreePreview(child)))
    }

    // Sub-components no longer have their own tree —
    // all content comes from assembly children above

      // Show empty placeholder when sub-component has no assembly children
      if (children.length === 0) {
        children.push(
          React.createElement(
            "span",
            {
              key: "__sc_empty__",
              className: "text-xs text-muted-foreground/40 select-none",
            },
            `{children}`,
          ),
        )
      }

    return React.createElement(tag, { key, className, "data-node-id": key }, ...children)
  }

  // Re-render on every tree change — no memoization needed
  const customPreview = React.useMemo(() => {
    if (!componentTree) return null
    // Apply main component definition classes to the assembly root for preview
    const assemblyWithClasses = {
      ...componentTree.assemblyTree,
      classes: [
        ...(componentTree.classes ?? []),
        ...componentTree.assemblyTree.classes,
      ].filter(Boolean),
    }
    return renderTreePreview(assemblyWithClasses)
  }, [componentTree, renderTreePreview])

  const displaySource = source || `// Source code for ${userComponent?.name ?? "Component"}`

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

  // Update classes on a specific component/sub-component in the tree
  const handleTreeClassChange = React.useCallback(
    (targetId: string, classes: string[]) => {
      if (!componentTree) return
      if (targetId === "main") {
        handleTreeChange({ ...componentTree, classes })
      } else {
        handleTreeChange({
          ...componentTree,
          subComponents: componentTree.subComponents.map((sc) =>
            sc.id === targetId ? { ...sc, classes } : sc,
          ),
        })
      }
    },
    [componentTree, handleTreeChange],
  )


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
    <ComponentEditProvider slug={slug}>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <PlaygroundToolbar
        componentName={componentTree?.name ?? userComponent.name}
        slug={hasAnyStyles ? slug : undefined}
        source={hasAnyStyles ? source : undefined}
        mode={mode}
        onModeChange={setMode}
        isCustom={hasTree}
        saveState={saveState}
        onSave={handleManualSave}
      />

      {/* ── Main content area ────────────────────────────────── */}
      <div ref={contentRef} className="flex flex-1 overflow-hidden">

        {/* ═══════════ DEFINE MODE ═══════════════════════════════ */}
        {mode === "define" && hasTree && (
          <DefineView
            tree={componentTree}
            onTreeChange={handleTreeChange}
          />
        )}

        {/* ═══════════ PREVIEW MODE ═════════════════════════════ */}
        {mode === "preview" && hasTree && (
          <>
            {/* Code panel (left) */}
            <div
              className="relative flex shrink-0 flex-col border-r"
              style={{ width: `${codePanelWidth}px` }}
            >
              <CodePanel code={displaySource} highlightLine={highlightLine} />
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
              {/* Canvas toolbar */}
              <CanvasToolbar
                propSelectors={propSelectors}
              />

              {/* Canvas + floating assembly panel */}
              <div
                className="relative flex flex-1 flex-col"
                onClick={(e) => {
                  // Walk up from clicked element to find data-node-id
                  let el = e.target as HTMLElement | null
                  while (el && !el.getAttribute("data-node-id")) {
                    if (el.classList.contains("assembly-panel") || el === e.currentTarget) break
                    el = el.parentElement
                  }
                  const nodeId = el?.getAttribute("data-node-id")
                  if (nodeId) {
                    // Map root assembly node ID to "main" for consistency
                    const resolvedId = nodeId === componentTree.assemblyTree.id ? "main" : nodeId
                    setSelectedNodeId(resolvedId)
                  }
                }}
              >
                <ComponentCanvas
                  slug={slug}
                  componentName={componentTree?.name ?? userComponent.name}
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
                    tree={componentTree}
                    onTreeChange={handleTreeChange}
                    onSelectComponent={setSelectedNodeId}
                    selectedId={selectedNodeId}
                    hiddenIds={hiddenIds}
                    onHiddenChange={setHiddenIds}
                  />
                </div>
              </div>

              {/* Status bar with breakpoints + theme (bottom of canvas section) */}
              <StatusBar
                source={source}
                theme={theme}
                onThemeChange={setTheme}
                breakpoint={breakpoint}
                onBreakpointChange={setBreakpoint}
              />
            </div>

            {/* Right panel: visual styling per component/sub-component */}
            <div className="flex w-[320px] shrink-0 flex-col border-l bg-background">
              <div className="flex items-center gap-1.5 border-b px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Style</span>
              </div>

              {/* Component/sub-component pills */}
              <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedNodeId("main")}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                    (selectedNodeId === "main" || selectedNodeId === componentTree.assemblyTree.id)
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {componentTree.name}
                </button>
                {componentTree.subComponents.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelectedNodeId(sc.id)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                      selectedNodeId === sc.id || findSubComponentForNodeId(selectedNodeId)?.id === sc.id
                        ? "bg-blue-500/10 text-blue-500"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {sc.name.replace(componentTree.name, "")}
                  </button>
                ))}
              </div>

              {/* Visual editor for selected component */}
              <ScrollArea className="flex-1">
                {selectedNodeId ? (() => {
                  const matchedSc = findSubComponentForNodeId(selectedNodeId)
                  const isMain = selectedNodeId === "main" || (!matchedSc && selectedNodeId === componentTree.assemblyTree.id)
                  return (
                  <VisualEditor
                    selectedElement={{
                      tagName: isMain
                        ? componentTree.baseElement
                        : matchedSc?.baseElement ?? "div",
                      textContent: isMain
                        ? componentTree.name
                        : matchedSc?.name ?? "",
                      currentClasses: isMain
                        ? (componentTree.classes ?? [])
                        : matchedSc?.classes ?? [],
                      elementPath: "",
                      rect: new DOMRect(),
                      domElement: document.createElement("div"),
                    }}
                    onClassChange={(classes) => {
                      // Route to the correct target: main or sub-component
                      const targetId = isMain ? "main" : matchedSc?.id ?? selectedNodeId
                      handleTreeClassChange(targetId, classes)
                    }}
                    onDeselect={() => setSelectedNodeId(null)}
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

        {/* ═══════════ INSPECT/EDIT (non-tree components) ═══════ */}
        {!hasTree && (
          <>
            <div
              className="flex shrink-0 flex-col border-r"
              style={{ width: `${structurePanelWidth}px` }}
            >
              <div className="flex items-center gap-1.5 border-b px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Outline</span>
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
              <CodePanel code={displaySource} highlightLine={highlightLine} />
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

      {/* Status bar is now inside the canvas section for Preview mode,
          and inside the inspect layout for non-tree components */}
    </ComponentEditProvider>
  )
}

