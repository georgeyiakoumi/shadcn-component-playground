"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
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
import { DefineView } from "@/components/playground/define-view"
import { CanvasToolbar } from "@/components/playground/canvas-toolbar"
import { VisualEditor } from "@/components/playground/visual-editor"
import { DragHandle } from "@/components/playground/drag-handle"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [selectedElement, setSelectedElement] =
    React.useState<ElementInfo | null>(null)
  const [structurePanelWidth, setStructurePanelWidth] = React.useState(200)
  const [codePanelWidth, setCodePanelWidth] = React.useState(350)
  const [highlightLine, setHighlightLine] = React.useState<number | null>(null)
  const [styledComponentId, setStyledComponentId] = React.useState<string | null>(null)
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
        // Sync name from tree if it changed
        name: componentTree?.name ?? userComponent.name,
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
              className: "text-xs text-muted-foreground/40 select-none",
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
      // Use classes from the definition tree root (these are the styled classes)
      const allClasses = [...sc.tree.classes, ...sc.classes].filter(Boolean)
      const className = allClasses.length > 0
        ? allClasses.join(" ")
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

      // Generate usecase-based placeholder content (canvas-only, not exported)
      if (children.length === 0) {
        const ucs = sc.usecases ?? []
        if (ucs.length === 0) {
          // No usecases defined — show generic placeholder
          children.push(
            React.createElement(
              "span",
              {
                key: "__sc_empty__",
                className: "text-xs text-muted-foreground/40 select-none",
              },
              `<${sc.name}>`,
            ),
          )
        } else {
          // Render placeholder content based on usecases
          ucs.forEach((uc, i) => {
            const placeholderKey = `__uc_${i}__`
            switch (uc) {
              case "plain-text":
                children.push(
                  React.createElement("span", { key: placeholderKey }, "Sample text content"),
                )
                break
              case "heading":
                children.push(
                  React.createElement("h3", { key: placeholderKey, className: "text-lg font-semibold" }, "Heading"),
                )
                break
              case "button":
                children.push(
                  React.createElement("button", {
                    key: placeholderKey,
                    className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                  }, "Click me"),
                )
                break
              case "image":
                children.push(
                  React.createElement("div", {
                    key: placeholderKey,
                    className: "flex h-32 w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground",
                  }, "Image placeholder"),
                )
                break
              case "input":
                children.push(
                  React.createElement("input", {
                    key: placeholderKey,
                    className: "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                    placeholder: "Type here...",
                    readOnly: true,
                  }),
                )
                break
              case "list":
                children.push(
                  React.createElement("ul", { key: placeholderKey, className: "list-disc pl-5 text-sm space-y-1" },
                    React.createElement("li", { key: "1" }, "Item one"),
                    React.createElement("li", { key: "2" }, "Item two"),
                    React.createElement("li", { key: "3" }, "Item three"),
                  ),
                )
                break
              case "icon":
                children.push(
                  React.createElement("div", {
                    key: placeholderKey,
                    className: "flex size-8 items-center justify-center rounded bg-muted text-muted-foreground",
                  }, "★"),
                )
                break
              case "wrapper":
                children.push(
                  React.createElement("div", {
                    key: placeholderKey,
                    className: "min-h-[40px] rounded border border-dashed border-muted-foreground/30 p-2",
                  },
                    React.createElement("span", {
                      className: "text-xs text-muted-foreground/40 select-none",
                    }, "{children}"),
                  ),
                )
                break
            }
          })
        }
      }

      return React.createElement(tag, { key, className }, ...children)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subComponentMap],
  )

  const customPreview = React.useMemo(() => {
    if (!componentTree) return null
    // Apply main component definition classes to the assembly root for preview
    const assemblyWithClasses = {
      ...componentTree.assemblyTree,
      classes: [
        ...componentTree.tree.classes,
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

  const handleClassChange = React.useCallback((classes: string[]) => {
    setSelectedElement((prev) => {
      if (!prev) return null
      if (prev.domElement && prev.domElement.isConnected) {
        prev.domElement.className = classes.join(" ")
      }
      return { ...prev, currentClasses: classes }
    })
  }, [])

  // Update classes on a specific component/sub-component in the tree
  const handleTreeClassChange = React.useCallback(
    (targetId: string, classes: string[]) => {
      if (!componentTree) return
      if (targetId === "main") {
        const newTree = {
          ...componentTree,
          tree: { ...componentTree.tree, classes },
        }
        handleTreeChange(newTree)
      } else {
        const newTree = {
          ...componentTree,
          subComponents: componentTree.subComponents.map((sc) =>
            sc.id === targetId ? { ...sc, tree: { ...sc.tree, classes } } : sc,
          ),
        }
        handleTreeChange(newTree)
      }
    },
    [componentTree, handleTreeChange],
  )

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
        slug={mode !== "define" ? slug : undefined}
        source={mode !== "define" ? source : undefined}
        theme={mode !== "define" ? theme : undefined}
        onThemeChange={mode !== "define" ? setTheme : undefined}
        breakpoint={mode !== "define" ? breakpoint : undefined}
        onBreakpointChange={mode !== "define" ? setBreakpoint : undefined}
        propSelectors={mode !== "define" ? propSelectors : undefined}
        mode={mode}
        onModeChange={setMode}
        isCustom={hasTree}
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
              <div className="relative flex flex-1 flex-col">
                <ComponentCanvas
                  slug={slug}
                  componentName={componentTree?.name ?? userComponent.name}
                  theme={theme}
                  breakpoint={breakpoint}
                  previewProps={previewProps}
                  customPreview={customPreview}
                  mode="edit"
                  onElementSelect={setSelectedElement}
                  onElementHover={() => {}}
                />

                {/* Floating assembly panel (bottom-left) */}
                <div className="absolute bottom-3 left-3 z-10 w-56 rounded-lg border bg-background/95 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 border-b px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Assembly
                    </span>
                  </div>
                  <ScrollArea className="max-h-48">
                    <div className="p-2">
                      <AssemblyOutline
                        tree={componentTree}
                        onSelectComponent={setStyledComponentId}
                        selectedId={styledComponentId}
                      />
                    </div>
                  </ScrollArea>
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
                  onClick={() => setStyledComponentId("main")}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                    styledComponentId === "main"
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
                    onClick={() => setStyledComponentId(sc.id)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                      styledComponentId === sc.id
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
                {styledComponentId ? (
                  <VisualEditor
                    selectedElement={{
                      tagName: styledComponentId === "main"
                        ? componentTree.baseElement
                        : componentTree.subComponents.find(
                            (sc) => sc.id === styledComponentId,
                          )?.baseElement ?? "div",
                      textContent: styledComponentId === "main"
                        ? componentTree.name
                        : componentTree.subComponents.find(
                            (sc) => sc.id === styledComponentId,
                          )?.name ?? "",
                      currentClasses: styledComponentId === "main"
                        ? componentTree.tree.classes
                        : componentTree.subComponents.find(
                            (sc) => sc.id === styledComponentId,
                          )?.tree.classes ?? [],
                      elementPath: "",
                      rect: new DOMRect(),
                      domElement: document.createElement("div"),
                    }}
                    onClassChange={(classes) => {
                      handleTreeClassChange(styledComponentId, classes)
                    }}
                    onDeselect={() => setStyledComponentId(null)}
                  />
                ) : (
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
              onElementSelect={setSelectedElement}
              onElementHover={() => {}}
            />

            <RightPanel
              isOpen={mode === "edit"}
              source={source}
              isCompound={false}
              selectedElement={selectedElement}
              onClassChange={handleClassChange}
              onDeselect={handleDeselect}
            />
          </>
        )}
      </div>

      {/* Status bar is now inside the canvas section for Preview mode,
          and inside the inspect layout for non-tree components */}
    </ComponentEditProvider>
  )
}

/* ── AssemblyOutline — clickable tree for navigating in Preview ───── */

function AssemblyOutline({
  tree,
  onSelectComponent,
  selectedId,
}: {
  tree: ComponentTree
  onSelectComponent: (id: string) => void
  selectedId: string | null
}) {
  const renderNode = (
    node: import("@/lib/component-tree").ElementNode,
    depth: number,
  ): React.ReactNode => {
    const subComponent = tree.subComponents.find((sc) => sc.name === node.tag)

    if (subComponent) {
      return (
        <div key={node.id} style={{ paddingLeft: `${depth * 12}px` }}>
          <button
            type="button"
            onClick={() => onSelectComponent(subComponent.id)}
            className={cn(
              "flex items-center gap-1 rounded px-1 py-0.5 text-xs font-mono transition-colors",
              selectedId === subComponent.id
                ? "bg-blue-500/10 text-blue-500"
                : "text-blue-500/70 hover:bg-blue-500/5",
            )}
          >
            &lt;{subComponent.name}&gt;
          </button>
        </div>
      )
    }

    return (
      <div key={node.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <span className="text-xs font-mono text-muted-foreground">
          &lt;{node.tag}&gt;
          {node.text && (
            <span className="ml-1 text-foreground/50">
              {node.text.slice(0, 15)}
            </span>
          )}
        </span>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelectComponent("main")}
        className={cn(
          "flex items-center gap-1 rounded px-1 py-0.5 text-xs font-mono transition-colors",
          selectedId === "main"
            ? "bg-blue-500/10 text-blue-500"
            : "text-blue-500/70 hover:bg-blue-500/5",
        )}
      >
        &lt;{tree.name}&gt;
      </button>
      {tree.assemblyTree.children.map((child) => renderNode(child, 1))}
    </div>
  )
}
