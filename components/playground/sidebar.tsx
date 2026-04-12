"use client"

import * as React from "react"
import { ChevronRight, Plus, Search, Trash2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"

import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,

  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  categories,
  searchComponents,
  getComponentsByCategory,
  type ComponentMeta,
} from "@/lib/registry"
import {
  getUserComponents,
  deleteUserComponent,
  type UserComponent,
} from "@/lib/component-store"
import { CreateComponentDialog } from "@/components/playground/create-component-dialog"

/* ── Types ──────────────────────────────────────────────────────── */

interface SidebarProps {
  onSelectComponent?: (component: ComponentMeta) => void
  onSelectCustomComponent?: (slug: string) => void
  selectedSlug?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function PlaygroundSidebar({
  onSelectComponent,
  onSelectCustomComponent,
  selectedSlug,
}: SidebarProps) {
  const [query, setQuery] = React.useState("")
  const [customComponents, setCustomComponents] = React.useState<UserComponent[]>([])

  // Load custom components on mount
  React.useEffect(() => {
    setCustomComponents(getUserComponents())
  }, [])

  const refreshCustomComponents = React.useCallback(() => {
    setCustomComponents(getUserComponents())
  }, [])

  const handleDeleteCustom = React.useCallback(
    (e: React.MouseEvent, slug: string) => {
      e.stopPropagation()
      deleteUserComponent(slug)
      refreshCustomComponents()
    },
    [refreshCustomComponents],
  )

  const grouped = React.useMemo(() => getComponentsByCategory(), [])

  const filteredComponents = React.useMemo(
    () => searchComponents(query),
    [query],
  )

  const isSearching = query.trim().length > 0

  return (
    <>
      {/* ── Header ──────────────────────────────────────────── */}
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">
            Component Lab
          </span>
          <div className="flex-1" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      {/* ── Content ─────────────────────────────────────────── */}
      <SidebarContent>
        {/* ── Custom components ────────────────────────────── */}
        {!isSearching && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Custom components
              {customComponents.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {customComponents.length}
                </Badge>
              )}
            </SidebarGroupLabel>
            <CreateComponentDialog>
              <SidebarGroupAction title="Create new component">
                <Plus />
              </SidebarGroupAction>
            </CreateComponentDialog>
            <SidebarGroupContent>
              <SidebarMenu>
                {customComponents.map((uc) => (
                  <SidebarMenuItem key={uc.id}>
                    <SidebarMenuButton
                      isActive={selectedSlug === `custom/${uc.slug}`}
                      onClick={() => onSelectCustomComponent?.(uc.slug)}
                    >
                      <span>{uc.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      onClick={(e) => handleDeleteCustom(e, uc.slug)}
                      className="hover:text-destructive"
                    >
                      <Trash2 />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* ── Explore shadcn components ──────────────────── */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 pb-2">
              <InputGroup className="h-8">
                <InputGroupAddon>
                  <Search className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search shadcn/ui..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="text-xs"
                />
              </InputGroup>
            </div>
            {isSearching ? (
              <SidebarMenu>
                {filteredComponents.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No components match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  filteredComponents.map((component) => (
                    <SidebarMenuItem key={component.slug}>
                      <SidebarMenuButton
                        isActive={selectedSlug === component.slug}
                        onClick={() => onSelectComponent?.(component)}
                      >
                        <span>{component.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {component.category}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            ) : (
              <SidebarMenu>
                {categories.map((category) => {
                  const components = grouped.get(category.name) ?? []
                  if (components.length === 0) return null

                  return (
                    <Collapsible key={category.slug} asChild>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            <span>{category.name}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {components.map((component) => (
                              <SidebarMenuSubItem key={component.slug}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={selectedSlug === component.slug}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onSelectComponent?.(component)}
                                  >
                                    <span>{component.name}</span>
                                    {component.isCompound && (
                                      <Badge
                                        variant="outline"
                                        className="ml-auto h-4 px-1 text-xs font-normal"
                                      >
                                        compound
                                      </Badge>
                                    )}
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}
