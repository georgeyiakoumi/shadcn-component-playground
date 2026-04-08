"use client"

import * as React from "react"

import { registry, type ComponentMeta } from "@/lib/registry"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomVariantDef {
  name: string
  type: "variant" | "boolean"
  options: string[]
  defaultValue: string
  /**
   * Variant strategy: how the variant is expressed in the generated
   * component source.
   *
   * - `"data-attr"` (default): plain TS union prop mirrored to the DOM via
   *   `data-<name>={<name>}` on the root. Classes live inline in the cn()
   *   base with `data-[<name>=<value>]:` prefixes. Matches the newer
   *   shadcn authoring style (Card, Accordion). Good for compact/default
   *   toggles and anything children should react to via group selectors.
   *
   * - `"cva"`: generates a cva() export with a `variants` map. Matches the
   *   older shadcn pattern (Button, Badge, Alert). Good for variants with
   *   many value-specific style sets that don't fit comfortably inline.
   *
   * Optional for backwards compatibility with existing localStorage
   *  entries; undefined defaults to `"data-attr"` at the translator
   *  boundary.
   */
  strategy?: "cva" | "data-attr"
}

/**
 * UI shape for prop declarations in the from-scratch builder. Originally
 * lived in `lib/component-tree.ts` (v1 from-scratch tree). Moved here
 * during GEO-305 Step 6 when v1 was deleted, because the from-scratch
 * UI components (Define view, prop popovers) still consume this flat
 * shape and the v2 helpers (`v2-tree-define.ts`) translate to/from it
 * at the v2 boundary.
 */
export interface ComponentProp {
  name: string
  type: "string" | "number" | "boolean" | "ReactNode"
  required: boolean
  defaultValue?: string
}

export interface ComponentEdit {
  slug: string
  /** Sub-components that are currently active (for compound components) */
  activeSubComponents: string[]
  /** Custom Tailwind classes added by the user, keyed by element id */
  customClasses: Record<string, string[]>
  /** Custom variants added by the user, keyed by variant name */
  customVariants: Record<string, Record<string, string>>
  /** Structured custom variant definitions created by the user */
  customVariantDefs: CustomVariantDef[]
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
    customVariantDefs: [],
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
  /** Add a custom variant definition */
  addCustomVariant: (
    name: string,
    type: "variant" | "boolean",
    options: string[],
    defaultValue: string,
  ) => void
  /** Update an existing custom variant definition */
  updateCustomVariant: (
    name: string,
    options: string[],
    defaultValue: string,
  ) => void
  /** Remove a custom variant definition */
  removeCustomVariant: (name: string) => void
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
          customVariantDefs: [],
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
        customVariantDefs: [],
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

  const addCustomVariant = React.useCallback(
    (
      name: string,
      type: "variant" | "boolean",
      options: string[],
      defaultValue: string,
    ) => {
      setEdit((prev) => {
        // Prevent duplicates
        if (prev.customVariantDefs.some((v) => v.name === name)) return prev

        return {
          ...prev,
          customVariantDefs: [
            ...prev.customVariantDefs,
            { name, type, options, defaultValue },
          ],
          isDirty: true,
        }
      })
    },
    [],
  )

  const updateCustomVariant = React.useCallback(
    (name: string, options: string[], defaultValue: string) => {
      setEdit((prev) => ({
        ...prev,
        customVariantDefs: prev.customVariantDefs.map((v) =>
          v.name === name ? { ...v, options, defaultValue } : v,
        ),
        isDirty: true,
      }))
    },
    [],
  )

  const removeCustomVariant = React.useCallback((name: string) => {
    setEdit((prev) => ({
      ...prev,
      customVariantDefs: prev.customVariantDefs.filter((v) => v.name !== name),
      isDirty: true,
    }))
  }, [])

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
      addCustomVariant,
      updateCustomVariant,
      removeCustomVariant,
      resetToOriginal,
    }),
    [
      edit,
      setEdit,
      meta,
      toggleSubComponent,
      addCustomClass,
      removeCustomClass,
      addCustomVariant,
      updateCustomVariant,
      removeCustomVariant,
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
