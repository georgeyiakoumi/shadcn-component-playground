"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* ── Constants ──────────────────────────────────────────────────── */

const HTML_ELEMENTS = [
  { value: "div", description: "Generic container" },
  { value: "button", description: "Clickable action" },
  { value: "input", description: "Text input" },
  { value: "a", description: "Anchor / link" },
  { value: "span", description: "Inline container" },
  { value: "form", description: "Form wrapper" },
  { value: "textarea", description: "Multi-line input" },
  { value: "select", description: "Dropdown select" },
  { value: "img", description: "Image element" },
  { value: "section", description: "Section container" },
  { value: "header", description: "Header container" },
  { value: "footer", description: "Footer container" },
  { value: "nav", description: "Navigation container" },
  { value: "aside", description: "Aside container" },
  { value: "p", description: "Paragraph" },
  { value: "ul", description: "Unordered list" },
  { value: "li", description: "List item" },
  { value: "article", description: "Article container" },
] as const

const SHADCN_BASE_COMPONENTS = [
  "Button",
  "Badge",
  "Input",
  "Label",
  "Separator",
  "Checkbox",
  "Switch",
  "Slider",
  "Progress",
  "Skeleton",
  "Avatar",
  "Toggle",
] as const

/* ── Helpers ────────────────────────────────────────────────────── */

function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/* ── BaseElementSelect ──────────────────────────────────────────── */

export function BaseElementSelect({
  value,
  onValueChange,
  size = "default",
  includeShadcn = false,
}: {
  value: string
  onValueChange: (value: string) => void
  size?: "default" | "sm"
  includeShadcn?: boolean
}) {
  const triggerClass = size === "sm" ? "h-8 text-xs" : "h-10 w-full"
  const itemClass = size === "sm" ? "text-xs" : ""

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClass}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs text-muted-foreground">
            HTML elements
          </SelectLabel>
          {HTML_ELEMENTS.map((el) => (
            <SelectItem key={el.value} value={el.value} className={itemClass}>
              <span className="font-mono text-xs">
                &lt;{el.value}&gt;
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {el.description}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        {includeShadcn && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">
              shadcn components
            </SelectLabel>
            {SHADCN_BASE_COMPONENTS.map((el) => (
              <SelectItem key={el} value={el} className={itemClass}>
                {el}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}

/* ── ConventionToggles ──────────────────────────────────────────── */

export function ConventionToggles({
  name,
  namedGroup,
  onNamedGroupChange,
  containerQuery,
  onContainerQueryChange,
  headingFont,
  onHeadingFontChange,
}: {
  name: string
  namedGroup: boolean
  onNamedGroupChange: (value: boolean) => void
  containerQuery?: boolean
  onContainerQueryChange?: (value: boolean) => void
  headingFont: boolean
  onHeadingFontChange: (value: boolean) => void
}) {
  const kebabName = name ? toKebab(name) : "name"

  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <Label className="text-xs">Named group</Label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Adds{" "}
            <code className="rounded bg-muted px-1">group/{kebabName}</code> so
            children can use group modifiers.
          </p>
        </div>
        <Switch checked={namedGroup} onCheckedChange={onNamedGroupChange} />
      </div>
      {onContainerQueryChange && (
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-xs">Container query</Label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Adds{" "}
              <code className="rounded bg-muted px-1">@container/{kebabName}</code> so
              children can use container query modifiers.
            </p>
          </div>
          <Switch checked={containerQuery ?? false} onCheckedChange={onContainerQueryChange} />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <Label className="text-xs">Heading font</Label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Adds{" "}
            <code className="rounded bg-muted px-1">cn-font-heading</code> for
            heading typography.
          </p>
        </div>
        <Switch checked={headingFont} onCheckedChange={onHeadingFontChange} />
      </div>
    </div>
  )
}
