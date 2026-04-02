"use client"

import * as React from "react"
import {
  Layout,
  Type,
  Palette,
  Square,
  Sparkles,
  Box,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignCenterVertical,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Minus,
  X,
  Columns3,
  LayoutGrid,
  EyeOff,
  PanelTop,
  WrapText,
  Maximize2,
  Move,
  SlidersHorizontal,
  Layers,
  Crosshair,
  Pin,
  Anchor,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  StretchHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ElementInfo } from "@/components/playground/element-selector"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"

import { getNativeDisplay, DISPLAY_OPTIONS, INSET_SCALE, OVERFLOW_OPTIONS, VISIBILITY_OPTIONS, ASPECT_RATIO_OPTIONS, FLOAT_OPTIONS, CLEAR_OPTIONS, OBJECT_FIT_OPTIONS, ALIGN_CONTENT_OPTIONS, AUTO_ROWS_OPTIONS, AUTO_COLS_OPTIONS, JUSTIFY_ITEMS_OPTIONS, JUSTIFY_SELF_OPTIONS, ALIGN_SELF_OPTIONS, ORDER_OPTIONS, FLEX_BASIS_OPTIONS, FONT_SIZE_OPTIONS, FONT_WEIGHT_OPTIONS, FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, TEXT_DECORATION_OPTIONS, TEXT_DECORATION_STYLE_OPTIONS, TEXT_DECORATION_THICKNESS_OPTIONS, TEXT_UNDERLINE_OFFSET_OPTIONS, TEXT_TRANSFORM_OPTIONS, TEXT_OVERFLOW_OPTIONS, TEXT_WRAP_OPTIONS, TEXT_INDENT_OPTIONS, LINE_HEIGHT_OPTIONS, LETTER_SPACING_OPTIONS, WORD_BREAK_OPTIONS, WHITESPACE_OPTIONS, HYPHENS_OPTIONS, LINE_CLAMP_OPTIONS, VERTICAL_ALIGN_OPTIONS, LIST_STYLE_TYPE_OPTIONS, LIST_STYLE_POSITION_OPTIONS, FONT_VARIANT_NUMERIC_OPTIONS, SHADCN_TEXT_TOKENS, SHADCN_BG_TOKENS, SHADCN_BORDER_TOKENS, SHADCN_RING_TOKENS, RADIUS_VALUES, BORDER_WIDTH_OPTIONS, BORDER_WIDTH_T_OPTIONS, BORDER_WIDTH_R_OPTIONS, BORDER_WIDTH_B_OPTIONS, BORDER_WIDTH_L_OPTIONS, BORDER_STYLE_OPTIONS, BORDER_RADIUS_TL_OPTIONS, BORDER_RADIUS_TR_OPTIONS, BORDER_RADIUS_BR_OPTIONS, BORDER_RADIUS_BL_OPTIONS, RING_WIDTH_OPTIONS, RING_OFFSET_WIDTH_OPTIONS, OUTLINE_WIDTH_OPTIONS, OUTLINE_STYLE_OPTIONS, OUTLINE_OFFSET_OPTIONS, DIVIDE_X_OPTIONS, DIVIDE_Y_OPTIONS, DIVIDE_STYLE_OPTIONS, DIVIDE_REVERSE_OPTIONS, SHADOW_OPTIONS, TEXT_SHADOW_OPTIONS, MIX_BLEND_OPTIONS, BG_BLEND_OPTIONS, MASK_CLIP_OPTIONS, MASK_COMPOSITE_OPTIONS, MASK_IMAGE_OPTIONS, MASK_MODE_OPTIONS, MASK_ORIGIN_OPTIONS, MASK_POSITION_GRID, MASK_REPEAT_OPTIONS, MASK_SIZE_OPTIONS, MASK_TYPE_OPTIONS, BLUR_OPTIONS, BRIGHTNESS_OPTIONS, CONTRAST_OPTIONS, GRAYSCALE_OPTIONS, HUE_ROTATE_OPTIONS, INVERT_OPTIONS, SATURATE_OPTIONS, SEPIA_OPTIONS, DROP_SHADOW_OPTIONS, BACKDROP_BLUR_OPTIONS, BACKDROP_BRIGHTNESS_OPTIONS, BACKDROP_CONTRAST_OPTIONS, BACKDROP_GRAYSCALE_OPTIONS, BACKDROP_HUE_ROTATE_OPTIONS, BACKDROP_INVERT_OPTIONS, BACKDROP_OPACITY_OPTIONS, BACKDROP_SATURATE_OPTIONS, BACKDROP_SEPIA_OPTIONS, TRANSITION_PROPERTY_OPTIONS, TRANSITION_BEHAVIOR_OPTIONS, TRANSITION_DURATION_OPTIONS, TRANSITION_TIMING_OPTIONS, TRANSITION_DELAY_OPTIONS, ANIMATION_OPTIONS, SCALE_OPTIONS, SCALE_X_OPTIONS, SCALE_Y_OPTIONS, ROTATE_OPTIONS, TRANSLATE_X_OPTIONS, TRANSLATE_Y_OPTIONS, SKEW_X_OPTIONS, SKEW_Y_OPTIONS, TRANSFORM_ORIGIN_OPTIONS, WIDTH_OPTIONS, HEIGHT_OPTIONS, MIN_WIDTH_OPTIONS, MAX_WIDTH_OPTIONS, MIN_HEIGHT_OPTIONS, MAX_HEIGHT_OPTIONS, SIZE_OPTIONS, SPACING_SCALE_FULL } from "@/lib/tailwind-options"
import type { StyleContext } from "@/lib/style-context"
import { getCssPrefix } from "@/lib/style-context"
import type { ControlState } from "@/lib/style-state"
import { classesToControlState, controlStateToClasses, mergeClasses } from "@/lib/style-state"

import { IconToggle, TextToggle, PositionGrid, ObjectPositionGrid, SpacingValueInput, BoxModelControl, ColorPicker, ZIndexInput, GridNumberPicker, GapControl, ContentDistributionPicker, TransformOriginGrid, SteppedSlider, ScaleControl, TranslateControl, SkewControl, RotateControl, SpatialGrid } from "@/components/playground/style-controls"
import { ContextPicker } from "@/components/playground/context-picker"
import { AppliedClassesSection } from "@/components/playground/applied-classes"
import { EditPanelRow } from "@/components/playground/edit-panel-row"
import {
  EditPanelSection,
  EditSection,
  EditSectionContent,
  EditSubSectionWrapper,
  EditSubSection,
  EditSubSectionTitle,
  EditSubSectionContent,
  EditNestedGroup,
} from "@/components/playground/edit-panel-section"

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
}: VisualEditorProps) {
  const [contexts, setContexts] = React.useState<string[]>([])

  // Compute the combined CSS prefix from selected contexts
  const combinedPrefix = React.useMemo(() => {
    if (contexts.length === 0) return "default"
    // Filter out variant contexts (they don't produce CSS prefixes)
    const cssPrefixes = contexts
      .map(getCssPrefix)
      .filter((p) => p !== "default")
    if (cssPrefixes.length === 0) return "default"
    return cssPrefixes.join(":")
  }, [contexts])

  const [state, setState] = React.useState<ControlState>(() =>
    classesToControlState(selectedElement?.currentClasses ?? [], "default"),
  )
  const [showPaddingSides, setShowPaddingSides] = React.useState(false)
  const [showMarginSides, setShowMarginSides] = React.useState(false)

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
    setShowPaddingSides(false)
    setShowMarginSides(false)
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

  const toggleValue = React.useCallback(
    <K extends keyof ControlState>(
      key: K,
      value: string,
    ) => {
      isUserChange.current = true
      setState((prev) => ({
        ...prev,
        [key]: prev[key] === value ? "" : value,
      }))
    },
    [],
  )

  // Section key groups for hasValues / clear
  const SECTION_KEYS: Record<string, (keyof ControlState)[]> = React.useMemo(() => ({
    layout: [
      "display", "direction", "justify", "align", "gap", "gapX", "gapY",
      "flexWrap", "alignContent", "gridCols", "gridRows", "gridFlow", "autoRows", "autoCols",
      "justifyItems",
      "position", "overflow", "zIndex", "inset", "insetX", "insetY", "top", "right", "bottom", "left",
      "visibility", "aspectRatio", "float", "clear", "isolation", "objectFit", "objectPosition",
      "spaceY", "spaceX", "spaceXReverse", "spaceYReverse",
      "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "size",
    ],
    childPlacement: [
      "justifySelf", "alignSelf", "order",
      "flexShorthand", "flexGrow", "flexShrink", "flexBasis",
      "colSpan", "rowSpan", "colStart", "colEnd", "rowStart", "rowEnd",
    ],
    spacing: [
      "padding", "paddingX", "paddingY", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "margin", "marginX", "marginY", "marginTop", "marginRight", "marginBottom", "marginLeft",
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
      "opacity", "gradientDirection", "gradientFrom", "gradientVia", "gradientTo",
    ],
    borders: [
      "borderRadius", "borderRadiusTL", "borderRadiusTR", "borderRadiusBR", "borderRadiusBL",
      "borderWidth", "borderWidthT", "borderWidthR", "borderWidthB", "borderWidthL", "borderStyle",
      "ringWidth", "ringOffsetWidth", "outlineWidth", "outlineStyle", "outlineOffset",
      "divideX", "divideY", "divideStyle", "divideReverse",
    ],
    effects: ["shadow", "shadowColor", "textShadow", "mixBlend", "bgBlend", "maskClip", "maskComposite", "maskImage", "maskMode", "maskOrigin", "maskPosition", "maskRepeat", "maskSize", "maskType"],
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

  if (!selectedElement) return null

  const nativeDisplay = getNativeDisplay(selectedElement.tagName)
  const effectiveDisplay = state.display || nativeDisplay
  const isFlex = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex"
  const isGrid = effectiveDisplay === "grid" || effectiveDisplay === "inline-grid"

  // Derive parent's effective display for child placement controls
  const parentEffectiveDisplay = React.useMemo(() => {
    if (!parentClasses) return undefined
    const parentNative = parentTag ? getNativeDisplay(parentTag) : "block"
    // Check plain classes first, then try stripping any prefix (variant/responsive/state)
    const plainMatch = parentClasses.find((c) => DISPLAY_OPTIONS.includes(c))
    if (plainMatch) return plainMatch
    // Also check for display classes that might be after a prefix like "data-[size=default]:flex"
    for (const cls of parentClasses) {
      const lastColon = cls.lastIndexOf(":")
      if (lastColon !== -1) {
        const unprefixed = cls.slice(lastColon + 1)
        if (DISPLAY_OPTIONS.includes(unprefixed)) return unprefixed
      }
    }
    return parentNative
  }, [parentClasses, parentTag])
  const parentIsFlex = parentEffectiveDisplay === "flex" || parentEffectiveDisplay === "inline-flex"
  const parentIsGrid = parentEffectiveDisplay === "grid" || parentEffectiveDisplay === "inline-grid"

  const allClasses = mergeClasses(originalClasses.current, state)

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
          {/* ── Child Placement (first when parent is flex/grid) ── */}
          {(parentIsFlex || parentIsGrid) && (
          <EditPanelSection
            icon={AlignCenterVertical}
            title={`Child — ${parentEffectiveDisplay}`}
            defaultOpen
            hasValues={sectionHasValues("childPlacement")}
            onClear={() => clearSection("childPlacement")}
          >
            <EditPanelRow label="Align self">
              <div className="flex flex-wrap gap-0.5">
                {ALIGN_SELF_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("self-", "")} tooltip={opt} isActive={state.alignSelf === opt} onClick={(v) => update("alignSelf", state.alignSelf === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Justify self">
              <div className="flex flex-wrap gap-0.5">
                {JUSTIFY_SELF_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("justify-self-", "")} tooltip={opt} isActive={state.justifySelf === opt} onClick={(v) => update("justifySelf", state.justifySelf === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Order">
              <Select value={state.order || "__none__"} onValueChange={(v) => update("order", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {ORDER_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">{v.replace("order-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            {parentIsFlex && (
              <>
                <EditPanelRow label="Flex">
                  <div className="flex flex-wrap gap-0.5">
                    <TextToggle value="" label="–" tooltip="default" isActive={!state.flexShorthand} onClick={() => update("flexShorthand", "")} />
                    <TextToggle value="flex-1" label="1" tooltip="flex-1" isActive={state.flexShorthand === "flex-1"} onClick={(v) => update("flexShorthand", v)} />
                    <TextToggle value="flex-auto" label="auto" tooltip="flex-auto" isActive={state.flexShorthand === "flex-auto"} onClick={(v) => update("flexShorthand", v)} />
                    <TextToggle value="flex-initial" label="initial" tooltip="flex-initial" isActive={state.flexShorthand === "flex-initial"} onClick={(v) => update("flexShorthand", v)} />
                    <TextToggle value="flex-none" label="none" tooltip="flex-none" isActive={state.flexShorthand === "flex-none"} onClick={(v) => update("flexShorthand", v)} />
                  </div>
                </EditPanelRow>

                <EditPanelRow label="Grow">
                  <div className="flex flex-wrap gap-0.5">
                    <TextToggle value="" label="–" tooltip="default" isActive={!state.flexGrow} onClick={() => update("flexGrow", "")} />
                    <IconToggle value="grow" icon={Maximize2} tooltip="grow" isActive={state.flexGrow === "grow"} onClick={(v) => update("flexGrow", v)} />
                    <TextToggle value="grow-0" label="0" tooltip="grow-0" isActive={state.flexGrow === "grow-0"} onClick={(v) => update("flexGrow", v)} />
                  </div>
                </EditPanelRow>

                <EditPanelRow label="Shrink">
                  <div className="flex flex-wrap gap-0.5">
                    <TextToggle value="" label="–" tooltip="default" isActive={!state.flexShrink} onClick={() => update("flexShrink", "")} />
                    <TextToggle value="shrink" label="shrink" tooltip="shrink" isActive={state.flexShrink === "shrink"} onClick={(v) => update("flexShrink", v)} />
                    <TextToggle value="shrink-0" label="0" tooltip="shrink-0" isActive={state.flexShrink === "shrink-0"} onClick={(v) => update("flexShrink", v)} />
                  </div>
                </EditPanelRow>

                <EditPanelRow label="Basis">
                  <Select value={state.flexBasis || "__none__"} onValueChange={(v) => update("flexBasis", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {FLEX_BASIS_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v} className="text-xs">{v.replace("basis-", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </EditPanelRow>
              </>
            )}

            {parentIsGrid && (
              <>
                <EditPanelRow label="Col span">
                  <GridNumberPicker value={state.colSpan} prefix="col-span" max={12} extras={[{ value: "col-span-full", label: "full" }]} onChange={(v) => update("colSpan", v)} />
                </EditPanelRow>
                <EditPanelRow label="Row span">
                  <GridNumberPicker value={state.rowSpan} prefix="row-span" max={12} extras={[{ value: "row-span-full", label: "full" }]} onChange={(v) => update("rowSpan", v)} />
                </EditPanelRow>
                <EditPanelRow label="Col start">
                  <GridNumberPicker value={state.colStart} prefix="col-start" max={13} extras={[{ value: "col-start-auto", label: "auto" }]} onChange={(v) => update("colStart", v)} />
                </EditPanelRow>
                <EditPanelRow label="Col end">
                  <GridNumberPicker value={state.colEnd} prefix="col-end" max={13} extras={[{ value: "col-end-auto", label: "auto" }]} onChange={(v) => update("colEnd", v)} />
                </EditPanelRow>
                <EditPanelRow label="Row start">
                  <GridNumberPicker value={state.rowStart} prefix="row-start" max={7} extras={[{ value: "row-start-auto", label: "auto" }]} onChange={(v) => update("rowStart", v)} />
                </EditPanelRow>
                <EditPanelRow label="Row end">
                  <GridNumberPicker value={state.rowEnd} prefix="row-end" max={7} extras={[{ value: "row-end-auto", label: "auto" }]} onChange={(v) => update("rowEnd", v)} />
                </EditPanelRow>
              </>
            )}
          </EditPanelSection>
          )}

          {/* ── Layout ────────────────────────────────────── */}
          <EditSection icon={Layout} title="Layout" defaultOpen hasValues={sectionHasValues("layout")} onClear={() => clearSection("layout")}>

            {/* ── Display ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Display</EditSubSectionTitle>
                <EditSubSectionContent>
                  <div className="flex flex-wrap gap-0.5">
                    {(() => {
                      const nativeDisp = getNativeDisplay(selectedElement.tagName)
                      const effectiveDisplay = state.display || nativeDisp
                      return (
                        <>
                          <IconToggle value="block" icon={PanelTop} tooltip="block" isActive={effectiveDisplay === "block"} isDefault={effectiveDisplay === "block" && !state.display} onClick={() => update("display", nativeDisp === "block" ? "" : "block")} />
                          <IconToggle value="inline-block" icon={Box} tooltip="inline-block" isActive={effectiveDisplay === "inline-block"} isDefault={effectiveDisplay === "inline-block" && !state.display} onClick={() => update("display", nativeDisp === "inline-block" ? "" : "inline-block")} />
                          <IconToggle value="inline" icon={Minus} tooltip="inline" isActive={effectiveDisplay === "inline"} isDefault={effectiveDisplay === "inline" && !state.display} onClick={() => update("display", nativeDisp === "inline" ? "" : "inline")} />
                          <IconToggle value="flex" icon={Columns3} tooltip="flex" isActive={effectiveDisplay === "flex"} onClick={() => update("display", nativeDisp === "flex" ? "" : "flex")} />
                          <IconToggle value="inline-flex" icon={Columns3} tooltip="inline-flex" isActive={effectiveDisplay === "inline-flex"} onClick={() => update("display", nativeDisp === "inline-flex" ? "" : "inline-flex")} />
                          <IconToggle value="grid" icon={LayoutGrid} tooltip="grid" isActive={effectiveDisplay === "grid"} onClick={() => update("display", nativeDisp === "grid" ? "" : "grid")} />
                          <IconToggle value="inline-grid" icon={LayoutGrid} tooltip="inline-grid" isActive={effectiveDisplay === "inline-grid"} onClick={() => update("display", nativeDisp === "inline-grid" ? "" : "inline-grid")} />
                          <IconToggle value="contents" icon={Box} tooltip="contents" isActive={effectiveDisplay === "contents"} onClick={() => update("display", nativeDisp === "contents" ? "" : "contents")} />
                          <IconToggle value="hidden" icon={EyeOff} tooltip="hidden" isActive={effectiveDisplay === "hidden"} onClick={() => update("display", nativeDisp === "hidden" ? "" : "hidden")} />
                        </>
                      )
                    })()}
                  </div>

                  {/* Flex: direction + wrap nested under Display */}
                  {isFlex && (
                    <EditNestedGroup>
                      <EditPanelRow label="Direction" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          <IconToggle value="flex-row" icon={ArrowRight} tooltip="flex-row (default)" isActive={state.direction === "flex-row" || !state.direction} isDefault={!state.direction} onClick={() => update("direction", "")} />
                          <IconToggle value="flex-col" icon={ArrowDown} tooltip="flex-col" isActive={state.direction === "flex-col"} onClick={(v) => update("direction", v)} />
                          <IconToggle value="flex-row-reverse" icon={ArrowLeft} tooltip="flex-row-reverse" isActive={state.direction === "flex-row-reverse"} onClick={(v) => update("direction", v)} />
                          <IconToggle value="flex-col-reverse" icon={ArrowUp} tooltip="flex-col-reverse" isActive={state.direction === "flex-col-reverse"} onClick={(v) => update("direction", v)} />
                        </div>
                      </EditPanelRow>
                      <EditPanelRow label="Wrap" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          <IconToggle value="flex-nowrap" icon={X} tooltip="flex-nowrap (default)" isActive={!state.flexWrap || state.flexWrap === "flex-nowrap"} isDefault={!state.flexWrap} onClick={() => update("flexWrap", "")} />
                          <IconToggle value="flex-wrap" icon={WrapText} tooltip="flex-wrap" isActive={state.flexWrap === "flex-wrap"} onClick={(v) => update("flexWrap", v)} />
                          <TextToggle value="flex-wrap-reverse" label="reverse" tooltip="flex-wrap-reverse" isActive={state.flexWrap === "flex-wrap-reverse"} onClick={(v) => update("flexWrap", v)} />
                        </div>

                        {/* Align content — only when wrapping, sits with wrap since it's related */}
                        {(state.flexWrap === "flex-wrap" || state.flexWrap === "flex-wrap-reverse") && (
                          <EditPanelRow label="Row distribution" variant="nested">
                            <ContentDistributionPicker
                              prefix="content"
                              value={state.alignContent}
                              onChange={(v) => update("alignContent", v)}
                              axis={state.direction === "flex-col" || state.direction === "flex-col-reverse" ? "horizontal" : "vertical"}
                            />
                          </EditPanelRow>
                        )}
                      </EditPanelRow>

                      <EditPanelRow label="Alignment" variant="nested">
                        <PositionGrid justify={state.justify} align={state.align} display={effectiveDisplay} direction={state.direction}
                          onJustifyChange={(v) => update("justify", v)} onAlignChange={(v) => update("align", v)} />
                      </EditPanelRow>

                      <GapControl
                        gap={state.gap} gapX={state.gapX} gapY={state.gapY}
                        onGapChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gap: v, gapX: "", gapY: "" })) }}
                        onGapXChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gapX: v, gap: "" })) }}
                        onGapYChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gapY: v, gap: "" })) }}
                      />
                    </EditNestedGroup>
                  )}

                  {/* Grid: columns, rows, flow, auto, justify items, align content nested under Display */}
                  {isGrid && (
                    <EditNestedGroup>
                      <EditPanelRow label="Columns" variant="nested">
                        <GridNumberPicker value={state.gridCols} prefix="grid-cols" max={12} allowCustom
                          extras={[{ value: "grid-cols-none", label: "auto" }, { value: "grid-cols-subgrid", label: "subgrid" }]}
                          onChange={(v) => update("gridCols", v)} />
                      </EditPanelRow>
                      <EditPanelRow label="Rows" variant="nested">
                        <GridNumberPicker value={state.gridRows} prefix="grid-rows" max={12} allowCustom
                          extras={[{ value: "grid-rows-none", label: "auto" }, { value: "grid-rows-subgrid", label: "subgrid" }]}
                          onChange={(v) => update("gridRows", v)} />
                      </EditPanelRow>
                      <EditPanelRow label="Flow" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          <TextToggle value="grid-flow-row" label="row" tooltip="grid-flow-row (default)" isActive={!state.gridFlow || state.gridFlow === "grid-flow-row"} isDefault={!state.gridFlow} onClick={() => update("gridFlow", "")} />
                          <TextToggle value="grid-flow-col" label="col" tooltip="grid-flow-col" isActive={state.gridFlow === "grid-flow-col"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-dense" label="dense" tooltip="grid-flow-dense" isActive={state.gridFlow === "grid-flow-dense"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-row-dense" label="row+dense" tooltip="grid-flow-row-dense" isActive={state.gridFlow === "grid-flow-row-dense"} onClick={(v) => update("gridFlow", v)} />
                          <TextToggle value="grid-flow-col-dense" label="col+dense" tooltip="grid-flow-col-dense" isActive={state.gridFlow === "grid-flow-col-dense"} onClick={(v) => update("gridFlow", v)} />
                        </div>
                      </EditPanelRow>
                      <EditPanelRow label="Auto rows" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          {AUTO_ROWS_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("auto-rows-", "")} tooltip={opt} isActive={state.autoRows === opt} onClick={(v) => update("autoRows", state.autoRows === v ? "" : v)} />
                          ))}
                        </div>
                      </EditPanelRow>
                      <EditPanelRow label="Auto cols" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          {AUTO_COLS_OPTIONS.map((opt) => (
                            <TextToggle key={opt} value={opt} label={opt.replace("auto-cols-", "")} tooltip={opt} isActive={state.autoCols === opt} onClick={(v) => update("autoCols", state.autoCols === v ? "" : v)} />
                          ))}
                        </div>
                      </EditPanelRow>
                      <EditPanelRow label="Justify items" variant="nested">
                        <div className="flex flex-wrap gap-0.5">
                          <IconToggle value="justify-items-start" icon={AlignHorizontalJustifyStart} tooltip="justify-items-start" isActive={state.justifyItems === "justify-items-start"} onClick={() => update("justifyItems", state.justifyItems === "justify-items-start" ? "" : "justify-items-start")} />
                          <IconToggle value="justify-items-center" icon={AlignHorizontalJustifyCenter} tooltip="justify-items-center" isActive={state.justifyItems === "justify-items-center"} onClick={() => update("justifyItems", state.justifyItems === "justify-items-center" ? "" : "justify-items-center")} />
                          <IconToggle value="justify-items-end" icon={AlignHorizontalJustifyEnd} tooltip="justify-items-end" isActive={state.justifyItems === "justify-items-end"} onClick={() => update("justifyItems", state.justifyItems === "justify-items-end" ? "" : "justify-items-end")} />
                          <IconToggle value="justify-items-stretch" icon={StretchHorizontal} tooltip="justify-items-stretch" isActive={state.justifyItems === "justify-items-stretch"} onClick={() => update("justifyItems", state.justifyItems === "justify-items-stretch" ? "" : "justify-items-stretch")} />
                        </div>
                      </EditPanelRow>
                      <EditPanelRow label="Align content" variant="nested">
                        <ContentDistributionPicker
                          prefix="content"
                          value={state.alignContent}
                          onChange={(v) => update("alignContent", v)}
                        />
                      </EditPanelRow>
                    </EditNestedGroup>
                  )}
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Controls below are conditional on display type ── */}
            {(() => {
              const isHidden = effectiveDisplay === "hidden"
              const isContents = effectiveDisplay === "contents"
              const isInline = effectiveDisplay === "inline"
              const isBlock = effectiveDisplay === "block" || effectiveDisplay === "inline-block"
              const showPosition = !isHidden && !isContents
              const showOverflow = !isHidden && !isContents && !isInline
              const isPositioned = !!(state.position && state.position !== "static")

              return (
                <>
                  {/* ── Position ── */}
                  {showPosition && (
                    <EditSubSectionWrapper>
                      <EditSubSection>
                        <EditSubSectionTitle>Position</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <div className="flex flex-wrap gap-0.5">
                            <IconToggle value="static" icon={Square} tooltip="static (default)" isActive={!state.position || state.position === "static"} isDefault={!state.position} onClick={() => update("position", "")} />
                            <IconToggle value="relative" icon={Layers} tooltip="relative" isActive={state.position === "relative"} onClick={() => update("position", state.position === "relative" ? "" : "relative")} />
                            <IconToggle value="absolute" icon={Crosshair} tooltip="absolute" isActive={state.position === "absolute"} onClick={() => update("position", state.position === "absolute" ? "" : "absolute")} />
                            <IconToggle value="fixed" icon={Pin} tooltip="fixed" isActive={state.position === "fixed"} onClick={() => update("position", state.position === "fixed" ? "" : "fixed")} />
                            <IconToggle value="sticky" icon={Anchor} tooltip="sticky" isActive={state.position === "sticky"} onClick={() => update("position", state.position === "sticky" ? "" : "sticky")} />
                          </div>

                          {isPositioned && (
                            <>
                              <EditPanelRow label="Z-index" variant="nested">
                                <div className="flex flex-wrap items-center gap-1">
                                  <ZIndexInput value={state.zIndex} onChange={(v) => update("zIndex", v)} />
                                  {[10, 20, 30, 40, 50].map((n) => (
                                    <TextToggle key={n} value={`z-${n}`} label={String(n)} tooltip={`z-${n}`} isActive={state.zIndex === `z-${n}`} onClick={(v) => update("zIndex", state.zIndex === v ? "" : v)} />
                                  ))}
                                  <TextToggle value="z-auto" label="auto" tooltip="z-auto" isActive={state.zIndex === "z-auto"} onClick={(v) => update("zIndex", state.zIndex === v ? "" : v)} />
                                </div>
                              </EditPanelRow>
                              <EditPanelRow label="Inset (all)" variant="nested">
                                <Select value={state.inset ? state.inset.replace("inset-", "") : "__none__"} onValueChange={(v) => update("inset", v === "__none__" ? "" : `inset-${v}`)}>
                                  <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">–</SelectItem>
                                    {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </EditPanelRow>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                                {([
                                  { label: "Top", key: "top" as const, prefix: "top" },
                                  { label: "Right", key: "right" as const, prefix: "right" },
                                  { label: "Bottom", key: "bottom" as const, prefix: "bottom" },
                                  { label: "Left", key: "left" as const, prefix: "left" },
                                ] as const).map(({ label, key, prefix }) => (
                                  <EditPanelRow key={key} label={label} variant="nested">
                                    <Select value={state[key] ? (state[key] as string).replace(`${prefix}-`, "") : "__none__"} onValueChange={(v) => update(key, v === "__none__" ? "" : `${prefix}-${v}`)}>
                                      <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">–</SelectItem>
                                        {INSET_SCALE.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  </EditPanelRow>
                                ))}
                              </div>
                            </>
                          )}
                        </EditSubSectionContent>
                      </EditSubSection>
                    </EditSubSectionWrapper>
                  )}

                  {/* ── Grid: alignment + gap (separate from grid config above) ── */}
                  {isGrid && (
                    <EditSubSectionWrapper>
                      <EditSubSection>
                        <EditSubSectionTitle>Alignment</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <PositionGrid justify={state.justify} align={state.align} display={effectiveDisplay}
                            onJustifyChange={(v) => update("justify", v)} onAlignChange={(v) => update("align", v)} />
                        </EditSubSectionContent>
                      </EditSubSection>

                      <GapControl
                        gap={state.gap} gapX={state.gapX} gapY={state.gapY}
                        onGapChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gap: v, gapX: "", gapY: "" })) }}
                        onGapXChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gapX: v, gap: "" })) }}
                        onGapYChange={(v) => { isUserChange.current = true; setState((prev) => ({ ...prev, gapY: v, gap: "" })) }}
                      />
                    </EditSubSectionWrapper>
                  )}

                  {/* ── Overflow / Visibility / Aspect ── */}
                  {showPosition && (
                    <EditSubSectionWrapper>
                      {showOverflow && (
                        <EditSubSection>
                          <EditSubSectionTitle>Overflow</EditSubSectionTitle>
                          <EditSubSectionContent>
                            <div className="flex flex-wrap gap-0.5">
                              {OVERFLOW_OPTIONS.map((opt) => (
                                <TextToggle key={opt} value={opt} label={opt.replace("overflow-", "")} tooltip={opt} isActive={state.overflow === opt} onClick={(v) => update("overflow", state.overflow === v ? "" : v)} />
                              ))}
                            </div>
                          </EditSubSectionContent>
                        </EditSubSection>
                      )}

                      <EditSubSection>
                        <EditSubSectionTitle>Visibility</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <div className="flex flex-wrap gap-0.5">
                            {VISIBILITY_OPTIONS.map((opt) => (
                              <TextToggle key={opt} value={opt} label={opt} tooltip={opt} isActive={state.visibility === opt} onClick={(v) => update("visibility", state.visibility === v ? "" : v)} />
                            ))}
                          </div>
                        </EditSubSectionContent>
                      </EditSubSection>

                      <EditSubSection>
                        <EditSubSectionTitle>Aspect ratio</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <div className="flex flex-wrap gap-0.5">
                            {ASPECT_RATIO_OPTIONS.map((opt) => (
                              <TextToggle key={opt} value={opt} label={opt.replace("aspect-", "")} tooltip={opt} isActive={state.aspectRatio === opt} onClick={(v) => update("aspectRatio", state.aspectRatio === v ? "" : v)} />
                            ))}
                          </div>
                        </EditSubSectionContent>
                      </EditSubSection>

                      <EditSubSection>
                        <EditSubSectionTitle>Isolation</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <div className="flex flex-wrap items-center gap-2">
                            <Switch
                              checked={state.isolation === "isolate"}
                              onCheckedChange={(checked) => update("isolation", checked ? "isolate" : "")}
                            />
                            <span className="text-xs text-muted-foreground">
                              {state.isolation === "isolate" ? "isolate" : "auto"}
                            </span>
                          </div>
                        </EditSubSectionContent>
                      </EditSubSection>

                      {isBlock && (
                        <>
                          <EditSubSection>
                            <EditSubSectionTitle>Float</EditSubSectionTitle>
                            <EditSubSectionContent>
                              <div className="flex flex-wrap gap-0.5">
                                {FLOAT_OPTIONS.map((opt) => (
                                  <TextToggle key={opt} value={opt} label={opt.replace("float-", "")} tooltip={opt} isActive={state.float === opt} onClick={(v) => update("float", state.float === v ? "" : v)} />
                                ))}
                              </div>
                            </EditSubSectionContent>
                          </EditSubSection>
                          <EditSubSection>
                            <EditSubSectionTitle>Clear</EditSubSectionTitle>
                            <EditSubSectionContent>
                              <div className="flex flex-wrap gap-0.5">
                                {CLEAR_OPTIONS.map((opt) => (
                                  <TextToggle key={opt} value={opt} label={opt.replace("clear-", "")} tooltip={opt} isActive={state.clear === opt} onClick={(v) => update("clear", state.clear === v ? "" : v)} />
                                ))}
                              </div>
                            </EditSubSectionContent>
                          </EditSubSection>
                        </>
                      )}
                    </EditSubSectionWrapper>
                  )}

                  {/* ── Object ── */}
                  {showPosition && (
                    <EditSubSectionWrapper>
                      <EditSubSection>
                        <EditSubSectionTitle>Object fit</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <Select
                            value={state.objectFit || "__none__"}
                            onValueChange={(v) => update("objectFit", v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">–</SelectItem>
                              {OBJECT_FIT_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("object-", "")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </EditSubSectionContent>
                      </EditSubSection>
                      <EditSubSection>
                        <EditSubSectionTitle>Object position</EditSubSectionTitle>
                        <EditSubSectionContent>
                          <ObjectPositionGrid
                            value={state.objectPosition}
                            onChange={(v) => update("objectPosition", v)}
                          />
                        </EditSubSectionContent>
                      </EditSubSection>
                    </EditSubSectionWrapper>
                  )}

                  {/* Child placement moved to its own section below Layout */}
                </>
              )
            })()}
          </EditSection>

          {/* ── Remaining sections hidden when display is hidden/contents ── */}
          {effectiveDisplay !== "hidden" && effectiveDisplay !== "contents" && (
          <>
          {/* ── Spacing ──────────────────────────────────── */}
          <EditPanelSection icon={Box} title="Spacing" hasValues={sectionHasValues("spacing")} onClear={() => clearSection("spacing")}>
            {(() => {
              const isInline = effectiveDisplay === "inline"
              const isBlockDisplay = effectiveDisplay === "block" || effectiveDisplay === "inline-block"
              const acceptsSize = !isInline && effectiveDisplay !== "hidden" && effectiveDisplay !== "contents"
              const isFlexRow = isFlex && (state.direction === "flex-row" || state.direction === "flex-row-reverse" || !state.direction)
              const isFlexCol = isFlex && (state.direction === "flex-col" || state.direction === "flex-col-reverse")

              return (
                <>
                  {/* Padding */}
                  <EditPanelRow label="Padding">
                    <BoxModelControl
                      label="Padding"
                      allPrefix="p"
                      allValue={state.padding}
                      onAllChange={(v) => update("padding", v)}
                      sides={[
                        { prefix: "pt", label: "Top", value: state.paddingTop, onChange: (v) => update("paddingTop", v) },
                        { prefix: "pr", label: "Right", value: state.paddingRight, onChange: (v) => update("paddingRight", v) },
                        { prefix: "pb", label: "Bottom", value: state.paddingBottom, onChange: (v) => update("paddingBottom", v) },
                        { prefix: "pl", label: "Left", value: state.paddingLeft, onChange: (v) => update("paddingLeft", v) },
                      ]}
                      expanded={showPaddingSides}
                      onToggleExpand={() => setShowPaddingSides((v) => !v)}
                    />
                    {/* Padding axes */}
                    <div className="mt-1 flex gap-2 pl-6">
                      <SpacingValueInput prefix="px" value={state.paddingX} onChange={(v) => update("paddingX", v)} />
                      <SpacingValueInput prefix="py" value={state.paddingY} onChange={(v) => update("paddingY", v)} />
                    </div>
                  </EditPanelRow>

                  {/* Margin */}
                  <EditPanelRow label="Margin">
                    <BoxModelControl
                      label="Margin"
                      allPrefix="m"
                      allValue={state.margin}
                      onAllChange={(v) => update("margin", v)}
                      sides={[
                        { prefix: "mt", label: "Top", value: state.marginTop, onChange: (v) => update("marginTop", v) },
                        { prefix: "mr", label: "Right", value: state.marginRight, onChange: (v) => update("marginRight", v) },
                        { prefix: "mb", label: "Bottom", value: state.marginBottom, onChange: (v) => update("marginBottom", v) },
                        { prefix: "ml", label: "Left", value: state.marginLeft, onChange: (v) => update("marginLeft", v) },
                      ]}
                      expanded={showMarginSides}
                      onToggleExpand={() => setShowMarginSides((v) => !v)}
                      allowNegative
                      allowAuto
                    />
                    {/* Margin axes */}
                    <div className="mt-1 flex gap-2 pl-6">
                      <SpacingValueInput prefix="mx" value={state.marginX} onChange={(v) => update("marginX", v)} allowNegative allowAuto />
                      <SpacingValueInput prefix="my" value={state.marginY} onChange={(v) => update("marginY", v)} allowNegative allowAuto />
                    </div>
                  </EditPanelRow>

                  {/* Space between — conditional on display/direction */}
                  {isFlexRow && (
                    <EditPanelRow label="Space-X">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={state.spaceX ? state.spaceX.replace("space-x-", "") : "__none__"} onValueChange={(v) => update("spaceX", v === "__none__" ? "" : `space-x-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <TextToggle value="space-x-reverse" label="rev" tooltip="space-x-reverse" isActive={!!state.spaceXReverse} onClick={() => update("spaceXReverse", state.spaceXReverse ? "" : "space-x-reverse")} />
                      </div>
                    </EditPanelRow>
                  )}
                  {(isBlockDisplay || isFlexCol) && (
                    <EditPanelRow label="Space-Y">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={state.spaceY ? state.spaceY.replace("space-y-", "") : "__none__"} onValueChange={(v) => update("spaceY", v === "__none__" ? "" : `space-y-${v}`)}>
                          <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SPACING_SCALE_FULL.map((v) => (<SelectItem key={v} value={String(v)} className="text-xs">{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <TextToggle value="space-y-reverse" label="rev" tooltip="space-y-reverse" isActive={!!state.spaceYReverse} onClick={() => update("spaceYReverse", state.spaceYReverse ? "" : "space-y-reverse")} />
                      </div>
                    </EditPanelRow>
                  )}

                  {/* Width / Height — not for inline */}
                  {acceptsSize && (
                    <>

                      <EditPanelRow label="Width">
                        <Select value={state.width || "__none__"} onValueChange={(v) => update("width", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>

                      <EditPanelRow label="Height">
                        <Select value={state.height || "__none__"} onValueChange={(v) => update("height", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>

                      <EditPanelRow label="Size">
                        <Select value={state.size || "__none__"} onValueChange={(v) => update("size", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {SIZE_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("size-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>



                      <EditPanelRow label="Min W">
                        <Select value={state.minWidth || "__none__"} onValueChange={(v) => update("minWidth", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MIN_WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("min-w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>

                      <EditPanelRow label="Max W">
                        <Select value={state.maxWidth || "__none__"} onValueChange={(v) => update("maxWidth", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MAX_WIDTH_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("max-w-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>

                      <EditPanelRow label="Min H">
                        <Select value={state.minHeight || "__none__"} onValueChange={(v) => update("minHeight", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MIN_HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("min-h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>

                      <EditPanelRow label="Max H">
                        <Select value={state.maxHeight || "__none__"} onValueChange={(v) => update("maxHeight", v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">–</SelectItem>
                            {MAX_HEIGHT_OPTIONS.map((v) => (<SelectItem key={v} value={v} className="text-xs">{v.replace("max-h-", "")}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </EditPanelRow>
                    </>
                  )}
                </>
              )
            })()}
          </EditPanelSection>

          {/* ── Typography ───────────────────────────────── */}
          <EditPanelSection icon={Type} title="Typography" hasValues={sectionHasValues("typography")} onClear={() => clearSection("typography")}>
            <EditPanelRow label="Family">
              <div className="flex flex-wrap gap-0.5">
                {FONT_FAMILY_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("font-", "")} tooltip={opt} isActive={state.fontFamily === opt} onClick={(v) => update("fontFamily", state.fontFamily === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Size">
              <Select value={state.fontSize || "__none__"} onValueChange={(v) => update("fontSize", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("text-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="Weight">
              <Select value={state.fontWeight || "__none__"} onValueChange={(v) => update("fontWeight", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("font-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="Style">
              <div className="flex flex-wrap gap-0.5">
                {FONT_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt} tooltip={opt} isActive={state.fontStyle === opt} onClick={(v) => update("fontStyle", state.fontStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Align">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle value="text-left" icon={AlignLeft} tooltip="text-left" isActive={state.textAlign === "text-left"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-center" icon={AlignCenter} tooltip="text-center" isActive={state.textAlign === "text-center"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-right" icon={AlignRight} tooltip="text-right" isActive={state.textAlign === "text-right"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                {["text-justify", "text-start", "text-end"].map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textAlign === opt} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Decoration">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_DECORATION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("no-", "none").replace("line-through", "strike")} tooltip={opt} isActive={state.textDecoration === opt} onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            {state.textDecoration && state.textDecoration !== "no-underline" && (
              <>
                <EditPanelRow label="Dec. style">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_STYLE_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationStyle === opt} onClick={(v) => update("textDecorationStyle", state.textDecorationStyle === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
                <EditPanelRow label="Dec. thick">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_THICKNESS_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationThickness === opt} onClick={(v) => update("textDecorationThickness", state.textDecorationThickness === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
                <EditPanelRow label="Underline offset">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_UNDERLINE_OFFSET_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("underline-offset-", "")} tooltip={opt} isActive={state.textUnderlineOffset === opt} onClick={(v) => update("textUnderlineOffset", state.textUnderlineOffset === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
              </>
            )}

            <EditPanelRow label="Transform">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_TRANSFORM_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("normal-case", "none")} tooltip={opt} isActive={state.textTransform === opt} onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Line height">
              <Select value={state.lineHeight || "__none__"} onValueChange={(v) => update("lineHeight", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {LINE_HEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("leading-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="Letter space">
              <div className="flex flex-wrap gap-0.5">
                {LETTER_SPACING_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("tracking-", "")} tooltip={opt} isActive={state.letterSpacing === opt} onClick={(v) => update("letterSpacing", state.letterSpacing === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Overflow">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_OVERFLOW_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textOverflow === opt} onClick={(v) => update("textOverflow", state.textOverflow === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Wrap">
              <div className="flex flex-wrap gap-0.5">
                {TEXT_WRAP_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textWrap === opt} onClick={(v) => update("textWrap", state.textWrap === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Whitespace">
              <Select value={state.whitespace || "__none__"} onValueChange={(v) => update("whitespace", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-28 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {WHITESPACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("whitespace-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="Word break">
              <div className="flex flex-wrap gap-0.5">
                {WORD_BREAK_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("break-", "")} tooltip={opt} isActive={state.wordBreak === opt} onClick={(v) => update("wordBreak", state.wordBreak === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Hyphens">
              <div className="flex flex-wrap gap-0.5">
                {HYPHENS_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("hyphens-", "")} tooltip={opt} isActive={state.hyphens === opt} onClick={(v) => update("hyphens", state.hyphens === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Line clamp">
              <div className="flex flex-wrap gap-0.5">
                {LINE_CLAMP_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("line-clamp-", "")} tooltip={opt} isActive={state.lineClamp === opt} onClick={(v) => update("lineClamp", state.lineClamp === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Indent">
              <Select value={state.textIndent || "__none__"} onValueChange={(v) => update("textIndent", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-20 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {TEXT_INDENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("indent-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="V-align">
              <Select value={state.verticalAlign || "__none__"} onValueChange={(v) => update("verticalAlign", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-24 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {VERTICAL_ALIGN_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("align-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="List type">
              <div className="flex flex-wrap gap-0.5">
                {LIST_STYLE_TYPE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("list-", "")} tooltip={opt} isActive={state.listStyleType === opt} onClick={(v) => update("listStyleType", state.listStyleType === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="List pos">
              <div className="flex flex-wrap gap-0.5">
                {LIST_STYLE_POSITION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("list-", "")} tooltip={opt} isActive={state.listStylePosition === opt} onClick={(v) => update("listStylePosition", state.listStylePosition === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Num variant">
              <Select value={state.fontVariantNumeric || "__none__"} onValueChange={(v) => update("fontVariantNumeric", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 w-32 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_VARIANT_NUMERIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>
          </EditPanelSection>

          {/* ── Colours ──────────────────────────────────── */}
          <EditPanelSection icon={Palette} title="Colours" hasValues={sectionHasValues("colours")} onClear={() => clearSection("colours")}>
            <ColorPicker
              label="Text"
              prefix="text"
              shadcnTokens={SHADCN_TEXT_TOKENS}
              value={state.textColor}
              onChange={(v) => update("textColor", v)}
            />
            <ColorPicker
              label="Background"
              prefix="bg"
              shadcnTokens={SHADCN_BG_TOKENS}
              value={state.bgColor}
              onChange={(v) => update("bgColor", v)}
            />
            <ColorPicker
              label="Border"
              prefix="border"
              shadcnTokens={SHADCN_BORDER_TOKENS}
              value={state.borderColor}
              onChange={(v) => update("borderColor", v)}
            />
            <ColorPicker
              label="Ring"
              prefix="ring"
              shadcnTokens={SHADCN_RING_TOKENS}
              value={state.ringColor}
              onChange={(v) => update("ringColor", v)}
            />
            <ColorPicker
              label="Ring offset"
              prefix="ring-offset"
              value={state.ringOffsetColor}
              onChange={(v) => update("ringOffsetColor", v)}
            />
            <ColorPicker
              label="Outline"
              prefix="outline"
              value={state.outlineColor}
              onChange={(v) => update("outlineColor", v)}
            />



            {/* Opacity */}
            <EditPanelRow label="Opacity" value={state.opacity ? state.opacity.replace("opacity-", "") + "%" : "100%"}>
              <Slider
                value={[state.opacity ? parseInt(state.opacity.replace("opacity-", ""), 10) : 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) =>
                  update("opacity", v === 100 ? "" : `opacity-${v}`)
                }
              />
            </EditPanelRow>



            {/* Gradient */}
            <EditPanelRow label="Gradient dir.">
              <div className="flex flex-wrap gap-0.5">
                {[
                  { value: "bg-gradient-to-t", label: "↑" },
                  { value: "bg-gradient-to-tr", label: "↗" },
                  { value: "bg-gradient-to-r", label: "→" },
                  { value: "bg-gradient-to-br", label: "↘" },
                  { value: "bg-gradient-to-b", label: "↓" },
                  { value: "bg-gradient-to-bl", label: "↙" },
                  { value: "bg-gradient-to-l", label: "←" },
                  { value: "bg-gradient-to-tl", label: "↖" },
                ].map((opt) => (
                  <TextToggle
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    tooltip={opt.value}
                    isActive={state.gradientDirection === opt.value}
                    onClick={(v) => update("gradientDirection", v)}
                  />
                ))}
              </div>
            </EditPanelRow>
            <ColorPicker
              label="From"
              prefix="from"
              value={state.gradientFrom}
              onChange={(v) => update("gradientFrom", v)}
            />
            <ColorPicker
              label="Via"
              prefix="via"
              value={state.gradientVia}
              onChange={(v) => update("gradientVia", v)}
            />
            <ColorPicker
              label="To"
              prefix="to"
              value={state.gradientTo}
              onChange={(v) => update("gradientTo", v)}
            />
          </EditPanelSection>

          {/* ── Borders ──────────────────────────────────── */}
          <EditPanelSection icon={Square} title="Borders" hasValues={sectionHasValues("borders")} onClear={() => clearSection("borders")}>
            {/* Radius — all */}
            <EditPanelRow label="Radius">
              <Select value={state.borderRadius || "__none__"} onValueChange={(v) => update("borderRadius", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 flex-1 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {RADIUS_VALUES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label} ({r.px})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>
            {/* Per-corner radius */}
            {[
              { label: "TL", key: "borderRadiusTL" as const, options: BORDER_RADIUS_TL_OPTIONS },
              { label: "TR", key: "borderRadiusTR" as const, options: BORDER_RADIUS_TR_OPTIONS },
              { label: "BR", key: "borderRadiusBR" as const, options: BORDER_RADIUS_BR_OPTIONS },
              { label: "BL", key: "borderRadiusBL" as const, options: BORDER_RADIUS_BL_OPTIONS },
            ].map((corner) => (
              <EditPanelRow key={corner.label} label={`Radius ${corner.label}`}>
                <div className="flex flex-wrap gap-0.5">
                  {corner.options.map((opt) => (
                    <TextToggle key={opt} value={opt} label={opt.split("-").pop()!} tooltip={opt} isActive={state[corner.key] === opt} onClick={(v) => update(corner.key, state[corner.key] === v ? "" : v)} />
                  ))}
                </div>
              </EditPanelRow>
            ))}



            {/* Border width — all */}
            <EditPanelRow label="Width">
              <div className="flex flex-wrap gap-0.5">
                {BORDER_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "border" ? "1" : opt.replace("border-", "")} tooltip={opt} isActive={state.borderWidth === opt} onClick={(v) => update("borderWidth", state.borderWidth === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            {/* Per-side border width */}
            {[
              { label: "Width T", key: "borderWidthT" as const, options: BORDER_WIDTH_T_OPTIONS, prefix: "border-t-" },
              { label: "Width R", key: "borderWidthR" as const, options: BORDER_WIDTH_R_OPTIONS, prefix: "border-r-" },
              { label: "Width B", key: "borderWidthB" as const, options: BORDER_WIDTH_B_OPTIONS, prefix: "border-b-" },
              { label: "Width L", key: "borderWidthL" as const, options: BORDER_WIDTH_L_OPTIONS, prefix: "border-l-" },
            ].map((side) => (
              <EditPanelRow key={side.label} label={side.label}>
                <div className="flex flex-wrap gap-0.5">
                  {side.options.map((opt) => {
                    const short = opt === `border-${side.label.split(" ")[1]?.toLowerCase()}` ? "1" : opt.replace(side.prefix, "").replace(/^border-[trbl]$/, "1")
                    return <TextToggle key={opt} value={opt} label={short} tooltip={opt} isActive={state[side.key] === opt} onClick={(v) => update(side.key, state[side.key] === v ? "" : v)} />
                  })}
                </div>
              </EditPanelRow>
            ))}

            {/* Border style */}
            <EditPanelRow label="Style">
              <div className="flex flex-wrap gap-0.5">
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("border-", "")} tooltip={opt} isActive={state.borderStyle === opt} onClick={(v) => update("borderStyle", state.borderStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>



            {/* Ring */}
            <EditPanelRow label="Ring">
              <div className="flex flex-wrap gap-0.5">
                {RING_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "ring" ? "3" : opt.replace("ring-", "")} tooltip={opt} isActive={state.ringWidth === opt} onClick={(v) => update("ringWidth", state.ringWidth === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Ring offset">
              <div className="flex flex-wrap gap-0.5">
                {RING_OFFSET_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("ring-offset-", "")} tooltip={opt} isActive={state.ringOffsetWidth === opt} onClick={(v) => update("ringOffsetWidth", state.ringOffsetWidth === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>



            {/* Outline */}
            <EditPanelRow label="Outline W">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_WIDTH_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("outline-", "")} tooltip={opt} isActive={state.outlineWidth === opt} onClick={(v) => update("outlineWidth", state.outlineWidth === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Outline style">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "outline" ? "solid" : opt.replace("outline-", "")} tooltip={opt} isActive={state.outlineStyle === opt} onClick={(v) => update("outlineStyle", state.outlineStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Outline offset">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_OFFSET_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("outline-offset-", "")} tooltip={opt} isActive={state.outlineOffset === opt} onClick={(v) => update("outlineOffset", state.outlineOffset === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>



            {/* Divide */}
            <EditPanelRow label="Divide X">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_X_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "divide-x" ? "1" : opt.replace("divide-x-", "")} tooltip={opt} isActive={state.divideX === opt} onClick={(v) => update("divideX", state.divideX === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Divide Y">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_Y_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "divide-y" ? "1" : opt.replace("divide-y-", "")} tooltip={opt} isActive={state.divideY === opt} onClick={(v) => update("divideY", state.divideY === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Divide style">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("divide-", "")} tooltip={opt} isActive={state.divideStyle === opt} onClick={(v) => update("divideStyle", state.divideStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Divide rev.">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_REVERSE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("divide-", "")} tooltip={opt} isActive={state.divideReverse === opt} onClick={(v) => update("divideReverse", state.divideReverse === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
          </EditPanelSection>

          {/* ── Effects ──────────────────────────────────── */}
          <EditSection icon={Sparkles} title="Effects" hasValues={sectionHasValues("effects")} onClear={() => clearSection("effects")}>

            {/* ── Shadows ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Box shadow</EditSubSectionTitle>
                <EditSubSectionContent className="space-y-0">
                  <div className="flex flex-wrap gap-0.5">
                    {SHADOW_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt === "shadow" ? "base" : opt.replace("shadow-", "")} tooltip={opt} isActive={state.shadow === opt} onClick={(v) => update("shadow", state.shadow === v ? "" : v)} />
                    ))}
                  </div>
                  <ColorPicker className="p-0"label="" prefix="shadow" value={state.shadowColor} onChange={(v) => update("shadowColor", v)} />
                </EditSubSectionContent>
              </EditSubSection>

              <EditSubSection>
                <EditSubSectionTitle>Text shadow</EditSubSectionTitle>
                <EditSubSectionContent>
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_SHADOW_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt === "text-shadow" ? "base" : opt.replace("text-shadow-", "")} tooltip={opt} isActive={state.textShadow === opt} onClick={(v) => update("textShadow", state.textShadow === v ? "" : v)} />
                    ))}
                  </div>
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Blend modes ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Blend modes</EditSubSectionTitle>
                <EditSubSectionContent>
                  <EditPanelRow label="Mix blend" variant="nested">
                    <Select value={state.mixBlend || "__none__"} onValueChange={(v) => update("mixBlend", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">–</SelectItem>
                        {MIX_BLEND_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("mix-blend-", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditPanelRow>
                  <EditPanelRow label="Background blend" variant="nested">
                    <Select value={state.bgBlend || "__none__"} onValueChange={(v) => update("bgBlend", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">–</SelectItem>
                        {BG_BLEND_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("bg-blend-", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditPanelRow>
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Mask ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Mask</EditSubSectionTitle>
                <EditSubSectionContent>
                  {/* Source */}
                  <EditPanelRow label="Image" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_IMAGE_OPTIONS.map((opt) => {
                        const arrowMap: Record<string, string> = { "mask-linear-gradient-to-t": "↑", "mask-linear-gradient-to-tr": "↗", "mask-linear-gradient-to-r": "→", "mask-linear-gradient-to-br": "↘", "mask-linear-gradient-to-b": "↓", "mask-linear-gradient-to-bl": "↙", "mask-linear-gradient-to-l": "←", "mask-linear-gradient-to-tl": "↖" }
                        return (
                          <TextToggle key={opt} value={opt} label={arrowMap[opt] ?? opt.replace("mask-", "")} tooltip={opt} isActive={state.maskImage === opt} onClick={(v) => update("maskImage", state.maskImage === v ? "" : v)} />
                        )
                      })}
                    </div>
                  </EditPanelRow>
                  {/* Placement */}
                  <EditPanelRow label="Position" variant="nested">
                    <SpatialGrid options={MASK_POSITION_GRID} value={state.maskPosition} onChange={(v) => update("maskPosition", v)} labelPrefix="mask-" />
                  </EditPanelRow>
                  <EditPanelRow label="Size" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_SIZE_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-", "")} tooltip={opt} isActive={state.maskSize === opt} onClick={(v) => update("maskSize", state.maskSize === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Repeat" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_REPEAT_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-", "")} tooltip={opt} isActive={state.maskRepeat === opt} onClick={(v) => update("maskRepeat", state.maskRepeat === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  {/* Advanced */}
                  <EditPanelRow label="Clip" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_CLIP_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-clip-", "")} tooltip={opt} isActive={state.maskClip === opt} onClick={(v) => update("maskClip", state.maskClip === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Origin" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_ORIGIN_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-origin-", "")} tooltip={opt} isActive={state.maskOrigin === opt} onClick={(v) => update("maskOrigin", state.maskOrigin === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Composite" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_COMPOSITE_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-composite-", "")} tooltip={opt} isActive={state.maskComposite === opt} onClick={(v) => update("maskComposite", state.maskComposite === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Mode" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_MODE_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-", "")} tooltip={opt} isActive={state.maskMode === opt} onClick={(v) => update("maskMode", state.maskMode === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Type" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {MASK_TYPE_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("mask-type-", "")} tooltip={opt} isActive={state.maskType === opt} onClick={(v) => update("maskType", state.maskType === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

          </EditSection>

          {/* ── Filters ──────────────────────────────────── */}
          <EditSection icon={SlidersHorizontal} title="Filters" hasValues={sectionHasValues("filters")} onClear={() => clearSection("filters")}>

            {/* ── Element filters ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Filters</EditSubSectionTitle>
                <EditSubSectionContent>
                  <EditPanelRow label="Blur" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {BLUR_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt === "blur" ? "base" : opt.replace("blur-", "")} tooltip={opt} isActive={state.blur === opt} onClick={(v) => update("blur", state.blur === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <SteppedSlider label="Brightness" values={["0", "50", "75", "90", "95", "100", "105", "110", "125", "150", "200"]} prefix="brightness" value={state.brightness} onChange={(v) => update("brightness", v)} suffix="%" />
                  <SteppedSlider label="Contrast" values={["0", "50", "75", "100", "125", "150", "200"]} prefix="contrast" value={state.contrast} onChange={(v) => update("contrast", v)} suffix="%" />
                  <SteppedSlider label="Saturate" values={["0", "50", "100", "150", "200"]} prefix="saturate" value={state.saturate} onChange={(v) => update("saturate", v)} suffix="%" />
                  <SteppedSlider label="Hue rotate" values={["0", "15", "30", "60", "90", "180"]} prefix="hue-rotate" value={state.hueRotate} onChange={(v) => update("hueRotate", v)} suffix="°" />
                  <EditPanelRow label="Grayscale" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.grayscale === "grayscale"} onCheckedChange={(checked) => update("grayscale", checked ? "grayscale" : "")} />
                      <span className="text-xs text-muted-foreground">{state.grayscale === "grayscale" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Invert" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.invert === "invert"} onCheckedChange={(checked) => update("invert", checked ? "invert" : "")} />
                      <span className="text-xs text-muted-foreground">{state.invert === "invert" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Sepia" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.sepia === "sepia"} onCheckedChange={(checked) => update("sepia", checked ? "sepia" : "")} />
                      <span className="text-xs text-muted-foreground">{state.sepia === "sepia" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Drop shadow" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {DROP_SHADOW_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt === "drop-shadow" ? "base" : opt.replace("drop-shadow-", "")} tooltip={opt} isActive={state.dropShadow === opt} onClick={(v) => update("dropShadow", state.dropShadow === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Backdrop filters ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Backdrop</EditSubSectionTitle>
                <EditSubSectionContent>
                  <EditPanelRow label="Blur" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {BACKDROP_BLUR_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt === "backdrop-blur" ? "base" : opt.replace("backdrop-blur-", "")} tooltip={opt} isActive={state.backdropBlur === opt} onClick={(v) => update("backdropBlur", state.backdropBlur === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <SteppedSlider label="Brightness" values={["0", "50", "75", "90", "95", "100", "105", "110", "125", "150", "200"]} prefix="backdrop-brightness" value={state.backdropBrightness} onChange={(v) => update("backdropBrightness", v)} suffix="%" />
                  <SteppedSlider label="Contrast" values={["0", "50", "75", "100", "125", "150", "200"]} prefix="backdrop-contrast" value={state.backdropContrast} onChange={(v) => update("backdropContrast", v)} suffix="%" />
                  <SteppedSlider label="Saturate" values={["0", "50", "100", "150", "200"]} prefix="backdrop-saturate" value={state.backdropSaturate} onChange={(v) => update("backdropSaturate", v)} suffix="%" />
                  <SteppedSlider label="Opacity" values={["0", "5", "10", "20", "25", "30", "40", "50", "60", "70", "75", "80", "90", "95", "100"]} prefix="backdrop-opacity" value={state.backdropOpacity} onChange={(v) => update("backdropOpacity", v)} suffix="%" />
                  <SteppedSlider label="Hue rotate" values={["0", "15", "30", "60", "90", "180"]} prefix="backdrop-hue-rotate" value={state.backdropHueRotate} onChange={(v) => update("backdropHueRotate", v)} suffix="°" />
                  <EditPanelRow label="Grayscale" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.backdropGrayscale === "backdrop-grayscale"} onCheckedChange={(checked) => update("backdropGrayscale", checked ? "backdrop-grayscale" : "")} />
                      <span className="text-xs text-muted-foreground">{state.backdropGrayscale === "backdrop-grayscale" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Invert" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.backdropInvert === "backdrop-invert"} onCheckedChange={(checked) => update("backdropInvert", checked ? "backdrop-invert" : "")} />
                      <span className="text-xs text-muted-foreground">{state.backdropInvert === "backdrop-invert" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Sepia" variant="nested">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={state.backdropSepia === "backdrop-sepia"} onCheckedChange={(checked) => update("backdropSepia", checked ? "backdrop-sepia" : "")} />
                      <span className="text-xs text-muted-foreground">{state.backdropSepia === "backdrop-sepia" ? "on" : "off"}</span>
                    </div>
                  </EditPanelRow>
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

          </EditSection>

          {/* ── Motion ──────────────────────────────────────── */}
          <EditSection icon={Move} title="Motion" hasValues={sectionHasValues("motion")} onClear={() => clearSection("motion")}>

            {/* ── Transitions ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Transitions</EditSubSectionTitle>
                <EditSubSectionContent>
                  <EditPanelRow label="Property" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {TRANSITION_PROPERTY_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt === "transition" ? "default" : opt.replace("transition-", "")} tooltip={opt} isActive={state.transitionProperty === opt} onClick={(v) => update("transitionProperty", state.transitionProperty === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <EditPanelRow label="Behavior" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {TRANSITION_BEHAVIOR_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("transition-", "")} tooltip={opt} isActive={state.transitionBehavior === opt} onClick={(v) => update("transitionBehavior", state.transitionBehavior === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <SteppedSlider label="Duration" values={["0", "75", "100", "150", "200", "300", "500", "700", "1000"]} prefix="duration" value={state.transitionDuration} onChange={(v) => update("transitionDuration", v)} suffix="ms" />
                  <EditPanelRow label="Easing" variant="nested">
                    <div className="flex flex-wrap gap-0.5">
                      {TRANSITION_TIMING_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("ease-", "")} tooltip={opt} isActive={state.transitionTiming === opt} onClick={(v) => update("transitionTiming", state.transitionTiming === v ? "" : v)} />
                      ))}
                    </div>
                  </EditPanelRow>
                  <SteppedSlider label="Delay" values={["0", "75", "100", "150", "200", "300", "500", "700", "1000"]} prefix="delay" value={state.transitionDelay} onChange={(v) => update("transitionDelay", v)} suffix="ms" />
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Animation ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Animation</EditSubSectionTitle>
                <EditSubSectionContent>
                  {(state.scale || state.scaleX || state.scaleY || state.rotate || state.rotateX || state.rotateY || state.translateX || state.translateY || state.skewX || state.skewY) ? (
                    <p className="text-xs text-muted-foreground">
                      Disabled —{" "}
                      <button
                        type="button"
                        className="text-xs font-medium text-destructive hover:underline"
                        onClick={() => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, scale: "", scaleX: "", scaleY: "", rotate: "", rotateX: "", rotateY: "", translateX: "", translateY: "", skewX: "", skewY: "", transformOrigin: "" }))
                        }}
                      >
                        clear transforms
                      </button>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-0.5">
                      {ANIMATION_OPTIONS.map((opt) => (
                        <TextToggle key={opt} value={opt} label={opt.replace("animate-", "")} tooltip={opt} isActive={state.animation === opt} onClick={(v) => update("animation", state.animation === v ? "" : v)} />
                      ))}
                    </div>
                  )}
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

            {/* ── Transforms ── */}
            <EditSubSectionWrapper>
              <EditSubSection>
                <EditSubSectionTitle>Transforms</EditSubSectionTitle>
                <EditSubSectionContent>
                  {(state.animation && state.animation !== "animate-none") ? (
                    <p className="text-xs text-muted-foreground">
                      Disabled —{" "}
                      <button
                        type="button"
                        className="text-xs font-medium text-destructive hover:underline"
                        onClick={() => {
                          isUserChange.current = true
                          setState((prev) => ({ ...prev, animation: "" }))
                        }}
                      >
                        clear animation
                      </button>
                    </p>
                  ) : (
                    <>
                      <EditPanelRow label="Origin" variant="nested">
                        <TransformOriginGrid
                          value={state.transformOrigin}
                          onChange={(v) => update("transformOrigin", v)}
                        />
                      </EditPanelRow>
                      <ScaleControl
                        scale={state.scale}
                        scaleX={state.scaleX}
                        scaleY={state.scaleY}
                        onScaleChange={(v) => update("scale", v)}
                        onScaleXChange={(v) => update("scaleX", v)}
                        onScaleYChange={(v) => update("scaleY", v)}
                      />
                      <TranslateControl
                        translateX={state.translateX}
                        translateY={state.translateY}
                        onTranslateXChange={(v) => update("translateX", v)}
                        onTranslateYChange={(v) => update("translateY", v)}
                      />
                      <SkewControl
                        skewX={state.skewX}
                        skewY={state.skewY}
                        onSkewXChange={(v) => update("skewX", v)}
                        onSkewYChange={(v) => update("skewY", v)}
                      />
                      <RotateControl
                        rotate={state.rotate}
                        rotateX={state.rotateX}
                        rotateY={state.rotateY}
                        onRotateChange={(v) => update("rotate", v)}
                        onRotateXChange={(v) => update("rotateX", v)}
                        onRotateYChange={(v) => update("rotateY", v)}
                      />
                    </>
                  )}
                </EditSubSectionContent>
              </EditSubSection>
            </EditSubSectionWrapper>

          </EditSection>
          </>
          )}
        </div>
        </TooltipProvider>
      </ScrollArea>

    </div>
  )
}
