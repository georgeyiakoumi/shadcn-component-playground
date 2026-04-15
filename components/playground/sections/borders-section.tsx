"use client"

import { Square } from "lucide-react"

import { BORDER_STYLE_OPTIONS, OUTLINE_STYLE_OPTIONS, DIVIDE_STYLE_OPTIONS } from "@/lib/tailwind-options"
import { Switch } from "@/components/ui/switch"

import { TextToggle, SteppedSlider, BorderRadiusControl, BorderWidthControl } from "@/components/playground/style-controls"
import { EditPanelRow } from "@/components/playground/edit-panel-row"
import {
  EditSection,
  EditSubSectionWrapper,
  EditSubSection,
  EditSubSectionTitle,
  EditSubSectionContent,
} from "@/components/playground/edit-panel-section"

import type { SectionProps, SectionCallbacks } from "./types"

export function BordersSection({
  state,
  update,
  sectionHasValues,
  clearSection,
}: SectionProps & SectionCallbacks) {
  return (
    <EditSection icon={Square} title="Borders" hasValues={sectionHasValues("borders")} onClear={() => clearSection("borders")}>

      {/* ── Border ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Border</EditSubSectionTitle>
          <EditSubSectionContent>
            <BorderRadiusControl
              radius={state.borderRadius}
              radiusT={state.borderRadiusT}
              radiusR={state.borderRadiusR}
              radiusB={state.borderRadiusB}
              radiusL={state.borderRadiusL}
              radiusTL={state.borderRadiusTL}
              radiusTR={state.borderRadiusTR}
              radiusBR={state.borderRadiusBR}
              radiusBL={state.borderRadiusBL}
              onRadiusChange={(v) => update("borderRadius", v)}
              onRadiusTChange={(v) => update("borderRadiusT", v)}
              onRadiusRChange={(v) => update("borderRadiusR", v)}
              onRadiusBChange={(v) => update("borderRadiusB", v)}
              onRadiusLChange={(v) => update("borderRadiusL", v)}
              onRadiusTLChange={(v) => update("borderRadiusTL", v)}
              onRadiusTRChange={(v) => update("borderRadiusTR", v)}
              onRadiusBRChange={(v) => update("borderRadiusBR", v)}
              onRadiusBLChange={(v) => update("borderRadiusBL", v)}
            />
            <BorderWidthControl
              width={state.borderWidth}
              widthT={state.borderWidthT}
              widthR={state.borderWidthR}
              widthB={state.borderWidthB}
              widthL={state.borderWidthL}
              onWidthChange={(v) => update("borderWidth", v)}
              onWidthTChange={(v) => update("borderWidthT", v)}
              onWidthRChange={(v) => update("borderWidthR", v)}
              onWidthBChange={(v) => update("borderWidthB", v)}
              onWidthLChange={(v) => update("borderWidthL", v)}
            />
            <EditPanelRow label="Style" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("border-", "")} tooltip={opt} isActive={state.borderStyle === opt} onClick={(v) => update("borderStyle", state.borderStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Ring ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Ring</EditSubSectionTitle>
          <EditSubSectionContent>
            <SteppedSlider label="Width" values={["0", "1", "2", "", "4", "8"]} prefix="ring" value={state.ringWidth} onChange={(v) => update("ringWidth", v === "ring-" ? "ring" : v)} suffix="px" />
            <SteppedSlider label="Offset" values={["0", "1", "2", "4", "8"]} prefix="ring-offset" value={state.ringOffsetWidth} onChange={(v) => update("ringOffsetWidth", v)} suffix="px" />
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Outline ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Outline</EditSubSectionTitle>
          <EditSubSectionContent>
            <SteppedSlider label="Width" values={["0", "1", "2", "4", "8"]} prefix="outline" value={state.outlineWidth} onChange={(v) => update("outlineWidth", v)} suffix="px" />
            <EditPanelRow label="Style" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {OUTLINE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt === "outline" ? "solid" : opt.replace("outline-", "")} tooltip={opt} isActive={state.outlineStyle === opt} onClick={(v) => update("outlineStyle", state.outlineStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <SteppedSlider label="Offset" values={["0", "1", "2", "4", "8"]} prefix="outline-offset" value={state.outlineOffset} onChange={(v) => update("outlineOffset", v)} suffix="px" />
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Divide ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Divide</EditSubSectionTitle>
          <EditSubSectionContent>
            <SteppedSlider label="X" values={["0", "", "2", "4", "8"]} prefix="divide-x" value={state.divideX} onChange={(v) => update("divideX", v === "divide-x-" ? "divide-x" : v)} suffix="px" />
            <SteppedSlider label="Y" values={["0", "", "2", "4", "8"]} prefix="divide-y" value={state.divideY} onChange={(v) => update("divideY", v === "divide-y-" ? "divide-y" : v)} suffix="px" />
            <EditPanelRow label="Style" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {DIVIDE_STYLE_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("divide-", "")} tooltip={opt} isActive={state.divideStyle === opt} onClick={(v) => update("divideStyle", state.divideStyle === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
            <EditPanelRow label="Reverse" variant="nested">
              <div className="flex flex-wrap items-center gap-2">
                <Switch checked={!!state.divideReverse} onCheckedChange={(checked) => update("divideReverse", checked ? "divide-x-reverse" : "")} />
                <span className="text-xs text-muted-foreground">{state.divideReverse || "off"}</span>
              </div>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>
    </EditSection>
  )
}
