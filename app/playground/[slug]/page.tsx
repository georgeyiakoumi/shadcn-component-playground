"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { registry } from "@/lib/registry"
import { PlaygroundToolbar, type Breakpoint } from "@/components/playground/toolbar"
import { ComponentCanvas } from "@/components/playground/component-canvas"

export default function ComponentPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("2xl")

  const component = registry.find((c) => c.slug === slug)

  if (!component) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Component not found</p>
      </div>
    )
  }

  return (
    <>
      <PlaygroundToolbar
        componentName={component.name}
        theme={theme}
        onThemeChange={setTheme}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
      />
      <ComponentCanvas
        slug={slug}
        componentName={component.name}
        theme={theme}
        breakpoint={breakpoint}
      />
    </>
  )
}
