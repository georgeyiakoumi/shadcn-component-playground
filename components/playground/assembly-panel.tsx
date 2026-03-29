"use client"

import * as React from "react"
import { Plus, Eye, EyeOff, Trash2, ChevronRight, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ComponentTree, ElementNode } from "@/lib/component-tree"
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
}: AssemblyPanelProps) {
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set())

  function toggleHidden(nodeId: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
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
    const child = createElementNode(tag)
    const newAssembly = addChild(tree.assemblyTree, parentId, child)
    onTreeChange({ ...tree, assemblyTree: newAssembly })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 border-b px-3 py-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assembly
          </span>
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1.5">
            <AssemblyNode
              node={tree.assemblyTree}
              depth={0}
              isRoot
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
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}

/* ── AssemblyNode — recursive tree node ────────────────────────── */

interface AssemblyNodeProps {
  node: ElementNode
  depth: number
  isRoot: boolean
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
  const isSelected = subComponent ? selectedId === subComponent.id : selectedId === "main" && isRoot

  // Display name
  const displayName = isRoot
    ? node.tag // Will show as the component name from the assembly root
    : node.tag

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
          style={{ marginLeft: `${depth * 14 + 4}px` }}
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
          "group flex items-center gap-1 rounded-md py-0.5 pr-1",
          isSelected && "bg-blue-500/10",
          isHidden && "opacity-40",
          dropPosition === "inside" && "ring-1 ring-blue-500 bg-blue-500/5",
          !isRoot && "cursor-grab active:cursor-grabbing",
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
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

        {/* Tag name — clickable for sub-components */}
        <button
          type="button"
          className={cn(
            "flex-1 truncate text-left font-mono text-xs",
            isSubComponent
              ? "text-blue-500/80 hover:text-blue-500"
              : "text-muted-foreground",
          )}
          onClick={() => {
            if (isSubComponent && onSelectComponent) {
              onSelectComponent(subComponent.id)
            } else if (isRoot && onSelectComponent) {
              onSelectComponent("main")
            }
          }}
        >
          &lt;{displayName}{!hasChildren && !node.text ? " /" : ""}&gt;
          {node.text && (
            <span className="ml-1 text-foreground/40 font-sans">
              {node.text.slice(0, 12)}
            </span>
          )}
        </button>

        {/* Hover actions */}
        {!isRoot && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Add inside */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    // For now, add a placeholder div — will be replaced with picker
                    onAddChild(node.id, "div")
                    setExpanded(true)
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Add inside</TooltipContent>
            </Tooltip>

            {/* Toggle visibility */}
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

            {/* Remove from demo */}
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
          </div>
        )}
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
          style={{ marginLeft: `${depth * 14 + 4}px` }}
        />
      )}
    </div>
  )
}
