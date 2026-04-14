"use client"

import * as React from "react"
import {
  Layout,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  X,
  Columns3,
  LayoutGrid,
  EyeOff,
  PanelTop,
  WrapText,
  Box,
  Minus,
  Layers,
  Crosshair,
  Pin,
  Anchor,
  Square,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  StretchHorizontal,
} from "lucide-react"

import type { ControlState } from "@/lib/style-state"
import { getNativeDisplay, DISPLAY_OPTIONS, INSET_SCALE, OVERFLOW_OPTIONS, VISIBILITY_OPTIONS, ASPECT_RATIO_OPTIONS, FLOAT_OPTIONS, CLEAR_OPTIONS, OBJECT_FIT_OPTIONS, AUTO_ROWS_OPTIONS, AUTO_COLS_OPTIONS, WIDTH_OPTIONS, HEIGHT_OPTIONS, MIN_WIDTH_OPTIONS, MAX_WIDTH_OPTIONS, MIN_HEIGHT_OPTIONS, MAX_HEIGHT_OPTIONS, SIZE_OPTIONS } from "@/lib/tailwind-options"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { IconToggle, TextToggle, PositionGrid, ObjectPositionGrid, ZIndexInput, GridNumberPicker, GapControl, ContentDistributionPicker } from "@/components/playground/style-controls"
import { EditPanelRow } from "@/components/playground/edit-panel-row"
import {
  EditSection,
  EditSubSectionWrapper,
  EditSubSection,
  EditSubSectionTitle,
  EditSubSectionContent,
  EditNestedGroup,
} from "@/components/playground/edit-panel-section"

import type { SectionProps, SectionCallbacks } from "./types"

interface LayoutSectionProps extends SectionProps, SectionCallbacks {
  effectiveDisplay: string
  isFlex: boolean
  isGrid: boolean
  selectedElementTagName: string
  selectedElementDataSlot?: string
  isUserChange: React.MutableRefObject<boolean>
  setState: React.Dispatch<React.SetStateAction<ControlState>>
}

/** Format justify + align into a compact display string like "center, start" */
function formatAlignment(justify: string, align: string): string | undefined {
  const j = justify ? justify.replace("justify-", "") : ""
  const a = align ? align.replace("items-", "") : ""
  if (!j && !a) return undefined
  return [j, a].filter(Boolean).join(", ")
}

export function LayoutSection({
  state,
  update,
  sectionHasValues,
  clearSection,
  effectiveDisplay,
  isFlex,
  isGrid,
  selectedElementTagName,
  selectedElementDataSlot,
  isUserChange,
  setState,
}: LayoutSectionProps) {
  return (
    <EditSection icon={Layout} title="Layout" defaultOpen hasValues={sectionHasValues("layout")} onClear={() => clearSection("layout")}>

      {/* ── Display ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Display</EditSubSectionTitle>
          <EditSubSectionContent>
            <div className="flex flex-wrap gap-0.5">
              {(() => {
                const nativeDisp = getNativeDisplay(selectedElementTagName)
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

                <EditPanelRow
                  label="Alignment"
                  variant="nested"
                  value={formatAlignment(state.justify, state.align)}
                  onClear={(state.justify || state.align) ? () => { update("justify", ""); update("align", "") } : undefined}
                >
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
                    <EditPanelRow
                      label="Position"
                      variant="nested"
                      value={formatAlignment(state.justify, state.align)}
                      onClear={(state.justify || state.align) ? () => { update("justify", ""); update("align", "") } : undefined}
                    >
                      <PositionGrid justify={state.justify} align={state.align} display={effectiveDisplay}
                        onJustifyChange={(v) => update("justify", v)} onAlignChange={(v) => update("align", v)} />
                    </EditPanelRow>
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
                  <EditSubSectionTitle>Object</EditSubSectionTitle>
                  <EditSubSectionContent>
                    <EditPanelRow
                      label="Fit"
                      variant="nested"
                      value={state.objectFit ? state.objectFit.replace("object-", "") : undefined}
                      onClear={state.objectFit ? () => update("objectFit", "") : undefined}
                    >
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
                    </EditPanelRow>
                    <EditPanelRow
                      label="Position"
                      variant="nested"
                      value={state.objectPosition ? state.objectPosition.replace("object-", "") : undefined}
                      onClear={state.objectPosition ? () => update("objectPosition", "") : undefined}
                    >
                      <ObjectPositionGrid
                        value={state.objectPosition}
                        onChange={(v) => update("objectPosition", v)}
                      />
                    </EditPanelRow>
                  </EditSubSectionContent>
                </EditSubSection>
              </EditSubSectionWrapper>
            )}
          </>
        )
      })()}
    </EditSection>
  )
}
