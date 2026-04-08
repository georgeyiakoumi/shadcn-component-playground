"use client"

import * as React from "react"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUpDown,
  Settings,
  ToggleLeft,
  Type,
  Hash,
  Blocks,
  Diamond,
} from "lucide-react"
import { deleteUserComponent, toSlug } from "@/lib/component-store"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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

import type { ComponentTreeV2, SubComponentV2 } from "@/lib/component-tree-v2"
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"
import { toPascalCase } from "@/lib/code-generator"
import {
  addSubComponent,
  readPropsFromSub,
  readVariantsFromSub,
  removeSubComponent,
  renameSubComponent,
  reorderSubComponents,
  setPropsOnSub,
  setVariantsOnSub,
} from "@/lib/parser/v2-tree-define"

/* ── Constants ──────────────────────────────────────────────────── */

const PROP_TYPES = ["string", "number", "boolean", "ReactNode"] as const

const HTML_ELEMENTS = [
  "div",
  "section",
  "header",
  "footer",
  "nav",
  "aside",
  "span",
  "p",
  "ul",
  "li",
  "button",
  "a",
  "form",
  "input",
  "textarea",
  "select",
  "img",
  "article",
]

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
]

/** Local helper — kebab-case for data slot, mirrors the factories' helper. */
function toDataSlot(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/** Get the base HTML/component tag of a sub-component for display. */
function getSubBaseTag(sub: SubComponentV2): string {
  const base = sub.parts.root.base
  if (base.kind === "html") return base.tag
  if (base.kind === "component-ref") return base.name
  if (base.kind === "radix") return `${base.primitive}.${base.part}`
  if (base.kind === "third-party") return base.component
  return base.localName
}

/* ── Props ──────────────────────────────────────────────────────── */

interface DefineViewProps {
  tree: ComponentTreeV2
  onTreeChange: (tree: ComponentTreeV2) => void
}

/* ── Component ──────────────────────────────────────────────────── */

export function DefineView({ tree, onTreeChange }: DefineViewProps) {
  const rootSub = tree.subComponents[0]
  if (!rootSub) return null

  const rootProps = readPropsFromSub(rootSub)
  const rootVariants = readVariantsFromSub(rootSub, tree.cvaExports)
  const rootBaseTag = getSubBaseTag(rootSub)

  function handleDeleteComponent() {
    deleteUserComponent(toSlug(tree.name))
    window.location.href = "/"
  }

  /* ── Root sub-component prop/variant handlers ── */

  function setRootProps(props: ComponentProp[]) {
    const newSubs = [...tree.subComponents]
    newSubs[0] = setPropsOnSub(newSubs[0], props)
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function setRootVariants(variants: CustomVariantDef[]) {
    onTreeChange(setVariantsOnSub(tree, 0, variants))
  }

  function handleUpdateRootProp(index: number, updated: ComponentProp) {
    const newProps = [...rootProps]
    newProps[index] = updated
    setRootProps(newProps)
  }

  function handleDeleteRootProp(index: number) {
    setRootProps(rootProps.filter((_, i) => i !== index))
  }

  function handleAddRootProp(prop: ComponentProp) {
    setRootProps([...rootProps, prop])
  }

  function handleUpdateRootVariant(index: number, updated: CustomVariantDef) {
    const newVariants = [...rootVariants]
    newVariants[index] = updated
    setRootVariants(newVariants)
  }

  function handleDeleteRootVariant(index: number) {
    setRootVariants(rootVariants.filter((_, i) => i !== index))
  }

  function handleAddRootVariant(variant: CustomVariantDef) {
    setRootVariants([...rootVariants, variant])
  }

  /* ── Sub-component handlers (siblings of root, indexed from 1) ── */

  function setSubProps(scIndex: number, props: ComponentProp[]) {
    const newSubs = [...tree.subComponents]
    if (!newSubs[scIndex]) return
    newSubs[scIndex] = setPropsOnSub(newSubs[scIndex], props)
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function setSubVariants(scIndex: number, variants: CustomVariantDef[]) {
    onTreeChange(setVariantsOnSub(tree, scIndex, variants))
  }

  function handleUpdateSubProp(
    scIndex: number,
    propIndex: number,
    updated: ComponentProp,
  ) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    const subProps = readPropsFromSub(sub)
    const newProps = [...subProps]
    newProps[propIndex] = updated
    setSubProps(scIndex, newProps)
  }

  function handleDeleteSubProp(scIndex: number, propIndex: number) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    const subProps = readPropsFromSub(sub)
    setSubProps(
      scIndex,
      subProps.filter((_, i) => i !== propIndex),
    )
  }

  function handleAddSubProp(scIndex: number, prop: ComponentProp) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    setSubProps(scIndex, [...readPropsFromSub(sub), prop])
  }

  function handleUpdateSubVariant(
    scIndex: number,
    varIndex: number,
    updated: CustomVariantDef,
  ) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    const subVariants = readVariantsFromSub(sub, tree.cvaExports)
    const newVariants = [...subVariants]
    newVariants[varIndex] = updated
    setSubVariants(scIndex, newVariants)
  }

  function handleDeleteSubVariant(scIndex: number, varIndex: number) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    const subVariants = readVariantsFromSub(sub, tree.cvaExports)
    setSubVariants(
      scIndex,
      subVariants.filter((_, i) => i !== varIndex),
    )
  }

  function handleAddSubVariant(scIndex: number, variant: CustomVariantDef) {
    const sub = tree.subComponents[scIndex]
    if (!sub) return
    const subVariants = readVariantsFromSub(sub, tree.cvaExports)
    setSubVariants(scIndex, [...subVariants, variant])
  }

  /* ── Sub-component CRUD ── */

  function handleAddSubComponent(name: string, baseTag: string) {
    onTreeChange(addSubComponent(tree, name, baseTag))
  }

  function handleDeleteSubComponent(scIndex: number) {
    onTreeChange(removeSubComponent(tree, scIndex))
  }

  function handleRenameSubComponent(
    scIndex: number,
    newName: string,
    newBaseTag: string,
  ) {
    onTreeChange(renameSubComponent(tree, scIndex, newName, newBaseTag))
  }

  function handleRenameRoot(newName: string, newBaseTag: string) {
    onTreeChange(renameSubComponent(tree, 0, newName, newBaseTag))
  }

  function handleReorderSubComponents(reordered: SubComponentV2[]) {
    // The reordered list contains the non-root sub-components only.
    // Prepend the root.
    onTreeChange(reorderSubComponents(tree, [tree.subComponents[0], ...reordered]))
  }

  // Sub-components other than the root (indices 1+)
  const childSubs = tree.subComponents.slice(1)

  return (
    <ScrollArea className="flex-1">
      <div className="w-full max-w-2xl space-y-8 p-8">
        {/* ── Main component ───────────────────────────────── */}
        <Card className="group/compound">
          <CardHeader>
            <CardTitle className="text-lg">{tree.name}</CardTitle>
            <CardDescription>&lt;{rootBaseTag}&gt;</CardDescription>
            <CardAction className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover/compound:opacity-100">
              <EditSettingsDialog
                name={tree.name}
                baseElement={rootBaseTag}
                isCompound
                onSave={(newName, newBaseElement) => {
                  // Renaming the root also renames the tree's `name`. The
                  // helper updates the sub-component, then we update the
                  // tree-level name afterwards.
                  const renamed = renameSubComponent(
                    tree,
                    0,
                    newName,
                    newBaseElement,
                  )
                  onTreeChange({ ...renamed, name: newName, slug: toSlug(newName) })
                }}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {tree.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this component and all its
                      sub-components. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteComponent}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            <InlinePropsSection
              props={rootProps}
              onUpdate={handleUpdateRootProp}
              onDelete={handleDeleteRootProp}
              onAdd={handleAddRootProp}
            />
            <InlineVariantsSection
              variants={rootVariants}
              onUpdate={handleUpdateRootVariant}
              onDelete={handleDeleteRootVariant}
              onAdd={handleAddRootVariant}
            />
          </CardContent>
          {rootVariants.length > 0 && (
            <CardFooter className="text-xs text-muted-foreground">
              <span className="font-semibold">Defaults:</span>&nbsp;
              {rootVariants.map((v, i) => (
                <React.Fragment key={v.name}>
                  {i > 0 && ", "}
                  {v.name}: <em>{v.defaultValue}</em>
                </React.Fragment>
              ))}
            </CardFooter>
          )}
        </Card>

        {/* ── Sub-components ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Sub-components</h2>
              {childSubs.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {childSubs.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {childSubs.length > 1 && (
                <ReorderDialog
                  subComponents={childSubs}
                  onReorder={handleReorderSubComponents}
                />
              )}
              <AddSubComponentDialog
                parentName={tree.name}
                existingNames={childSubs.map((sc) => sc.name)}
                onAdd={(name, baseTag) => handleAddSubComponent(name, baseTag)}
              />
            </div>
          </div>

          {childSubs.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sub-components yet. Add one to create a compound component.
            </p>
          )}

          {childSubs.map((sc, childIndex) => {
            const scIndex = childIndex + 1 // index in tree.subComponents
            const subProps = readPropsFromSub(sc)
            const subVariants = readVariantsFromSub(sc, tree.cvaExports)
            const subBaseTag = getSubBaseTag(sc)

            return (
              <Card key={sc.name} className="group/card">
                <CardHeader>
                  <CardTitle className="text-sm">{sc.name}</CardTitle>
                  <CardDescription>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span>&lt;{subBaseTag}&gt;</span>
                    </span>
                  </CardDescription>
                  <CardAction className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                    <EditSettingsDialog
                      name={sc.name}
                      baseElement={subBaseTag}
                      onSave={(newName, newBaseElement) => {
                        handleRenameSubComponent(scIndex, newName, newBaseElement)
                      }}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {sc.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove this sub-component. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteSubComponent(scIndex)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InlinePropsSection
                    props={subProps}
                    onUpdate={(idx, updated) =>
                      handleUpdateSubProp(scIndex, idx, updated)
                    }
                    onDelete={(idx) => handleDeleteSubProp(scIndex, idx)}
                    onAdd={(prop) => handleAddSubProp(scIndex, prop)}
                  />
                  <InlineVariantsSection
                    variants={subVariants}
                    onUpdate={(idx, updated) =>
                      handleUpdateSubVariant(scIndex, idx, updated)
                    }
                    onDelete={(idx) => handleDeleteSubVariant(scIndex, idx)}
                    onAdd={(variant) => handleAddSubVariant(scIndex, variant)}
                  />
                </CardContent>
                {subVariants.length > 0 && (
                  <CardFooter className="text-xs text-muted-foreground">
                    <span className="font-semibold">Defaults:</span>&nbsp;
                    {subVariants.map((v, vi) => (
                      <React.Fragment key={v.name}>
                        {vi > 0 && ", "}
                        {v.name}: <em>{v.defaultValue}</em>
                      </React.Fragment>
                    ))}
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

/* ── InlinePropsSection — props displayed inline with popover add/edit ── */

function InlinePropsSection({
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

/* ── PropRow — using Item component ── */

const PROP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  ReactNode: Blocks,
}

function PropRow({
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
            <span className="text-destructive" title="Required">
              *
            </span>
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

/* ── AddPropPopover — popover to add a new prop ── */

function AddPropPopover({ onAdd }: { onAdd: (prop: ComponentProp) => void }) {
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
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
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
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
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

/* ── EditPropPopover — popover to edit an existing prop ── */

function EditPropPopover({
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
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
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

/* ── InlineVariantsSection ─────────────────────────────────────── */

function InlineVariantsSection({
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
        <p className="py-1 text-xs text-muted-foreground/60">
          No variants defined.
        </p>
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

/* ── VariantRow ─────────────────────────────────────────────────── */

function VariantRow({
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

/* ── AddVariantPopover ─────────────────────────────────────────── */

function AddVariantPopover({
  onAdd,
}: {
  onAdd: (v: CustomVariantDef) => void
}) {
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
      defaultValue:
        type === "boolean"
          ? defaultValue || "false"
          : defaultValue || options[0] || "",
    })
    reset()
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="size-3.5" />
          Add variant
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3 p-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "variant" | "boolean")}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">
                Variant
              </SelectItem>
              <SelectItem value="boolean" className="text-xs">
                Boolean
              </SelectItem>
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

/* ── EditVariantPopover ────────────────────────────────────────── */

function EditVariantPopover({
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
      defaultValue:
        type === "boolean"
          ? defaultValue || "false"
          : defaultValue || options[0] || "",
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
          <Select
            value={type}
            onValueChange={(v) => setType(v as "variant" | "boolean")}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">
                Variant
              </SelectItem>
              <SelectItem value="boolean" className="text-xs">
                Boolean
              </SelectItem>
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

/* ── VariantOptionsEditor ──────────────────────────────────────── */

function VariantOptionsEditor({
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
      className="flex min-h-[28px] flex-wrap items-center gap-1 rounded-md border px-1.5 py-1 cursor-text"
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      {options.map((opt) => (
        <Badge
          key={opt}
          variant={opt === defaultValue ? "default" : "secondary"}
          className="shrink-0 cursor-pointer gap-0.5 text-xs h-5"
          onClick={(e) => {
            e.stopPropagation()
            onDefaultChange(opt)
          }}
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
          if (
            e.key === "Backspace" &&
            optionInput === "" &&
            options.length > 0
          ) {
            onOptionsChange(options.slice(0, -1))
          }
        }}
        onBlur={onCommitOptions}
        className="h-full min-w-[40px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

/* ── EditSettingsDialog ────────────────────────────────────────── */

function EditSettingsDialog({
  name: initialName,
  baseElement: initialBaseElement,
  isCompound,
  onSave,
}: {
  name: string
  baseElement: string
  isCompound?: boolean
  onSave: (name: string, baseElement: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [editName, setEditName] = React.useState(initialName)
  const [baseElement, setBaseElement] = React.useState(initialBaseElement)
  const isSubComponent = !isCompound

  React.useEffect(() => {
    if (open) {
      setEditName(initialName)
      setBaseElement(initialBaseElement)
    }
  }, [open, initialName, initialBaseElement])

  const pascalName = React.useMemo(() => {
    if (!editName.trim()) return ""
    return toPascalCase(editName.trim())
  }, [editName])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="size-4" />
          Edit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSubComponent ? "Edit sub-component" : "Edit component"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Update general settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
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

          <div className="space-y-1.5">
            <Label className="text-xs">Based on</Label>
            <Select value={baseElement} onValueChange={setBaseElement}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">
                    HTML elements
                  </SelectLabel>
                  {HTML_ELEMENTS.map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      &lt;{el}&gt;
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">
                    shadcn components
                  </SelectLabel>
                  {SHADCN_BASE_COMPONENTS.map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      {el}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onSave(pascalName || initialName, baseElement)}
            disabled={!pascalName}
          >
            Save changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── ReorderDialog — drag-and-drop reordering in a dialog ──────── */

function ReorderDialog({
  subComponents,
  onReorder,
}: {
  subComponents: SubComponentV2[]
  onReorder: (reordered: SubComponentV2[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState(subComponents)
  const [dragIdx, setDragIdx] = React.useState<number | null>(null)
  const [dropIdx, setDropIdx] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (open) setItems(subComponents)
  }, [open, subComponents])

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      setDropIdx(null)
      return
    }
    const newItems = [...items]
    const [moved] = newItems.splice(dragIdx, 1)
    newItems.splice(targetIdx, 0, moved)
    setItems(newItems)
    setDragIdx(null)
    setDropIdx(null)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown />
          Reorder
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Reorder sub-components</AlertDialogTitle>
          <AlertDialogDescription>
            Drag to reorder. This changes the order in the exported code.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1 py-2">
          {items.map((sc, i) => (
            <div key={sc.name} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropIdx(i)
                }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => {
                  setDragIdx(null)
                  setDropIdx(null)
                }}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-md border px-3 py-2 transition-all cursor-grab active:cursor-grabbing",
                  dragIdx === i && "opacity-50",
                  dropIdx === i && dragIdx !== i && "border-blue-500 border-t-2",
                )}
              >
                <span className="text-muted-foreground/40">&#x2807;</span>
                <span className="text-sm font-medium">{sc.name}</span>
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onReorder(items)}>
            Apply order
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
  onAdd: (name: string, baseTag: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [error, setError] = React.useState<string | null>(null)

  const pascalName = React.useMemo(() => {
    if (!name.trim()) return ""
    const suffix = toPascalCase(name.trim())
    return `${parentName}${suffix}`
  }, [name, parentName])

  function resetForm() {
    setName("")
    setBaseElement("div")
    setError(null)
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
    onAdd(pascalName, baseElement)
    resetForm()
    setOpen(false)
  }

  function handleAddAnother() {
    if (!pascalName) {
      setError("Name is required")
      return
    }
    if (existingNames.includes(pascalName)) {
      setError("A sub-component with this name already exists")
      return
    }
    onAdd(pascalName, baseElement)
    const keepBase = baseElement
    resetForm()
    setBaseElement(keepBase)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add sub-component</AlertDialogTitle>
          <AlertDialogDescription>
            Creates a new exported sub-component prefixed with {parentName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Start typing..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                className="h-8 flex-1 text-xs"
              />
              {pascalName && (
                <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-semibold">
                  {pascalName}
                </code>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Based on</Label>
            <Select value={baseElement} onValueChange={setBaseElement}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">
                    HTML elements
                  </SelectLabel>
                  {HTML_ELEMENTS.map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      &lt;{el}&gt;
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-xs text-muted-foreground">
                    shadcn components
                  </SelectLabel>
                  {SHADCN_BASE_COMPONENTS.map((el) => (
                    <SelectItem key={el} value={el} className="text-xs">
                      {el}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={handleAddAnother} disabled={!pascalName}>
            Add another
          </Button>
          <Button onClick={handleAdd} disabled={!pascalName}>
            Add
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
