"use client"

import * as React from "react"

import { registry, type ComponentMeta } from "@/lib/registry"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentEdit {
  slug: string
  /** Sub-components that are currently active (for compound components) */
  activeSubComponents: string[]
  /** Custom Tailwind classes added by the user, keyed by element id */
  customClasses: Record<string, string[]>
  /** Custom variants added by the user, keyed by variant name */
  customVariants: Record<string, Record<string, string>>
  /** Whether the component has been modified from its default state */
  isDirty: boolean
}

// ---------------------------------------------------------------------------
// Required sub-components — these cannot be disabled
// ---------------------------------------------------------------------------

const REQUIRED_SUB_COMPONENTS: Record<string, readonly string[]> = {
  dialog: ["DialogContent"],
  "alert-dialog": ["AlertDialogContent"],
  sheet: ["SheetContent"],
  drawer: ["DrawerContent"],
  "dropdown-menu": ["DropdownMenuContent"],
  "context-menu": ["ContextMenuContent"],
  popover: ["PopoverContent"],
  "hover-card": ["HoverCardContent"],
  select: ["SelectContent", "SelectTrigger", "SelectValue"],
  accordion: ["AccordionItem"],
  tabs: ["TabsList", "TabsContent"],
}

/**
 * Returns the list of required (non-disableable) sub-components for a slug.
 */
export function getRequiredSubComponents(slug: string): readonly string[] {
  return REQUIRED_SUB_COMPONENTS[slug] ?? []
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Creates the default edit state for a component.
 * All sub-components start active for compound components.
 */
export function createDefaultEdit(
  slug: string,
  meta: ComponentMeta,
): ComponentEdit {
  return {
    slug,
    activeSubComponents: meta.isCompound ? [...meta.subComponents] : [],
    customClasses: {},
    customVariants: {},
    isDirty: false,
  }
}

/**
 * Resets the edit state back to defaults for a component.
 */
export function resetEdit(slug: string, meta: ComponentMeta): ComponentEdit {
  return createDefaultEdit(slug, meta)
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ComponentEditContextValue {
  edit: ComponentEdit
  setEdit: React.Dispatch<React.SetStateAction<ComponentEdit>>
  /** The registry metadata for the current component (if found) */
  meta: ComponentMeta | undefined
  /** Toggle a sub-component on or off (respects required constraints) */
  toggleSubComponent: (name: string) => void
  /** Add a custom Tailwind class to an element */
  addCustomClass: (elementId: string, className: string) => void
  /** Remove a custom Tailwind class from an element */
  removeCustomClass: (elementId: string, className: string) => void
  /** Reset all edits back to the original default state */
  resetToOriginal: () => void
}

export const ComponentEditContext =
  React.createContext<ComponentEditContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ComponentEditProviderProps {
  children: React.ReactNode
  slug: string
}

export function ComponentEditProvider({
  children,
  slug,
}: ComponentEditProviderProps) {
  const meta = registry.find((c) => c.slug === slug)

  const [edit, setEdit] = React.useState<ComponentEdit>(() =>
    meta
      ? createDefaultEdit(slug, meta)
      : {
          slug,
          activeSubComponents: [],
          customClasses: {},
          customVariants: {},
          isDirty: false,
        },
  )

  // Reset when slug changes
  React.useEffect(() => {
    const currentMeta = registry.find((c) => c.slug === slug)
    if (currentMeta) {
      setEdit(createDefaultEdit(slug, currentMeta))
    } else {
      setEdit({
        slug,
        activeSubComponents: [],
        customClasses: {},
        customVariants: {},
        isDirty: false,
      })
    }
  }, [slug])

  const toggleSubComponent = React.useCallback(
    (name: string) => {
      const required = getRequiredSubComponents(slug)
      if (required.includes(name)) return

      setEdit((prev) => {
        const isActive = prev.activeSubComponents.includes(name)
        const next = isActive
          ? prev.activeSubComponents.filter((s) => s !== name)
          : [...prev.activeSubComponents, name]

        return { ...prev, activeSubComponents: next, isDirty: true }
      })
    },
    [slug],
  )

  const addCustomClass = React.useCallback(
    (elementId: string, className: string) => {
      setEdit((prev) => {
        const existing = prev.customClasses[elementId] ?? []
        if (existing.includes(className)) return prev

        return {
          ...prev,
          customClasses: {
            ...prev.customClasses,
            [elementId]: [...existing, className],
          },
          isDirty: true,
        }
      })
    },
    [],
  )

  const removeCustomClass = React.useCallback(
    (elementId: string, className: string) => {
      setEdit((prev) => {
        const existing = prev.customClasses[elementId] ?? []
        const filtered = existing.filter((c) => c !== className)

        return {
          ...prev,
          customClasses: {
            ...prev.customClasses,
            [elementId]: filtered,
          },
          isDirty: true,
        }
      })
    },
    [],
  )

  const resetToOriginal = React.useCallback(() => {
    const currentMeta = registry.find((c) => c.slug === slug)
    if (currentMeta) {
      setEdit(resetEdit(slug, currentMeta))
    }
  }, [slug])

  const value = React.useMemo<ComponentEditContextValue>(
    () => ({
      edit,
      setEdit,
      meta,
      toggleSubComponent,
      addCustomClass,
      removeCustomClass,
      resetToOriginal,
    }),
    [
      edit,
      setEdit,
      meta,
      toggleSubComponent,
      addCustomClass,
      removeCustomClass,
      resetToOriginal,
    ],
  )

  return (
    <ComponentEditContext.Provider value={value}>
      {children}
    </ComponentEditContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useComponentEdit(): ComponentEditContextValue {
  const ctx = React.useContext(ComponentEditContext)
  if (!ctx) {
    throw new Error(
      "useComponentEdit must be used within a ComponentEditProvider",
    )
  }
  return ctx
}
