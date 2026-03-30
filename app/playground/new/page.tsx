"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileCode, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  categories,
  getComponentsByCategory,
  registry,
  type ComponentMeta,
} from "@/lib/registry"
import { componentSources } from "@/lib/component-source"
import { toPascalCase, generateFromTree } from "@/lib/code-generator"
import {
  generateId,
  saveUserComponent,
  toSlug,
  type UserComponent,
} from "@/lib/component-store"
import { createComponentTree, type ComponentProp } from "@/lib/component-tree"
import type { CustomVariantDef } from "@/lib/component-state"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Hash, ToggleLeft } from "lucide-react"

/* ── Constants ──────────────────────────────────────────────────── */

type CreationMode = "copy" | "scratch"

const BASE_ELEMENTS = [
  { value: "div", label: "div", description: "Generic container" },
  { value: "button", label: "button", description: "Clickable action" },
  { value: "input", label: "input", description: "Text input" },
  { value: "a", label: "a", description: "Anchor / link" },
  { value: "span", label: "span", description: "Inline container" },
  { value: "form", label: "form", description: "Form wrapper" },
  { value: "textarea", label: "textarea", description: "Multi-line input" },
  { value: "select", label: "select", description: "Dropdown select" },
  { value: "img", label: "img", description: "Image element" },
] as const

// Removed — auto-conversion to PascalCase means no validation needed

/* ── Page ───────────────────────────────────────────────────────── */

export default function NewComponentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialMode: CreationMode =
    searchParams.get("mode") === "copy" ? "copy" : "scratch"

  const [mode, setMode] = React.useState<CreationMode>(initialMode)
  const [name, setName] = React.useState("")
  const [selectedComponent, setSelectedComponent] = React.useState<string>("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [props, setProps] = React.useState<ComponentProp[]>([])
  const [variants, setVariants] = React.useState<CustomVariantDef[]>([])

  const grouped = React.useMemo(() => getComponentsByCategory(), [])

  /* ── Name handling ──────────────────────────────────────────── */

  const handleNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value)
    },
    [],
  )

  // Auto-convert to PascalCase for display
  const pascalName = React.useMemo(() => {
    if (!name.trim()) return ""
    return toPascalCase(name.trim())
  }, [name])

  const isValid =
    pascalName.length >= 2 &&
    (mode === "copy" ? selectedComponent.length > 0 : true)

  /* ── Source rename helper ────────────────────────────────────── */

  function renameComponentInSource(
    source: string,
    originalSlug: string,
    newName: string,
  ): string {
    const originalMeta = registry.find((c) => c.slug === originalSlug)
    if (!originalMeta) return source

    const originalName = originalMeta.name
    let result = source

    // Replace the main component name (PascalCase occurrences)
    // Be careful with compound components — replace root name only in
    // declarations and displayName, not sub-component prefixes
    if (originalMeta.isCompound) {
      // For compound components, replace the root name prefix
      // e.g. "Card" -> "MyCard", "CardHeader" -> "MyCardHeader"
      result = result.replace(
        new RegExp(`\\b${originalName}(?=[A-Z]|\\b)`, "g"),
        newName,
      )
    } else {
      // For simple components, replace exact name matches
      result = result.replace(
        new RegExp(`\\b${originalName}\\b`, "g"),
        newName,
      )
    }

    return result
  }

  /* ── Create handler ─────────────────────────────────────────── */

  function handleCreate() {
    if (!isValid) return

    const componentName = pascalName
    const slug = toSlug(componentName)
    const now = new Date().toISOString()

    let source: string
    let tree = undefined

    if (mode === "copy") {
      const originalSource = componentSources[selectedComponent] ?? ""
      source = renameComponentInSource(originalSource, selectedComponent, componentName)
    } else {
      // Generate a from-scratch component with a tree structure
      tree = createComponentTree(componentName, baseElement)
      tree.props = props
      tree.variants = variants
      source = generateFromTree(tree)
    }

    const component: UserComponent = {
      id: generateId(),
      name: componentName,
      slug,
      source,
      tree,
      basedOn: mode === "copy" ? selectedComponent : undefined,
      createdAt: now,
      updatedAt: now,
    }

    saveUserComponent(component)
    router.push(`/playground/custom/${slug}`)
  }

  return (
    <>
      {/* ── Toolbar placeholder ────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Create New Component</span>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-8">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          {/* ── Name input ─────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="component-name" className="text-sm font-medium">
              Component Name
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="component-name"
                placeholder="Start typing..."
                value={name}
                onChange={handleNameChange}
                className="h-10 flex-1"
              />
              {pascalName && (
                <code className="shrink-0 rounded-md bg-muted px-3 py-2 text-sm font-semibold">
                  {pascalName}
                </code>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              You can rename it later.
            </p>
          </div>

          {/* ── Mode selector ─────────────────────────────────── */}
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as CreationMode)}
            className="grid grid-cols-2 gap-4"
          >
            <label
              htmlFor="mode-copy"
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                mode === "copy"
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-muted-foreground/30",
              )}
            >
              <RadioGroupItem value="copy" id="mode-copy" className="mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-medium">Copy from Existing</span>
                <p className="text-xs text-muted-foreground">
                  Fork a shadcn component as your starting point
                </p>
              </div>
            </label>

            <label
              htmlFor="mode-scratch"
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                mode === "scratch"
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-muted-foreground/30",
              )}
            >
              <RadioGroupItem value="scratch" id="mode-scratch" className="mt-0.5" />
              <div className="space-y-1">
                <span className="text-sm font-medium">From Scratch</span>
                <p className="text-xs text-muted-foreground">
                  Start with a blank component shell
                </p>
              </div>
            </label>
          </RadioGroup>

          {/* ── Mode-specific content ──────────────────────────── */}
          {mode === "copy" ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select component to fork
              </Label>
              <Command className="rounded-lg border shadow-sm [&_[cmdk-list]]:max-h-[260px]">
                <CommandInput placeholder="Search components..." />
                <CommandList>
                  <CommandEmpty>No components found.</CommandEmpty>
                  {categories.map((category) => {
                    const components = grouped.get(category.name) ?? []
                    if (components.length === 0) return null
                    return (
                      <CommandGroup key={category.slug} heading={category.name}>
                        {components.map((component: ComponentMeta) => (
                          <CommandItem
                            key={component.slug}
                            value={`${component.name} ${component.keywords.join(" ")}`}
                            onSelect={() =>
                              setSelectedComponent(component.slug)
                            }
                            className={cn(
                              selectedComponent === component.slug &&
                                "bg-accent text-accent-foreground",
                            )}
                          >
                            <FileCode className="mr-2 size-4 text-muted-foreground" />
                            <span className="font-medium">
                              {component.name}
                            </span>
                            {selectedComponent === component.slug && (
                              <span className="ml-auto text-xs text-primary">
                                Selected
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  })}
                </CommandList>
              </Command>
              {selectedComponent && (
                <p className="text-xs text-muted-foreground">
                  Forking from{" "}
                  <span className="font-medium text-foreground">
                    {registry.find((c) => c.slug === selectedComponent)?.name}
                  </span>
                  . All occurrences of the original name will be renamed to{" "}
                  <span className="font-medium text-foreground">
                    {pascalName || "YourName"}
                  </span>
                  .
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Base HTML element</Label>
              <RadioGroup
                value={baseElement}
                onValueChange={setBaseElement}
                className="grid grid-cols-3 gap-2"
              >
                {BASE_ELEMENTS.map((el) => (
                  <label
                    key={el.value}
                    htmlFor={`el-${el.value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition-colors",
                      baseElement === el.value
                        ? "border-primary ring-1 ring-primary"
                        : "hover:border-muted-foreground/30",
                    )}
                  >
                    <RadioGroupItem value={el.value} id={`el-${el.value}`} className="mt-0.5" />
                    <div>
                      <code className="text-xs font-semibold">
                        &lt;{el.label}&gt;
                      </code>
                      <p className="text-xs text-muted-foreground">
                        {el.description}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* ── Props (optional) ──────────────────────────────── */}
          {mode === "scratch" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Props</Label>
                    <p className="text-xs text-muted-foreground">Optional. You can add more later.</p>
                  </div>
                  {props.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{props.length}</Badge>
                  )}
                </div>

                {props.map((prop, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                    <code className="text-xs font-medium">{prop.name}</code>
                    <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                    {prop.required && <Badge variant="secondary" className="text-xs">required</Badge>}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => setProps(props.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

                <InlinePropAdder onAdd={(prop) => setProps([...props, prop])} />
              </div>
            </>
          )}

          {/* ── Variants (optional) ────────────────────────────── */}
          {mode === "scratch" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Variants</Label>
                    <p className="text-xs text-muted-foreground">Optional. Define size, intent, or boolean props.</p>
                  </div>
                  {variants.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{variants.length}</Badge>
                  )}
                </div>

                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                    <code className="text-xs font-medium">{v.name}</code>
                    <Badge variant="outline" className="text-xs">{v.type}</Badge>
                    {v.type === "variant" && (
                      <div className="flex flex-wrap gap-1">
                        {v.options.map((opt) => (
                          <Badge key={opt} variant="secondary" className="text-xs">
                            {opt}{opt === v.defaultValue ? " ✓" : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

                <InlineVariantAdder onAdd={(v) => setVariants([...variants, v])} />
              </div>
            </>
          )}

          {/* ── Create button ──────────────────────────────────── */}
          <Button
            size="lg"
            disabled={!isValid}
            onClick={handleCreate}
            className="w-full"
          >
            <Plus className="mr-2 size-4" />
            Create Component
          </Button>
        </div>
      </div>
    </>
  )
}

/* ── InlinePropAdder ────────────────────────────────────────────── */

const PROP_TYPES = ["string", "number", "boolean", "ReactNode"] as const

function InlinePropAdder({ onAdd }: { onAdd: (prop: ComponentProp) => void }) {
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<ComponentProp["type"]>("string")
  const [required, setRequired] = React.useState(false)

  function handleAdd() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), type, required })
    setName("")
    setType("string")
    setRequired(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Button group: type + name + add */}
      <div className="flex flex-1">
        <Select value={type} onValueChange={(v) => setType(v as ComponentProp["type"])}>
          <SelectTrigger className="h-8 w-24 rounded-r-none border-r-0 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROP_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Prop name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 rounded-none border-x-0 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 rounded-l-none gap-1 text-xs"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Plus className="size-3" />
          Add prop
        </Button>
      </div>
      {/* Required switch */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Switch checked={required} onCheckedChange={setRequired} className="scale-75" />
        <span className="text-xs text-muted-foreground">Req</span>
      </div>
    </div>
  )
}

/* ── InlineVariantAdder ────────────────────────────────────────── */

function InlineVariantAdder({ onAdd }: { onAdd: (v: CustomVariantDef) => void }) {
  const [variantName, setVariantName] = React.useState("")
  const [variantType, setVariantType] = React.useState<"variant" | "boolean">("variant")
  const [options, setOptions] = React.useState<string[]>([])
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState("")

  function handleAddOptions() {
    // Support comma-separated and Enter
    const newOpts = optionInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !options.includes(s))
    if (newOpts.length === 0) return
    const updated = [...options, ...newOpts]
    setOptions(updated)
    setOptionInput("")
    if (updated.length >= 1 && !defaultValue) setDefaultValue(updated[0])
  }

  function handleAdd() {
    if (!variantName.trim()) return
    if (variantType === "variant" && options.length < 2) return

    onAdd({
      name: variantName.trim(),
      type: variantType,
      options: variantType === "boolean" ? ["true", "false"] : options,
      defaultValue: variantType === "boolean" ? (defaultValue || "false") : (defaultValue || options[0] || ""),
    })

    setVariantName("")
    setVariantType("variant")
    setOptions([])
    setOptionInput("")
    setDefaultValue("")
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        {/* Button group: type + name + options (variant) + add */}
        <div className="flex flex-1">
          <Select value={variantType} onValueChange={(v) => setVariantType(v as "variant" | "boolean")}>
            <SelectTrigger className="h-8 w-24 shrink-0 rounded-r-none border-r-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">Variant</SelectItem>
              <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Name (e.g. size)"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className="h-8 w-32 shrink-0 rounded-none border-x-0 text-xs"
          />
          {variantType === "variant" && (
            <div
              className="flex min-h-[32px] min-w-0 flex-1 cursor-text flex-wrap items-center gap-1 border-x-0 border-y px-2 py-0.5"
              onClick={() => {
                const input = document.getElementById("variant-option-input")
                input?.focus()
              }}
            >
              {options.map((opt) => (
                <Badge
                  key={opt}
                  variant={opt === defaultValue ? "default" : "secondary"}
                  className="shrink-0 cursor-pointer gap-0.5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDefaultValue(opt)
                  }}
                >
                  {opt}
                  <button
                    type="button"
                    className="hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOptions(options.filter((o) => o !== opt))
                    }}
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              <input
                id="variant-option-input"
                placeholder={options.length === 0 ? "Options (e.g. sm, md, lg)" : ""}
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    handleAddOptions()
                  }
                  if (e.key === "Backspace" && optionInput === "" && options.length > 0) {
                    setOptions(options.slice(0, -1))
                  }
                }}
                onBlur={handleAddOptions}
                className="h-full min-w-[60px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 rounded-l-none gap-1 text-xs"
            onClick={handleAdd}
            disabled={!variantName.trim() || (variantType === "variant" && options.length < 2)}
          >
            <Plus className="size-3" />
            Add variant
          </Button>
        </div>

        {/* Boolean default switch */}
        {variantType === "boolean" && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Switch
              checked={defaultValue === "true"}
              onCheckedChange={(checked) => setDefaultValue(checked ? "true" : "false")}
              className="scale-75"
            />
            <span className="text-xs text-muted-foreground">
              {defaultValue === "true" ? "true" : "false"}
            </span>
          </div>
        )}
      </div>

      {/* Helper text */}
      {variantType === "variant" && options.length > 0 && (
        <p className="text-xs text-muted-foreground">Click a badge to set as default. Backspace to remove last.</p>
      )}
    </div>
  )
}
