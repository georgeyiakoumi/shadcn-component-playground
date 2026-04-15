"use client"

import * as React from "react"
import { X, Code2, Plus } from "lucide-react"

import type { ElementInfo } from "@/components/playground/element-selector"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"

import { getNativeDisplay, DISPLAY_OPTIONS } from "@/lib/tailwind-options"
import type { StyleContext } from "@/lib/style-context"
import { getCssPrefix } from "@/lib/style-context"
import type { ControlState } from "@/lib/style-state"
import { classesToControlState, controlStateToClasses, mergeClasses, MANAGED_PREFIXES } from "@/lib/style-state"
import { EditSection } from "@/components/playground/edit-panel-section"
import { Badge } from "@/components/ui/badge"

import { ContextPicker } from "@/components/playground/context-picker"
import {
  ChildPlacementSection,
  LayoutSection,
  SizeSection,
  SpacingSection,
  TypographySection,
  ColoursSection,
  BordersSection,
  EffectsSection,
  FiltersSection,
  MotionSection,
} from "@/components/playground/sections"

/* ── Types ──────────────────────────────────────────────────────── */

interface VariantOption {
  variantName: string
  optionValue: string
}

interface VisualEditorProps {
  selectedElement: ElementInfo | null
  onClassChange: (classes: string[]) => void
  onDeselect: () => void
  variants?: Array<{ name: string; options: string[] }>
  props?: Array<{ name: string; type: string }>
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>
  subComponentNames?: string[]
  parentClasses?: string[]
  parentTag?: string
  /**
   * Observe the active context selection. The parent page uses this to
   * derive which cva slot a write should land in when the active
   * contexts include a `variant:<group>:<value>` that belongs to the
   * current element's own cva. Fires on every context change.
   */
  onContextsChange?: (contexts: string[]) => void
  /** Base display value from the full (unprefixed) class list, computed by parent */
  baseDisplay?: string
}

/* ── Raw class input for unmanaged modifiers ────────────────────── */

function RawClassInput({
  originalClasses,
  state,
  combinedPrefix,
  selectedElementTagName,
  onClassChange,
  isUserChange,
}: {
  originalClasses: React.MutableRefObject<string[]>
  state: ControlState
  combinedPrefix: string
  selectedElementTagName: string
  onClassChange: (classes: string[]) => void
  isUserChange: React.MutableRefObject<boolean>
}) {
  const [inputValue, setInputValue] = React.useState("")

  // Compute unmanaged classes (ones not represented in ControlState)
  const managedSet = React.useMemo(() => new Set(MANAGED_PREFIXES), [])
  const managedOutput = React.useMemo(
    () => new Set(controlStateToClasses(state, "default", selectedElementTagName)),
    [state, selectedElementTagName],
  )

  const unmanagedClasses = React.useMemo(() => {
    return originalClasses.current.filter((cls) => {
      if (managedOutput.has(cls)) return false
      // Check if the class (stripped of prefix) is in managed set
      const stripped = cls.includes(":") ? cls.slice(cls.lastIndexOf(":") + 1) : cls
      const slashIdx = stripped.lastIndexOf("/")
      const base = slashIdx === -1 ? stripped : stripped.slice(0, slashIdx)
      if (managedSet.has(stripped) || managedSet.has(base)) return false
      // className and data-slot are not classes
      if (cls === "className" || cls.startsWith("data-")) return false
      return true
    })
  }, [originalClasses.current, managedOutput, managedSet])

  const handleAdd = () => {
    const cls = inputValue.trim()
    if (!cls) return
    if (!originalClasses.current.includes(cls)) {
      originalClasses.current = [...originalClasses.current, cls]
      isUserChange.current = true
      onClassChange(mergeClasses(originalClasses.current, state, combinedPrefix, selectedElementTagName))
    }
    setInputValue("")
  }

  const handleRemove = (cls: string) => {
    originalClasses.current = originalClasses.current.filter((c) => c !== cls)
    isUserChange.current = true
    onClassChange(mergeClasses(originalClasses.current, state, combinedPrefix, selectedElementTagName))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <EditSection icon={Code2} title="Custom classes" hasValues={unmanagedClasses.length > 0} onClear={() => {}}>
      <div className="space-y-2">
        {unmanagedClasses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unmanagedClasses.map((cls) => (
              <Badge
                key={cls}
                variant="secondary"
                className="gap-1 font-mono text-[10px]"
              >
                {cls}
                <button
                  type="button"
                  className="ml-0.5 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(cls)}
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. has-[>img:first-child]:pt-0"
            className="h-7 flex-1 rounded-md border bg-transparent px-2 font-mono text-[11px] placeholder:text-muted-foreground/50"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </EditSection>
  )
}

/* ── Main component ──────────────────────────────────────────────── */

export function VisualEditor({
  selectedElement,
  onClassChange,
  onDeselect,
  variants,
  props,
  parentVariants,
  subComponentNames,
  parentClasses,
  parentTag,
  onContextsChange,
  baseDisplay = "",
}: VisualEditorProps) {
  const [contexts, setContexts] = React.useState<string[]>([])

  // Notify parent when contexts change so it can derive cva slot routing.
  React.useEffect(() => {
    onContextsChange?.(contexts)
  }, [contexts, onContextsChange])

  // Compute the combined CSS prefix from selected contexts.
  //
  // Variant contexts (e.g. `variant:size:sm`) are deliberately excluded
  // here: when the user picks a variant in the ContextPicker, the edit
  // should land in the cva slot (variants.size.sm) — NOT on the base
  // className as a `data-[size=sm]:` prefix. The parent page derives
  // the target slot from `contexts` via `onContextsChange` and routes
  // the write accordingly. Breakpoints, pseudos, and data-attr contexts
  // from parentVariants still produce CSS prefixes as before.
  const combinedPrefix = React.useMemo(() => {
    if (contexts.length === 0) return "default"
    const cssPrefixes = contexts
      .filter((c) => !c.startsWith("variant:"))
      .map(getCssPrefix)
      .filter((p) => p !== "default")
    if (cssPrefixes.length === 0) return "default"
    return cssPrefixes.join(":")
  }, [contexts])

  const [state, setState] = React.useState<ControlState>(() =>
    classesToControlState(selectedElement?.currentClasses ?? [], "default"),
  )

  // Original classes that the editor does not manage
  const originalClasses = React.useRef<string[]>([])

  // Track whether state changes are from user interaction
  const isUserChange = React.useRef(false)

  // Sync state when selected element or context changes
  React.useEffect(() => {
    isUserChange.current = false
    const classes = selectedElement?.currentClasses ?? []
    originalClasses.current = classes
    setState(classesToControlState(classes, combinedPrefix))

    // baseDisplay is now a prop from the parent — no need to compute here
  }, [selectedElement, combinedPrefix])

  // Emit class changes only when user interacts with controls
  React.useEffect(() => {
    if (!isUserChange.current) return
    onClassChange(mergeClasses(originalClasses.current, state, combinedPrefix, selectedElement?.tagName))
  }, [state, combinedPrefix, onClassChange])

  const FLEX_KEYS: (keyof ControlState)[] = [
    "direction", "flexWrap", "alignContent",
    "flexShorthand", "flexGrow", "flexShrink", "flexBasis",
  ]
  const GRID_KEYS: (keyof ControlState)[] = [
    "gridCols", "gridRows", "gridFlow", "autoRows", "autoCols",
    "justifyItems", "colSpan", "rowSpan", "colStart", "colEnd", "rowStart", "rowEnd",
  ]

  const update = React.useCallback(
    <K extends keyof ControlState>(key: K, value: ControlState[K]) => {
      isUserChange.current = true
      setState((prev) => {
        const next = { ...prev, [key]: value }

        // When switching display mode, clear conflicting properties
        if (key === "display") {
          const isSwitchingToGrid = value === "grid" || value === "inline-grid"
          const isSwitchingToFlex = value === "flex" || value === "inline-flex"
          const wasGrid = prev.display === "grid" || prev.display === "inline-grid"
          const wasFlex = prev.display === "flex" || prev.display === "inline-flex"

          if (isSwitchingToGrid && wasFlex) {
            for (const k of FLEX_KEYS) next[k] = ""
          }
          if (isSwitchingToFlex && wasGrid) {
            for (const k of GRID_KEYS) next[k] = ""
          }
          // Switching to block/inline/hidden — clear both
          if (!isSwitchingToGrid && !isSwitchingToFlex) {
            if (wasFlex) for (const k of FLEX_KEYS) next[k] = ""
            if (wasGrid) for (const k of GRID_KEYS) next[k] = ""
          }
        }

        return next
      })
    },
    [],
  )

  // Section key groups for hasValues / clear
  const SECTION_KEYS: Record<string, (keyof ControlState)[]> = React.useMemo(() => ({
    layout: [
      "container", "containerName",
      "display", "direction", "justify", "align", "gap", "gapX", "gapY",
      "flexWrap", "alignContent", "gridCols", "gridRows", "gridFlow", "autoRows", "autoCols",
      "justifyItems",
      "position", "overflow", "zIndex", "inset", "insetX", "insetY", "top", "right", "bottom", "left",
      "visibility", "aspectRatio", "float", "clear", "isolation", "objectFit", "objectPosition",
    ],
    childPlacement: [
      "justifySelf", "alignSelf", "order",
      "flexShorthand", "flexGrow", "flexShrink", "flexBasis",
      "colSpan", "rowSpan", "colStart", "colEnd", "rowStart", "rowEnd",
    ],
    size: [
      "width", "height", "size", "minWidth", "maxWidth", "minHeight", "maxHeight",
    ],
    spacing: [
      "padding", "paddingX", "paddingY", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "margin", "marginX", "marginY", "marginTop", "marginRight", "marginBottom", "marginLeft",
      "spaceY", "spaceX", "spaceXReverse", "spaceYReverse",
    ],
    typography: [
      "fontSize", "fontWeight", "fontFamily", "fontStyle", "textAlign",
      "textDecoration", "textDecorationStyle", "textDecorationThickness", "textUnderlineOffset",
      "textTransform", "textOverflow", "textWrap", "textIndent",
      "lineHeight", "letterSpacing", "wordBreak", "whitespace", "hyphens", "lineClamp",
      "verticalAlign", "listStyleType", "listStylePosition", "fontVariantNumeric",
    ],
    colours: [
      "textColor", "bgColor", "borderColor", "ringColor", "ringOffsetColor", "outlineColor",
      "gradientDirection", "gradientFrom", "gradientVia", "gradientTo",
    ],
    borders: [
      "borderRadius", "borderRadiusTL", "borderRadiusTR", "borderRadiusBR", "borderRadiusBL",
      "borderWidth", "borderWidthT", "borderWidthR", "borderWidthB", "borderWidthL", "borderStyle",
      "ringWidth", "ringOffsetWidth", "outlineWidth", "outlineStyle", "outlineOffset",
      "divideX", "divideY", "divideStyle", "divideReverse",
    ],
    effects: ["shadow", "shadowColor", "textShadow", "opacity", "mixBlend", "bgBlend", "maskClip", "maskComposite", "maskImage", "maskMode", "maskOrigin", "maskPosition", "maskRepeat", "maskSize", "maskType"],
    filters: [
      "blur", "brightness", "contrast", "grayscale", "hueRotate", "invert", "saturate", "sepia", "dropShadow",
      "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale",
      "backdropHueRotate", "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia",
    ],
    motion: [
      "transitionProperty", "transitionBehavior", "transitionDuration", "transitionTiming", "transitionDelay", "animation",
      "scale", "scaleX", "scaleY", "rotate", "rotateX", "rotateY", "translateX", "translateY", "skewX", "skewY", "transformOrigin",
    ],
  }), [])

  const sectionHasValues = React.useCallback(
    (section: string) => SECTION_KEYS[section]?.some((k) => !!state[k]) ?? false,
    [state, SECTION_KEYS],
  )

  const clearSection = React.useCallback(
    (section: string) => {
      isUserChange.current = true
      setState((prev) => {
        const next = { ...prev }
        for (const k of SECTION_KEYS[section] ?? []) {
          next[k] = ""
        }
        return next
      })
    },
    [SECTION_KEYS],
  )

  // baseDisplay is passed as a prop from the parent, computed from the full
  // unprefixed class list. This avoids stale/corrupted values from re-renders.

  if (!selectedElement) return null

  const nativeDisplay = getNativeDisplay(selectedElement.tagName)
  const effectiveDisplay = state.display || baseDisplay || nativeDisplay
  const isFlex = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex"
  const isGrid = effectiveDisplay === "grid" || effectiveDisplay === "inline-grid"

  // Derive parent's effective display for child placement controls
  const parentEffectiveDisplay = (() => {
    if (!parentClasses) return undefined
    const parentNative = parentTag ? getNativeDisplay(parentTag) : "block"
    const plainMatch = parentClasses.find((c) => DISPLAY_OPTIONS.includes(c))
    if (plainMatch) return plainMatch
    for (const cls of parentClasses) {
      const lastColon = cls.lastIndexOf(":")
      if (lastColon !== -1) {
        const unprefixed = cls.slice(lastColon + 1)
        if (DISPLAY_OPTIONS.includes(unprefixed)) return unprefixed
      }
    }
    return parentNative
  })()
  const parentIsFlex = parentEffectiveDisplay === "flex" || parentEffectiveDisplay === "inline-flex"
  const parentIsGrid = parentEffectiveDisplay === "grid" || parentEffectiveDisplay === "inline-grid"

  return (
    <div className="flex h-full w-full min-w-96 flex-col overflow-hidden">
      {/* ── Header with context selector ────────────────── */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {"<"}
            {selectedElement.tagName}
            {">"}
            {selectedElement.textContent && (
              <span className="ml-1 font-normal text-muted-foreground">
                {selectedElement.textContent.slice(0, 15)}
              </span>
            )}
          </p>
        </div>
        <ContextPicker contexts={contexts} onContextsChange={setContexts} variants={variants} props={props} parentVariants={parentVariants} subComponentNames={subComponentNames} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onDeselect}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <TooltipProvider delayDuration={200}>
        <div className="space-y-1">

          <ChildPlacementSection
            state={state}
            update={update}
            sectionHasValues={sectionHasValues}
            clearSection={clearSection}
            parentIsFlex={parentIsFlex}
            parentIsGrid={parentIsGrid}
            parentEffectiveDisplay={parentEffectiveDisplay}
          />

          <LayoutSection
            state={state}
            update={update}
            sectionHasValues={sectionHasValues}
            clearSection={clearSection}
            effectiveDisplay={effectiveDisplay}
            isFlex={isFlex}
            isGrid={isGrid}
            selectedElementTagName={selectedElement.tagName}
            selectedElementDataSlot={selectedElement.domElement?.dataset?.slot ?? undefined}
            isUserChange={isUserChange}
            setState={setState}
          />

          {/* ── Remaining sections hidden when display is hidden/contents ── */}
          {effectiveDisplay !== "hidden" && effectiveDisplay !== "contents" && (
          <>
            <SizeSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
              effectiveDisplay={effectiveDisplay}
            />

            <SpacingSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
              effectiveDisplay={effectiveDisplay}
              isFlex={isFlex}
            />

            <TypographySection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
            />

            <ColoursSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
            />

            <BordersSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
            />

            <EffectsSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
            />

            <FiltersSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
            />

            <MotionSection
              state={state}
              update={update}
              sectionHasValues={sectionHasValues}
              clearSection={clearSection}
              isUserChange={isUserChange}
              setState={setState}
            />
          </>
          )}

          {/* ── Raw class input for unsupported modifiers ──── */}
          <RawClassInput
            originalClasses={originalClasses}
            state={state}
            combinedPrefix={combinedPrefix}
            selectedElementTagName={selectedElement.tagName}
            onClassChange={onClassChange}
            isUserChange={isUserChange}
          />
        </div>
        </TooltipProvider>
      </ScrollArea>

    </div>
  )
}
