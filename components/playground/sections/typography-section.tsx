"use client"

import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Italic,
  Underline,
  Strikethrough,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  RemoveFormatting,
  WrapText,
  Ellipsis,
  ListOrdered,
  List as ListIcon,
} from "lucide-react"

import {
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_DECORATION_STYLE_OPTIONS,
  TEXT_DECORATION_THICKNESS_OPTIONS,
  TEXT_UNDERLINE_OFFSET_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
  TEXT_OVERFLOW_OPTIONS,
  TEXT_WRAP_OPTIONS,
  TEXT_INDENT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  LETTER_SPACING_OPTIONS,
  WORD_BREAK_OPTIONS,
  WHITESPACE_OPTIONS,
  HYPHENS_OPTIONS,
  LINE_CLAMP_OPTIONS,
  VERTICAL_ALIGN_OPTIONS,
  LIST_STYLE_TYPE_OPTIONS,
  LIST_STYLE_POSITION_OPTIONS,
  FONT_VARIANT_NUMERIC_OPTIONS,
} from "@/lib/tailwind-options"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { IconToggle, TextToggle, SteppedSlider } from "@/components/playground/style-controls"
import { EditPanelRow } from "@/components/playground/edit-panel-row"
import {
  EditSection,
  EditSubSectionWrapper,
  EditSubSection,
  EditSubSectionTitle,
  EditSubSectionContent,
} from "@/components/playground/edit-panel-section"

import type { SectionProps, SectionCallbacks } from "./types"

// Shorthand value arrays for SteppedSlider
const FONT_SIZE_VALUES = FONT_SIZE_OPTIONS.map((o) => o.replace("text-", ""))
const FONT_WEIGHT_VALUES = FONT_WEIGHT_OPTIONS.map((o) => o.replace("font-", ""))
const LINE_HEIGHT_VALUES = LINE_HEIGHT_OPTIONS.map((o) => o.replace("leading-", ""))
const LETTER_SPACING_VALUES = LETTER_SPACING_OPTIONS.map((o) => o.replace("tracking-", ""))
const LINE_CLAMP_VALUES = LINE_CLAMP_OPTIONS.map((o) => o.replace("line-clamp-", ""))

export function TypographySection({
  state,
  update,
  sectionHasValues,
  clearSection,
}: SectionProps & SectionCallbacks) {
  return (
    <EditSection icon={Type} title="Typography" hasValues={sectionHasValues("typography")} onClear={() => clearSection("typography")}>

      {/* ── Font ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Font</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Family" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {FONT_FAMILY_OPTIONS.map((opt) => (
                  <TextToggle
                    key={opt}
                    value={opt}
                    label={opt.replace("font-", "")}
                    tooltip={opt}
                    isActive={state.fontFamily === opt}
                    onClick={(v) => update("fontFamily", state.fontFamily === v ? "" : v)}
                  />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Size" variant="nested">
              <SteppedSlider
                label=""
                hideLabel
                values={FONT_SIZE_VALUES}
                prefix="text"
                value={state.fontSize}
                onChange={(v) => update("fontSize", v)}
              />
            </EditPanelRow>

            <EditPanelRow label="Weight" variant="nested">
              <SteppedSlider
                label=""
                hideLabel
                values={FONT_WEIGHT_VALUES}
                prefix="font"
                value={state.fontWeight}
                onChange={(v) => update("fontWeight", v)}
              />
            </EditPanelRow>

            <EditPanelRow label="Style" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="italic"
                  icon={Italic}
                  tooltip="italic"
                  isActive={state.fontStyle === "italic"}
                  onClick={(v) => update("fontStyle", state.fontStyle === v ? "" : v)}
                />
                <IconToggle
                  value="not-italic"
                  icon={RemoveFormatting}
                  tooltip="not-italic"
                  isActive={state.fontStyle === "not-italic"}
                  onClick={(v) => update("fontStyle", state.fontStyle === v ? "" : v)}
                />
              </div>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Alignment ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Alignment</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Text align" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle value="text-left" icon={AlignLeft} tooltip="text-left" isActive={state.textAlign === "text-left"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-center" icon={AlignCenter} tooltip="text-center" isActive={state.textAlign === "text-center"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-right" icon={AlignRight} tooltip="text-right" isActive={state.textAlign === "text-right"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                <IconToggle value="text-justify" icon={AlignJustify} tooltip="text-justify" isActive={state.textAlign === "text-justify"} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                {["text-start", "text-end"].map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textAlign === opt} onClick={(v) => update("textAlign", state.textAlign === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Vertical align" variant="nested">
              <Select value={state.verticalAlign || "__none__"} onValueChange={(v) => update("verticalAlign", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {VERTICAL_ALIGN_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("align-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Decoration ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Decoration</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Line" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="underline"
                  icon={Underline}
                  tooltip="underline"
                  isActive={state.textDecoration === "underline"}
                  onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)}
                />
                <IconToggle
                  value="line-through"
                  icon={Strikethrough}
                  tooltip="line-through"
                  isActive={state.textDecoration === "line-through"}
                  onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)}
                />
                <TextToggle
                  value="overline"
                  label="overline"
                  tooltip="overline"
                  isActive={state.textDecoration === "overline"}
                  onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)}
                />
                <IconToggle
                  value="no-underline"
                  icon={RemoveFormatting}
                  tooltip="no-underline"
                  isActive={state.textDecoration === "no-underline"}
                  onClick={(v) => update("textDecoration", state.textDecoration === v ? "" : v)}
                />
              </div>
            </EditPanelRow>

            {state.textDecoration && state.textDecoration !== "no-underline" && (
              <>
                <EditPanelRow label="Style" variant="nested">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_STYLE_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationStyle === opt} onClick={(v) => update("textDecorationStyle", state.textDecorationStyle === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
                <EditPanelRow label="Thickness" variant="nested">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_DECORATION_THICKNESS_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("decoration-", "")} tooltip={opt} isActive={state.textDecorationThickness === opt} onClick={(v) => update("textDecorationThickness", state.textDecorationThickness === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
                <EditPanelRow label="Underline offset" variant="nested">
                  <div className="flex flex-wrap gap-0.5">
                    {TEXT_UNDERLINE_OFFSET_OPTIONS.map((opt) => (
                      <TextToggle key={opt} value={opt} label={opt.replace("underline-offset-", "")} tooltip={opt} isActive={state.textUnderlineOffset === opt} onClick={(v) => update("textUnderlineOffset", state.textUnderlineOffset === v ? "" : v)} />
                    ))}
                  </div>
                </EditPanelRow>
              </>
            )}
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Spacing ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Spacing</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Line height" variant="nested">
              <SteppedSlider
                label=""
                hideLabel
                values={LINE_HEIGHT_VALUES}
                prefix="leading"
                value={state.lineHeight}
                onChange={(v) => update("lineHeight", v)}
              />
            </EditPanelRow>

            <EditPanelRow label="Letter spacing" variant="nested">
              <SteppedSlider
                label=""
                hideLabel
                values={LETTER_SPACING_VALUES}
                prefix="tracking"
                value={state.letterSpacing}
                onChange={(v) => update("letterSpacing", v)}
              />
            </EditPanelRow>

            <EditPanelRow label="Line clamp" variant="nested">
              <SteppedSlider
                label=""
                hideLabel
                values={LINE_CLAMP_VALUES}
                prefix="line-clamp"
                value={state.lineClamp}
                onChange={(v) => update("lineClamp", v)}
              />
            </EditPanelRow>

            <EditPanelRow label="Indent" variant="nested">
              <Select value={state.textIndent || "__none__"} onValueChange={(v) => update("textIndent", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {TEXT_INDENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("indent-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Wrapping ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Wrapping</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Wrap" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="text-wrap"
                  icon={WrapText}
                  tooltip="text-wrap"
                  isActive={state.textWrap === "text-wrap"}
                  onClick={(v) => update("textWrap", state.textWrap === v ? "" : v)}
                />
                {["text-nowrap", "text-balance", "text-pretty"].map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textWrap === opt} onClick={(v) => update("textWrap", state.textWrap === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Overflow" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="text-ellipsis"
                  icon={Ellipsis}
                  tooltip="text-ellipsis"
                  isActive={state.textOverflow === "text-ellipsis"}
                  onClick={(v) => update("textOverflow", state.textOverflow === v ? "" : v)}
                />
                {["truncate", "text-clip"].map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("text-", "")} tooltip={opt} isActive={state.textOverflow === opt} onClick={(v) => update("textOverflow", state.textOverflow === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Whitespace" variant="nested">
              <Select value={state.whitespace || "__none__"} onValueChange={(v) => update("whitespace", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {WHITESPACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt.replace("whitespace-", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>

            <EditPanelRow label="Word break" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {WORD_BREAK_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("break-", "")} tooltip={opt} isActive={state.wordBreak === opt} onClick={(v) => update("wordBreak", state.wordBreak === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>

            <EditPanelRow label="Hyphens" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {HYPHENS_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("hyphens-", "")} tooltip={opt} isActive={state.hyphens === opt} onClick={(v) => update("hyphens", state.hyphens === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── Transform & Variant ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>Transform</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Case" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="uppercase"
                  icon={CaseUpper}
                  tooltip="uppercase"
                  isActive={state.textTransform === "uppercase"}
                  onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)}
                />
                <IconToggle
                  value="lowercase"
                  icon={CaseLower}
                  tooltip="lowercase"
                  isActive={state.textTransform === "lowercase"}
                  onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)}
                />
                <IconToggle
                  value="capitalize"
                  icon={CaseSensitive}
                  tooltip="capitalize"
                  isActive={state.textTransform === "capitalize"}
                  onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)}
                />
                <IconToggle
                  value="normal-case"
                  icon={RemoveFormatting}
                  tooltip="normal-case"
                  isActive={state.textTransform === "normal-case"}
                  onClick={(v) => update("textTransform", state.textTransform === v ? "" : v)}
                />
              </div>
            </EditPanelRow>

            <EditPanelRow label="Numeric" variant="nested">
              <Select value={state.fontVariantNumeric || "__none__"} onValueChange={(v) => update("fontVariantNumeric", v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">–</SelectItem>
                  {FONT_VARIANT_NUMERIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

      {/* ── List ── */}
      <EditSubSectionWrapper>
        <EditSubSection>
          <EditSubSectionTitle>List</EditSubSectionTitle>
          <EditSubSectionContent>
            <EditPanelRow label="Type" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                <IconToggle
                  value="list-disc"
                  icon={ListIcon}
                  tooltip="list-disc"
                  isActive={state.listStyleType === "list-disc"}
                  onClick={(v) => update("listStyleType", state.listStyleType === v ? "" : v)}
                />
                <IconToggle
                  value="list-decimal"
                  icon={ListOrdered}
                  tooltip="list-decimal"
                  isActive={state.listStyleType === "list-decimal"}
                  onClick={(v) => update("listStyleType", state.listStyleType === v ? "" : v)}
                />
                <IconToggle
                  value="list-none"
                  icon={RemoveFormatting}
                  tooltip="list-none"
                  isActive={state.listStyleType === "list-none"}
                  onClick={(v) => update("listStyleType", state.listStyleType === v ? "" : v)}
                />
              </div>
            </EditPanelRow>

            <EditPanelRow label="Position" variant="nested">
              <div className="flex flex-wrap gap-0.5">
                {LIST_STYLE_POSITION_OPTIONS.map((opt) => (
                  <TextToggle key={opt} value={opt} label={opt.replace("list-", "")} tooltip={opt} isActive={state.listStylePosition === opt} onClick={(v) => update("listStylePosition", state.listStylePosition === v ? "" : v)} />
                ))}
              </div>
            </EditPanelRow>
          </EditSubSectionContent>
        </EditSubSection>
      </EditSubSectionWrapper>

    </EditSection>
  )
}
