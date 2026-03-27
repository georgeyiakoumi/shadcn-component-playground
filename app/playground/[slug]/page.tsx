"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { registry } from "@/lib/registry"
import { componentSources } from "@/lib/component-source"
import { parseCvaVariants } from "@/lib/cva-parser"
import { ComponentEditProvider } from "@/lib/component-state"
import {
  PlaygroundToolbar,
  type Breakpoint,
  type PropSelector,
} from "@/components/playground/toolbar"
import { ComponentCanvas } from "@/components/playground/component-canvas"
import { CodePanel } from "@/components/playground/code-panel"
import { StructurePanel } from "@/components/playground/structure-panel"
import { TwPanel } from "@/components/playground/tw-panel"
import { TwEditorPanel } from "@/components/playground/tw-editor-panel"
import { A11yPanel } from "@/components/playground/a11y-panel"
import { SemanticPanel } from "@/components/playground/semantic-panel"
import { SubComponentPanel } from "@/components/playground/sub-component-panel"
import { VariantPanel } from "@/components/playground/variant-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ComponentPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")
  const [propValues, setPropValues] = React.useState<Record<string, string>>({})

  const component = registry.find((c) => c.slug === slug)

  // Parse cva variants from the actual component source code
  const source = componentSources[slug] ?? ""
  const variantDefs = React.useMemo(() => parseCvaVariants(source), [source])

  // Reset prop values when slug changes, using defaults from parser
  React.useEffect(() => {
    const defaults: Record<string, string> = {}
    variantDefs.forEach((v) => {
      defaults[v.name] = v.defaultValue
    })
    setPropValues(defaults)
  }, [slug, variantDefs])

  if (!component) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Component not found</p>
      </div>
    )
  }

  const displaySource =
    source || `// Source code for ${component.name} coming soon`

  // Build prop selectors from parsed variant definitions
  const propSelectors: PropSelector[] | undefined =
    variantDefs.length > 0
      ? variantDefs.map((v) => ({
          label: v.name.charAt(0).toUpperCase() + v.name.slice(1),
          options: v.options,
          value: propValues[v.name] ?? v.defaultValue,
          onChange: (value: string) =>
            setPropValues((prev) => ({ ...prev, [v.name]: value })),
        }))
      : undefined

  // Build preview props from current prop values
  const previewProps: Record<string, string> | undefined =
    Object.keys(propValues).length > 0 ? propValues : undefined

  return (
    <ComponentEditProvider slug={slug}>
      <PlaygroundToolbar
        componentName={component.name}
        slug={slug}
        source={source}
        theme={theme}
        onThemeChange={setTheme}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        propSelectors={propSelectors}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Inspect panels ───────────────────────────── */}
        <div className="flex w-[400px] shrink-0 flex-col border-r">
          <Tabs defaultValue="code" className="flex flex-1 flex-col">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="a11y">A11y</TabsTrigger>
              <TabsTrigger value="semantic">Semantic</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              {component.isCompound && (
                <TabsTrigger value="sub-components">Parts</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="structure" className="flex-1 overflow-auto">
              <StructurePanel slug={slug} />
            </TabsContent>
            <TabsContent value="code" className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0">
                <CodePanel code={displaySource} />
              </div>
            </TabsContent>
            <TabsContent value="styles" className="flex-1 overflow-hidden">
              <TwPanel source={source} />
            </TabsContent>
            <TabsContent value="classes" className="flex-1 overflow-hidden">
              <TwEditorPanel source={source} />
            </TabsContent>
            <TabsContent value="a11y" className="flex-1 overflow-hidden">
              <A11yPanel source={source} />
            </TabsContent>
            <TabsContent value="semantic" className="flex-1 overflow-hidden">
              <SemanticPanel source={source} />
            </TabsContent>
            <TabsContent value="variants" className="flex-1 overflow-hidden">
              <VariantPanel source={source} />
            </TabsContent>
            {component.isCompound && (
              <TabsContent value="sub-components" className="flex-1 overflow-hidden">
                <SubComponentPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* ── Right: Component preview ───────────────────────── */}
        <ComponentCanvas
          slug={slug}
          componentName={component.name}
          theme={theme}
          breakpoint={breakpoint}
          previewProps={previewProps}
        />
      </div>
    </ComponentEditProvider>
  )
}
