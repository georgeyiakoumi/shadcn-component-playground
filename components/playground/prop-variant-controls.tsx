"use client"

import * as React from "react"
import { Plus, Pencil, X, ToggleLeft, Type, Hash, Blocks, Diamond } from "lucide-react"

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
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"

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

export function AddPropPopover({ onAdd }: { onAdd: (prop: ComponentProp) => void }) {
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
          Add prop
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

export function AddVariantPopover({ onAdd }: { onAdd: (v: CustomVariantDef) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<"variant" | "boolean">("variant")
  const [options, setOptions] = React.useState<string[]>([])
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState("")

  function reset() {
    setName("")
    setType("variant")
    setOptions([])
    setOptionInput("")
    setDefaultValue("")
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
    })
    reset()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="size-3.5" />
          Add variant
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

  React.useEffect(() => {
    if (open) {
      setName(variant.name)
      setType(variant.type)
      setOptions(variant.options)
      setOptionInput("")
      setDefaultValue(variant.defaultValue)
    }
  }, [open, variant.name, variant.type, variant.options, variant.defaultValue])

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
}: {
  variants: CustomVariantDef[]
  onUpdate: (index: number, updated: CustomVariantDef) => void
  onDelete: (index: number) => void
  onAdd: (variant: CustomVariantDef) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-medium">Variants</h4>
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
}: {
  props: ComponentProp[]
  onUpdate: (index: number, updated: ComponentProp) => void
  onDelete: (index: number) => void
  onAdd: (prop: ComponentProp) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-medium">Props</h4>
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
