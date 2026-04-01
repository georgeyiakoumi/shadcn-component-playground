"use client"

import * as React from "react"
import { Plus, Eye, EyeOff, Trash2, ChevronRight, ChevronDown, Box, Type, Heading, MousePointer, Image, FormInput, List, Minus, Code2, Component, TextCursorInput } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { ComponentTree, ElementNode, SubComponentDef } from "@/lib/component-tree"
import {
  addChild,
  removeNode,
  moveNode,
  createElementNode,
} from "@/lib/component-tree"

/* ── Types ──────────────────────────────────────────────────────── */

interface AssemblyPanelProps {
  tree: ComponentTree
  onTreeChange: (tree: ComponentTree) => void
  onSelectComponent?: (id: string) => void
  selectedId?: string | null
  /** Set of node IDs that are hidden in the canvas */
  hiddenIds: Set<string>
  onHiddenChange: (hiddenIds: Set<string>) => void
}

type DropPosition = "before" | "after" | "inside"

/* ── Hidden nodes state ────────────────────────────────────────── */

// Track which nodes are hidden (visibility toggle)
// This is local state — hidden nodes still exist in the tree but
// don't render in the canvas preview

/* ── Component ──────────────────────────────────────────────────── */

export function AssemblyPanel({
  tree,
  onTreeChange,
  onSelectComponent,
  selectedId,
  hiddenIds,
  onHiddenChange,
}: AssemblyPanelProps) {
  function toggleHidden(nodeId: string) {
    const next = new Set(hiddenIds)
    if (next.has(nodeId)) {
      next.delete(nodeId)
    } else {
      next.add(nodeId)
    }
    onHiddenChange(next)
  }

  function handleRemoveNode(nodeId: string) {
    const newAssembly = removeNode(tree.assemblyTree, nodeId)
    onTreeChange({ ...tree, assemblyTree: newAssembly })
  }

  function handleMoveNode(dragId: string, targetId: string, position: DropPosition) {
    const newAssembly = moveNode(tree.assemblyTree, dragId, targetId, position)
    onTreeChange({ ...tree, assemblyTree: newAssembly })
  }

  function handleAddChild(parentId: string, tag: string) {
    const child = createElementNode(tag === "#text" ? "span" : tag)
    if (tag === "#text") {
      child.text = "Sample text"
    }
    const newAssembly = addChild(tree.assemblyTree, parentId, child)
    onTreeChange({ ...tree, assemblyTree: newAssembly })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex max-h-96 flex-col">
        <div className="flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assembly
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="min-w-max p-1.5">
            <AssemblyNode
              node={tree.assemblyTree}
              depth={0}
              isRoot
              rootName={tree.name}
              subComponents={tree.subComponents}
              hiddenIds={hiddenIds}
              selectedId={selectedId}
              onSelectComponent={onSelectComponent}
              onToggleHidden={toggleHidden}
              onRemove={handleRemoveNode}
              onMove={handleMoveNode}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ── AssemblyNode — recursive tree node ────────────────────────── */

interface AssemblyNodeProps {
  node: ElementNode
  depth: number
  isRoot: boolean
  rootName?: string
  subComponents: ComponentTree["subComponents"]
  hiddenIds: Set<string>
  selectedId?: string | null
  onSelectComponent?: (id: string) => void
  onToggleHidden: (id: string) => void
  onRemove: (id: string) => void
  onMove: (dragId: string, targetId: string, position: DropPosition) => void
  onAddChild: (parentId: string, tag: string) => void
}

function AssemblyNode({
  node,
  depth,
  isRoot,
  rootName,
  subComponents,
  hiddenIds,
  selectedId,
  onSelectComponent,
  onToggleHidden,
  onRemove,
  onMove,
  onAddChild,
}: AssemblyNodeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const [dropPosition, setDropPosition] = React.useState<DropPosition | null>(null)
  const rowRef = React.useRef<HTMLDivElement>(null)

  const isHidden = hiddenIds.has(node.id)
  const hasChildren = node.children.length > 0
  const subComponent = subComponents.find((sc) => sc.name === node.tag)
  const isSubComponent = !!subComponent
  const isSelected = subComponent
    ? selectedId === subComponent.id
    : isRoot
      ? selectedId === "main"
      : selectedId === node.id

  // Display name — root shows component name, sub-components show their name
  const displayName = isRoot && rootName ? rootName : node.tag

  // Drag handlers
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
    if (y < third) setDropPosition("before")
    else if (y > third * 2) setDropPosition("after")
    else setDropPosition("inside")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDropPosition(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dragId = e.dataTransfer.getData("text/plain")
    if (dragId && dragId !== node.id && dropPosition) {
      onMove(dragId, node.id, dropPosition)
    }
    setDropPosition(null)
  }

  return (
    <div>
      {/* Drop indicator: before */}
      {dropPosition === "before" && !isRoot && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 14 + 20}px` }}
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
          "group flex items-center gap-1 rounded-md py-0.5 pl-1",
          isSelected && "bg-blue-500/10",
          isHidden && "opacity-40",
          dropPosition === "inside" && "ring-1 ring-blue-500 bg-blue-500/5",
          !isRoot && "cursor-grab active:cursor-grabbing",
        )}
      >
        {/* Indentation spacer */}
        {depth > 0 && <div className="shrink-0" style={{ width: `${depth * 14}px` }} />}

        {/* Expand/collapse */}
        <button
          type="button"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm",
            hasChildren ? "text-muted-foreground hover:text-foreground" : "invisible",
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>

        {/* Tag name — clickable for all nodes */}
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate text-left font-mono text-xs",
            isSubComponent
              ? "text-blue-500/80 hover:text-blue-500"
              : isSelected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70",
          )}
          onClick={() => {
            if (onSelectComponent) {
              // Always pass the assembly node ID for unified selection
              onSelectComponent(isRoot ? "main" : node.id)
            }
          }}
        >
          &lt;{displayName}{!hasChildren && !node.text ? " /" : ""}&gt;
          {node.text && (
            <span className="ml-1 font-sans text-foreground/50 italic">
              {node.text.length > 20 ? node.text.slice(0, 20) + "…" : node.text}
            </span>
          )}
        </button>

        {/* Hover actions — sticky to panel right edge */}
        <div className="sticky right-0 ml-auto flex shrink-0 items-center gap-0.5 bg-gradient-to-l from-background from-70% to-transparent pl-4 pr-1 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Add inside — Popover with Command picker */}
          <AddElementPicker
            subComponents={subComponents}
            onSelect={(tag) => {
              onAddChild(node.id, tag)
              setExpanded(true)
            }}
          />

          {/* Toggle visibility — not on root */}
          {!isRoot && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleHidden(node.id)
                  }}
                >
                  {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isHidden ? "Show" : "Hide"}
              </TooltipContent>
            </Tooltip>

          )}

          {/* Remove from demo — not on root */}
          {!isRoot && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(node.id)
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && node.children.map((child) => (
        <AssemblyNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isRoot={false}
          subComponents={subComponents}
          hiddenIds={hiddenIds}
          selectedId={selectedId}
          onSelectComponent={onSelectComponent}
          onToggleHidden={onToggleHidden}
          onRemove={onRemove}
          onMove={onMove}
          onAddChild={onAddChild}
        />
      ))}

      {/* Drop indicator: after */}
      {dropPosition === "after" && !isRoot && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 14 + 20}px` }}
        />
      )}
    </div>
  )
}

/* ── AddElementPicker — Command-based popover for adding elements ── */

const DOM_ELEMENTS = [
  { tag: "#text", label: "Plain text", description: "Raw text content", icon: TextCursorInput },
  { tag: "div", label: "div", description: "Container", icon: Box },
  { tag: "p", label: "p", description: "Paragraph", icon: Type },
  { tag: "span", label: "span", description: "Inline text", icon: Type },
  { tag: "h1", label: "h1", description: "Heading 1", icon: Heading },
  { tag: "h2", label: "h2", description: "Heading 2", icon: Heading },
  { tag: "h3", label: "h3", description: "Heading 3", icon: Heading },
  { tag: "h4", label: "h4", description: "Heading 4", icon: Heading },
  { tag: "button", label: "button", description: "Button", icon: MousePointer },
  { tag: "a", label: "a", description: "Link", icon: MousePointer },
  { tag: "img", label: "img", description: "Image", icon: Image },
  { tag: "input", label: "input", description: "Input field", icon: FormInput },
  { tag: "textarea", label: "textarea", description: "Text area", icon: FormInput },
  { tag: "ul", label: "ul", description: "Unordered list", icon: List },
  { tag: "ol", label: "ol", description: "Ordered list", icon: List },
  { tag: "li", label: "li", description: "List item", icon: Minus },
  { tag: "section", label: "section", description: "Section", icon: Box },
  { tag: "article", label: "article", description: "Article", icon: Box },
  { tag: "header", label: "header", description: "Header", icon: Box },
  { tag: "footer", label: "footer", description: "Footer", icon: Box },
  { tag: "nav", label: "nav", description: "Navigation", icon: Box },
  { tag: "form", label: "form", description: "Form", icon: FormInput },
] as const

const SHADCN_ELEMENTS = [
  { tag: "Button", label: "Button", description: "shadcn Button" },
  { tag: "Badge", label: "Badge", description: "shadcn Badge" },
  { tag: "Input", label: "Input", description: "shadcn Input" },
  { tag: "Label", label: "Label", description: "shadcn Label" },
  { tag: "Separator", label: "Separator", description: "shadcn Separator" },
  { tag: "Avatar", label: "Avatar", description: "shadcn Avatar" },
  { tag: "Checkbox", label: "Checkbox", description: "shadcn Checkbox" },
  { tag: "Switch", label: "Switch", description: "shadcn Switch" },
  { tag: "Slider", label: "Slider", description: "shadcn Slider" },
  { tag: "Progress", label: "Progress", description: "shadcn Progress" },
  { tag: "Skeleton", label: "Skeleton", description: "shadcn Skeleton" },
] as const

function AddElementPicker({
  subComponents,
  onSelect,
}: {
  subComponents: SubComponentDef[]
  onSelect: (tag: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  function handleSelect(tag: string) {
    onSelect(tag)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-5"
          title="Add inside"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end" side="right" sideOffset={4}>
        <Command className="[&_[cmdk-list]]:max-h-[240px]">
          <CommandInput placeholder="Search elements..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-xs">No matches.</CommandEmpty>

            {/* Sub-components */}
            {subComponents.length > 0 && (
              <CommandGroup heading="Your sub-components">
                {subComponents.map((sc) => (
                  <CommandItem
                    key={sc.id}
                    value={sc.name}
                    onSelect={() => handleSelect(sc.name)}
                    className="gap-2 text-xs"
                  >
                    <Component className="size-3.5 text-blue-500" />
                    <span className="font-medium">{sc.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* DOM elements */}
            <CommandGroup heading="HTML elements">
              {DOM_ELEMENTS.map((el) => (
                <CommandItem
                  key={el.tag}
                  value={`${el.tag} ${el.description}`}
                  onSelect={() => handleSelect(el.tag)}
                  className="gap-2 text-xs"
                >
                  <el.icon className="size-3.5 text-muted-foreground" />
                  {el.tag === "#text" ? (
                    <span className="font-medium">{el.label}</span>
                  ) : (
                    <code className="font-mono text-xs">&lt;{el.label}&gt;</code>
                  )}
                  <span className="text-muted-foreground">{el.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* shadcn components (preview only) */}
            <CommandGroup heading="shadcn (preview only)">
              {SHADCN_ELEMENTS.map((el) => (
                <CommandItem
                  key={el.tag}
                  value={`${el.tag} ${el.description}`}
                  onSelect={() => handleSelect(el.tag)}
                  className="gap-2 text-xs"
                >
                  <Code2 className="size-3.5 text-purple-500" />
                  <span className="font-medium">{el.label}</span>
                  <span className="text-muted-foreground">{el.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
