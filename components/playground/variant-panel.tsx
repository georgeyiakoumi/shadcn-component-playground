"use client"

import * as React from "react"
import { Plus, X, Trash2, Pencil, Tag, ToggleLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { parseCvaVariants, type VariantDef } from "@/lib/cva-parser"
import {
  useComponentEdit,
  type CustomVariantDef,
} from "@/lib/component-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

/* ── Types ──────────────────────────────────────────────────────── */

interface VariantPanelProps {
  source: string
  className?: string
}

type PropType = "variant" | "boolean"

interface CreateFormState {
  propType: PropType | null
  name: string
  options: string[]
  optionInput: string
  defaultValue: string
  editingName: string | null
}

const INITIAL_FORM_STATE: CreateFormState = {
  propType: null,
  name: "",
  options: [],
  optionInput: "",
  defaultValue: "",
  editingName: null,
}

/* ── Component ──────────────────────────────────────────────────── */

export function VariantPanel({ source, className }: VariantPanelProps) {
  const existingVariants = React.useMemo(
    () => parseCvaVariants(source),
    [source],
  )

  const {
    edit,
    addCustomVariant,
    updateCustomVariant,
    removeCustomVariant,
  } = useComponentEdit()

  const customVariants = edit.customVariantDefs

  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [form, setForm] = React.useState<CreateFormState>(INITIAL_FORM_STATE)
  const [error, setError] = React.useState<string | null>(null)

  /** All variant names that are taken (existing + custom) */
  const takenNames = React.useMemo(() => {
    const names = new Set<string>()
    existingVariants.forEach((v) => names.add(v.name))
    customVariants.forEach((v) => names.add(v.name))
    return names
  }, [existingVariants, customVariants])

  /* ── Form helpers ─────────────────────────────────────────────── */

  function resetForm() {
    setForm(INITIAL_FORM_STATE)
    setError(null)
  }

  function handleOpenChange(open: boolean) {
    setPopoverOpen(open)
    if (!open) resetForm()
  }

  function handleAddOption() {
    const trimmed = form.optionInput.trim()
    if (!trimmed) return
    if (form.options.includes(trimmed)) {
      setError("Duplicate option name")
      return
    }
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, trimmed],
      optionInput: "",
      // Auto-set first option as default
      defaultValue: prev.options.length === 0 ? trimmed : prev.defaultValue,
    }))
    setError(null)
  }

  function handleRemoveOption(option: string) {
    setForm((prev) => {
      const next = prev.options.filter((o) => o !== option)
      return {
        ...prev,
        options: next,
        defaultValue:
          prev.defaultValue === option
            ? next[0] ?? ""
            : prev.defaultValue,
      }
    })
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddOption()
    }
  }

  function handleCreate() {
    const trimmedName = form.name.trim().toLowerCase()

    if (!trimmedName) {
      setError("Variant name is required")
      return
    }

    // Allow the current editing name (it's being updated, not duplicated)
    if (
      takenNames.has(trimmedName) &&
      form.editingName !== trimmedName
    ) {
      setError("A variant with this name already exists")
      return
    }

    if (form.propType === "variant") {
      if (form.options.length < 2) {
        setError("Add at least 2 options")
        return
      }
      if (!form.defaultValue) {
        setError("Select a default value")
        return
      }
    }

    if (form.propType === "boolean") {
      if (!form.defaultValue) {
        setError("Select a default value")
        return
      }
    }

    if (form.editingName) {
      // Updating an existing custom variant
      const options =
        form.propType === "boolean"
          ? ["true", "false"]
          : form.options
      updateCustomVariant(form.editingName, options, form.defaultValue)
    } else {
      // Creating a new one
      const options =
        form.propType === "boolean"
          ? ["true", "false"]
          : form.options
      addCustomVariant(
        trimmedName,
        form.propType!,
        options,
        form.defaultValue,
      )
    }

    setPopoverOpen(false)
    resetForm()
  }

  function handleEdit(variant: CustomVariantDef) {
    setForm({
      propType: variant.type,
      name: variant.name,
      options: variant.type === "boolean" ? [] : variant.options,
      optionInput: "",
      defaultValue: variant.defaultValue,
      editingName: variant.name,
    })
    setError(null)
    setPopoverOpen(true)
  }

  /* ── Render ───────────────────────────────────────────────────── */

  const hasExisting = existingVariants.length > 0
  const hasCustom = customVariants.length > 0

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 p-4">
        {/* ── Existing variants (from cva) ──────────────────── */}
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Existing Variants</h3>
          {hasExisting && (
            <Badge variant="secondary" className="text-xs">
              {existingVariants.length}
            </Badge>
          )}
        </div>

        {hasExisting ? (
          <div className="space-y-2">
            {existingVariants.map((v) => (
              <ExistingVariantCard key={v.name} variant={v} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No cva variants found in this component.
          </p>
        )}

        <Separator />

        {/* ── Custom variants ───────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ToggleLeft className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Custom Variants</h3>
            {hasCustom && (
              <Badge variant="secondary" className="text-xs">
                {customVariants.length}
              </Badge>
            )}
          </div>

          <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
              >
                <Plus className="size-3" />
                Create
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80"
              align="end"
              side="bottom"
              sideOffset={8}
            >
              <CreateVariantForm
                form={form}
                error={error}
                onFormChange={setForm}
                onAddOption={handleAddOption}
                onRemoveOption={handleRemoveOption}
                onOptionKeyDown={handleOptionKeyDown}
                onCreate={handleCreate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {hasCustom ? (
          <div className="space-y-2">
            {customVariants.map((v) => (
              <CustomVariantCard
                key={v.name}
                variant={v}
                onEdit={() => handleEdit(v)}
                onDelete={() => removeCustomVariant(v.name)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No custom variants yet. Click Create to add one.
          </p>
        )}
      </div>
    </ScrollArea>
  )
}

/* ── ExistingVariantCard ───────────────────────────────────────── */

interface ExistingVariantCardProps {
  variant: VariantDef
}

function ExistingVariantCard({ variant }: ExistingVariantCardProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium">{variant.name}</span>
        <Badge variant="outline" className="text-xs">
          cva
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {variant.options.map((opt) => (
          <Badge
            key={opt}
            variant={opt === variant.defaultValue ? "default" : "secondary"}
            className="text-xs"
          >
            {opt}
            {opt === variant.defaultValue && (
              <span className="ml-1 opacity-60">default</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  )
}

/* ── CustomVariantCard ─────────────────────────────────────────── */

interface CustomVariantCardProps {
  variant: CustomVariantDef
  onEdit: () => void
  onDelete: () => void
}

function CustomVariantCard({
  variant,
  onEdit,
  onDelete,
}: CustomVariantCardProps) {
  return (
    <div className="group rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{variant.name}</span>
          <Badge variant="outline" className="text-xs">
            {variant.type}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label={`Edit ${variant.name}`}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${variant.name}`}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {variant.options.map((opt) => (
          <Badge
            key={opt}
            variant={
              opt === variant.defaultValue ? "default" : "secondary"
            }
            className="text-xs"
          >
            {opt}
            {opt === variant.defaultValue && (
              <span className="ml-1 opacity-60">default</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  )
}

/* ── CreateVariantForm ─────────────────────────────────────────── */

interface CreateVariantFormProps {
  form: CreateFormState
  error: string | null
  onFormChange: React.Dispatch<React.SetStateAction<CreateFormState>>
  onAddOption: () => void
  onRemoveOption: (option: string) => void
  onOptionKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onCreate: () => void
}

function CreateVariantForm({
  form,
  error,
  onFormChange,
  onAddOption,
  onRemoveOption,
  onOptionKeyDown,
  onCreate,
}: CreateVariantFormProps) {
  const isEditing = form.editingName !== null

  /* ── Step 1: type selection ─────────────────────────────────── */
  if (!form.propType) {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Choose type</h4>
          <p className="text-xs text-muted-foreground">
            What kind of prop do you want to create?
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
              "hover:border-foreground/20 hover:bg-muted/40",
            )}
            onClick={() =>
              onFormChange((prev) => ({ ...prev, propType: "variant" }))
            }
          >
            <Tag className="size-5 text-muted-foreground" />
            <span className="text-xs font-medium">Variant</span>
            <span className="text-xs text-muted-foreground">
              Named options
            </span>
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
              "hover:border-foreground/20 hover:bg-muted/40",
            )}
            onClick={() =>
              onFormChange((prev) => ({
                ...prev,
                propType: "boolean",
                defaultValue: "false",
              }))
            }
          >
            <ToggleLeft className="size-5 text-muted-foreground" />
            <span className="text-xs font-medium">Boolean</span>
            <span className="text-xs text-muted-foreground">
              True / false
            </span>
          </button>
        </div>
      </div>
    )
  }

  /* ── Step 2a: variant type form ─────────────────────────────── */
  if (form.propType === "variant") {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">
            {isEditing ? "Edit variant" : "New variant"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Define named options like size or intent.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="variant-name" className="text-xs">
            Name
          </Label>
          <Input
            id="variant-name"
            placeholder="e.g. appearance, intent"
            value={form.name}
            disabled={isEditing}
            onChange={(e) =>
              onFormChange((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="variant-option" className="text-xs">
            Options
          </Label>
          <div className="flex gap-1.5">
            <Input
              id="variant-option"
              placeholder="Type and press Enter"
              value={form.optionInput}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  optionInput: e.target.value,
                }))
              }
              onKeyDown={onOptionKeyDown}
              className="h-8 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={onAddOption}
              type="button"
            >
              <Plus className="size-3" />
            </Button>
          </div>
          {form.options.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {form.options.map((opt) => (
                <Badge
                  key={opt}
                  variant={
                    opt === form.defaultValue ? "default" : "secondary"
                  }
                  className="gap-1 text-xs"
                >
                  {opt}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full hover:bg-foreground/10"
                    onClick={() => onRemoveOption(opt)}
                    aria-label={`Remove ${opt}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {form.options.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Default</Label>
            <ToggleGroup
              type="single"
              value={form.defaultValue}
              onValueChange={(v) => {
                if (v) {
                  onFormChange((prev) => ({
                    ...prev,
                    defaultValue: v,
                  }))
                }
              }}
              className="flex flex-wrap justify-start gap-1"
            >
              {form.options.map((opt) => (
                <ToggleGroupItem
                  key={opt}
                  value={opt}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                >
                  {opt}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          size="sm"
          className="w-full"
          onClick={onCreate}
          type="button"
        >
          {isEditing ? "Save" : "Create"}
        </Button>
      </div>
    )
  }

  /* ── Step 2b: boolean type form ─────────────────────────────── */
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">
          {isEditing ? "Edit boolean" : "New boolean"}
        </h4>
        <p className="text-xs text-muted-foreground">
          A simple true/false toggle prop.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="boolean-name" className="text-xs">
          Name
        </Label>
        <Input
          id="boolean-name"
          placeholder="e.g. disabled, loading, fullWidth"
          value={form.name}
          disabled={isEditing}
          onChange={(e) =>
            onFormChange((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Default value</Label>
        <ToggleGroup
          type="single"
          value={form.defaultValue}
          onValueChange={(v) => {
            if (v) {
              onFormChange((prev) => ({ ...prev, defaultValue: v }))
            }
          }}
          className="justify-start"
        >
          <ToggleGroupItem
            value="false"
            size="sm"
            className="h-7 px-3 text-xs"
          >
            false
          </ToggleGroupItem>
          <ToggleGroupItem
            value="true"
            size="sm"
            className="h-7 px-3 text-xs"
          >
            true
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={onCreate}
        type="button"
      >
        {isEditing ? "Save" : "Create"}
      </Button>
    </div>
  )
}
