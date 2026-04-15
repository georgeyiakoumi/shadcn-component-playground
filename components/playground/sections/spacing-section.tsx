"use client"

import { Box, ArrowLeftFromLine } from "lucide-react"

import { SPACING_SCALE_FULL } from "@/lib/tailwind-options"

import { IconToggle, SteppedSlider, PaddingControl, MarginControl } from "@/components/playground/style-controls"
import { EditPanelRow } from "@/components/playground/edit-panel-row"
import { EditSection } from "@/components/playground/edit-panel-section"

import type { SectionProps, SectionCallbacks } from "./types"

interface SpacingSectionProps extends SectionProps, SectionCallbacks {
  effectiveDisplay: string
  isFlex: boolean
}

/** Format space-x/y value + reverse flag into display string */
function formatSpaceValue(value: string, prefix: string, reverse: boolean): string | undefined {
  const raw = value ? value.replace(`${prefix}-`, "") : ""
  if (!raw && !reverse) return undefined
  return `${raw}${reverse ? " (reversed)" : ""}`
}

export function SpacingSection({
  state,
  update,
  sectionHasValues,
  clearSection,
  effectiveDisplay,
  isFlex,
}: SpacingSectionProps) {
  const isBlockDisplay = effectiveDisplay === "block" || effectiveDisplay === "inline-block"
  const isFlexRow = isFlex && (state.direction === "flex-row" || state.direction === "flex-row-reverse" || !state.direction)
  const isFlexCol = isFlex && (state.direction === "flex-col" || state.direction === "flex-col-reverse")

  return (
    <EditSection icon={Box} title="Spacing" hasValues={sectionHasValues("spacing")} onClear={() => clearSection("spacing")}>

      <PaddingControl
        padding={state.padding}
        paddingX={state.paddingX}
        paddingY={state.paddingY}
        paddingTop={state.paddingTop}
        paddingRight={state.paddingRight}
        paddingBottom={state.paddingBottom}
        paddingLeft={state.paddingLeft}
        onPaddingChange={(v) => update("padding", v)}
        onPaddingXChange={(v) => update("paddingX", v)}
        onPaddingYChange={(v) => update("paddingY", v)}
        onPaddingTopChange={(v) => update("paddingTop", v)}
        onPaddingRightChange={(v) => update("paddingRight", v)}
        onPaddingBottomChange={(v) => update("paddingBottom", v)}
        onPaddingLeftChange={(v) => update("paddingLeft", v)}
      />

      <MarginControl
        margin={state.margin}
        marginX={state.marginX}
        marginY={state.marginY}
        marginTop={state.marginTop}
        marginRight={state.marginRight}
        marginBottom={state.marginBottom}
        marginLeft={state.marginLeft}
        onMarginChange={(v) => update("margin", v)}
        onMarginXChange={(v) => update("marginX", v)}
        onMarginYChange={(v) => update("marginY", v)}
        onMarginTopChange={(v) => update("marginTop", v)}
        onMarginRightChange={(v) => update("marginRight", v)}
        onMarginBottomChange={(v) => update("marginBottom", v)}
        onMarginLeftChange={(v) => update("marginLeft", v)}
      />

      {/* Space between — only one axis based on direction */}
      {isFlexRow && (
        <EditPanelRow
          label="Space between"
          variant="nested"
          value={formatSpaceValue(state.spaceX, "space-x", !!state.spaceXReverse)}
          onClear={(state.spaceX || state.spaceXReverse) ? () => { update("spaceX", ""); update("spaceXReverse", "") } : undefined}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SteppedSlider
                label=""
                hideLabel
                values={SPACING_SCALE_FULL}
                prefix="space-x"
                value={state.spaceX}
                onChange={(v) => update("spaceX", v)}
              />
            </div>
            <IconToggle value="space-x-reverse" icon={ArrowLeftFromLine} tooltip="space-x-reverse" isActive={!!state.spaceXReverse} onClick={() => update("spaceXReverse", state.spaceXReverse ? "" : "space-x-reverse")} />
          </div>
        </EditPanelRow>
      )}
      {(isBlockDisplay || isFlexCol) && (
        <EditPanelRow
          label="Space between"
          variant="nested"
          value={formatSpaceValue(state.spaceY, "space-y", !!state.spaceYReverse)}
          onClear={(state.spaceY || state.spaceYReverse) ? () => { update("spaceY", ""); update("spaceYReverse", "") } : undefined}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SteppedSlider
                label=""
                hideLabel
                values={SPACING_SCALE_FULL}
                prefix="space-y"
                value={state.spaceY}
                onChange={(v) => update("spaceY", v)}
              />
            </div>
            <IconToggle value="space-y-reverse" icon={ArrowLeftFromLine} tooltip="space-y-reverse" isActive={!!state.spaceYReverse} onClick={() => update("spaceYReverse", state.spaceYReverse ? "" : "space-y-reverse")} />
          </div>
        </EditPanelRow>
      )}

    </EditSection>
  )
}
