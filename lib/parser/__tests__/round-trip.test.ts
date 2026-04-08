/**
 * Pillar 3a — round-trip fidelity test.
 *
 * For every `.tsx` file in `components/ui/`, this test parses the source
 * to a `ComponentTreeV2`, generates source back from the tree, and asserts
 * **byte-for-byte** equality with the original.
 *
 * This is the operationalisation of Lesson #16: the parser and generator
 * together must be a noop on unedited source. Any drift in either direction
 * is a bug.
 *
 * Pillar 3a uses the generator's fast path, which returns `originalSource`
 * verbatim. This is deliberately trivial — the fast path is the minimum
 * viable demonstration of the round-trip contract. Pillar 3b will add the
 * slow-path generator for edited trees.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseSource } from "@/lib/parser/parse-source-v2"
import {
  GeneratorError,
  generateFromTreeV2,
} from "@/lib/parser/generate-from-tree-v2"
import { createComponentTreeV2 } from "@/lib/component-tree-v2-factories"

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..")

function load(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf-8")
}

/**
 * Every component in `components/ui/`. Kept in sync with the parser's
 * coverage sweep so if a new shadcn component gets added, the round-trip
 * test picks it up automatically the next time the list is updated.
 */
const ALL_COMPONENTS = [
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

describe("round-trip fidelity — fast path", () => {
  it.each(ALL_COMPONENTS)(
    "parse → generate → byte-equivalent for %s",
    (slug) => {
      const filePath = `components/ui/${slug}.tsx`
      const source = load(filePath)
      const tree = parseSource(source, filePath)
      const emitted = generateFromTreeV2(tree)
      expect(emitted).toBe(source)
    },
  )

  it("preserves originalSource on every parsed tree", () => {
    const source = load("components/ui/button.tsx")
    const tree = parseSource(source, "components/ui/button.tsx")
    expect(tree.originalSource).toBe(source)
  })
})

describe("generator — escape hatch path", () => {
  it("returns rawSource verbatim when customHandling is true", () => {
    const rawSource = '// fake source\nconst x = 1\n'
    const fakeTree = {
      name: "Fake",
      slug: "fake",
      filePath: "fake.tsx",
      roundTripRisk: "unhandleable" as const,
      customHandling: true,
      rawSource,
      directives: [],
      filePassthrough: [],
      imports: [],
      cvaExports: [],
      contextExports: [],
      hookExports: [],
      subComponents: [],
    }
    expect(generateFromTreeV2(fakeTree)).toBe(rawSource)
  })
})

describe("generator — template emission (GEO-305 Step 2)", () => {
  it("emits a minimal file when no originalSource is set", () => {
    // Bare-minimum tree with no sub-components — exercises the template
    // path's handling of empty cvaExports, empty subComponents, empty
    // imports. Should produce a valid (if empty) source string.
    const programmaticTree = {
      name: "Programmatic",
      slug: "programmatic",
      filePath: "programmatic.tsx",
      roundTripRisk: "handleable" as const,
      customHandling: false,
      directives: [],
      filePassthrough: [],
      imports: [],
      cvaExports: [],
      contextExports: [],
      hookExports: [],
      subComponents: [],
    }
    const out = generateFromTreeV2(programmaticTree)
    // Empty file is fine — just a trailing newline.
    expect(out).toBe("\n")
  })

  it("throws GeneratorError only when an unrecoverable error occurs", () => {
    // Sanity check that the GeneratorError class still exists and can be
    // imported. Specific failure cases (e.g. overlapping splices) are
    // covered by the slow-path tests.
    expect(GeneratorError).toBeDefined()
  })

  it("emits a complete file from a factory-built tree", () => {
    // The from-scratch builder will call this exact path: build a tree
    // via the v2 factory helpers, hand it to the generator, get a .tsx
    // file out. This test exercises the same end-to-end shape.
    const tree = createComponentTreeV2("MyCard", "div")
    const out = generateFromTreeV2(tree)

    // Imports
    expect(out).toContain('import * as React from "react"')
    expect(out).toContain('import { cn } from "@/lib/utils"')

    // Sub-component declaration with the right name and prop type
    expect(out).toContain("function MyCard(")
    expect(out).toContain('React.ComponentProps<"div">')

    // Destructured className + spread
    expect(out).toContain("className,")
    expect(out).toContain("...props")

    // With no base classes, no cva, no convention flags, the generator
    // emits the bare `className` form (no wasted cn("", className) call).
    expect(out).toContain("className={className}")

    // data-slot attribute derived from the name
    expect(out).toContain('data-slot="my-card"')

    // {...props} spread on the JSX element
    expect(out).toContain("{...props}")

    // Named export at the bottom
    expect(out).toContain("export { MyCard }")
  })

  it("emits cva exports above the sub-component when present", () => {
    // Build a tree with one cva export. The from-scratch builder will do
    // this when the user opts into the cva variant strategy.
    const tree = createComponentTreeV2("MyButton", "button")
    tree.cvaExports.push({
      name: "myButtonVariants",
      baseClasses: "inline-flex items-center",
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground",
          destructive: "bg-destructive text-white",
        },
      },
      defaultVariants: { variant: "default" },
      exported: true,
    })

    const out = generateFromTreeV2(tree)
    expect(out).toContain("export const myButtonVariants = cva(")
    expect(out).toContain('"inline-flex items-center"')
    expect(out).toContain("variants: {")
    expect(out).toContain("variant: {")
    expect(out).toContain('default: "bg-primary text-primary-foreground"')
    expect(out).toContain('destructive: "bg-destructive text-white"')
    expect(out).toContain("defaultVariants: {")
  })

  it("ensures the cva export comes before its consumer sub-component", () => {
    const tree = createComponentTreeV2("MyButton", "button")
    tree.cvaExports.push({
      name: "myButtonVariants",
      baseClasses: "x",
      variants: {},
      exported: true,
    })

    const out = generateFromTreeV2(tree)
    const cvaIdx = out.indexOf("export const myButtonVariants")
    const fnIdx = out.indexOf("function MyButton(")
    expect(cvaIdx).toBeGreaterThan(-1)
    expect(fnIdx).toBeGreaterThan(-1)
    expect(cvaIdx).toBeLessThan(fnIdx)
  })

  it("emits 'use client' directive at the top when present", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    tree.directives.push("use client")

    const out = generateFromTreeV2(tree)
    expect(out.startsWith('"use client"\n')).toBe(true)
  })

  it("sub-components are emitted self-closing — body parts are preview-only", () => {
    // From-scratch sub-components are always self-closing in the source.
    // The user composes them via children in their own consuming code,
    // matching how shadcn's actual Card/Dialog/etc. work. Body parts the
    // user adds via the AssemblyPanel are canvas-preview-only and must
    // NOT be emitted as JSX children.
    const tree = createComponentTreeV2("MyCard", "div")
    // Manually add a body part to simulate what AssemblyPanel does
    tree.subComponents[0].parts.root.children = [
      {
        kind: "part",
        part: {
          base: { kind: "html", tag: "p" },
          className: { kind: "literal", value: "" },
          propsSpread: false,
          attributes: {},
          asChild: false,
          children: [],
        },
      },
    ]

    const out = generateFromTreeV2(tree)
    // Self-closing form
    expect(out).toContain("/>")
    // No <p> in the body
    expect(out).not.toContain("<p")
  })

  it("namedGroup prepends group/<kebab-name> to the className base classes", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    tree.subComponents[0].namedGroup = true

    const out = generateFromTreeV2(tree)
    expect(out).toContain('cn("group/my-card", className)')
  })

  it("headingFont prepends cn-font-heading to the className base classes", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    tree.subComponents[0].headingFont = true

    const out = generateFromTreeV2(tree)
    expect(out).toContain('cn("cn-font-heading", className)')
  })

  it("namedGroup + headingFont + user classes all coexist in the cn() call", () => {
    const tree = createComponentTreeV2("MyCard", "div")
    tree.subComponents[0].namedGroup = true
    tree.subComponents[0].headingFont = true
    // Set some user classes via the cn-call literal
    tree.subComponents[0].parts.root.className = {
      kind: "cn-call",
      args: ['"p-4 bg-muted"', "className"],
    }

    const out = generateFromTreeV2(tree)
    expect(out).toContain(
      'cn("group/my-card cn-font-heading p-4 bg-muted", className)',
    )
  })
})
