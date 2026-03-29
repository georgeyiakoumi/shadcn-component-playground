"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Paintbrush,
  Type,
  MoveHorizontal,
  LayoutGrid,
  Square,
  Sparkles,
  MousePointer2,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { analyseTailwindClasses, type TwAnalysis, type TwCategory, type TwClassInfo } from "@/lib/tw-class-parser"
import { describeTwClass } from "@/lib/tw-descriptions"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ── Types ──────────────────────────────────────────────────────── */

interface TwPanelProps {
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
  "spacing",
  "typography",
  "colour",
  "layout",
  "borders",
  "effects",
  "interactivity",
  "other",
]

/* ── Component ─────────────────────────────────────────────────── */

export function TwPanel({ source, className }: TwPanelProps) {
  const analysis = React.useMemo(() => analyseTailwindClasses(source), [source])

  const [grouped, setGrouped] = React.useState(true)
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(
    new Set(),
  )
  const [showAll, setShowAll] = React.useState(true)

  // Reset filters when source changes
  React.useEffect(() => {
    setActiveFilters(new Set())
    setShowAll(true)
  }, [source])

  const toggleFilter = React.useCallback((filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
    setShowAll(false)
  }, [])

  const handleShowAllChange = React.useCallback((checked: boolean | "indeterminate") => {
    if (checked === true) {
      setActiveFilters(new Set())
      setShowAll(true)
    } else {
      setShowAll(false)
    }
  }, [])

  // Filter classes
  const filteredClasses = React.useMemo(() => {
    if (showAll || activeFilters.size === 0) return analysis.classes
    return analysis.classes.filter(
      (cls) => cls.prefix && activeFilters.has(cls.prefix),
    )
  }, [analysis.classes, activeFilters, showAll])

  const filteredByCategory = React.useMemo(() => {
    if (showAll || activeFilters.size === 0) return analysis.byCategory

    const result: Record<TwCategory, TwClassInfo[]> = {
      spacing: [],
      typography: [],
      colour: [],
      layout: [],
      borders: [],
      effects: [],
      interactivity: [],
      other: [],
    }
    for (const cls of filteredClasses) {
      result[cls.category].push(cls)
    }
    return result
  }, [filteredClasses, activeFilters, showAll, analysis.byCategory])

  if (analysis.classes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">
          No Tailwind classes found
        </p>
      </div>
    )
  }

  const hasFilters =
    analysis.breakpoints.length > 0 || analysis.states.length > 0

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex h-full flex-col", className)}>
        {/* ── Filter controls ──────────────────────────────── */}
        <div className="shrink-0 space-y-3 border-b px-4 py-3">
          {/* Toggles row */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showAll}
                onCheckedChange={handleShowAllChange}
              />
              <span className="text-muted-foreground">Show all</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={grouped}
                onCheckedChange={(checked) =>
                  setGrouped(checked === true)
                }
              />
              <span className="text-muted-foreground">Group</span>
            </label>
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredClasses.length} classes
            </span>
          </div>

          {/* Filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.breakpoints.map((bp) => (
                <FilterChip
                  key={bp}
                  label={bp}
                  type="breakpoint"
                  active={activeFilters.has(bp)}
                  onClick={() => toggleFilter(bp)}
                />
              ))}
              {analysis.states.map((state) => (
                <FilterChip
                  key={state}
                  label={state}
                  type="state"
                  active={activeFilters.has(state)}
                  onClick={() => toggleFilter(state)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Class list ───────────────────────────────────── */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {grouped ? (
              <div className="space-y-1">
                {CATEGORY_ORDER.map((cat) => {
                  const classes = filteredByCategory[cat]
                  if (classes.length === 0) return null
                  return (
                    <CategorySection
                      key={cat}
                      category={cat}
                      classes={classes}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {filteredClasses.map((cls) => (
                  <ClassChip key={cls.raw} info={cls} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}

/* ── CategorySection ───────────────────────────────────────────── */

interface CategorySectionProps {
  category: TwCategory
  classes: TwClassInfo[]
}

function CategorySection({ category, classes }: CategorySectionProps) {
  const [open, setOpen] = React.useState(true)
  const meta = CATEGORY_META[category]
  const Icon = meta.icon

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
          className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs"
        >
          {classes.length}
        </Badge>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2.5">
          {classes.map((cls) => (
            <ClassChip key={cls.raw} info={cls} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── ClassChip ─────────────────────────────────────────────────── */

interface ClassChipProps {
  info: TwClassInfo
}

function ClassChip({ info }: ClassChipProps) {
  const description = React.useMemo(
    () => describeTwClass(info.raw),
    [info.raw],
  )

  const badgeVariant = getBadgeVariant(info)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "cursor-default select-text font-mono text-xs font-normal",
            badgeVariant,
          )}
        >
          {info.raw}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        <p className="text-xs">{description}</p>
        {info.prefix && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {info.prefixType === "breakpoint" ? "Breakpoint" : "State"}:{" "}
            {info.prefix}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function getBadgeVariant(info: TwClassInfo): string {
  if (!info.prefix) return ""
  if (info.prefixType === "state") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
  }
  if (info.prefixType === "breakpoint") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
  }
  if (info.prefixType === "group") {
    return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
  }
  return ""
}

/* ── FilterChip ────────────────────────────────────────────────── */

interface FilterChipProps {
  label: string
  type: "breakpoint" | "state"
  active: boolean
  onClick: () => void
}

function FilterChip({ label, type, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
        active
          ? type === "breakpoint"
            ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
            : "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
          : "border-border bg-background text-muted-foreground hover:bg-muted/50",
      )}
    >
      {label}
    </button>
  )
}
