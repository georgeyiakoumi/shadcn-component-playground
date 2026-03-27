"use client"

import * as React from "react"
import {
  Plus,
  X,
  Trash2,
  ChevronRight,
  ChevronDown,
  Code2,
  Box,
  Type as TypeIcon,
  Hash,
  ToggleLeft,
  Braces,
  Layers,
  Settings2,
  Component,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import type {
  ComponentTree,
  ElementNode,
  ComponentProp,
  SubComponentDef,
} from "@/lib/component-tree"
import {
  createElementNode,
  addChild,
  removeNode,
  updateNodeClasses,
  updateNodeText,
  moveNode,
} from "@/lib/component-tree"
import type { CustomVariantDef } from "@/lib/component-state"

/* ── Constants ──────────────────────────────────────────────────── */

const ELEMENT_GROUPS = [
  {
    label: "Container",
    elements: ["div", "section", "article", "header", "footer", "nav", "aside"],
  },
  {
    label: "Content",
    elements: ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "img"],
  },
  {
    label: "Interactive",
    elements: ["button", "a", "input", "textarea", "select"],
  },
  {
    label: "List",
    elements: ["ul", "ol", "li"],
  },
] as const

const PROP_TYPES = ["string", "number", "boolean", "ReactNode"] as const

const PROP_TYPE_ICONS: Record<string, React.ReactNode> = {
  string: <TypeIcon className="size-3" />,
  number: <Hash className="size-3" />,
  boolean: <ToggleLeft className="size-3" />,
  ReactNode: <Braces className="size-3" />,
}

type PropType = "string" | "number" | "boolean" | "ReactNode"

/* ── Props ──────────────────────────────────────────────────────── */

interface BuilderPanelProps {
  tree: ComponentTree
  onTreeChange: (tree: ComponentTree) => void
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function BuilderPanel({
  tree,
  onTreeChange,
  className,
}: BuilderPanelProps) {
  // null = assembly view (root), "main" = main component, sc id = sub-component
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const [structureOpen, setStructureOpen] = React.useState(true)
  const [propsOpen, setPropsOpen] = React.useState(true)
  const [variantsOpen, setVariantsOpen] = React.useState(true)
  const [subComponentsOpen, setSubComponentsOpen] = React.useState(true)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)

  // Get the focused component's data
  const focusedSc = focusedId && focusedId !== "main"
    ? tree.subComponents.find((sc) => sc.id === focusedId)
    : null
  const focusedName = focusedId === "main"
    ? tree.name
    : focusedSc?.name ?? null
  const focusedTree = focusedId === "main"
    ? tree.tree
    : focusedSc?.tree ?? null
  const focusedProps = focusedId === "main"
    ? tree.props
    : focusedSc?.props ?? []
  const focusedVariants = focusedId === "main"
    ? tree.variants
    : focusedSc?.variants ?? []

  // Handlers that route to the correct tree
  const handleTreeUpdate = (newElementTree: ElementNode) => {
    if (focusedId === "main") {
      onTreeChange({ ...tree, tree: newElementTree })
    } else if (focusedSc) {
      const updated = tree.subComponents.map((sc) =>
        sc.id === focusedId ? { ...sc, tree: newElementTree } : sc,
      )
      onTreeChange({ ...tree, subComponents: updated })
    }
  }

  const handlePropsUpdate = (props: ComponentProp[]) => {
    if (focusedId === "main") {
      onTreeChange({ ...tree, props })
    } else if (focusedSc) {
      const updated = tree.subComponents.map((sc) =>
        sc.id === focusedId ? { ...sc, props } : sc,
      )
      onTreeChange({ ...tree, subComponents: updated })
    }
  }

  const handleVariantsUpdate = (variants: CustomVariantDef[]) => {
    if (focusedId === "main") {
      onTreeChange({ ...tree, variants })
    } else if (focusedSc) {
      const updated = tree.subComponents.map((sc) =>
        sc.id === focusedId ? { ...sc, variants } : sc,
      )
      onTreeChange({ ...tree, subComponents: updated })
    }
  }

  return (
    <div className={cn("flex flex-1 flex-col border-l bg-background", className)}>
      {/* ── Focus selector: row 1 (Assembly + Main) ─────────── */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => setFocusedId(null)}
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
            focusedId === null
              ? "bg-blue-500/10 text-blue-500"
              : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          Assembly
        </button>
        <button
          type="button"
          onClick={() => setFocusedId("main")}
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
            focusedId === "main"
              ? "bg-blue-500/10 text-blue-500"
              : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          {tree.name}
        </button>
      </div>

      {/* ── Focus selector: row 2 (Sub-components, wrapping) ──── */}
      {tree.subComponents.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Sub
          </span>
          {tree.subComponents.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setFocusedId(sc.id)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                focusedId === sc.id
                  ? "bg-blue-500/10 text-blue-500"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              {sc.name.replace(tree.name, "")}
            </button>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-0">
          {/* ── Assembly view (no focus) ─────────────────────── */}
          {focusedId === null && (
            <>
              <div className="px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Usage preview (not exported)
                </p>
                <p className="text-[10px] text-muted-foreground/70 mb-3">
                  Build how your components compose together. This is the canvas preview — it does not affect the exported .tsx file.
                </p>
              </div>

              <BuilderSection
                icon={<Layers className="size-3.5" />}
                title="Assembly"
                badge={countNodes(tree.assemblyTree)}
                open={structureOpen}
                onOpenChange={setStructureOpen}
              >
                <ElementTree
                  node={tree.assemblyTree}
                  depth={0}
                  isRoot
                  selectedNodeId={selectedNodeId}
                  subComponents={tree.subComponents}
                  hideEditor
                  labelOverrides={{ [tree.assemblyTree.id]: tree.name }}
                  onSelectNode={setSelectedNodeId}
                  onAddChild={(parentId, tag) => {
                    const child = createElementNode(tag)
                    const newAssembly = addChild(tree.assemblyTree, parentId, child)
                    onTreeChange({ ...tree, assemblyTree: newAssembly })
                  }}
                  onRemoveNode={(nodeId) => {
                    const newAssembly = removeNode(tree.assemblyTree, nodeId)
                    onTreeChange({ ...tree, assemblyTree: newAssembly })
                  }}
                  onUpdateClasses={(nodeId, classes) => {
                    const newAssembly = updateNodeClasses(tree.assemblyTree, nodeId, classes)
                    onTreeChange({ ...tree, assemblyTree: newAssembly })
                  }}
                  onUpdateText={(nodeId, text) => {
                    const newAssembly = updateNodeText(tree.assemblyTree, nodeId, text || undefined)
                    onTreeChange({ ...tree, assemblyTree: newAssembly })
                  }}
                  onMoveNode={(dragId, targetId, position) => {
                    const newAssembly = moveNode(tree.assemblyTree, dragId, targetId, position)
                    onTreeChange({ ...tree, assemblyTree: newAssembly })
                  }}
                />
              </BuilderSection>

              <Separator />

              <BuilderSection
                icon={<Component className="size-3.5" />}
                title="Sub-components"
                badge={tree.subComponents.length}
                open={subComponentsOpen}
                onOpenChange={setSubComponentsOpen}
              >
                <SubComponentsEditor
                  subComponents={tree.subComponents}
                  parentName={tree.name}
                  onSubComponentsChange={(subComponents) =>
                    onTreeChange({ ...tree, subComponents })
                  }
                />
              </BuilderSection>
            </>
          )}

          {/* ── Focused component editing ───────────────────── */}
          {focusedId !== null && focusedTree && (
            <>
              <div className="px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {focusedName} — definition
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  This is the component&apos;s internal structure. Changes here are exported to .tsx.
                </p>
              </div>

              <BuilderSection
                icon={<Layers className="size-3.5" />}
                title="Structure"
                badge={countNodes(focusedTree)}
                open={structureOpen}
                onOpenChange={setStructureOpen}
              >
                <ElementTree
                  node={focusedTree}
                  depth={0}
                  isRoot
                  selectedNodeId={selectedNodeId}
                  subComponents={focusedId === "main" ? tree.subComponents : []}
                  hideEditor
                  hideTextEditor
                  onSelectNode={setSelectedNodeId}
                  onAddChild={(parentId, tag) => {
                    const child = createElementNode(tag)
                    const newTree = addChild(focusedTree, parentId, child)
                    handleTreeUpdate(newTree)
                  }}
                  onRemoveNode={(nodeId) => {
                    const newTree = removeNode(focusedTree, nodeId)
                    handleTreeUpdate(newTree)
                  }}
                  onUpdateClasses={(nodeId, classes) => {
                    const newTree = updateNodeClasses(focusedTree, nodeId, classes)
                    handleTreeUpdate(newTree)
                  }}
                  onUpdateText={(nodeId, text) => {
                    const newTree = updateNodeText(focusedTree, nodeId, text || undefined)
                    handleTreeUpdate(newTree)
                  }}
                  onMoveNode={(dragId, targetId, position) => {
                    const newTree = moveNode(focusedTree, dragId, targetId, position)
                    handleTreeUpdate(newTree)
                  }}
                />
              </BuilderSection>

              <Separator />

              <BuilderSection
                icon={<Code2 className="size-3.5" />}
                title="Props"
                badge={focusedProps.length}
                open={propsOpen}
                onOpenChange={setPropsOpen}
              >
                <PropsEditor
                  props={focusedProps}
                  onPropsChange={handlePropsUpdate}
                />
              </BuilderSection>

              <Separator />

              <BuilderSection
                icon={<ToggleLeft className="size-3.5" />}
                title="Variants"
                badge={focusedVariants.length}
                open={variantsOpen}
                onOpenChange={setVariantsOpen}
              >
                <VariantsEditor
                  variants={focusedVariants}
                  onVariantsChange={handleVariantsUpdate}
                />
              </BuilderSection>

              {/* Show sub-components section only when editing main component */}
              {focusedId === "main" && (
                <>
                  <Separator />
                  <BuilderSection
                    icon={<Component className="size-3.5" />}
                    title="Sub-components"
                    badge={tree.subComponents.length}
                    open={subComponentsOpen}
                    onOpenChange={setSubComponentsOpen}
                  >
                    <SubComponentsEditor
                      subComponents={tree.subComponents}
                      parentName={tree.name}
                      onSubComponentsChange={(subComponents) =>
                        onTreeChange({ ...tree, subComponents })
                      }
                    />
                  </BuilderSection>
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/* ── AssemblyTree — read-only view of composed structure ────────── */

function AssemblyTree({
  tree,
  onFocusComponent,
}: {
  tree: ComponentTree
  onFocusComponent: (id: string) => void
}) {
  const renderAssemblyNode = (node: ElementNode, depth: number): React.ReactNode => {
    const subComponent = tree.subComponents.find((sc) => sc.name === node.tag)

    if (subComponent) {
      return (
        <div key={node.id} style={{ paddingLeft: `${depth * 12}px` }}>
          <button
            type="button"
            onClick={() => onFocusComponent(subComponent.id)}
            className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-mono text-blue-500 hover:bg-blue-500/10"
          >
            <Component className="size-3" />
            &lt;{subComponent.name}&gt;
          </button>
          {subComponent.tree.children.map((child) =>
            renderAssemblyNode(child, depth + 1),
          )}
        </div>
      )
    }

    return (
      <div key={node.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <span className="text-[11px] font-mono text-muted-foreground">
          &lt;{node.tag}&gt;
          {node.text && (
            <span className="ml-1 text-foreground/60">{node.text.slice(0, 20)}</span>
          )}
        </span>
        {node.children.map((child) =>
          renderAssemblyNode(child, depth + 1),
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onFocusComponent("main")}
        className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-mono text-blue-500 hover:bg-blue-500/10"
      >
        <Component className="size-3" />
        &lt;{tree.name}&gt;
      </button>
      {tree.tree.children.map((child) =>
        renderAssemblyNode(child, 1),
      )}
    </div>
  )
}

/* ── BuilderSection ─────────────────────────────────────────────── */

interface BuilderSectionProps {
  icon: React.ReactNode
  title: string
  badge?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function BuilderSection({
  icon,
  title,
  badge,
  open,
  onOpenChange,
  children,
}: BuilderSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        >
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
          {icon}
          <span className="text-xs font-medium">{title}</span>
          {badge !== undefined && badge > 0 && (
            <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
              {badge}
            </Badge>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ── ElementTree ────────────────────────────────────────────────── */

type DropPosition = "before" | "after" | "inside"

interface ElementTreeProps {
  node: ElementNode
  depth: number
  isRoot: boolean
  selectedNodeId: string | null
  subComponents?: SubComponentDef[]
  /** When true, clicking a node won't show the class/text inline editor.
   *  Add/remove/reorder still work — only the inline editor is hidden. */
  hideEditor?: boolean
  /** Override display labels for specific node IDs (e.g. root → "MyCard") */
  labelOverrides?: Record<string, string>
  /** When true, hide text field in inline editor (root elements pass {children}) */
  hideTextEditor?: boolean
  onSelectNode: (id: string | null) => void
  onAddChild: (parentId: string, tag: string) => void
  onRemoveNode: (nodeId: string) => void
  onUpdateClasses: (nodeId: string, classes: string[]) => void
  onUpdateText: (nodeId: string, text: string) => void
  onMoveNode?: (dragId: string, targetId: string, position: DropPosition) => void
}

function ElementTree({
  node,
  depth,
  isRoot,
  selectedNodeId,
  subComponents,
  hideEditor,
  labelOverrides,
  hideTextEditor,
  onSelectNode,
  onAddChild,
  onRemoveNode,
  onUpdateClasses,
  onUpdateText,
  onMoveNode,
}: ElementTreeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const [dropPosition, setDropPosition] = React.useState<DropPosition | null>(null)
  const rowRef = React.useRef<HTMLDivElement>(null)
  const isSelected = selectedNodeId === node.id
  const hasChildren = node.children.length > 0

  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) { e.preventDefault(); return }
    e.dataTransfer.setData("text/plain", node.id)
    e.dataTransfer.effectAllowed = "move"
    e.stopPropagation()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const third = rect.height / 3
    if (y < third) {
      setDropPosition("before")
    } else if (y > third * 2) {
      setDropPosition("after")
    } else {
      setDropPosition("inside")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDropPosition(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dragId = e.dataTransfer.getData("text/plain")
    if (dragId && dragId !== node.id && dropPosition && onMoveNode) {
      onMoveNode(dragId, node.id, dropPosition)
    }
    setDropPosition(null)
  }

  return (
    <div>
      {/* Drop indicator: before */}
      {dropPosition === "before" && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 16 + 4}px`, marginRight: "4px" }}
        />
      )}

      {/* Node row */}
      <div
        ref={rowRef}
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pr-1 transition-colors",
          isSelected
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/40",
          dropPosition === "inside" && "ring-2 ring-blue-500 ring-inset bg-blue-500/5",
          !isRoot && "cursor-grab active:cursor-grabbing",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm",
            hasChildren
              ? "text-muted-foreground hover:text-foreground"
              : "invisible",
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>

        {/* Tag name — clickable to select */}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={() => onSelectNode(isSelected ? null : node.id)}
        >
          <code className="text-xs font-semibold">
            &lt;{labelOverrides?.[node.id] ?? node.tag}&gt;
          </code>
          {node.classes.length > 0 && (
            <span className="truncate text-[10px] text-muted-foreground">
              .{node.classes[0]}
              {node.classes.length > 1 && `+${node.classes.length - 1}`}
            </span>
          )}
          {isRoot && (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              root
            </Badge>
          )}
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <AddElementPopover
            onSelect={(tag) => onAddChild(node.id, tag)}
            subComponents={subComponents}
          />
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              className="size-5 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveNode(node.id)}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline editor when selected */}
      {isSelected && !hideEditor && (
        <div
          className="space-y-2 rounded-md border bg-muted/20 p-2"
          style={{ marginLeft: `${depth * 16 + 4}px`, marginRight: "4px" }}
        >
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Classes
            </Label>
            <Input
              value={node.classes.join(" ")}
              placeholder="Tailwind classes..."
              className="h-7 text-xs"
              onChange={(e) =>
                onUpdateClasses(
                  node.id,
                  e.target.value
                    .split(/\s+/)
                    .filter(Boolean),
                )
              }
            />
          </div>
          {!hideTextEditor && !isRoot && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Text content
            </Label>
            <Input
              value={node.text ?? ""}
              placeholder="Text..."
              className="h-7 text-xs"
              onChange={(e) => onUpdateText(node.id, e.target.value)}
            />
          </div>
          )}
        </div>
      )}

      {/* Children */}
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <ElementTree
            key={child.id}
            node={child}
            depth={depth + 1}
            isRoot={false}
            selectedNodeId={selectedNodeId}
            subComponents={subComponents}
            hideEditor={hideEditor}
            labelOverrides={labelOverrides}
            hideTextEditor={hideTextEditor}
            onSelectNode={onSelectNode}
            onAddChild={onAddChild}
            onRemoveNode={onRemoveNode}
            onUpdateClasses={onUpdateClasses}
            onUpdateText={onUpdateText}
            onMoveNode={onMoveNode}
          />
        ))}

      {/* Drop indicator: after */}
      {dropPosition === "after" && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 16 + 4}px`, marginRight: "4px" }}
        />
      )}
    </div>
  )
}

/* ── AddElementPopover ──────────────────────────────────────────── */

interface AddElementPopoverProps {
  onSelect: (tag: string) => void
  subComponents?: SubComponentDef[]
}

function AddElementPopover({ onSelect, subComponents }: AddElementPopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Add element
          </p>
          {ELEMENT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.elements.map((el) => (
                  <button
                    key={el}
                    type="button"
                    className="rounded border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                    onClick={() => {
                      onSelect(el)
                      setOpen(false)
                    }}
                  >
                    {el}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {subComponents && subComponents.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-blue-500/60">
                Sub-components
              </p>
              <div className="flex flex-wrap gap-1">
                {subComponents.map((sc) => (
                  <button
                    key={sc.name}
                    type="button"
                    className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    onClick={() => {
                      onSelect(sc.name)
                      setOpen(false)
                    }}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── PropsEditor ────────────────────────────────────────────────── */

interface PropsEditorProps {
  props: ComponentProp[]
  onPropsChange: (props: ComponentProp[]) => void
}

function PropsEditor({ props, onPropsChange }: PropsEditorProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<PropType>("string")
  const [required, setRequired] = React.useState(false)
  const [defaultValue, setDefaultValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  function resetForm() {
    setName("")
    setType("string")
    setRequired(false)
    setDefaultValue("")
    setError(null)
    setEditingIndex(null)
  }

  function handleOpenChange(open: boolean) {
    setPopoverOpen(open)
    if (!open) resetForm()
  }

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Name is required")
      return
    }
    if (!/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) {
      setError("Must be camelCase")
      return
    }
    // Check duplicates (except when editing the same index)
    const isDuplicate = props.some(
      (p, i) => p.name === trimmed && i !== editingIndex,
    )
    if (isDuplicate) {
      setError("A prop with this name already exists")
      return
    }

    const newProp: ComponentProp = {
      name: trimmed,
      type,
      required,
      defaultValue: defaultValue || undefined,
    }

    if (editingIndex !== null) {
      const updated = [...props]
      updated[editingIndex] = newProp
      onPropsChange(updated)
    } else {
      onPropsChange([...props, newProp])
    }

    setPopoverOpen(false)
    resetForm()
  }

  function handleEdit(index: number) {
    const prop = props[index]
    setName(prop.name)
    setType(prop.type)
    setRequired(prop.required)
    setDefaultValue(prop.defaultValue ?? "")
    setEditingIndex(index)
    setError(null)
    setPopoverOpen(true)
  }

  function handleDelete(index: number) {
    onPropsChange(props.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {/* Existing props list */}
      {props.length > 0 ? (
        <div className="space-y-1.5">
          {props.map((prop, i) => (
            <div
              key={prop.name}
              className="group flex items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {PROP_TYPE_ICONS[prop.type]}
                <code className="text-xs font-medium">{prop.name}</code>
                {prop.required && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[9px] text-destructive"
                  >
                    req
                  </Badge>
                )}
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                  {prop.type}
                </Badge>
                {prop.defaultValue && (
                  <span className="truncate text-[10px] text-muted-foreground">
                    = {prop.defaultValue}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(i)}
                >
                  <Code2 className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(i)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No custom props defined yet.
        </p>
      )}

      {/* Add prop button + popover */}
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-xs"
          >
            <Plus className="size-3" />
            Add prop
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start" sideOffset={8}>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">
                {editingIndex !== null ? "Edit prop" : "New prop"}
              </h4>
              <p className="text-xs text-muted-foreground">
                Define a typed prop for this component.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-name" className="text-xs">
                Name
              </Label>
              <Input
                id="prop-name"
                placeholder="e.g. label, count, isOpen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-type" className="text-xs">
                Type
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as PropType)}>
                <SelectTrigger id="prop-type" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROP_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        {PROP_TYPE_ICONS[t]}
                        {t}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="prop-required" className="text-xs">
                Required
              </Label>
              <Switch
                id="prop-required"
                checked={required}
                onCheckedChange={setRequired}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prop-default" className="text-xs">
                Default value
              </Label>
              <Input
                id="prop-default"
                placeholder="Optional"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={handleCreate}
              type="button"
            >
              {editingIndex !== null ? "Save" : "Add"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── VariantsEditor ─────────────────────────────────────────────── */

interface VariantsEditorProps {
  variants: CustomVariantDef[]
  onVariantsChange: (variants: CustomVariantDef[]) => void
}

function VariantsEditor({
  variants,
  onVariantsChange,
}: VariantsEditorProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [variantName, setVariantName] = React.useState("")
  const [variantType, setVariantType] = React.useState<"variant" | "boolean">(
    "variant",
  )
  const [options, setOptions] = React.useState<string[]>([])
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  function resetForm() {
    setVariantName("")
    setVariantType("variant")
    setOptions([])
    setOptionInput("")
    setDefaultValue("")
    setError(null)
    setEditingIndex(null)
  }

  function handleOpenChange(open: boolean) {
    setPopoverOpen(open)
    if (!open) resetForm()
  }

  function handleAddOption() {
    const trimmed = optionInput.trim()
    if (!trimmed) return
    if (options.includes(trimmed)) {
      setError("Duplicate option")
      return
    }
    setOptions((prev) => [...prev, trimmed])
    if (options.length === 0) setDefaultValue(trimmed)
    setOptionInput("")
    setError(null)
  }

  function handleCreate() {
    const trimmed = variantName.trim().toLowerCase()
    if (!trimmed) {
      setError("Name is required")
      return
    }

    const isDuplicate = variants.some(
      (v, i) => v.name === trimmed && i !== editingIndex,
    )
    if (isDuplicate) {
      setError("A variant with this name already exists")
      return
    }

    if (variantType === "variant" && options.length < 2) {
      setError("Add at least 2 options")
      return
    }

    const def: CustomVariantDef = {
      name: trimmed,
      type: variantType,
      options: variantType === "boolean" ? ["true", "false"] : options,
      defaultValue:
        variantType === "boolean" ? defaultValue || "false" : defaultValue,
    }

    if (editingIndex !== null) {
      const updated = [...variants]
      updated[editingIndex] = def
      onVariantsChange(updated)
    } else {
      onVariantsChange([...variants, def])
    }

    setPopoverOpen(false)
    resetForm()
  }

  function handleEdit(index: number) {
    const v = variants[index]
    setVariantName(v.name)
    setVariantType(v.type)
    setOptions(v.type === "boolean" ? [] : v.options)
    setDefaultValue(v.defaultValue)
    setEditingIndex(index)
    setError(null)
    setPopoverOpen(true)
  }

  return (
    <div className="space-y-2">
      {variants.length > 0 ? (
        <div className="space-y-1.5">
          {variants.map((v, i) => (
            <div
              key={v.name}
              className="group rounded-md border bg-muted/20 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{v.name}</span>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    {v.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(i)}
                  >
                    <Code2 className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onVariantsChange(variants.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {v.options.map((opt) => (
                  <Badge
                    key={opt}
                    variant={opt === v.defaultValue ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {opt}
                    {opt === v.defaultValue && (
                      <span className="ml-0.5 opacity-60">*</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No variants defined. Add size, intent, or boolean props.
        </p>
      )}

      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-xs"
          >
            <Plus className="size-3" />
            Add variant
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start" sideOffset={8}>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">
                {editingIndex !== null ? "Edit variant" : "New variant"}
              </h4>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-md border p-2 text-center text-xs transition-colors",
                  variantType === "variant"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
                onClick={() => setVariantType("variant")}
              >
                Named options
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md border p-2 text-center text-xs transition-colors",
                  variantType === "boolean"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
                onClick={() => {
                  setVariantType("boolean")
                  setDefaultValue("false")
                }}
              >
                Boolean
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="e.g. size, intent"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {variantType === "variant" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Options</Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Type and press Enter"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0"
                      onClick={handleAddOption}
                      type="button"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {options.map((opt) => (
                        <Badge
                          key={opt}
                          variant={
                            opt === defaultValue ? "default" : "secondary"
                          }
                          className="gap-1 text-xs"
                        >
                          <button
                            type="button"
                            className="hover:underline"
                            onClick={() => setDefaultValue(opt)}
                          >
                            {opt}
                          </button>
                          <button
                            type="button"
                            className="ml-0.5 rounded-full hover:bg-foreground/10"
                            onClick={() => {
                              const next = options.filter((o) => o !== opt)
                              setOptions(next)
                              if (defaultValue === opt) {
                                setDefaultValue(next[0] ?? "")
                              }
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {variantType === "boolean" && (
              <div className="flex items-center justify-between">
                <Label className="text-xs">Default: true</Label>
                <Switch
                  checked={defaultValue === "true"}
                  onCheckedChange={(checked) =>
                    setDefaultValue(checked ? "true" : "false")
                  }
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={handleCreate}
              type="button"
            >
              {editingIndex !== null ? "Save" : "Create"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── SubComponentsEditor ────────────────────────────────────────── */

interface SubComponentsEditorProps {
  subComponents: SubComponentDef[]
  parentName: string
  onSubComponentsChange: (subComponents: SubComponentDef[]) => void
}

function SubComponentsEditor({
  subComponents,
  parentName,
  onSubComponentsChange,
}: SubComponentsEditorProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [subName, setSubName] = React.useState("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [classes, setClasses] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  function resetForm() {
    setSubName("")
    setBaseElement("div")
    setClasses("")
    setError(null)
    setEditingIndex(null)
  }

  function handleOpenChange(open: boolean) {
    setPopoverOpen(open)
    if (!open) resetForm()
  }

  function handleCreate() {
    const trimmed = subName.trim()
    if (!trimmed) {
      setError("Name is required")
      return
    }
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
      setError("Must be PascalCase")
      return
    }

    // Ensure sub-component name starts with parent name
    const fullName = trimmed.startsWith(parentName)
      ? trimmed
      : `${parentName}${trimmed}`

    const isDuplicate = subComponents.some(
      (s, i) => s.name === fullName && i !== editingIndex,
    )
    if (isDuplicate) {
      setError("A sub-component with this name already exists")
      return
    }

    const def: SubComponentDef = {
      id: `sc_${Date.now().toString(36)}`,
      name: fullName,
      baseElement,
      tree: createElementNode(baseElement),
      classes: classes
        .split(/\s+/)
        .filter(Boolean),
      props: [],
      variants: [],
    }

    if (editingIndex !== null) {
      const updated = [...subComponents]
      updated[editingIndex] = def
      onSubComponentsChange(updated)
    } else {
      onSubComponentsChange([...subComponents, def])
    }

    setPopoverOpen(false)
    resetForm()
  }

  function handleEdit(index: number) {
    const sub = subComponents[index]
    setSubName(sub.name)
    setBaseElement(sub.baseElement)
    setClasses(sub.classes.join(" "))
    setEditingIndex(index)
    setError(null)
    setPopoverOpen(true)
  }

  const BASE_ELEMENTS = [
    "div",
    "section",
    "header",
    "footer",
    "nav",
    "aside",
    "span",
    "p",
    "ul",
    "li",
  ]

  return (
    <div className="space-y-2">
      {subComponents.length > 0 ? (
        <div className="space-y-1.5">
          {subComponents.map((sub, i) => (
            <div
              key={sub.name}
              className="group rounded-md border bg-muted/20 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Box className="size-3 text-muted-foreground" />
                  <code className="text-xs font-medium">{sub.name}</code>
                  <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                    {sub.baseElement}
                  </Badge>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(i)}
                  >
                    <Code2 className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onSubComponentsChange(
                        subComponents.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              {sub.classes.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {sub.classes.slice(0, 5).map((cls) => (
                    <Badge
                      key={cls}
                      variant="secondary"
                      className="text-[9px]"
                    >
                      {cls}
                    </Badge>
                  ))}
                  {sub.classes.length > 5 && (
                    <Badge variant="secondary" className="text-[9px]">
                      +{sub.classes.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No sub-components. Add parts like {parentName}Header,{" "}
          {parentName}Content.
        </p>
      )}

      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-xs"
          >
            <Plus className="size-3" />
            Add sub-component
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start" sideOffset={8}>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">
                {editingIndex !== null
                  ? "Edit sub-component"
                  : "New sub-component"}
              </h4>
              <p className="text-xs text-muted-foreground">
                Creates a separate forwardRef export.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder={`e.g. ${parentName}Header`}
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                PascalCase. Will be prefixed with {parentName} if needed.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Base element</Label>
              <Select value={baseElement} onValueChange={setBaseElement}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_ELEMENTS.map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      &lt;{el}&gt;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tailwind classes</Label>
              <Input
                placeholder="e.g. flex flex-col gap-2 p-4"
                value={classes}
                onChange={(e) => setClasses(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={handleCreate}
              type="button"
            >
              {editingIndex !== null ? "Save" : "Create"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

/** Count total nodes in a tree. */
function countNodes(node: ElementNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}
