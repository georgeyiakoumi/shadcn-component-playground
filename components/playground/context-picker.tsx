"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { buildContextGroups } from "@/lib/style-context"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface ContextPickerProps {
  contexts: string[]
  onContextsChange: (ctxs: string[]) => void
  variants?: Array<{ name: string; options: string[] }>
  props?: Array<{ name: string; type: string }>
  parentVariants?: Array<{ name: string; options: string[]; parentName: string }>
  subComponentNames?: string[]
}

function ContextPicker({
  contexts,
  onContextsChange,
  variants,
  props,
  parentVariants,
  subComponentNames,
}: ContextPickerProps) {
  const [open, setOpen] = React.useState(false)
  const groups = React.useMemo(() => buildContextGroups(variants, props, parentVariants, subComponentNames), [variants, props, parentVariants, subComponentNames])

  const isDefault = contexts.length === 0

  const contextLabel = React.useMemo(() => {
    if (isDefault) return "Default"
    return contexts.map((c) => {
      if (c.startsWith("variant:")) {
        const parts = c.split(":")
        return `${parts[1]}:${parts[2]}`
      }
      return c
    }).join(":") + ":"
  }, [contexts, isDefault])

  const BREAKPOINTS = new Set(["sm", "md", "lg", "xl", "2xl"])

  function toggleContext(value: string) {
    if (value.startsWith("variant:")) {
      const parts = value.split(":")
      const variantGroup = `variant:${parts[1]}:`
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = contexts.filter((c) => !c.startsWith(variantGroup))
        onContextsChange([...filtered, value])
      }
    }
    else if (value === "bp-none") {
      onContextsChange(contexts.filter((c) => !BREAKPOINTS.has(c)))
    }
    else if (BREAKPOINTS.has(value)) {
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = contexts.filter((c) => !BREAKPOINTS.has(c))
        onContextsChange([...filtered, value])
      }
    }
    else if (value.match(/^data-\[(\w+)=\w+\]$/)) {
      const key = value.match(/^data-\[(\w+)=/)?.[1]
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        const filtered = key
          ? contexts.filter((c) => !c.startsWith(`data-[${key}=`))
          : contexts
        onContextsChange([...filtered, value])
      }
    }
    else {
      if (contexts.includes(value)) {
        onContextsChange(contexts.filter((c) => c !== value))
      } else {
        onContextsChange([...contexts, value])
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 max-w-[180px] gap-1 truncate text-xs",
            !isDefault && "border-blue-500/50 text-blue-500",
          )}
        >
          <code className="truncate font-mono">{contextLabel}</code>
          <ChevronDown className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command className="[&_[cmdk-list]]:max-h-[320px]">
          <CommandInput placeholder="Search..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-xs">No match.</CommandEmpty>

            <CommandItem
              value="default clear"
              onSelect={() => {
                onContextsChange([])
                setOpen(false)
              }}
              className={cn(
                "gap-2 text-xs",
                isDefault && "bg-blue-500/10 text-blue-500",
              )}
            >
              <code className="font-mono text-xs">Default</code>
              {!isDefault && (
                <span className="ml-auto text-xs text-muted-foreground">clear all</span>
              )}
            </CommandItem>

            {groups.map((group, gi) => (
              <React.Fragment key={`${group.label}-${gi}`}>
                {group.section && (
                  <div className="px-2 pb-1 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.section}
                    </p>
                  </div>
                )}
                <CommandGroup heading={group.section ? group.label : group.label}>
                  {group.options.map((opt) => {
                    const isVariant = opt.value.startsWith("variant:")
                    const isBreakpoint = BREAKPOINTS.has(opt.value) || opt.value === "bp-none"
                    const isDataAttrWithValue = !!opt.value.match(/^data-\[\w+=\w+\]$/)
                    const isRadio = isVariant || isBreakpoint || isDataAttrWithValue
                    // A row is active iff its exact value is in the
                    // currently-selected contexts. The "bp-none" pseudo-row
                    // is the one exception — it's active when no breakpoint
                    // is selected (it represents "no responsive prefix").
                    //
                    // We deliberately do NOT light up a variant's first/
                    // default value as active when no variant context is
                    // selected. The top-level "Default" entry already
                    // signals "no context active"; showing the first
                    // variant value as active alongside it would suggest
                    // edits route into that variant's slot when in fact
                    // they route into the base. (Reported by George after
                    // the data-attr strategy PR landed.)
                    const isActive = opt.value === "bp-none"
                      ? !contexts.some((c) => BREAKPOINTS.has(c))
                      : contexts.includes(opt.value)
                    return (
                      <CommandItem
                        key={opt.value}
                        value={`${opt.label} ${group.label} ${group.section ?? ""}`}
                        onSelect={() => toggleContext(opt.value)}
                        className={cn(
                          "gap-2 text-xs",
                          isActive && "bg-blue-500/10 text-blue-500",
                        )}
                      >
                        {isRadio ? (
                          <div className={cn(
                            "flex size-3.5 items-center justify-center rounded-full border",
                            isActive ? "border-blue-500" : "border-muted-foreground/30",
                          )}>
                            {isActive && <div className="size-2 rounded-full bg-blue-500" />}
                          </div>
                        ) : (
                          <div className={cn(
                            "flex size-3.5 items-center justify-center rounded-sm border",
                            isActive ? "border-blue-500 bg-blue-500 text-white" : "border-muted-foreground/30",
                          )}>
                            {isActive && <span className="text-xs leading-none">✓</span>}
                          </div>
                        )}
                        <code className="font-mono text-xs">{opt.label}</code>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ContextPicker }
export type { ContextPickerProps }
