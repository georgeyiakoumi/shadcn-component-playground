"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type {
  ComponentTree,
  ComponentProp,
  SubComponentDef,
  SubComponentUsecase,
  ElementNode,
} from "@/lib/component-tree"
import { createElementNode, toDataSlot } from "@/lib/component-tree"
import { toPascalCase } from "@/lib/code-generator"
import type { CustomVariantDef } from "@/lib/component-state"

/* ── Helpers ────────────────────────────────────────────────────── */

/** Recursively rename tags in an element tree that contain the old prefix */
function renameTagsInTree(
  node: ElementNode,
  oldPrefix: string,
  newPrefix: string,
): ElementNode {
  const newTag = node.tag.includes(oldPrefix)
    ? node.tag.replace(oldPrefix, newPrefix)
    : node.tag
  return {
    ...node,
    tag: newTag,
    children: node.children.map((c) =>
      renameTagsInTree(c, oldPrefix, newPrefix),
    ),
  }
}

/* ── Constants ──────────────────────────────────────────────────── */

const PROP_TYPES = ["string", "number", "boolean", "ReactNode"] as const

const BASE_ELEMENTS = [
  "div", "section", "header", "footer", "nav", "aside", "span", "p", "ul", "li",
]

const USECASE_OPTIONS: { value: SubComponentUsecase; label: string }[] = [
  { value: "plain-text", label: "Text" },
  { value: "heading", label: "Heading" },
  { value: "button", label: "Button" },
  { value: "image", label: "Image" },
  { value: "input", label: "Input" },
  { value: "list", label: "List" },
  { value: "icon", label: "Icon" },
  { value: "wrapper", label: "Wrapper" },
]

/* ── Props ──────────────────────────────────────────────────────── */

interface DefineViewProps {
  tree: ComponentTree
  onTreeChange: (tree: ComponentTree) => void
}

/* ── Component ──────────────────────────────────────────────────── */

export function DefineView({ tree, onTreeChange }: DefineViewProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="w-full max-w-2xl space-y-8 p-8">
        {/* ── Main component card ──────────────────────────── */}
        <ComponentCard
          name={tree.name}
          props={tree.props}
          variants={tree.variants}
          onUpdate={(newName, props, variants) => {
            const oldName = tree.name
            // If name changed, cascade to sub-components
            const updatedSubComponents = newName !== oldName
              ? tree.subComponents.map((sc) => ({
                  ...sc,
                  name: sc.name.replace(oldName, newName),
                  dataSlot: toDataSlot(sc.name.replace(oldName, newName)),
                }))
              : tree.subComponents
            // Also update assembly tree tags that reference sub-component names
            const updatedAssembly = newName !== oldName
              ? renameTagsInTree(tree.assemblyTree, oldName, newName)
              : tree.assemblyTree
            onTreeChange({
              ...tree,
              name: newName,
              dataSlot: toDataSlot(newName),
              props,
              variants,
              subComponents: updatedSubComponents,
              assemblyTree: updatedAssembly,
            })
          }}
        />

        {/* ── Sub-components ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Sub-components</h3>
              {tree.subComponents.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {tree.subComponents.length}
                </Badge>
              )}
            </div>
            <AddSubComponentDialog
              parentName={tree.name}
              existingNames={tree.subComponents.map((sc) => sc.name)}
              onAdd={(sc) => {
                // Add to subComponents and assembly tree
                const scNode = createElementNode(sc.name)
                const newAssembly = {
                  ...tree.assemblyTree,
                  children: [...tree.assemblyTree.children, scNode],
                }
                onTreeChange({
                  ...tree,
                  subComponents: [...tree.subComponents, sc],
                  assemblyTree: newAssembly,
                })
              }}
            />
          </div>

          {tree.subComponents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sub-components yet. Add one to create a compound component.
            </p>
          )}

          {tree.subComponents.map((sc, i) => (
            <SubComponentCard
              key={sc.id}
              sc={sc}
              parentName={tree.name}
              onUpdate={(updated) => {
                const newSubs = [...tree.subComponents]
                newSubs[i] = updated
                onTreeChange({ ...tree, subComponents: newSubs })
              }}
              onDelete={() => {
                const newSubs = tree.subComponents.filter((_, idx) => idx !== i)
                // Also remove from assembly tree
                const removeFromAssembly = (node: typeof tree.assemblyTree): typeof tree.assemblyTree => ({
                  ...node,
                  children: node.children
                    .filter((c) => c.tag !== sc.name)
                    .map(removeFromAssembly),
                })
                onTreeChange({
                  ...tree,
                  subComponents: newSubs,
                  assemblyTree: removeFromAssembly(tree.assemblyTree),
                })
              }}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

/* ── ComponentCard — main component ────────────────────────────── */

function ComponentCard({
  name,
  props,
  variants,
  onUpdate,
}: {
  name: string
  props: ComponentProp[]
  variants: CustomVariantDef[]
  onUpdate: (name: string, props: ComponentProp[], variants: CustomVariantDef[]) => void
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold">{name}</h2>
        <EditComponentDialog
          name={name}
          props={props}
          variants={variants}
          onSave={onUpdate}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        {/* Props column */}
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Props
          </p>
          {props.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {props.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{p.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{p.type}</Badge>
                  {p.required && <span className="text-[9px] text-muted-foreground">req</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants column */}
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Variants
          </p>
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {variants.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{v.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{v.type}</Badge>
                  {v.type === "variant" && (
                    <span className="text-[9px] text-muted-foreground">
                      {v.options.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── SubComponentCard ──────────────────────────────────────────── */

function SubComponentCard({
  sc,
  parentName,
  onUpdate,
  onDelete,
}: {
  sc: SubComponentDef
  parentName: string
  onUpdate: (sc: SubComponentDef) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{sc.name}</h3>
          <Badge variant="secondary" className="text-[10px]">
            &lt;{sc.baseElement}&gt;
          </Badge>
          {(sc.usecases ?? []).map((uc) => (
            <Badge key={uc} variant="outline" className="text-[9px]">
              {uc}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <EditComponentDialog
            name={sc.name}
            props={sc.props}
            variants={sc.variants}
            onSave={(newName, props, variants) =>
              onUpdate({ ...sc, name: newName, props, variants })
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Props
          </p>
          {sc.props.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {sc.props.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{p.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{p.type}</Badge>
                  {p.required && <span className="text-[9px] text-muted-foreground">req</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Variants
          </p>
          {sc.variants.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {sc.variants.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{v.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{v.type}</Badge>
                  {v.type === "variant" && (
                    <span className="text-[9px] text-muted-foreground">
                      {v.options.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── EditComponentDialog ───────────────────────────────────────── */

function EditComponentDialog({
  name: initialName,
  props: initialProps,
  variants: initialVariants,
  onSave,
}: {
  name: string
  props: ComponentProp[]
  variants: CustomVariantDef[]
  onSave: (name: string, props: ComponentProp[], variants: CustomVariantDef[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [editName, setEditName] = React.useState(initialName)
  const [props, setProps] = React.useState<ComponentProp[]>(initialProps)
  const [variants, setVariants] = React.useState<CustomVariantDef[]>(initialVariants)

  // Sync when dialog opens
  React.useEffect(() => {
    if (open) {
      setEditName(initialName)
      setProps(initialProps)
      setVariants(initialVariants)
    }
  }, [open, initialName, initialProps, initialVariants])

  const pascalName = React.useMemo(() => {
    if (!editName.trim()) return ""
    return toPascalCase(editName.trim())
  }, [editName])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Pencil className="size-3" />
          Edit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit component</AlertDialogTitle>
          <AlertDialogDescription>
            Update name, props and variants.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Name</Label>
            <div className="flex items-center gap-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 flex-1 text-xs"
                placeholder="Component name"
              />
              {pascalName && pascalName !== editName && (
                <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-semibold">
                  {pascalName}
                </code>
              )}
            </div>
          </div>

          {/* Props */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Props</Label>
            {props.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                <code className="font-medium">{p.name}</code>
                {p.required && <Badge variant="secondary" className="text-[9px]">req</Badge>}
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
            <DialogPropAdder onAdd={(p) => setProps([...props, p])} />
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Variants</Label>
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                <code className="font-medium">{v.name}</code>
                {v.type === "variant" && (
                  <span className="text-[9px] text-muted-foreground">{v.options.join(", ")}</span>
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
            <DialogVariantAdder onAdd={(v) => setVariants([...variants, v])} />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onSave(pascalName || initialName, props, variants)} disabled={!pascalName}>
            Save changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── AddSubComponentDialog ─────────────────────────────────────── */

function AddSubComponentDialog({
  parentName,
  existingNames,
  onAdd,
}: {
  parentName: string
  existingNames: string[]
  onAdd: (sc: SubComponentDef) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [usecases, setUsecases] = React.useState<SubComponentUsecase[]>([])
  const [props, setProps] = React.useState<ComponentProp[]>([])
  const [variants, setVariants] = React.useState<CustomVariantDef[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const pascalName = React.useMemo(() => {
    if (!name.trim()) return ""
    const suffix = toPascalCase(name.trim())
    return `${parentName}${suffix}`
  }, [name, parentName])

  function resetForm() {
    setName("")
    setBaseElement("div")
    setUsecases([])
    setProps([])
    setVariants([])
    setError(null)
  }

  function toggleUsecase(uc: SubComponentUsecase) {
    setUsecases((prev) => {
      if (uc === "wrapper") return prev.includes("wrapper") ? [] : ["wrapper"]
      const without = prev.filter((u) => u !== "wrapper" && u !== uc)
      return prev.includes(uc) ? without : [...without, uc]
    })
  }

  function handleAdd() {
    if (!pascalName) {
      setError("Name is required")
      return
    }
    if (existingNames.includes(pascalName)) {
      setError("A sub-component with this name already exists")
      return
    }

    const sc: SubComponentDef = {
      id: `sc_${Date.now().toString(36)}`,
      name: pascalName,
      baseElement,
      dataSlot: toDataSlot(pascalName),
      usecases,
      tree: createElementNode(baseElement),
      classes: [],
      props,
      variants,
    }

    onAdd(sc)
    resetForm()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="size-3" />
          Add
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add sub-component</AlertDialogTitle>
          <AlertDialogDescription>
            Creates a separate forwardRef export prefixed with {parentName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Start typing..."
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                className="h-8 flex-1 text-xs"
              />
              {pascalName && (
                <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-semibold">
                  {pascalName}
                </code>
              )}
            </div>
          </div>

          {/* Base element */}
          <div className="space-y-1.5">
            <Label className="text-xs">Base element</Label>
            <Select value={baseElement} onValueChange={setBaseElement}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_ELEMENTS.map((el) => (
                  <SelectItem key={el} value={el} className="text-xs">
                    &lt;{el}&gt;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Content type</Label>
            <div className="flex flex-wrap gap-1.5">
              {USECASE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleUsecase(value)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                    usecases.includes(value)
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "border-border text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Props */}
          <div className="space-y-2">
            <Label className="text-xs">Props (optional)</Label>
            {props.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                <code className="font-medium">{p.name}</code>
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
            <DialogPropAdder onAdd={(p) => setProps([...props, p])} />
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <Label className="text-xs">Variants (optional)</Label>
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                <code className="font-medium">{v.name}</code>
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
            <DialogVariantAdder onAdd={(v) => setVariants([...variants, v])} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleAdd} disabled={!pascalName}>
            Add sub-component
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── DialogPropAdder — compact prop adder for dialogs ──────────── */

function DialogPropAdder({ onAdd }: { onAdd: (prop: ComponentProp) => void }) {
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
      <div className="flex flex-1">
        <Select value={type} onValueChange={(v) => setType(v as ComponentProp["type"])}>
          <SelectTrigger className="h-7 w-20 rounded-r-none border-r-0 text-[10px]">
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
          className="h-7 rounded-none border-x-0 text-[10px]"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-l-none gap-1 text-[10px]"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Plus className="size-2.5" />
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Switch checked={required} onCheckedChange={setRequired} className="scale-[0.6]" />
        <span className="text-[9px] text-muted-foreground">Req</span>
      </div>
    </div>
  )
}

/* ── DialogVariantAdder — compact variant adder for dialogs ────── */

function DialogVariantAdder({ onAdd }: { onAdd: (v: CustomVariantDef) => void }) {
  const [variantName, setVariantName] = React.useState("")
  const [variantType, setVariantType] = React.useState<"variant" | "boolean">("variant")
  const [options, setOptions] = React.useState<string[]>([])
  const [optionInput, setOptionInput] = React.useState("")
  const [defaultValue, setDefaultValue] = React.useState("")

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
        <div className="flex flex-1">
          <Select value={variantType} onValueChange={(v) => setVariantType(v as "variant" | "boolean")}>
            <SelectTrigger className="h-7 w-20 shrink-0 rounded-r-none border-r-0 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">Variant</SelectItem>
              <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Name"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className="h-7 w-24 shrink-0 rounded-none border-x-0 text-[10px]"
          />
          {variantType === "variant" && (
            <div
              className="flex h-7 min-w-0 flex-1 cursor-text items-center gap-1 overflow-x-auto border-y border-x-0 px-1.5"
              onClick={() => document.getElementById("dlg-variant-opts")?.focus()}
            >
              {options.map((opt) => (
                <Badge
                  key={opt}
                  variant={opt === defaultValue ? "default" : "secondary"}
                  className="shrink-0 cursor-pointer gap-0.5 text-[9px] h-4"
                  onClick={(e) => { e.stopPropagation(); setDefaultValue(opt) }}
                >
                  {opt}
                  <button
                    type="button"
                    className="hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setOptions(options.filter((o) => o !== opt)) }}
                  >
                    <X className="size-2" />
                  </button>
                </Badge>
              ))}
              <input
                id="dlg-variant-opts"
                placeholder={options.length === 0 ? "Options (comma)" : ""}
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddOptions() }
                  if (e.key === "Backspace" && optionInput === "" && options.length > 0) {
                    setOptions(options.slice(0, -1))
                  }
                }}
                onBlur={handleAddOptions}
                className="h-full min-w-[40px] flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 rounded-l-none gap-1 text-[10px]"
            onClick={handleAdd}
            disabled={!variantName.trim() || (variantType === "variant" && options.length < 2)}
          >
            <Plus className="size-2.5" />
          </Button>
        </div>
        {variantType === "boolean" && (
          <div className="flex shrink-0 items-center gap-1">
            <Switch
              checked={defaultValue === "true"}
              onCheckedChange={(c) => setDefaultValue(c ? "true" : "false")}
              className="scale-[0.6]"
            />
            <span className="text-[9px] text-muted-foreground">
              {defaultValue === "true" ? "true" : "false"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
