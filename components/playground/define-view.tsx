"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, ArrowUpDown, Settings } from "lucide-react"
import { deleteUserComponent, toSlug } from "@/lib/component-store"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
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

/** Add a node to the assembly tree, optionally nested inside a specific sub-component */
function addToAssemblyTree(
  assemblyTree: ElementNode,
  newNodeTag: string,
  nestInside?: string,
): ElementNode {
  if (!nestInside) {
    return {
      ...assemblyTree,
      children: [...assemblyTree.children, createElementNode(newNodeTag)],
    }
  }
  function addInside(node: ElementNode): ElementNode {
    if (node.tag === nestInside) {
      return {
        ...node,
        children: [...node.children, createElementNode(newNodeTag)],
      }
    }
    return { ...node, children: node.children.map(addInside) }
  }
  return addInside(assemblyTree)
}

/** Remove a node by tag from the assembly tree (recursive) */
function removeFromAssemblyTree(
  node: ElementNode,
  tagToRemove: string,
): ElementNode {
  return {
    ...node,
    children: node.children
      .filter((c) => c.tag !== tagToRemove)
      .map((c) => removeFromAssemblyTree(c, tagToRemove)),
  }
}

/** Move a node from one parent to another in the assembly tree */
function moveInAssemblyTree(
  assemblyTree: ElementNode,
  nodeTag: string,
  newParentTag?: string,
): ElementNode {
  const removed = removeFromAssemblyTree(assemblyTree, nodeTag)
  return addToAssemblyTree(removed, nodeTag, newParentTag)
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
  function handleDeleteComponent() {
    deleteUserComponent(toSlug(tree.name))
    window.location.href = "/"
  }

  /* ── Compound prop/variant handlers ── */

  function handleUpdateCompoundProp(index: number, updated: ComponentProp) {
    const newProps = [...tree.props]
    newProps[index] = updated
    onTreeChange({ ...tree, props: newProps })
  }

  function handleDeleteCompoundProp(index: number) {
    onTreeChange({ ...tree, props: tree.props.filter((_, i) => i !== index) })
  }

  function handleAddCompoundProp(prop: ComponentProp) {
    onTreeChange({ ...tree, props: [...tree.props, prop] })
  }

  function handleUpdateCompoundVariant(index: number, updated: CustomVariantDef) {
    const newVariants = [...tree.variants]
    newVariants[index] = updated
    onTreeChange({ ...tree, variants: newVariants })
  }

  function handleDeleteCompoundVariant(index: number) {
    onTreeChange({ ...tree, variants: tree.variants.filter((_, i) => i !== index) })
  }

  function handleAddCompoundVariant(variant: CustomVariantDef) {
    onTreeChange({ ...tree, variants: [...tree.variants, variant] })
  }

  /* ── Sub-component prop/variant handlers ── */

  function handleUpdateSubProp(scIndex: number, propIndex: number, updated: ComponentProp) {
    const newSubs = [...tree.subComponents]
    const newProps = [...newSubs[scIndex].props]
    newProps[propIndex] = updated
    newSubs[scIndex] = { ...newSubs[scIndex], props: newProps }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function handleDeleteSubProp(scIndex: number, propIndex: number) {
    const newSubs = [...tree.subComponents]
    newSubs[scIndex] = {
      ...newSubs[scIndex],
      props: newSubs[scIndex].props.filter((_, i) => i !== propIndex),
    }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function handleAddSubProp(scIndex: number, prop: ComponentProp) {
    const newSubs = [...tree.subComponents]
    newSubs[scIndex] = {
      ...newSubs[scIndex],
      props: [...newSubs[scIndex].props, prop],
    }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function handleUpdateSubVariant(scIndex: number, varIndex: number, updated: CustomVariantDef) {
    const newSubs = [...tree.subComponents]
    const newVariants = [...newSubs[scIndex].variants]
    newVariants[varIndex] = updated
    newSubs[scIndex] = { ...newSubs[scIndex], variants: newVariants }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function handleDeleteSubVariant(scIndex: number, varIndex: number) {
    const newSubs = [...tree.subComponents]
    newSubs[scIndex] = {
      ...newSubs[scIndex],
      variants: newSubs[scIndex].variants.filter((_, i) => i !== varIndex),
    }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  function handleAddSubVariant(scIndex: number, variant: CustomVariantDef) {
    const newSubs = [...tree.subComponents]
    newSubs[scIndex] = {
      ...newSubs[scIndex],
      variants: [...newSubs[scIndex].variants, variant],
    }
    onTreeChange({ ...tree, subComponents: newSubs })
  }

  return (
    <ScrollArea className="flex-1">
      <div className="w-full max-w-2xl space-y-8 p-8">
        {/* ── Main component ───────────────────────────────── */}
        <div className="space-y-4 rounded-lg bg-muted p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{tree.name}</h1>
              <Badge variant="secondary" className="text-xs">
                &lt;{tree.baseElement}&gt;
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <EditSettingsDialog
                name={tree.name}
                baseElement={tree.baseElement}
                isCompound
                onSave={(newName, newBaseElement) => {
                  const oldName = tree.name
                  const updatedSubComponents = newName !== oldName
                    ? tree.subComponents.map((sc) => ({
                        ...sc,
                        name: sc.name.replace(oldName, newName),
                        dataSlot: toDataSlot(sc.name.replace(oldName, newName)),
                      }))
                    : tree.subComponents
                  const updatedAssembly = newName !== oldName
                    ? renameTagsInTree(tree.assemblyTree, oldName, newName)
                    : tree.assemblyTree
                  const updatedTree = newBaseElement !== tree.baseElement
                    ? { ...updatedAssembly, tag: newBaseElement }
                    : updatedAssembly
                  onTreeChange({
                    ...tree,
                    name: newName,
                    dataSlot: toDataSlot(newName),
                    baseElement: newBaseElement,
                    tree: { ...tree.tree, tag: newBaseElement },
                    subComponents: updatedSubComponents,
                    assemblyTree: updatedTree,
                  })
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
                      This will permanently delete this component and all its sub-components. This action cannot be undone.
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
            </div>
          </div>

          {/* Inline props */}
          <InlinePropsSection
            props={tree.props}
            onUpdate={handleUpdateCompoundProp}
            onDelete={handleDeleteCompoundProp}
            onAdd={handleAddCompoundProp}
          />

          {/* Inline variants */}
          <InlineVariantsSection
            variants={tree.variants}
            onUpdate={handleUpdateCompoundVariant}
            onDelete={handleDeleteCompoundVariant}
            onAdd={handleAddCompoundVariant}
          />
        </div>

        {/* ── Sub-components ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Sub-components</h2>
              {tree.subComponents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tree.subComponents.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {tree.subComponents.length > 1 && (
                <ReorderDialog
                  subComponents={tree.subComponents}
                  onReorder={(reordered) => onTreeChange({ ...tree, subComponents: reordered })}
                />
              )}
              <AddSubComponentDialog
                parentName={tree.name}
                existingNames={tree.subComponents.map((sc) => sc.name)}
                existingSubComponents={tree.subComponents}
                onAdd={(sc) => {
                  const newAssembly = addToAssemblyTree(
                    tree.assemblyTree,
                    sc.name,
                    sc.nestInside,
                  )
                  onTreeChange({
                    ...tree,
                    subComponents: [...tree.subComponents, sc],
                    assemblyTree: newAssembly,
                  })
                }}
              />
            </div>
          </div>

          {tree.subComponents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sub-components yet. Add one to create a compound component.
            </p>
          )}

          {tree.subComponents.map((sc, i) => (
            <div
              key={sc.id}
              className="group/card rounded-lg border bg-background p-4 transition-colors hover:border-muted-foreground/30 hover:bg-muted/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{sc.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    &lt;{sc.baseElement}&gt;
                  </Badge>
                  {(sc.usecases ?? []).map((uc) => (
                    <Badge key={uc} variant="outline" className="text-xs">
                      {uc}
                    </Badge>
                  ))}
                  {sc.nestInside && (
                    <span className="text-xs text-muted-foreground">
                      nests inside {sc.nestInside}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                  <EditSettingsDialog
                    name={sc.name}
                    baseElement={sc.baseElement}
                    usecases={sc.usecases}
                    nestInside={sc.nestInside}
                    existingSubComponents={tree.subComponents.filter((s) => s.id !== sc.id)}
                    onSave={(newName, newBaseElement, newUsecases, newNestInside) => {
                      const newSubs = [...tree.subComponents]
                      const oldName = sc.name
                      newSubs[i] = {
                        ...sc,
                        name: newName,
                        dataSlot: toDataSlot(newName),
                        baseElement: newBaseElement,
                        usecases: newUsecases ?? sc.usecases,
                        nestInside: newNestInside,
                      }

                      let updatedAssembly = tree.assemblyTree
                      if (newName !== oldName) {
                        updatedAssembly = renameTagsInTree(updatedAssembly, oldName, newName)
                      }
                      // Handle nestInside change
                      if (sc.nestInside !== newNestInside) {
                        updatedAssembly = moveInAssemblyTree(
                          updatedAssembly,
                          newName,
                          newNestInside,
                        )
                      }
                      onTreeChange({
                        ...tree,
                        subComponents: newSubs,
                        assemblyTree: updatedAssembly,
                      })
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
                          This will remove this sub-component. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            const newSubs = tree.subComponents.filter((_, idx) => idx !== i)
                            const newAssembly = removeFromAssemblyTree(tree.assemblyTree, sc.name)
                            onTreeChange({
                              ...tree,
                              subComponents: newSubs,
                              assemblyTree: newAssembly,
                            })
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Inline props */}
              <div className="mt-3">
                <InlinePropsSection
                  props={sc.props}
                  onUpdate={(idx, updated) => handleUpdateSubProp(i, idx, updated)}
                  onDelete={(idx) => handleDeleteSubProp(i, idx)}
                  onAdd={(prop) => handleAddSubProp(i, prop)}
                />
              </div>

              {/* Inline variants */}
              <div className="mt-3">
                <InlineVariantsSection
                  variants={sc.variants}
                  onUpdate={(idx, updated) => handleUpdateSubVariant(i, idx, updated)}
                  onDelete={(idx) => handleDeleteSubVariant(i, idx)}
                  onAdd={(variant) => handleAddSubVariant(i, variant)}
                />
              </div>
            </div>
          ))}
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
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Props
      </p>
      {props.length === 0 && (
        <p className="text-xs text-muted-foreground/60">No props defined.</p>
      )}
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
  )
}

/* ── PropRow — single prop with hover-reveal edit/delete ── */

function PropRow({
  prop,
  onUpdate,
  onDelete,
}: {
  prop: ComponentProp
  onUpdate: (prop: ComponentProp) => void
  onDelete: () => void
}) {
  return (
    <div className="group/row flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted/40">
      <Badge variant="outline" className="h-5 text-xs">{prop.type}</Badge>
      <code className="font-medium">{prop.name}</code>
      {prop.required && (
        <Badge variant="secondary" className="h-4 px-1.5 text-xs">req</Badge>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
        <EditPropPopover prop={prop} onSave={onUpdate} />
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
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

/* ── InlineVariantsSection — variants displayed inline with popover add/edit ── */

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
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Variants
      </p>
      {variants.length === 0 && (
        <p className="text-xs text-muted-foreground/60">No variants defined.</p>
      )}
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
  )
}

/* ── VariantRow — single variant with hover-reveal edit/delete ── */

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
    <div className="group/row rounded-md px-2 py-1 text-xs hover:bg-muted/40">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="h-5 text-xs">{variant.type}</Badge>
        <code className="font-medium">{variant.name}</code>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
          <EditVariantPopover variant={variant} onSave={onUpdate} />
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-0.5 text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {variant.type === "variant" && variant.options.length > 0 && (
        <div className="mt-1 ml-7 space-y-1">
          <div className="flex flex-wrap gap-1">
            {variant.options.map((opt) => (
              <Badge
                key={opt}
                variant={opt === variant.defaultValue ? "default" : "secondary"}
                className="text-xs h-5"
              >
                {opt}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Default: {variant.defaultValue}
          </p>
        </div>
      )}
      {variant.type === "boolean" && (
        <p className="mt-1 ml-7 text-xs text-muted-foreground">
          Default: {variant.defaultValue}
        </p>
      )}
    </div>
  )
}

/* ── AddVariantPopover — popover to add a new variant ── */

function AddVariantPopover({ onAdd }: { onAdd: (v: CustomVariantDef) => void }) {
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

/* ── EditVariantPopover — popover to edit an existing variant ── */

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

/* ── VariantOptionsEditor — shared flex-wrap badge input for options ── */

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

/* ── EditSettingsDialog — general settings only (name, base element, content type, nests inside) ── */

function EditSettingsDialog({
  name: initialName,
  baseElement: initialBaseElement,
  usecases: initialUsecases,
  nestInside: initialNestInside,
  isCompound,
  existingSubComponents,
  onSave,
}: {
  name: string
  baseElement: string
  usecases?: SubComponentUsecase[]
  nestInside?: string
  isCompound?: boolean
  existingSubComponents?: SubComponentDef[]
  onSave: (
    name: string,
    baseElement: string,
    usecases?: SubComponentUsecase[],
    nestInside?: string,
  ) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [editName, setEditName] = React.useState(initialName)
  const [baseElement, setBaseElement] = React.useState(initialBaseElement)
  const [usecases, setUsecases] = React.useState<SubComponentUsecase[]>(initialUsecases ?? [])
  const [nestInside, setNestInside] = React.useState(initialNestInside ?? "")
  const isSubComponent = !isCompound

  function toggleUsecase(uc: SubComponentUsecase) {
    setUsecases((prev) => {
      if (uc === "wrapper") return prev.includes("wrapper") ? [] : ["wrapper"]
      const without = prev.filter((u) => u !== "wrapper" && u !== uc)
      return prev.includes(uc) ? without : [...without, uc]
    })
  }

  React.useEffect(() => {
    if (open) {
      setEditName(initialName)
      setBaseElement(initialBaseElement)
      setUsecases(initialUsecases ?? [])
      setNestInside(initialNestInside ?? "")
    }
  }, [open, initialName, initialBaseElement, initialUsecases, initialNestInside])

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
          {/* Name */}
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

          {/* Base element — for BOTH compound and sub-components */}
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

          {/* Content type — sub-components only */}
          {isSubComponent && (
            <div className="space-y-1.5">
              <Label className="text-xs">Content type</Label>
              <div className="flex flex-wrap gap-1.5">
                {USECASE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleUsecase(value)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
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
          )}

          {/* Nests inside — sub-components only */}
          {isSubComponent && existingSubComponents && (
            <div className="space-y-1.5">
              <Label className="text-xs">Nests inside</Label>
              <Select
                value={nestInside || "__root__"}
                onValueChange={(v) => setNestInside(v === "__root__" ? "" : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__" className="text-xs">
                    Root (direct child)
                  </SelectItem>
                  {existingSubComponents.map((sc) => (
                    <SelectItem key={sc.id} value={sc.name} className="text-xs">
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              onSave(
                pascalName || initialName,
                baseElement,
                isSubComponent ? usecases : undefined,
                isSubComponent ? (nestInside || undefined) : undefined,
              )
            }
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
  subComponents: SubComponentDef[]
  onReorder: (reordered: SubComponentDef[]) => void
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
            <div key={sc.id} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setDropIdx(i) }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDropIdx(null) }}
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
  existingSubComponents,
  onAdd,
}: {
  parentName: string
  existingNames: string[]
  existingSubComponents: SubComponentDef[]
  onAdd: (sc: SubComponentDef & { nestInside?: string }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [usecases, setUsecases] = React.useState<SubComponentUsecase[]>([])
  const [nestInside, setNestInside] = React.useState("")
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
    setNestInside("")
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

    const sc: SubComponentDef & { nestInside?: string } = {
      id: `sc_${Date.now().toString(36)}`,
      name: pascalName,
      baseElement,
      dataSlot: toDataSlot(pascalName),
      usecases,
      tree: createElementNode(baseElement),
      classes: [],
      props: [],
      variants: [],
      nestInside: nestInside || undefined,
    }

    onAdd(sc)
    resetForm()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
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
                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
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

          {/* Nests inside */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nests inside</Label>
            <Select
              value={nestInside || "__root__"}
              onValueChange={(v) => setNestInside(v === "__root__" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__" className="text-xs">
                  Root (direct child)
                </SelectItem>
                {existingSubComponents.map((sc) => (
                  <SelectItem key={sc.id} value={sc.name} className="text-xs">
                    {sc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
