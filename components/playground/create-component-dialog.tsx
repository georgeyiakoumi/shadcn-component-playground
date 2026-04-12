"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toPascalCase } from "@/lib/code-generator"
import { generateFromTreeV2 } from "@/lib/parser/generate-from-tree-v2"
import { createV2TreeFromScratch } from "@/lib/component-tree-v2-factories"
import {
  generateId,
  saveUserComponent,
  toSlug,
  type UserComponent,
} from "@/lib/component-store"
import type { ComponentProp, CustomVariantDef } from "@/lib/component-state"
import {
  InlinePropsSection,
  InlineVariantsSection,
} from "@/components/playground/prop-variant-controls"

/* ── Constants ──────────────────────────────────────────────────── */

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

/* ── Component ─────────────────────────────────────────────────── */

export function CreateComponentDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const [name, setName] = React.useState("")
  const [baseElement, setBaseElement] = React.useState("div")
  const [props, setProps] = React.useState<ComponentProp[]>([])
  const [variants, setVariants] = React.useState<CustomVariantDef[]>([])

  const pascalName = React.useMemo(() => {
    if (!name.trim()) return ""
    return toPascalCase(name.trim())
  }, [name])

  const isValid = pascalName.length >= 2

  function reset() {
    setName("")
    setBaseElement("div")
    setProps([])
    setVariants([])
  }

  function handleCreate() {
    if (!isValid) return

    const componentName = pascalName
    const slug = toSlug(componentName)
    const now = new Date().toISOString()

    const treeV2 = createV2TreeFromScratch(componentName, baseElement, props, variants)
    const source = generateFromTreeV2(treeV2)

    const component: UserComponent = {
      id: generateId(),
      name: componentName,
      slug,
      source,
      treeV2,
      basedOn: undefined,
      createdAt: now,
      updatedAt: now,
    }

    saveUserComponent(component)
    setOpen(false)
    reset()
    router.push(`/playground/custom/${slug}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create from scratch</DialogTitle>
          <DialogDescription>
            You can tweak this later if you want.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="props" className="flex-1">
              Props
              {props.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {props.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex-1">
              Variants
              {variants.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {variants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── General ────────────────────────────────────────── */}
          <TabsContent value="general" className="min-h-[220px] space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="component-name" className="text-sm font-medium">
                Component name
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="component-name"
                  placeholder="e.g. status badge, user card..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 flex-1"
                  autoFocus
                />
                {pascalName && (
                  <code className="shrink-0 rounded-md bg-muted px-3 py-2 text-sm font-semibold">
                    {pascalName}
                  </code>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Don&apos;t worry about formatting — we&apos;ll convert it to
                PascalCase for you.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-element" className="text-sm font-medium">
                Base HTML element
              </Label>
              <Select value={baseElement} onValueChange={setBaseElement}>
                <SelectTrigger id="base-element" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_ELEMENTS.map((el) => (
                    <SelectItem key={el.value} value={el.value}>
                      <span className="font-mono text-xs">
                        &lt;{el.label}&gt;
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {el.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ── Props ──────────────────────────────────────────── */}
          <TabsContent value="props" className="min-h-[220px] pt-2">
            <InlinePropsSection
              props={props}
              onUpdate={(i, updated) =>
                setProps(props.map((p, idx) => (idx === i ? updated : p)))
              }
              onDelete={(i) =>
                setProps(props.filter((_, idx) => idx !== i))
              }
              onAdd={(prop) => setProps([...props, prop])}
              headless
            />
          </TabsContent>

          {/* ── Variants ──────────────────────────────────────── */}
          <TabsContent value="variants" className="min-h-[220px] pt-2">
            <InlineVariantsSection
              variants={variants}
              onUpdate={(i, updated) =>
                setVariants(
                  variants.map((v, idx) => (idx === i ? updated : v)),
                )
              }
              onDelete={(i) =>
                setVariants(variants.filter((_, idx) => idx !== i))
              }
              onAdd={(v) => setVariants([...variants, v])}
              headless
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            disabled={!isValid}
            onClick={handleCreate}
            className="w-full"
          >
            Create component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
