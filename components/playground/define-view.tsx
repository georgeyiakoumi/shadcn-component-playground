"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, ArrowUpDown } from "lucide-react"
import { deleteUserComponent, toSlug } from "@/lib/component-store"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  function handleDeleteComponent() {
    deleteUserComponent(toSlug(tree.name))
    window.location.href = "/"
  }

  return (
    <ScrollArea className="flex-1">
      <div className="w-full max-w-2xl space-y-8 p-8">
        {/* ── Main component ───────────────────────────────── */}
        <div className="space-y-4 rounded-lg bg-muted p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{tree.name}</h1>
            <div className="flex items-center gap-1.5">
              <EditComponentDialog
                name={tree.name}
                props={tree.props}
                variants={tree.variants}
                onSave={(newName, props, variants) => {
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

          {/* Props */}
          {tree.props.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Props
              </p>
              <div className="divide-y">
                {tree.props.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 px-1 py-2">
                    <Badge variant="outline">{p.type}</Badge>
                    <code className="text-xs font-medium">{p.name}</code>
                    {p.required && <Badge variant="secondary">req</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {tree.variants.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Variants
              </p>
              <div className="divide-y">
                {tree.variants.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 px-1 py-2">
                    <Badge variant="outline">{v.type}</Badge>
                    <code className="text-xs font-medium">{v.name}</code>
                    {v.type === "variant" && (
                      <span className="text-xs text-muted-foreground">{v.options.join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for compound */}
          {tree.props.length === 0 && tree.variants.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No props or variants defined. Use Edit to add some.
            </p>
          )}
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
                onAdd={(sc) => {
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
          </div>

          {tree.subComponents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sub-components yet. Add one to create a compound component.
            </p>
          )}

          {tree.subComponents.map((sc, i) => (
            <div
              key={sc.id}
              className="group rounded-lg border bg-background p-4 transition-colors hover:border-muted-foreground/30 hover:bg-muted/20"
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
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <EditComponentDialog
                    name={sc.name}
                    props={sc.props}
                    variants={sc.variants}
                    baseElement={sc.baseElement}
                    usecases={sc.usecases}
                    onSave={(newName, props, variants, newBaseElement, newUsecases) => {
                      const newSubs = [...tree.subComponents]
                      newSubs[i] = {
                        ...sc,
                        name: newName,
                        props,
                        variants,
                        baseElement: newBaseElement ?? sc.baseElement,
                        usecases: newUsecases ?? sc.usecases,
                      }
                      onTreeChange({ ...tree, subComponents: newSubs })
                    }}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                      >
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
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Props — only show if there are any */}
              {sc.props.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Props
                  </p>
                  <div className="divide-y">
                    {sc.props.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 px-1 py-2">
                        <Badge variant="outline">{p.type}</Badge>
                        <code className="text-xs font-medium">{p.name}</code>
                        {p.required && <Badge variant="secondary">req</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants — only show if there are any */}
              {sc.variants.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Variants
                  </p>
                  <div className="divide-y">
                    {sc.variants.map((v) => (
                      <div key={v.name} className="flex items-center gap-2 px-1 py-2">
                        <Badge variant="outline">{v.type}</Badge>
                        <code className="text-xs font-medium">{v.name}</code>
                        {v.type === "variant" && (
                          <span className="text-xs text-muted-foreground">{v.options.join(", ")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

/* ── (ComponentCard removed — main component is now inline) ────── */
/* ── (SubComponentCard removed — sub-components are now inline) ── */

function _unused_ComponentCard({
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
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Props
          </p>
          {props.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {props.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{p.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-xs">{p.type}</Badge>
                  {p.required && <span className="text-xs text-muted-foreground">req</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants column */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Variants
          </p>
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {variants.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{v.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-xs">{v.type}</Badge>
                  {v.type === "variant" && (
                    <span className="text-xs text-muted-foreground">
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
          <Badge variant="secondary" className="text-xs">
            &lt;{sc.baseElement}&gt;
          </Badge>
          {(sc.usecases ?? []).map((uc) => (
            <Badge key={uc} variant="outline" className="text-xs">
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
            size="sm"
            
            onClick={onDelete}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Props
          </p>
          {sc.props.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {sc.props.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{p.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-xs">{p.type}</Badge>
                  {p.required && <span className="text-xs text-muted-foreground">req</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Variants
          </p>
          {sc.variants.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">None</p>
          ) : (
            <div className="space-y-0.5">
              {sc.variants.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5 text-xs">
                  <code className="font-medium">{v.name}</code>
                  <Badge variant="outline" className="h-4 px-1 text-xs">{v.type}</Badge>
                  {v.type === "variant" && (
                    <span className="text-xs text-muted-foreground">
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
  baseElement: initialBaseElement,
  usecases: initialUsecases,
  onSave,
}: {
  name: string
  props: ComponentProp[]
  variants: CustomVariantDef[]
  baseElement?: string
  usecases?: SubComponentUsecase[]
  onSave: (name: string, props: ComponentProp[], variants: CustomVariantDef[], baseElement?: string, usecases?: SubComponentUsecase[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [editName, setEditName] = React.useState(initialName)
  const [props, setProps] = React.useState<ComponentProp[]>(initialProps)
  const [variants, setVariants] = React.useState<CustomVariantDef[]>(initialVariants)
  const [baseElement, setBaseElement] = React.useState(initialBaseElement ?? "div")
  const [usecases, setUsecases] = React.useState<SubComponentUsecase[]>(initialUsecases ?? [])
  const isSubComponent = initialBaseElement !== undefined

  function toggleUsecase(uc: SubComponentUsecase) {
    setUsecases((prev) => {
      if (uc === "wrapper") return prev.includes("wrapper") ? [] : ["wrapper"]
      const without = prev.filter((u) => u !== "wrapper" && u !== uc)
      return prev.includes(uc) ? without : [...without, uc]
    })
  }

  // Sync when dialog opens
  React.useEffect(() => {
    if (open) {
      setEditName(initialName)
      setProps(initialProps)
      setVariants(initialVariants)
      setBaseElement(initialBaseElement ?? "div")
      setUsecases(initialUsecases ?? [])
    }
  }, [open, initialName, initialProps, initialVariants, initialBaseElement, initialUsecases])

  const pascalName = React.useMemo(() => {
    if (!editName.trim()) return ""
    return toPascalCase(editName.trim())
  }, [editName])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" >
          <Pencil />
          Edit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-w-lg flex-col min-h-[420px] max-h-[80vh] p-0">
        {/* Fixed header + tabs */}
        <div className="shrink-0 px-6 pt-6">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSubComponent ? "Edit sub-component" : "Edit component"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update name, props and variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-6">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1 text-xs">
                General
              </TabsTrigger>
              <TabsTrigger value="props" className="flex-1 gap-1 text-xs">
                Props
                {props.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {props.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex-1 gap-1 text-xs">
                Variants
                {variants.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {variants.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── General tab ─────────────────────────────────── */}
          <TabsContent value="general" className="flex-1 overflow-auto px-6 py-4 space-y-4">
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

            {isSubComponent && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Base element</Label>
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
            )}

            {isSubComponent && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Content type</Label>
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
          </TabsContent>

          {/* ── Props tab ───────────────────────────────────── */}
          <TabsContent value="props" className="flex-1 overflow-auto px-6 py-4 space-y-2">
            {props.map((p, i) => (
              <EditablePropRow
                key={i}
                prop={p}
                onUpdate={(updated) => {
                  const newProps = [...props]
                  newProps[i] = updated
                  setProps(newProps)
                }}
                onDelete={() => setProps(props.filter((_, idx) => idx !== i))}
              />
            ))}
            {props.length === 0 && (
              <p className="text-xs text-muted-foreground/60 py-2">No props defined yet.</p>
            )}
            <DialogPropAdder onAdd={(p) => setProps([...props, p])} />
          </TabsContent>

          {/* ── Variants tab ────────────────────────────────── */}
          <TabsContent value="variants" className="flex-1 overflow-auto px-6 py-4 space-y-2">
            {variants.map((v, i) => (
              <EditableVariantRow
                key={i}
                variant={v}
                onUpdate={(updated) => {
                  const newVariants = [...variants]
                  newVariants[i] = updated
                  setVariants(newVariants)
                }}
                onDelete={() => setVariants(variants.filter((_, idx) => idx !== i))}
              />
            ))}
            {variants.length === 0 && (
              <p className="text-xs text-muted-foreground/60 py-2">No variants defined yet.</p>
            )}
            <DialogVariantAdder onAdd={(v) => setVariants([...variants, v])} />
          </TabsContent>
        </Tabs>

        {/* Fixed footer */}
        <div className="shrink-0 border-t px-6 py-4">
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onSave(pascalName || initialName, props, variants, isSubComponent ? baseElement : undefined, isSubComponent ? usecases : undefined)} disabled={!pascalName}>
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
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
        <Button variant="outline" size="sm" >
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
                <span className="text-muted-foreground/40">⠿</span>
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
        <Button variant="outline" size="sm" >
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

          {/* Props */}
          <div className="space-y-2">
            <Label className="text-xs">Props (optional)</Label>
            {props.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">{p.type}</Badge>
                <code className="font-medium">{p.name}</code>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setProps(props.filter((_, idx) => idx !== i))}
                  
                >
                  <X />
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
                <Badge variant="outline" className="text-xs">{v.type}</Badge>
                <code className="font-medium">{v.name}</code>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                  
                >
                  <X />
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

/* ── EditablePropRow — view/edit toggle for a single prop ──────── */

function EditablePropRow({
  prop,
  onUpdate,
  onDelete,
}: {
  prop: ComponentProp
  onUpdate: (prop: ComponentProp) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(prop.name)
  const [editType, setEditType] = React.useState<ComponentProp["type"]>(prop.type)
  const [editRequired, setEditRequired] = React.useState(prop.required)

  function handleSave() {
    if (!editName.trim()) return
    onUpdate({ name: editName.trim(), type: editType, required: editRequired })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border bg-muted/20 p-2">
        <div className="flex items-center gap-2">
          <Select value={editType} onValueChange={(v) => setEditType(v as ComponentProp["type"])}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROP_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-7 flex-1 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div className="flex items-center gap-1">
            <Switch checked={editRequired} onCheckedChange={setEditRequired} />
            <span className="text-xs text-muted-foreground">Req</span>
          </div>
        </div>
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost"  onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm"  onClick={handleSave} disabled={!editName.trim()}>
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
      <Badge variant="outline" className="h-5 text-xs">{prop.type}</Badge>
      <code className="font-medium">{prop.name}</code>
      {prop.required && <Badge variant="secondary" className="h-4 px-1.5 text-xs">req</Badge>}
      <div className="flex-1" />
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => {
            setEditName(prop.name)
            setEditType(prop.type)
            setEditRequired(prop.required)
            setEditing(true)
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Pencil />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X />
        </button>
      </div>
    </div>
  )
}

/* ── EditableVariantRow — view/edit toggle for a single variant ── */

function EditableVariantRow({
  variant,
  onUpdate,
  onDelete,
}: {
  variant: CustomVariantDef
  onUpdate: (variant: CustomVariantDef) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(variant.name)
  const [editType, setEditType] = React.useState<"variant" | "boolean">(variant.type)
  const [editOptions, setEditOptions] = React.useState<string[]>(variant.options)
  const [editDefault, setEditDefault] = React.useState(variant.defaultValue)
  const [optionInput, setOptionInput] = React.useState("")

  function handleAddOptions() {
    const newOpts = optionInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !editOptions.includes(s))
    if (newOpts.length === 0) return
    const updated = [...editOptions, ...newOpts]
    setEditOptions(updated)
    setOptionInput("")
    if (!editDefault && updated.length >= 1) setEditDefault(updated[0])
  }

  function handleSave() {
    if (!editName.trim()) return
    if (editType === "variant" && editOptions.length < 2) return
    onUpdate({
      name: editName.trim(),
      type: editType,
      options: editType === "boolean" ? ["true", "false"] : editOptions,
      defaultValue: editType === "boolean" ? (editDefault || "false") : (editDefault || editOptions[0] || ""),
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border bg-muted/20 p-2">
        <div className="flex items-center gap-2">
          <Select value={editType} onValueChange={(v) => setEditType(v as "variant" | "boolean")}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="variant" className="text-xs">Variant</SelectItem>
              <SelectItem value="boolean" className="text-xs">Boolean</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-7 w-24 shrink-0 text-xs"
            placeholder="Name"
          />
          {editType === "variant" && (
            <div
              className="flex h-7 min-w-0 flex-1 cursor-text items-center gap-1 overflow-x-auto rounded-md border px-1.5"
              onClick={() => document.getElementById("edit-variant-opts")?.focus()}
            >
              {editOptions.map((opt) => (
                <Badge
                  key={opt}
                  variant={opt === editDefault ? "default" : "secondary"}
                  className="shrink-0 cursor-pointer gap-0.5 text-xs h-4"
                  onClick={(e) => { e.stopPropagation(); setEditDefault(opt) }}
                >
                  {opt}
                  <button
                    type="button"
                    className="hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setEditOptions(editOptions.filter((o) => o !== opt)) }}
                  >
                    <X />
                  </button>
                </Badge>
              ))}
              <input
                id="edit-variant-opts"
                placeholder={editOptions.length === 0 ? "Options (comma)" : ""}
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddOptions() }
                  if (e.key === "Backspace" && optionInput === "" && editOptions.length > 0) {
                    setEditOptions(editOptions.slice(0, -1))
                  }
                }}
                onBlur={handleAddOptions}
                className="h-full min-w-[40px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          {editType === "boolean" && (
            <div className="flex items-center gap-1">
              <Switch
                checked={editDefault === "true"}
                onCheckedChange={(c) => setEditDefault(c ? "true" : "false")}
               
              />
              <span className="text-xs text-muted-foreground">
                {editDefault === "true" ? "true" : "false"}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost"  onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm"  onClick={handleSave} disabled={!editName.trim() || (editType === "variant" && editOptions.length < 2)}>
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
      <Badge variant="outline" className="h-5 text-xs">{variant.type}</Badge>
      <code className="font-medium">{variant.name}</code>
      {variant.type === "variant" && (
        <span className="text-xs text-muted-foreground">{variant.options.join(", ")}</span>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => {
            setEditName(variant.name)
            setEditType(variant.type)
            setEditOptions(variant.options)
            setEditDefault(variant.defaultValue)
            setOptionInput("")
            setEditing(true)
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Pencil />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X />
        </button>
      </div>
    </div>
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
          <SelectTrigger className="h-7 w-20 rounded-r-none border-r-0 text-xs">
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
          className="h-7 rounded-none border-x-0 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-l-none gap-1 text-xs"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          <Plus />
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Switch checked={required} onCheckedChange={setRequired} />
        <span className="text-xs text-muted-foreground">Req</span>
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
            <SelectTrigger className="h-7 w-20 shrink-0 rounded-r-none border-r-0 text-xs">
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
            className="h-7 w-24 shrink-0 rounded-none border-x-0 text-xs"
          />
          {variantType === "variant" && (
            <div
              className="flex min-h-[28px] min-w-0 flex-1 cursor-text flex-wrap items-center gap-1 border-y border-x-0 px-1.5 py-0.5"
              onClick={() => document.getElementById("dlg-variant-opts")?.focus()}
            >
              {options.map((opt) => (
                <Badge
                  key={opt}
                  variant={opt === defaultValue ? "default" : "secondary"}
                  className="shrink-0 cursor-pointer gap-0.5 text-xs h-4"
                  onClick={(e) => { e.stopPropagation(); setDefaultValue(opt) }}
                >
                  {opt}
                  <button
                    type="button"
                    className="hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setOptions(options.filter((o) => o !== opt)) }}
                  >
                    <X />
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
                className="h-full min-w-[40px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 rounded-l-none gap-1 text-xs"
            onClick={handleAdd}
            disabled={!variantName.trim() || (variantType === "variant" && options.length < 2)}
          >
            <Plus />
          </Button>
        </div>
        {variantType === "boolean" && (
          <div className="flex shrink-0 items-center gap-1">
            <Switch
              checked={defaultValue === "true"}
              onCheckedChange={(c) => setDefaultValue(c ? "true" : "false")}
             
            />
            <span className="text-xs text-muted-foreground">
              {defaultValue === "true" ? "true" : "false"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
