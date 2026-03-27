"use client"

import * as React from "react"
import {
  Plus,
  X,
  AlertTriangle,
  Paintbrush,
  ChevronDown,
  ChevronRight,
  Type,
  MoveHorizontal,
  LayoutGrid,
  Square,
  Sparkles,
  MousePointer2,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useComponentEdit } from "@/lib/component-state"
import {
  analyseTailwindClasses,
  type TwCategory,
  type TwClassInfo,
} from "@/lib/tw-class-parser"
import { describeTwClass } from "@/lib/tw-descriptions"
import { findConflicts, type TwConflict } from "@/lib/tw-conflict-checker"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ── Types ──────────────────────────────────────────────────────── */

interface TwEditorPanelProps {
  source: string
  className?: string
}

/* ── Category metadata ─────────────────────────────────────────── */

interface CategoryMeta {
  label: string
  icon: React.ElementType
}

const CATEGORY_META: Record<TwCategory, CategoryMeta> = {
  spacing: { label: "Spacing", icon: MoveHorizontal },
  typography: { label: "Typography", icon: Type },
  colour: { label: "Colour", icon: Paintbrush },
  layout: { label: "Layout", icon: LayoutGrid },
  borders: { label: "Borders", icon: Square },
  effects: { label: "Effects", icon: Sparkles },
  interactivity: { label: "Interactivity", icon: MousePointer2 },
  other: { label: "Other", icon: HelpCircle },
}

const CATEGORY_ORDER: TwCategory[] = [
  "layout",
  "spacing",
  "typography",
  "colour",
  "borders",
  "effects",
  "interactivity",
  "other",
]

/* ── Common Tailwind class suggestions ──────────────────────────── */

const COMMON_CLASSES: string[] = [
  // Layout
  "flex", "inline-flex", "grid", "block", "inline-block", "inline", "hidden",
  "flex-col", "flex-row", "flex-wrap", "flex-nowrap", "flex-1", "flex-auto", "flex-none",
  "items-center", "items-start", "items-end", "items-stretch", "items-baseline",
  "justify-center", "justify-between", "justify-start", "justify-end", "justify-around", "justify-evenly",
  "self-auto", "self-start", "self-end", "self-center", "self-stretch",
  "grow", "grow-0", "shrink", "shrink-0",
  "w-full", "w-auto", "w-screen", "w-fit", "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4",
  "w-4", "w-5", "w-6", "w-8", "w-10", "w-12", "w-16", "w-20", "w-24", "w-32", "w-40", "w-48", "w-64",
  "h-full", "h-auto", "h-screen", "h-fit", "h-4", "h-5", "h-6", "h-8", "h-9", "h-10", "h-11", "h-12", "h-16", "h-20", "h-24", "h-32",
  "min-w-0", "min-w-full", "min-h-0", "min-h-full", "min-h-screen",
  "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-full", "max-w-none",
  "max-h-full", "max-h-screen",
  "size-4", "size-5", "size-6", "size-8", "size-10",
  "overflow-hidden", "overflow-auto", "overflow-scroll", "overflow-visible",
  "relative", "absolute", "fixed", "sticky", "static",
  "inset-0", "top-0", "right-0", "bottom-0", "left-0",
  "z-0", "z-10", "z-20", "z-30", "z-40", "z-50",

  // Spacing
  "p-0", "p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-8", "p-10", "p-12",
  "px-0", "px-1", "px-2", "px-3", "px-4", "px-5", "px-6", "px-8",
  "py-0", "py-1", "py-2", "py-3", "py-4", "py-5", "py-6", "py-8",
  "pt-0", "pt-1", "pt-2", "pt-4", "pt-6", "pt-8",
  "pr-0", "pr-1", "pr-2", "pr-4",
  "pb-0", "pb-1", "pb-2", "pb-4", "pb-6", "pb-8",
  "pl-0", "pl-1", "pl-2", "pl-3", "pl-4",
  "m-0", "m-1", "m-2", "m-4", "m-auto",
  "mx-auto", "mx-0", "mx-1", "mx-2", "mx-4",
  "my-0", "my-1", "my-2", "my-4", "my-6", "my-8",
  "mt-0", "mt-1", "mt-2", "mt-4", "mt-6", "mt-8", "mt-auto",
  "mr-0", "mr-1", "mr-2", "mr-4", "mr-auto",
  "mb-0", "mb-1", "mb-2", "mb-4", "mb-6", "mb-8",
  "ml-0", "ml-1", "ml-2", "ml-3", "ml-4", "ml-auto",
  "gap-0", "gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-8",
  "space-x-1", "space-x-2", "space-x-4",
  "space-y-1", "space-y-2", "space-y-4",

  // Typography
  "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl",
  "font-normal", "font-medium", "font-semibold", "font-bold",
  "font-sans", "font-serif", "font-mono",
  "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose",
  "tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest",
  "text-left", "text-center", "text-right", "text-justify",
  "truncate", "whitespace-nowrap", "whitespace-normal",
  "uppercase", "lowercase", "capitalize", "normal-case",
  "underline", "no-underline", "line-through",
  "italic", "not-italic",
  "antialiased",

  // Colour — backgrounds
  "bg-background", "bg-foreground", "bg-primary", "bg-secondary", "bg-destructive",
  "bg-muted", "bg-accent", "bg-popover", "bg-card", "bg-transparent", "bg-black", "bg-white",

  // Colour — text
  "text-foreground", "text-primary-foreground", "text-secondary-foreground",
  "text-destructive-foreground", "text-muted-foreground", "text-accent-foreground",
  "text-primary", "text-destructive", "text-current", "text-inherit",
  "text-black", "text-white",

  // Colour — border
  "border-input", "border-border", "border-destructive", "border-primary",
  "border-transparent", "border-black", "border-white",

  // Borders
  "border", "border-0", "border-2", "border-4",
  "border-t", "border-r", "border-b", "border-l",
  "rounded-none", "rounded-sm", "rounded", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full",
  "outline-none", "outline",
  "ring-0", "ring-1", "ring-2", "ring-4",
  "ring-ring", "ring-offset-2", "ring-offset-background",

  // Effects
  "shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl",
  "opacity-0", "opacity-25", "opacity-50", "opacity-75", "opacity-100",
  "transition-none", "transition-all", "transition-colors", "transition-opacity", "transition-transform",
  "duration-150", "duration-200", "duration-300", "duration-500",
  "ease-linear", "ease-in", "ease-out", "ease-in-out",
  "animate-spin", "animate-ping", "animate-pulse", "animate-bounce",
  "scale-0", "scale-50", "scale-75", "scale-90", "scale-95", "scale-100", "scale-105", "scale-110",

  // Interactivity
  "cursor-pointer", "cursor-default", "cursor-not-allowed", "cursor-grab",
  "pointer-events-none", "pointer-events-auto",
  "select-none", "select-text", "select-all",
  "sr-only", "not-sr-only",
]

/* ── Component ─────────────────────────────────────────────────── */

const ELEMENT_ID = "root"

export function TwEditorPanel({ source, className }: TwEditorPanelProps) {
  const { edit, addCustomClass, removeCustomClass } = useComponentEdit()

  // Parse classes from source
  const analysis = React.useMemo(
    () => analyseTailwindClasses(source),
    [source],
  )

  const customClasses = edit.customClasses[ELEMENT_ID] ?? []

  // Merge source + custom classes for conflict detection
  const allClassStrings = React.useMemo(() => {
    const sourceClasses = analysis.classes.map((c) => c.raw)
    return [...sourceClasses, ...customClasses]
  }, [analysis.classes, customClasses])

  // Detect conflicts
  const conflicts = React.useMemo(
    () => findConflicts(allClassStrings),
    [allClassStrings],
  )

  // Build a set of conflicting class names for quick lookup
  const conflictingClasses = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of conflicts) {
      set.add(c.classes[0])
      set.add(c.classes[1])
    }
    return set
  }, [conflicts])

  // Build grouped view: source classes by category + custom classes
  const groupedSource = React.useMemo(() => {
    const groups: Record<TwCategory, TwClassInfo[]> = {
      spacing: [],
      typography: [],
      colour: [],
      layout: [],
      borders: [],
      effects: [],
      interactivity: [],
      other: [],
    }
    for (const cls of analysis.classes) {
      groups[cls.category].push(cls)
    }
    return groups
  }, [analysis.classes])

  // Parse custom classes through the analyser to get categories
  const customAnalysis = React.useMemo(() => {
    if (customClasses.length === 0) return null
    const fakeSource = `className="${customClasses.join(" ")}"`
    return analyseTailwindClasses(fakeSource)
  }, [customClasses])

  const groupedCustom = React.useMemo(() => {
    if (!customAnalysis) return null
    const groups: Record<TwCategory, TwClassInfo[]> = {
      spacing: [],
      typography: [],
      colour: [],
      layout: [],
      borders: [],
      effects: [],
      interactivity: [],
      other: [],
    }
    for (const cls of customAnalysis.classes) {
      groups[cls.category].push(cls)
    }
    return groups
  }, [customAnalysis])

  const handleAddClass = React.useCallback(
    (cls: string) => {
      const trimmed = cls.trim()
      if (!trimmed) return
      addCustomClass(ELEMENT_ID, trimmed)
    },
    [addCustomClass],
  )

  const handleRemoveClass = React.useCallback(
    (cls: string) => {
      removeCustomClass(ELEMENT_ID, cls)
    },
    [removeCustomClass],
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex h-full flex-col", className)}>
        {/* ── Add class input ──────────────────────────────── */}
        <div className="shrink-0 border-b px-4 py-3">
          <ClassAutocomplete
            onAdd={handleAddClass}
            existingClasses={allClassStrings}
          />
          {customClasses.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {customClasses.length} custom{" "}
              {customClasses.length === 1 ? "class" : "classes"} added
            </p>
          )}
        </div>

        {/* ── Conflict warnings ────────────────────────────── */}
        {conflicts.length > 0 && (
          <div className="shrink-0 space-y-2 border-b px-4 py-3">
            {conflicts.map((conflict, i) => (
              <ConflictCard key={i} conflict={conflict} />
            ))}
          </div>
        )}

        {/* ── Class list ───────────────────────────────────── */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-4">
            {CATEGORY_ORDER.map((cat) => {
              const sourceClasses = groupedSource[cat]
              const customCat = groupedCustom?.[cat] ?? []

              if (sourceClasses.length === 0 && customCat.length === 0) {
                return null
              }

              return (
                <EditorCategorySection
                  key={cat}
                  category={cat}
                  sourceClasses={sourceClasses}
                  customClasses={customCat}
                  conflictingClasses={conflictingClasses}
                  conflicts={conflicts}
                  onRemoveCustom={handleRemoveClass}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}

/* ── Class autocomplete ─────────────────────────────────────────── */

interface ClassAutocompleteProps {
  onAdd: (cls: string) => void
  existingClasses: string[]
}

function ClassAutocomplete({ onAdd, existingClasses }: ClassAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const existingSet = React.useMemo(
    () => new Set(existingClasses),
    [existingClasses],
  )

  const suggestions = React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return COMMON_CLASSES.filter(
      (cls) => cls.includes(q) && !existingSet.has(cls),
    ).slice(0, 20)
  }, [query, existingSet])

  const handleSelect = React.useCallback(
    (cls: string) => {
      onAdd(cls)
      setQuery("")
      setOpen(false)
    },
    [onAdd],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && query.trim()) {
        // If there are suggestions, let the Command handle it
        // If no suggestions or user typed a custom class, add it directly
        if (suggestions.length === 0) {
          handleSelect(query.trim())
          e.preventDefault()
        }
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    },
    [query, suggestions.length, handleSelect],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Plus className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Add a Tailwind class..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.trim()) {
                setOpen(true)
              } else {
                setOpen(false)
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim()) setOpen(true)
            }}
            className="h-8 pl-8 font-mono text-xs"
          />
        </div>
      </PopoverTrigger>
      {suggestions.length > 0 && (
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No matching classes</CommandEmpty>
              <CommandGroup>
                {suggestions.map((cls) => (
                  <CommandItem
                    key={cls}
                    value={cls}
                    onSelect={() => handleSelect(cls)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-xs">{cls}</span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {describeTwClass(cls)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}

/* ── Editor category section ────────────────────────────────────── */

interface EditorCategorySectionProps {
  category: TwCategory
  sourceClasses: TwClassInfo[]
  customClasses: TwClassInfo[]
  conflictingClasses: Set<string>
  conflicts: TwConflict[]
  onRemoveCustom: (cls: string) => void
}

function EditorCategorySection({
  category,
  sourceClasses,
  customClasses,
  conflictingClasses,
  conflicts,
  onRemoveCustom,
}: EditorCategorySectionProps) {
  const [open, setOpen] = React.useState(true)
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const total = sourceClasses.length + customClasses.length

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span>{meta.label}</span>
        <Badge
          variant="secondary"
          className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
        >
          {total}
        </Badge>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2.5">
          {/* Source classes — read-only */}
          {sourceClasses.map((cls) => (
            <SourceClassBadge
              key={cls.raw}
              info={cls}
              hasConflict={conflictingClasses.has(cls.raw)}
              conflicts={conflicts}
            />
          ))}
          {/* Custom classes — editable */}
          {customClasses.map((cls) => (
            <CustomClassBadge
              key={cls.raw}
              info={cls}
              hasConflict={conflictingClasses.has(cls.raw)}
              conflicts={conflicts}
              onRemove={() => onRemoveCustom(cls.raw)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Source class badge (read-only, muted) ──────────────────────── */

interface SourceClassBadgeProps {
  info: TwClassInfo
  hasConflict: boolean
  conflicts: TwConflict[]
}

function SourceClassBadge({ info, hasConflict, conflicts }: SourceClassBadgeProps) {
  const description = React.useMemo(
    () => describeTwClass(info.raw),
    [info.raw],
  )

  const conflictReason = React.useMemo(() => {
    if (!hasConflict) return null
    const match = conflicts.find(
      (c) => c.classes[0] === info.raw || c.classes[1] === info.raw,
    )
    return match?.reason ?? null
  }, [hasConflict, conflicts, info.raw])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className={cn(
            "cursor-default select-text font-mono text-[11px] font-normal text-muted-foreground",
            hasConflict &&
              "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
          )}
        >
          {hasConflict && (
            <AlertTriangle className="mr-1 size-3 shrink-0" />
          )}
          {info.raw}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <p className="text-xs">{description}</p>
        {hasConflict && conflictReason && (
          <p className="mt-0.5 text-[10px] font-medium text-red-500">
            Conflict: {conflictReason}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Source (read-only)
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Custom class badge (editable, with X button) ───────────────── */

interface CustomClassBadgeProps {
  info: TwClassInfo
  hasConflict: boolean
  conflicts: TwConflict[]
  onRemove: () => void
}

function CustomClassBadge({
  info,
  hasConflict,
  conflicts,
  onRemove,
}: CustomClassBadgeProps) {
  const description = React.useMemo(
    () => describeTwClass(info.raw),
    [info.raw],
  )

  const conflictReason = React.useMemo(() => {
    if (!hasConflict) return null
    const match = conflicts.find(
      (c) => c.classes[0] === info.raw || c.classes[1] === info.raw,
    )
    return match?.reason ?? null
  }, [hasConflict, conflicts, info.raw])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "cursor-default gap-1 font-mono text-[11px] font-normal",
            hasConflict
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              : "border-primary/30 bg-primary/5 text-primary",
          )}
        >
          {hasConflict && (
            <AlertTriangle className="size-3 shrink-0" />
          )}
          {info.raw}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
            aria-label={`Remove ${info.raw}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <p className="text-xs">{description}</p>
        {hasConflict && conflictReason && (
          <p className="mt-0.5 text-[10px] font-medium text-red-500">
            Conflict: {conflictReason}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Custom (click X to remove)
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Conflict warning card ──────────────────────────────────────── */

interface ConflictCardProps {
  conflict: TwConflict
}

function ConflictCard({ conflict }: ConflictCardProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 dark:border-yellow-800 dark:bg-yellow-950">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
          <code className="font-mono">{conflict.classes[0]}</code>
          {" "}+{" "}
          <code className="font-mono">{conflict.classes[1]}</code>
        </p>
        <p className="text-[11px] text-yellow-700 dark:text-yellow-300">
          {conflict.reason}
        </p>
        <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
          {conflict.suggestion}
        </p>
      </div>
    </div>
  )
}
