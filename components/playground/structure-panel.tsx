"use client"

import * as React from "react"
import { Code2, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { registry } from "@/lib/registry"
import type { ComponentTree } from "@/lib/component-tree"
import { ScrollArea } from "@/components/ui/scroll-area"

/* ── Types ──────────────────────────────────────────────────────── */

interface StructurePanelProps {
  slug: string
  /** Pass a ComponentTree for custom components (overrides registry lookup) */
  customTree?: ComponentTree
  onNodeClick?: (name: string) => void
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function StructurePanel({ slug, customTree, onNodeClick, className }: StructurePanelProps) {
  // For custom components, build the outline from the tree
  if (customTree) {
    return (
      <ScrollArea className={cn("h-full", className)}>
        <div className="p-4">
          <div className="space-y-1">
            <TreeNode
              name={customTree.name}
              isRoot
              isCompound={customTree.subComponents.length > 0}
              onClick={onNodeClick}
            />
            {customTree.subComponents.length > 0 && (
              <div className="ml-3 border-l border-border pl-3 space-y-0.5">
                {customTree.subComponents.map((sub) => (
                  <TreeNode key={sub.id} name={sub.name} onClick={onNodeClick} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    )
  }

  const component = registry.find((c) => c.slug === slug)

  if (!component) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">Component not found</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4">
        <div className="space-y-1">
          {/* ── Root node ──────────────────────────────────── */}
          <TreeNode
            name={component.name}
            isRoot
            isCompound={component.isCompound}
            onClick={onNodeClick}
          />

          {/* ── Child nodes ────────────────────────────────── */}
          {component.isCompound && component.subComponents.length > 0 && (
            <div className="ml-3 border-l border-border pl-3 space-y-0.5">
              {component.subComponents.map((sub) => (
                <TreeNode key={sub} name={sub} onClick={onNodeClick} />
              ))}
            </div>
          )}
        </div>

        {/* Pillar 6.1 — variants used to render here as static chips
            keyed by `component.variants` from the registry. The registry
            list was hand-maintained and incomplete (e.g. Button has both
            `variant` and `size` cva groups but the registry only tracked
            `variant`). The variants UI now lives in the bottom-bar
            VariantsPopover widget on the slug page, which reads from the
            v2 parsed tree's structured `cvaExports`. */}
      </div>
    </ScrollArea>
  )
}

/* ── TreeNode ──────────────────────────────────────────────────── */

interface TreeNodeProps {
  name: string
  isRoot?: boolean
  isCompound?: boolean
  onClick?: (name: string) => void
}

function TreeNode({ name, isRoot, isCompound, onClick }: TreeNodeProps) {
  const handleClick = React.useCallback(() => {
    onClick?.(name)
  }, [name, onClick])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
        isRoot && "font-medium",
      )}
    >
      {isRoot ? (
        <Code2 className="size-4 shrink-0 text-blue-500" />
      ) : (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className={cn(isRoot ? "text-foreground" : "text-muted-foreground")}>
        {name}
      </span>
    </button>
  )
}
