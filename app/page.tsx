"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Code2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  type ComponentMeta,
} from "@/lib/registry"

export default function Home() {
  const router = useRouter()
  const grouped = React.useMemo(() => getComponentsByCategory(), [])

  function handleSelectComponent(slug: string) {
    router.push(`/playground/${slug}` as `/playground/${string}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        {/* ── Heading ──────────────────────────────────────────── */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Component Lab
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, inspect, edit, and build UI components visually.
          </p>
        </div>

        {/* ── Command palette ─────────────────────────────────── */}
        <Command className="rounded-lg border shadow-md [&_[cmdk-list]]:max-h-[300px]">
          <CommandInput placeholder="Search shadcn components" />
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
                        handleSelectComponent(component.slug)
                      }
                    >
                      <Code2 className="mr-2 size-4 text-muted-foreground" />
                      <span className="font-medium">{component.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>

        {/* ── Action button ──────────────────────────────────── */}
        <Button asChild>
          <Link href="/playground/new?mode=scratch">
            <Plus className="mr-2 size-4" />
            Create from scratch
          </Link>
        </Button>
      </div>

      {/* ── Footer attribution ──────────────────────────────── */}
      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        Built with <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">shadcn/ui</a>
      </footer>
    </main>
  )
}
