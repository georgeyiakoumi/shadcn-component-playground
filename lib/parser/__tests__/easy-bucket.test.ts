/**
 * Pillar 2b — easy bucket parser tests.
 *
 * Covers all components the parser should handle after 2b lands. Two layers:
 *
 * 1. **Coverage sweep.** A parameterised test that every supported component
 *    parses without throwing. Fastest safety net against regressions.
 * 2. **Deep spot checks.** Hand-written assertions on representative
 *    components that exercise patterns first introduced in 2b: Radix
 *    primitives (Checkbox), multi-sub-component files (RadioGroup), arrow
 *    function components + third-party integration (Sonner), context
 *    providers (Tooltip), third-party namespace imports (Resizable).
 *
 * Out of scope (expected to still throw under Pillar 2b):
 * - Carousel, NavigationMenu, ToggleGroup. The parser correctly rejects
 *   them because they use React.createContext / non-literal cva config —
 *   those patterns land in Pillar 2c/2d.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseSource } from "@/lib/parser/parse-source-v2"
import { ParserError } from "@/lib/parser/parser-error"

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..")

function load(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf-8")
}

/* ── 1. Coverage sweep ────────────────────────────────────────────────── */

/**
 * Every .tsx file in `components/ui/`. After Pillar 2c the parser handles
 * all 43 components; this list is the authoritative coverage target.
 */
const HANDLEABLE_COMPONENTS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "card",
  "carousel",
  "checkbox",
  "collapsible",
  "command",
  "context-menu",
  "dialog",
  "drawer",
  "dropdown-menu",
  "hover-card",
  "input",
  "item",
  "label",
  "menubar",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "slider",
  "sonner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle",
  "toggle-group",
  "tooltip",
]

describe("parseSource — coverage sweep", () => {
  it.each(HANDLEABLE_COMPONENTS)(
    "parses %s without throwing",
    (slug) => {
      const source = load(`components/ui/${slug}.tsx`)
      expect(() => parseSource(source, `components/ui/${slug}.tsx`)).not.toThrow()
    },
  )

  it("produces a tree with at least one sub-component for every handleable file", () => {
    for (const slug of HANDLEABLE_COMPONENTS) {
      const source = load(`components/ui/${slug}.tsx`)
      const tree = parseSource(source, `components/ui/${slug}.tsx`)
      expect(
        tree.subComponents.length,
        `${slug} should have ≥1 sub-component`,
      ).toBeGreaterThan(0)
      expect(
        tree.name,
        `${slug} should have a non-empty name`,
      ).not.toBe("Unknown")
    }
  })
})

/* ── 2. Deep spot-checks — Checkbox (Radix + nested children + lucide) ── */

describe("parseSource — Checkbox", () => {
  const tree = parseSource(
    load("components/ui/checkbox.tsx"),
    "components/ui/checkbox.tsx",
  )

  it("has one sub-component named Checkbox", () => {
    expect(tree.name).toBe("Checkbox")
    expect(tree.subComponents).toHaveLength(1)
  })

  it("uses a Radix primitive base (CheckboxPrimitive.Root)", () => {
    const root = tree.subComponents[0].parts.root
    expect(root.base).toEqual({
      kind: "radix",
      primitive: "Checkbox",
      part: "Root",
    })
  })

  it("has one child (the Indicator) which is also a Radix primitive", () => {
    const root = tree.subComponents[0].parts.root
    expect(root.children).toHaveLength(1)
    const indicator = root.children[0]
    expect(indicator.kind).toBe("part")
    if (indicator.kind !== "part") return
    expect(indicator.part.base).toEqual({
      kind: "radix",
      primitive: "Checkbox",
      part: "Indicator",
    })
  })

  it("the Indicator contains the CheckIcon as a component-ref child", () => {
    const root = tree.subComponents[0].parts.root
    const indicator = root.children[0]
    if (indicator.kind !== "part") return
    expect(indicator.part.children).toHaveLength(1)
    const icon = indicator.part.children[0]
    expect(icon.kind).toBe("part")
    if (icon.kind !== "part") return
    expect(icon.part.base).toEqual({
      kind: "component-ref",
      name: "CheckIcon",
    })
  })
})

/* ── 3. Deep spot-checks — RadioGroup (multi sub-component) ─────────── */

describe("parseSource — RadioGroup", () => {
  const tree = parseSource(
    load("components/ui/radio-group.tsx"),
    "components/ui/radio-group.tsx",
  )

  it("has two sub-components in source order", () => {
    expect(tree.subComponents).toHaveLength(2)
    expect(tree.subComponents[0].name).toBe("RadioGroup")
    expect(tree.subComponents[0].exportOrder).toBe(0)
    expect(tree.subComponents[1].name).toBe("RadioGroupItem")
    expect(tree.subComponents[1].exportOrder).toBe(1)
  })

  it("each sub-component has its own Radix primitive base", () => {
    expect(tree.subComponents[0].parts.root.base).toEqual({
      kind: "radix",
      primitive: "RadioGroup",
      part: "Root",
    })
    expect(tree.subComponents[1].parts.root.base).toEqual({
      kind: "radix",
      primitive: "RadioGroup",
      part: "Item",
    })
  })
})

/* ── 4. Deep spot-checks — Sonner (arrow function + third-party) ─────── */

describe("parseSource — Sonner (Toaster)", () => {
  const tree = parseSource(
    load("components/ui/sonner.tsx"),
    "components/ui/sonner.tsx",
  )

  it("marks thirdParty as sonner", () => {
    expect(tree.thirdParty).toEqual({ library: "sonner" })
  })

  it("has one arrow-function sub-component named Toaster", () => {
    expect(tree.subComponents).toHaveLength(1)
    expect(tree.subComponents[0].name).toBe("Toaster")
  })

  it("captures the `const { theme = system } = useTheme()` call as body passthrough", () => {
    const ptSources = tree.subComponents[0].passthrough.map((p) => p.source)
    expect(ptSources.some((s) => s.includes("useTheme"))).toBe(true)
  })

  it("uses Sonner (the aliased import) as a component-ref at the root", () => {
    // `import { Toaster as Sonner } from "sonner"` — the JSX uses `<Sonner />`.
    expect(tree.subComponents[0].parts.root.base).toEqual({
      kind: "component-ref",
      name: "Sonner",
    })
  })
})

/* ── 5. Deep spot-checks — Tooltip (provider + {children} expression) ── */

describe("parseSource — Tooltip", () => {
  const tree = parseSource(
    load("components/ui/tooltip.tsx"),
    "components/ui/tooltip.tsx",
  )

  it("has four sub-components in source order", () => {
    expect(tree.subComponents.map((s) => s.name)).toEqual([
      "TooltipProvider",
      "Tooltip",
      "TooltipTrigger",
      "TooltipContent",
    ])
  })

  it("TooltipContent's root is a Portal containing a Content", () => {
    const content = tree.subComponents.find((s) => s.name === "TooltipContent")!
    expect(content.parts.root.base).toEqual({
      kind: "radix",
      primitive: "Tooltip",
      part: "Portal",
    })
    const inner = content.parts.root.children[0]
    expect(inner.kind).toBe("part")
    if (inner.kind !== "part") return
    expect(inner.part.base).toEqual({
      kind: "radix",
      primitive: "Tooltip",
      part: "Content",
    })
  })

  it("the Content element contains a {children} expression child and an Arrow part", () => {
    const content = tree.subComponents.find((s) => s.name === "TooltipContent")!
    const portal = content.parts.root
    const inner = portal.children[0]
    if (inner.kind !== "part") return
    const childKinds = inner.part.children.map((c) => c.kind)
    expect(childKinds).toContain("expression")
    expect(childKinds).toContain("part")
  })
})

/* ── 6. Deep spot-checks — Resizable (third-party namespace import) ──── */

describe("parseSource — Resizable", () => {
  const tree = parseSource(
    load("components/ui/resizable.tsx"),
    "components/ui/resizable.tsx",
  )

  it("marks thirdParty as react-resizable-panels", () => {
    expect(tree.thirdParty).toEqual({ library: "react-resizable-panels" })
  })

  it("uses third-party base for the root part", () => {
    const group = tree.subComponents.find((s) => s.name === "ResizablePanelGroup")
    expect(group).toBeDefined()
    expect(group!.parts.root.base).toEqual({
      kind: "third-party",
      library: "react-resizable-panels",
      component: "Group",
    })
  })
})

/* ── 7. Deep spot-checks — Carousel (createContext + hook + local ref) ── */

describe("parseSource — Carousel", () => {
  const tree = parseSource(
    load("components/ui/carousel.tsx"),
    "components/ui/carousel.tsx",
  )

  it("captures CarouselContext as a ContextExport", () => {
    expect(tree.contextExports).toHaveLength(1)
    expect(tree.contextExports[0].name).toBe("CarouselContext")
    expect(tree.contextExports[0].typeArgSource).toContain("CarouselContextProps")
  })

  it("captures useCarousel as a HookExport", () => {
    expect(tree.hookExports).toHaveLength(1)
    expect(tree.hookExports[0].name).toBe("useCarousel")
    expect(tree.hookExports[0].bodySource).toContain("React.useContext")
  })

  it("captures multiple type alias declarations as file passthrough", () => {
    const typeAliases = tree.filePassthrough.filter((p) => p.kind === "type-alias")
    expect(typeAliases.length).toBeGreaterThanOrEqual(4)
  })

  it("marks thirdParty as embla-carousel-react", () => {
    expect(tree.thirdParty).toEqual({ library: "embla-carousel-react" })
  })

  it("resolves <CarouselContext.Provider> as a qualified dynamic-ref", () => {
    const carousel = tree.subComponents.find((s) => s.name === "Carousel")!
    expect(carousel.parts.root.base).toEqual({
      kind: "dynamic-ref",
      localName: "CarouselContext.Provider",
    })
  })
})

/* ── 8. Deep spot-checks — ToggleGroup (createContext + useContext) ────── */

describe("parseSource — ToggleGroup", () => {
  const tree = parseSource(
    load("components/ui/toggle-group.tsx"),
    "components/ui/toggle-group.tsx",
  )

  it("captures ToggleGroupContext as a ContextExport", () => {
    expect(tree.contextExports).toHaveLength(1)
    expect(tree.contextExports[0].name).toBe("ToggleGroupContext")
  })

  it("has two sub-components: ToggleGroup and ToggleGroupItem", () => {
    expect(tree.subComponents.map((s) => s.name)).toEqual([
      "ToggleGroup",
      "ToggleGroupItem",
    ])
  })

  it("ToggleGroupItem's body passthrough contains the React.useContext call", () => {
    const item = tree.subComponents.find((s) => s.name === "ToggleGroupItem")!
    const ptSources = item.passthrough.map((p) => p.source)
    expect(ptSources.some((s) => s.includes("useContext"))).toBe(true)
  })
})

/* ── 9. Deep spot-checks — NavigationMenu (cva no config + local ref) ── */

describe("parseSource — NavigationMenu", () => {
  const tree = parseSource(
    load("components/ui/navigation-menu.tsx"),
    "components/ui/navigation-menu.tsx",
  )

  it("captures navigationMenuTriggerStyle as a cva export with empty variants", () => {
    const style = tree.cvaExports.find((c) => c.name === "navigationMenuTriggerStyle")
    expect(style).toBeDefined()
    expect(style!.variants).toEqual({})
    expect(style!.defaultVariants).toBeUndefined()
    expect(style!.baseClasses).toContain("group inline-flex")
  })

  it("captures the conditional {viewport && <NavigationMenuViewport />} child as an expression", () => {
    // NavigationMenu's body is:
    //   <NavigationMenuPrimitive.Root ...>
    //     {children}
    //     {viewport && <NavigationMenuViewport />}
    //   </NavigationMenuPrimitive.Root>
    // The second child is a JS expression, not a direct JSX child, so the
    // parser stores it as `{ kind: 'expression', source: '...' }` with the
    // raw source intact. The generator in Pillar 3 will re-emit it verbatim.
    const nav = tree.subComponents.find((s) => s.name === "NavigationMenu")!
    const children = nav.parts.root.children
    const exprChildren = children.filter((c) => c.kind === "expression")
    expect(exprChildren.length).toBeGreaterThanOrEqual(1)
    const hasViewportRef = exprChildren.some(
      (c) => c.kind === "expression" && c.source.includes("NavigationMenuViewport"),
    )
    expect(hasViewportRef).toBe(true)
  })

  it("has NavigationMenuViewport as a top-level sub-component in the same file", () => {
    // Regression guard: ensure the local function declaration is still
    // picked up as its own sub-component even though it's also referenced
    // inline from NavigationMenu's JSX.
    const viewport = tree.subComponents.find(
      (s) => s.name === "NavigationMenuViewport",
    )
    expect(viewport).toBeDefined()
  })
})

/* ── 10. Error handling — synthetic broken sources ─────────────────── */

describe("parseSource — error handling", () => {
  it("throws a ParserError for an unhandled top-level statement", () => {
    const source = `import * as React from "react"\n\nclass Thing {}\n`
    expect(() => parseSource(source, "synthetic.tsx")).toThrow(ParserError)
  })

  it("ParserError carries file path and source position", () => {
    const source = `import * as React from "react"\n\nclass Thing {}\n`
    try {
      parseSource(source, "synthetic.tsx")
      throw new Error("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ParserError)
      if (!(err instanceof ParserError)) return
      expect(err.filePath).toBe("synthetic.tsx")
      expect(err.line).toBeGreaterThan(0)
      expect(err.column).toBeGreaterThan(0)
      expect(err.reason.length).toBeGreaterThan(0)
    }
  })
})
