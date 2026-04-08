"use client"

import * as React from "react"
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
  ChevronDown,
  Box,
  Type,
  Heading,
  MousePointer,
  Image,
  FormInput,
  List,
  Minus,
  Code2,
  TextCursorInput,
} from "lucide-react"

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
import type {
  ComponentTreeV2,
  PartChild,
  PartNode,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import { createPartNode } from "@/lib/component-tree-v2-factories"
import {
  appendChildAtPath,
  makePartPath,
  movePartByPath,
  removePartAtPath,
  type PartPath,
} from "@/lib/parser/v2-tree-path"

/* ── Types ──────────────────────────────────────────────────────── */

interface AssemblyPanelProps {
  tree: ComponentTreeV2
  onTreeChange: (tree: ComponentTreeV2) => void
  onSelectPath?: (path: PartPath | null) => void
  selectedPath?: PartPath | null
  /** Set of part paths that are hidden in the canvas */
  hiddenPaths: Set<PartPath>
  onHiddenChange: (hiddenPaths: Set<PartPath>) => void
}

type DropPosition = "before" | "after" | "inside"

/* ── Component ──────────────────────────────────────────────────── */

/**
 * AssemblyPanel — displays the from-scratch builder's composition graph
 * AND the JSX body of each sub-component.
 *
 * The composition graph is implicit from each sub-component's `nestInside`
 * field. The compound root is `subComponents[0]`. Sub-components with no
 * explicit `nestInside` (or `nestInside === root.name`) nest inside the
 * root. Other sub-components nest inside their named parent.
 *
 * Inside each sub-component's row, we ALSO render the html/text/expression
 * children of `parts.root.children` — these are the JSX body the user
 * builds via the picker (raw HTML elements + shadcn previews).
 *
 * Picking from the picker:
 * - HTML element / #text → adds to the clicked sub-component's
 *   parts.root.children
 * - shadcn preview component → adds as a component-ref part inside the
 *   clicked sub-component's parts.root.children
 *
 * Sub-components are NOT added via this panel — that's done via the Define
 * view's "Add sub-component" dialog (which sets `nestInside` directly).
 */
export function AssemblyPanel({
  tree,
  onTreeChange,
  onSelectPath,
  selectedPath,
  hiddenPaths,
  onHiddenChange,
}: AssemblyPanelProps) {
  function toggleHidden(path: PartPath) {
    const next = new Set(hiddenPaths)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    onHiddenChange(next)
  }

  function handleRemove(path: PartPath) {
    onTreeChange(removePartAtPath(tree, path))
  }

  function handleMove(
    dragPath: PartPath,
    targetPath: PartPath,
    position: DropPosition,
  ) {
    onTreeChange(movePartByPath(tree, dragPath, targetPath, position))
  }

  function handleAddChild(parentPath: PartPath, tag: string) {
    // #text becomes a literal text PartChild on the parent
    if (tag === "#text") {
      onTreeChange(appendTextChildAtPath(tree, parentPath, "Sample text"))
      return
    }

    // PascalCase tag → shadcn preview component. Build a component-ref
    // part so the renderer routes through the shadcn preview map.
    if (/^[A-Z]/.test(tag)) {
      const refPart: PartNode = {
        base: { kind: "component-ref", name: tag },
        className: { kind: "literal", value: "" },
        propsSpread: false,
        attributes: {},
        asChild: false,
        children: [],
      }
      onTreeChange(appendChildAtPath(tree, parentPath, refPart))
      return
    }

    // Plain HTML element
    const newChild = createPartNode(tag)
    onTreeChange(appendChildAtPath(tree, parentPath, newChild))
  }

  // Compound root sub-component
  const root = tree.subComponents[0]
  if (!root) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex max-h-96 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-1.5 border-b px-3 py-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assembly
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-[10px] italic text-muted-foreground/60">
                preview only
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs text-xs"
            >
              Plain HTML and shadcn elements you add inside a sub-component are
              for the canvas preview only. They show up here so you can see what
              your component looks like with realistic content, but they aren't
              exported to the .tsx file. Your component is still composed via
              `children` in the consuming code.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="min-w-max p-1.5">
            <SubComponentNode
              tree={tree}
              sub={root}
              isRoot
              depth={0}
              hiddenPaths={hiddenPaths}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onToggleHidden={toggleHidden}
              onRemove={handleRemove}
              onMove={handleMove}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

/** Find sub-components nested inside a given parent (per `nestInside`). */
function findNestedChildren(
  tree: ComponentTreeV2,
  parentName: string,
): SubComponentV2[] {
  const root = tree.subComponents[0]
  const isRoot = root && root.name === parentName
  return tree.subComponents.filter((sc, i) => {
    if (i === 0) return false
    if (isRoot) {
      return !sc.nestInside || sc.nestInside === parentName
    }
    return sc.nestInside === parentName
  })
}

function appendTextChildAtPath(
  tree: ComponentTreeV2,
  path: PartPath,
  text: string,
): ComponentTreeV2 {
  return mutatePartAtPath(tree, path, (part) => ({
    ...part,
    children: [
      ...part.children,
      { kind: "text", value: text } satisfies PartChild,
    ],
  }))
}

function mutatePartAtPath(
  tree: ComponentTreeV2,
  path: PartPath,
  mutate: (part: PartNode) => PartNode,
): ComponentTreeV2 {
  if (!path.startsWith("sub:")) return tree
  const slashIdx = path.indexOf("/")
  if (slashIdx === -1) return tree
  const subName = path.slice("sub:".length, slashIdx)
  const indexStr = path.slice(slashIdx + 1)
  const indices: number[] =
    indexStr === "" ? [] : indexStr.split("/").map((s) => Number(s))
  if (indices.some((n) => !Number.isInteger(n) || n < 0)) return tree

  return {
    ...tree,
    subComponents: tree.subComponents.map((sub) => {
      if (sub.name !== subName) return sub
      return {
        ...sub,
        parts: {
          root:
            indices.length === 0
              ? mutate(sub.parts.root)
              : mutateInChildren(sub.parts.root, indices, mutate),
        },
      }
    }),
  }
}

function mutateInChildren(
  parent: PartNode,
  indices: number[],
  mutate: (part: PartNode) => PartNode,
): PartNode {
  if (indices.length === 0) return mutate(parent)
  const [head, ...rest] = indices
  return {
    ...parent,
    children: parent.children.map((child, i) => {
      if (i !== head) return child
      if (child.kind !== "part") return child
      return {
        kind: "part",
        part:
          rest.length === 0
            ? mutate(child.part)
            : mutateInChildren(child.part, rest, mutate),
      }
    }),
  }
}

function appendIndexToPath(path: PartPath, index: number): PartPath {
  if (path.endsWith("/")) {
    return `${path}${index}`
  }
  return `${path}/${index}`
}

/* ── SubComponentNode — renders one sub-component row ─────────── */

interface SubComponentNodeProps {
  tree: ComponentTreeV2
  sub: SubComponentV2
  isRoot: boolean
  depth: number
  hiddenPaths: Set<PartPath>
  selectedPath?: PartPath | null
  onSelectPath?: (path: PartPath | null) => void
  onToggleHidden: (path: PartPath) => void
  onRemove: (path: PartPath) => void
  onMove: (dragPath: PartPath, targetPath: PartPath, position: DropPosition) => void
  onAddChild: (parentPath: PartPath, tag: string) => void
}

function SubComponentNode({
  tree,
  sub,
  isRoot,
  depth,
  hiddenPaths,
  selectedPath,
  onSelectPath,
  onToggleHidden,
  onRemove,
  onMove,
  onAddChild,
}: SubComponentNodeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const path = makePartPath(sub.name, [])
  const isHidden = hiddenPaths.has(path)
  const isSelected = selectedPath === path

  // Composition graph children: sub-components nested inside this one
  const nestedSubs = findNestedChildren(tree, sub.name)

  // Body part children of this sub-component (raw HTML / shadcn / text /
  // expressions added via the picker)
  const bodyChildren = sub.parts.root.children

  const hasAnyChildren = nestedSubs.length > 0 || bodyChildren.length > 0

  return (
    <div>
      {/* Sub-component row */}
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-0.5 pl-1",
          isSelected && "bg-blue-500/10",
          isHidden && "opacity-40",
        )}
      >
        {depth > 0 && (
          <div className="shrink-0" style={{ width: `${depth * 14}px` }} />
        )}

        <button
          type="button"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm",
            hasAnyChildren
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

        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate text-left font-mono text-xs",
            isSelected
              ? "text-foreground"
              : "text-blue-500/80 hover:text-blue-500",
          )}
          onClick={() => {
            if (onSelectPath) {
              onSelectPath(selectedPath === path ? null : path)
            }
          }}
        >
          &lt;{sub.name}
          {!hasAnyChildren ? " /" : ""}&gt;
        </button>

        {/* Hover actions */}
        <div className="sticky right-0 ml-auto flex shrink-0 items-center gap-0.5 bg-gradient-to-l from-background from-70% to-transparent pl-4 pr-1 opacity-0 transition-opacity group-hover:opacity-100">
          <AddElementPicker
            onSelect={(tag) => {
              onAddChild(path, tag)
              setExpanded(true)
            }}
          />
          {!isRoot && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleHidden(path)
                  }}
                >
                  {isHidden ? (
                    <EyeOff className="size-3" />
                  ) : (
                    <Eye className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isHidden ? "Show" : "Hide"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Children — composition-graph nested sub-components first, then
          html/text body parts */}
      {expanded && (
        <>
          {nestedSubs.map((nested) => (
            <SubComponentNode
              key={`sub:${nested.name}`}
              tree={tree}
              sub={nested}
              isRoot={false}
              depth={depth + 1}
              hiddenPaths={hiddenPaths}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onToggleHidden={onToggleHidden}
              onRemove={onRemove}
              onMove={onMove}
              onAddChild={onAddChild}
            />
          ))}
          {bodyChildren.map((child, i) => {
            if (child.kind !== "part") return null
            const childPath = appendIndexToPath(path, i)
            return (
              <BodyPartNode
                key={childPath}
                part={child.part}
                path={childPath}
                depth={depth + 1}
                hiddenPaths={hiddenPaths}
                selectedPath={selectedPath}
                onSelectPath={onSelectPath}
                onToggleHidden={onToggleHidden}
                onRemove={onRemove}
                onMove={onMove}
                onAddChild={onAddChild}
              />
            )
          })}
        </>
      )}
    </div>
  )
}

/* ── BodyPartNode — renders a raw HTML/shadcn body element ────── */

interface BodyPartNodeProps {
  part: PartNode
  path: PartPath
  depth: number
  hiddenPaths: Set<PartPath>
  selectedPath?: PartPath | null
  onSelectPath?: (path: PartPath | null) => void
  onToggleHidden: (path: PartPath) => void
  onRemove: (path: PartPath) => void
  onMove: (dragPath: PartPath, targetPath: PartPath, position: DropPosition) => void
  onAddChild: (parentPath: PartPath, tag: string) => void
}

function BodyPartNode({
  part,
  path,
  depth,
  hiddenPaths,
  selectedPath,
  onSelectPath,
  onToggleHidden,
  onRemove,
  onMove,
  onAddChild,
}: BodyPartNodeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const [dropPosition, setDropPosition] = React.useState<DropPosition | null>(
    null,
  )
  const rowRef = React.useRef<HTMLDivElement>(null)

  const isHidden = hiddenPaths.has(path)
  const hasChildren = part.children.length > 0
  const isSelected = selectedPath === path

  const displayName =
    part.base.kind === "html"
      ? part.base.tag
      : part.base.kind === "component-ref"
        ? part.base.name
        : part.base.kind === "radix"
          ? `${part.base.primitive}.${part.base.part}`
          : part.base.kind === "third-party"
            ? part.base.component
            : part.base.localName

  // Drag handlers (body parts can be reordered, sub-components can't via
  // this panel — those are reordered via the Define view's reorder dialog)
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", path)
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
    const dragPath = e.dataTransfer.getData("text/plain") as PartPath
    if (dragPath && dragPath !== path && dropPosition) {
      onMove(dragPath, path, dropPosition)
    }
    setDropPosition(null)
  }

  // First text child for the inline label
  const firstTextChild = part.children.find(
    (c) => c.kind === "text",
  ) as Extract<PartChild, { kind: "text" }> | undefined
  const showAsTextRow = !!firstTextChild && !hasChildrenOfKindPart(part)

  return (
    <div>
      {dropPosition === "before" && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 14 + 20}px` }}
        />
      )}

      <div
        ref={rowRef}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center gap-1 rounded-md py-0.5 pl-1",
          isSelected && "bg-blue-500/10",
          isHidden && "opacity-40",
          dropPosition === "inside" && "ring-1 ring-blue-500 bg-blue-500/5",
          "cursor-grab active:cursor-grabbing",
        )}
      >
        {depth > 0 && (
          <div className="shrink-0" style={{ width: `${depth * 14}px` }} />
        )}

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

        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate text-left font-mono text-xs",
            isSelected
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70",
          )}
          onClick={() => {
            if (onSelectPath) {
              onSelectPath(selectedPath === path ? null : path)
            }
          }}
        >
          {showAsTextRow && firstTextChild ? (
            <span className="font-sans text-foreground/50 italic">
              &quot;
              {firstTextChild.value.length > 20
                ? firstTextChild.value.slice(0, 20) + "…"
                : firstTextChild.value}
              &quot;
            </span>
          ) : (
            <>
              &lt;{displayName}
              {!hasChildren ? " /" : ""}&gt;
            </>
          )}
        </button>

        <div className="sticky right-0 ml-auto flex shrink-0 items-center gap-0.5 bg-gradient-to-l from-background from-70% to-transparent pl-4 pr-1 opacity-0 transition-opacity group-hover:opacity-100">
          <AddElementPicker
            onSelect={(tag) => {
              onAddChild(path, tag)
              setExpanded(true)
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleHidden(path)
                }}
              >
                {isHidden ? (
                  <EyeOff className="size-3" />
                ) : (
                  <Eye className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isHidden ? "Show" : "Hide"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(path)
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Remove
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {expanded && hasChildren &&
        part.children.map((child, i) => {
          if (child.kind !== "part") return null
          const childPath = appendIndexToPath(path, i)
          return (
            <BodyPartNode
              key={childPath}
              part={child.part}
              path={childPath}
              depth={depth + 1}
              hiddenPaths={hiddenPaths}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              onToggleHidden={onToggleHidden}
              onRemove={onRemove}
              onMove={onMove}
              onAddChild={onAddChild}
            />
          )
        })}

      {dropPosition === "after" && (
        <div
          className="h-0.5 rounded-full bg-blue-500"
          style={{ marginLeft: `${depth * 14 + 20}px` }}
        />
      )}
    </div>
  )
}

function hasChildrenOfKindPart(part: PartNode): boolean {
  return part.children.some((c) => c.kind === "part")
}

/* ── AddElementPicker — popover for adding HTML/shadcn elements ── */

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
  onSelect,
}: {
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
            <CommandEmpty className="py-3 text-center text-xs">
              No matches.
            </CommandEmpty>

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
                    <code className="font-mono text-xs">
                      &lt;{el.label}&gt;
                    </code>
                  )}
                  <span className="text-muted-foreground">
                    {el.description}
                  </span>
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
                  <span className="text-muted-foreground">
                    {el.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
