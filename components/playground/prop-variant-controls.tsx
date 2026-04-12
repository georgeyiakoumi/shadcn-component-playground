"use client"

import * as React from "react"
import { Plus, Pencil, X, ToggleLeft, Type, Hash, Blocks, Diamond, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"

/* ── VariantStrategyPicker ──────────────────────────────────────── */

/**
 * Small segmented control for choosing how a variant is expressed in the
 * generated source. Used by `AddVariantPopover` / `EditVariantPopover`
 * in this file AND by the dedicated add/edit variant popovers in
 * `define-view.tsx`, so the choice is consistent everywhere a variant
 * can be authored.
 *
 * - `data-attr` (default): plain TS union prop mirrored to the DOM via
 *   `data-<name>={<name>}`, classes inline in the cn() base with
 *   `data-[<name>=<value>]:` prefixes. Matches shadcn's newer pattern
 *   (Card, Accordion, etc.). Good for compact/default toggles and
 *   anything children should react to.
 *
 * - `cva`: generates a cva() export with a `variants` map. Matches the
 *   older shadcn pattern (Button, Badge, Alert). Good for variants with
 *   many value-specific style sets.
 */
export function VariantStrategyPicker({
  value,
  onChange,
}: {
  value: "data-attr" | "cva"
  onChange: (value: "data-attr" | "cva") => void
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1.5">
        <Label className="text-xs">Strategy</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md border p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange("data-attr")}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  value === "data-attr"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Data attr
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Recommended.</span> Emits
                  a plain TS union prop + <code>data-X={"{X}"}</code> on
                  the root element. Classes live inline in the cn() base
                  with <code>data-[X=Y]:</code> prefixes.
                </p>
                <p className="text-muted-foreground">
                  Matches shadcn Card, Accordion, etc. Children in this
                  compound can react to the parent's variant via
                  <code>{" group-data-[X=Y]/name:"}</code> selectors.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange("cva")}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  value === "cva"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                cva
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <div className="space-y-1">
                <p>
                  Generates a <code>cva()</code> export with a{" "}
                  <code>variants</code> map. Each value keeps its own
                  class string in the export.
                </p>
                <p className="text-muted-foreground">
                  Matches shadcn Button, Badge, Alert. Good for variants
                  with many value-specific style sets that don't fit
                  comfortably inline.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ── Constants ──────────────────────────────────────────────────── */

export const PROP_TYPES = ["string", "number", "boolean", "ReactNode"] as const

const PROP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  ReactNode: Blocks,
}

/* ── PropRow — single prop with hover-reveal edit/delete ── */

export function PropRow({
  prop,
  onUpdate,
  onDelete,
}: {
  prop: ComponentProp
  onUpdate: (prop: ComponentProp) => void
  onDelete: () => void
}) {
  const Icon = PROP_ICONS[prop.type] ?? Type
  return (
    <Item variant="muted" size="sm" className="group/row py-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <ItemContent className="flex-row items-center gap-2">
        <ItemTitle className="text-xs">
          {prop.name}
          {prop.required && (
            <span className="text-destructive" title="Required">*</span>
          )}
        </ItemTitle>
        <ItemDescription className="truncate text-xs">{prop.type}</ItemDescription>
      </ItemContent>
      <ItemActions className="opacity-0 transition-opacity group-hover/row:opacity-100">
        <EditPropPopover prop={prop} onSave={onUpdate} />
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </ItemActions>
    </Item>
  )
}

/* ── VariantRow — single variant with hover-reveal edit/delete ── */

export function VariantRow({
  variant,
  onUpdate,
  onDelete,
}: {
  variant: CustomVariantDef
  onUpdate: (variant: CustomVariantDef) => void
  onDelete: () => void
}) {
  return (
    <Item variant="muted" size="sm" className="group/row py-1.5">
      {variant.type === "boolean" ? (
        <ToggleLeft className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <Diamond className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <ItemContent className="flex-row items-center gap-2">
        <ItemTitle className="text-xs">{variant.name}</ItemTitle>
        {variant.type === "variant" && variant.options.length > 0 && (
          <ItemDescription className="truncate text-xs">
            {variant.options.join(", ")}
          </ItemDescription>
        )}
      </ItemContent>
      <ItemActions className="opacity-0 transition-opacity group-hover/row:opacity-100">
        <EditVariantPopover variant={variant} onSave={onUpdate} />
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </ItemActions>
    </Item>
  )
}

/* ── AddPropPopover ── */

export function AddPropPopover({ onAdd, label }: { onAdd: (prop: ComponentProp) => void; label?: string }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<ComponentProp["type"]>("string")
  const [required, setRequired] = React.useState(false)

  function reset() {
    setName("")
    setType("string")
    setRequired(false)
  }

  function handleAdd() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), type, required })
    reset()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="size-3.5" />
          {label ?? "Add prop"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 p-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ComponentProp["type"])}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROP_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="propName"
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={required} onCheckedChange={setRequired} />
          <Label className="text-xs">Required</Label>
        </div>
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          Add
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/* ── EditPropPopover ── */

export function EditPropPopover({
  prop,
  onSave,
}: {
  prop: ComponentProp
  onSave: (prop: ComponentProp) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(prop.name)
  const [type, setType] = React.useState<ComponentProp["type"]>(prop.type)
  const [required, setRequired] = React.useState(prop.required)

  React.useEffect(() => {
    if (open) {
      setName(prop.name)
      setType(prop.type)
      setRequired(prop.required)
    }
  }, [open, prop.name, prop.type, prop.required])

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), type, required })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 p-3" align="end">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ComponentProp["type"])}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROP_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={required} onCheckedChange={setRequired} />
          <Label className="text-xs">Required</Label>
        </div>
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Save
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/* ── VariantOptionsEditor — shared flex-wrap badge input ── */

export function VariantOptionsEditor({
  options,
  defaultValue,
  optionInput,
  onOptionsChange,
  onDefaultChange,
  onOptionInputChange,
  onCommitOptions,
  inputId,
}: {
  options: string[]
  defaultValue: string
  optionInput: string
  onOptionsChange: (opts: string[]) => void
  onDefaultChange: (val: string) => void
  onOptionInputChange: (val: string) => void
  onCommitOptions: () => void
  inputId: string
}) {
  return (
    <div
      className="flex min-h-[28px] cursor-text flex-wrap items-center gap-1 rounded-md border px-1.5 py-1"
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      {options.map((opt) => (
        <Badge
          key={opt}
          variant={opt === defaultValue ? "default" : "secondary"}
          className="h-5 shrink-0 cursor-pointer gap-0.5 text-xs"
          onClick={(e) => { e.stopPropagation(); onDefaultChange(opt) }}
        >
          {opt}
          <button
            type="button"
            className="hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onOptionsChange(options.filter((o) => o !== opt))
            }}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={inputId}
        placeholder={options.length === 0 ? "Type + Enter/comma" : ""}
        value={optionInput}
        onChange={(e) => onOptionInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            onCommitOptions()
          }
          if (e.key === "Backspace" && optionInput === "" && options.length > 0) {
            onOptionsChange(options.slice(0, -1))
          }
        }}
        onBlur={onCommitOptions}
        className="h-full min-w-[40px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

/* ── AddVariantPopover ── */

export function AddVariantPopover({ onAdd, label }: { onAdd: (v: CustomVariantDef) => void; label?: string }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<"variant" | "boolean">("variant")
  const [options, setOptions] = React.useState<string[]>([])
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState("")
  // New variants default to the data-attr strategy — matches the newer
  // shadcn authoring pattern and is the simpler mental model for most
  // compact/default toggles. The user can switch to cva for variants
  // with many value-specific style sets.
  const [strategy, setStrategy] = React.useState<"data-attr" | "cva">("data-attr")

  function reset() {
    setName("")
    setType("variant")
    setOptions([])
    setOptionInput("")
    setDefaultValue("")
    setStrategy("data-attr")
  }

  function handleAddOptions() {
    const newOpts = optionInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !options.includes(s))
    if (newOpts.length === 0) return
    const updated = [...options, ...newOpts]
    setOptions(updated)
    setOptionInput("")
    if (!defaultValue && updated.length >= 1) setDefaultValue(updated[0])
  }

  function handleAdd() {
    if (!name.trim()) return
    if (type === "variant" && options.length < 2) return
    onAdd({
      name: name.trim(),
      type,
      options: type === "boolean" ? ["true", "false"] : options,
      defaultValue: type === "boolean" ? (defaultValue || "false") : (defaultValue || options[0] || ""),
      strategy,
    })
    reset()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="size-3.5" />
          {label ?? "Add variant"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3 p-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "variant" | "boolean")}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">Variant</SelectItem>
              <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <VariantStrategyPicker value={strategy} onChange={setStrategy} />
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="variantName"
            className="h-7 text-xs"
          />
        </div>
        {type === "variant" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Options</Label>
            <VariantOptionsEditor
              options={options}
              defaultValue={defaultValue}
              optionInput={optionInput}
              onOptionsChange={setOptions}
              onDefaultChange={setDefaultValue}
              onOptionInputChange={setOptionInput}
              onCommitOptions={handleAddOptions}
              inputId="add-variant-opts"
            />
          </div>
        )}
        {type === "boolean" && (
          <div className="flex items-center gap-2">
            <Switch
              checked={defaultValue === "true"}
              onCheckedChange={(c) => setDefaultValue(c ? "true" : "false")}
            />
            <Label className="text-xs">
              Default: {defaultValue === "true" ? "true" : "false"}
            </Label>
          </div>
        )}
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleAdd}
          disabled={!name.trim() || (type === "variant" && options.length < 2)}
        >
          Add
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/* ── EditVariantPopover ── */

export function EditVariantPopover({
  variant,
  onSave,
}: {
  variant: CustomVariantDef
  onSave: (variant: CustomVariantDef) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(variant.name)
  const [type, setType] = React.useState<"variant" | "boolean">(variant.type)
  const [options, setOptions] = React.useState<string[]>(variant.options)
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState(variant.defaultValue)
  // Edit preserves the existing strategy. If absent (pre-this-PR
  // localStorage entries), default to "cva" — the historical default
  // for variants without an explicit strategy field. Matches the
  // translator's backwards-compat rule in `translateVariantsToV2Cva`.
  const [strategy, setStrategy] = React.useState<"data-attr" | "cva">(
    variant.strategy ?? "cva",
  )

  React.useEffect(() => {
    if (open) {
      setName(variant.name)
      setType(variant.type)
      setOptions(variant.options)
      setOptionInput("")
      setDefaultValue(variant.defaultValue)
      setStrategy(variant.strategy ?? "cva")
    }
  }, [
    open,
    variant.name,
    variant.type,
    variant.options,
    variant.defaultValue,
    variant.strategy,
  ])

  function handleAddOptions() {
    const newOpts = optionInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !options.includes(s))
    if (newOpts.length === 0) return
    const updated = [...options, ...newOpts]
    setOptions(updated)
    setOptionInput("")
    if (!defaultValue && updated.length >= 1) setDefaultValue(updated[0])
  }

  function handleSave() {
    if (!name.trim()) return
    if (type === "variant" && options.length < 2) return
    onSave({
      name: name.trim(),
      type,
      options: type === "boolean" ? ["true", "false"] : options,
      defaultValue: type === "boolean" ? (defaultValue || "false") : (defaultValue || options[0] || ""),
      strategy,
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3 p-3" align="end">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "variant" | "boolean")}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">Variant</SelectItem>
              <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <VariantStrategyPicker value={strategy} onChange={setStrategy} />
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        {type === "variant" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Options</Label>
            <VariantOptionsEditor
              options={options}
              defaultValue={defaultValue}
              optionInput={optionInput}
              onOptionsChange={setOptions}
              onDefaultChange={setDefaultValue}
              onOptionInputChange={setOptionInput}
              onCommitOptions={handleAddOptions}
              inputId="edit-variant-opts"
            />
          </div>
        )}
        {type === "boolean" && (
          <div className="flex items-center gap-2">
            <Switch
              checked={defaultValue === "true"}
              onCheckedChange={(c) => setDefaultValue(c ? "true" : "false")}
            />
            <Label className="text-xs">
              Default: {defaultValue === "true" ? "true" : "false"}
            </Label>
          </div>
        )}
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handleSave}
          disabled={!name.trim() || (type === "variant" && options.length < 2)}
        >
          Save
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/* ── InlineVariantsSection — variants displayed inline with popover add/edit ── */

export function InlineVariantsSection({
  variants,
  onUpdate,
  onDelete,
  onAdd,
  optional,
  headless,
}: {
  variants: CustomVariantDef[]
  onUpdate: (index: number, updated: CustomVariantDef) => void
  onDelete: (index: number) => void
  onAdd: (variant: CustomVariantDef) => void
  optional?: boolean
  headless?: boolean
}) {
  if (headless) {
    return (
      <div>
        {variants.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Diamond />
              </EmptyMedia>
              <EmptyTitle>No variants yet</EmptyTitle>
              <EmptyDescription>
                Add different styles like size or colour options.
              </EmptyDescription>
            </EmptyHeader>
            <AddVariantPopover
              onAdd={onAdd}
              label="Add your first variant"
            />
          </Empty>
        ) : (
          <div className="space-y-1">
            {variants.map((v, i) => (
              <VariantRow
                key={`${v.name}-${i}`}
                variant={v}
                onUpdate={(updated) => onUpdate(i, updated)}
                onDelete={() => onDelete(i)}
              />
            ))}
            <AddVariantPopover onAdd={onAdd} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-medium">
          Variants
          {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
        </h4>
        <AddVariantPopover onAdd={onAdd} />
      </div>
      {variants.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground/60">No variants defined.</p>
      ) : (
        <div className="space-y-1">
          {variants.map((v, i) => (
            <VariantRow
              key={`${v.name}-${i}`}
              variant={v}
              onUpdate={(updated) => onUpdate(i, updated)}
              onDelete={() => onDelete(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── InlinePropsSection — props displayed inline with popover add/edit ── */

export function InlinePropsSection({
  props,
  onUpdate,
  onDelete,
  onAdd,
  optional,
  headless,
}: {
  props: ComponentProp[]
  onUpdate: (index: number, updated: ComponentProp) => void
  onDelete: (index: number) => void
  onAdd: (prop: ComponentProp) => void
  optional?: boolean
  headless?: boolean
}) {
  if (headless) {
    return (
      <div>
        {props.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Puzzle />
              </EmptyMedia>
              <EmptyTitle>No props yet</EmptyTitle>
              <EmptyDescription>
                Props let you pass data into your component.
              </EmptyDescription>
            </EmptyHeader>
            <AddPropPopover
              onAdd={onAdd}
              label="Add your first prop"
            />
          </Empty>
        ) : (
          <div className="space-y-1">
            {props.map((p, i) => (
              <PropRow
                key={`${p.name}-${i}`}
                prop={p}
                onUpdate={(updated) => onUpdate(i, updated)}
                onDelete={() => onDelete(i)}
              />
            ))}
            <AddPropPopover onAdd={onAdd} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-medium">
          Props
          {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
        </h4>
        <AddPropPopover onAdd={onAdd} />
      </div>
      {props.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground/60">No props defined.</p>
      ) : (
        <div className="space-y-1">
          {props.map((p, i) => (
            <PropRow
              key={`${p.name}-${i}`}
              prop={p}
              onUpdate={(updated) => onUpdate(i, updated)}
              onDelete={() => onDelete(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
