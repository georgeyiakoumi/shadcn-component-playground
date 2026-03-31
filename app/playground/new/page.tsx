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
import {
  InlinePropsSection,
  InlineVariantsSection,
} from "@/components/playground/prop-variant-controls"

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
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Optional. You can add more later.</p>
                <InlinePropsSection
                  props={props}
                  onUpdate={(i, updated) => setProps(props.map((p, idx) => idx === i ? updated : p))}
                  onDelete={(i) => setProps(props.filter((_, idx) => idx !== i))}
                  onAdd={(prop) => setProps([...props, prop])}
                />
              </div>
            </>
          )}

          {/* ── Variants (optional) ────────────────────────────── */}
          {mode === "scratch" && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Optional. Define size, intent, or boolean props.</p>
                <InlineVariantsSection
                  variants={variants}
                  onUpdate={(i, updated) => setVariants(variants.map((v, idx) => idx === i ? updated : v))}
                  onDelete={(i) => setVariants(variants.filter((_, idx) => idx !== i))}
                  onAdd={(v) => setVariants([...variants, v])}
                />
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

