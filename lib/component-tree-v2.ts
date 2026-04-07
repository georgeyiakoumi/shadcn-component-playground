/**
 * ComponentTree v2 — schema for losslessly representing any shadcn registry
 * component file.
 *
 * Design doc: https://www.notion.so/33bfeeb2a07881b7a7bce13177051f8f
 * Linear: GEO-286
 *
 * This file defines ONLY the data model. No parser, no generator, no runtime
 * logic beyond factory helpers. Pillar 2 (GEO-287) will read this schema and
 * implement the AST-based parser; Pillar 3 (GEO-288) will implement the
 * generator.
 *
 * The guiding principle is **lossless by construction**: anything the parser
 * cannot structurally model goes into a typed `Passthrough` envelope and is
 * re-emitted verbatim by the generator. The schema only holds what the editor
 * needs to understand — everything else rides along untouched.
 *
 * Decisions D1–D10 referenced in the Notion doc are annotated on the relevant
 * fields below.
 */

/* ══════════════════════════════════════════════════════════════════════════
 * Top-level tree
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A full parsed representation of one file in `components/ui/`.
 *
 * One file = one tree. Multi-component files (e.g. Card exports Card,
 * CardHeader, CardTitle, …) are represented as a single tree with multiple
 * entries in `subComponents`.
 */
export interface ComponentTreeV2 {
  /** PascalCase component name, e.g. "Button", "AlertDialog". */
  name: string

  /** kebab-case slug matching the file stem, e.g. "button", "alert-dialog". */
  slug: string

  /** Repo-relative file path, e.g. "components/ui/button.tsx". */
  filePath: string

  /**
   * Round-trip risk bucket, set by the parser after a full read.
   * See Phase 1 spike (GEO-292) for the classification methodology.
   */
  roundTripRisk:
    | "handleable"
    | "needs-model-extension"
    | "needs-escape-hatch"
    | "unhandleable"

  /**
   * D8/D10 — escape hatch flag. When true, the structured fields below are
   * populated best-effort for the Outline panel, but the editor UI MUST use
   * the plain-text editor path and the generator MUST re-emit `rawSource`
   * verbatim instead of regenerating from the structured tree.
   */
  customHandling: boolean

  /**
   * D10 — raw source for escape-hatch components. Always present when
   * `customHandling` is true; undefined otherwise.
   */
  rawSource?: string

  /**
   * Top-of-file directives like `"use client"`. Emitted verbatim at the top
   * of the generated file in array order.
   */
  directives: string[]

  /**
   * File-level passthrough: leading comments, top-level statements the parser
   * did not model (e.g. `const _internalHelper = ...`), top-level type aliases
   * beyond what the parser handles structurally.
   */
  filePassthrough: Passthrough[]

  /** Structured import declarations, in source order. */
  imports: ImportDecl[]

  /**
   * cva helper function exports (`buttonVariants`, `badgeVariants`, etc.).
   * D5 — these are top-level, not nested under the sub-component that uses
   * them, because they are file-level exports and may be imported by other
   * components (e.g. Pagination imports `buttonVariants` from Button).
   */
  cvaExports: CvaExport[]

  /** React Context exports, e.g. `CarouselContext`, `ToggleGroupContext`. */
  contextExports: ContextExport[]

  /** Hook exports alongside the components, e.g. `useCarousel`. */
  hookExports: HookExport[]

  /**
   * The components themselves, in source order (D3). The generator must emit
   * exports in this exact order to keep the round-trip diff clean.
   */
  subComponents: SubComponentV2[]

  /**
   * Optional third-party integration metadata. Set when the component wraps a
   * known library (Calendar → react-day-picker, Drawer → vaul, etc.).
   * D6 — LibraryId is a closed enum.
   */
  thirdParty?: ThirdPartyIntegration
}

/* ══════════════════════════════════════════════════════════════════════════
 * Sub-components
 * ══════════════════════════════════════════════════════════════════════════ */

export interface SubComponentV2 {
  /** PascalCase export name, e.g. "Button", "DialogTrigger". */
  name: string

  /** kebab-case `data-slot` attribute value, e.g. "button", "dialog-trigger". */
  dataSlot: string

  /** Zero-based export index within the file, for source-order preservation. */
  exportOrder: number

  /** True if this is the file's default export (rare in shadcn; usually false). */
  isDefaultExport: boolean

  /** JSDoc block immediately preceding the export, if any. Verbatim source. */
  jsdoc: string | null

  /** Structured prop declaration. D2 of the Button PoC surfaced this shape. */
  propsDecl: PropsDecl

  /**
   * Variant strategy for this sub-component. D3 — per-sub-component, not
   * per-component. One component can mix strategies (e.g. Tabs has cva on
   * TabsList and data-attribute on TabsTrigger).
   */
  variantStrategy: VariantStrategy

  /**
   * In-body content the parser did not model: local consts, hooks called
   * inside the body (useMemo, useState, useContext), helper functions, etc.
   * Emitted verbatim by the generator in array order BEFORE the return
   * statement.
   */
  passthrough: Passthrough[]

  /**
   * D4 — the parts tree for this sub-component. A tree, not a flat list,
   * because `<SheetPortal><SheetOverlay /><SheetPrimitive.Content /></SheetPortal>`
   * requires nesting. The root is always `parts.root`.
   */
  parts: {
    root: PartNode
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Parts
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A single JSX element inside a sub-component's body. Part nodes compose into
 * a tree via `children`.
 */
export interface PartNode {
  /** What this part wraps (HTML tag, Radix primitive, third-party, etc.). */
  base: Base

  /** The `data-slot` attribute value, if any. Structured, not free-form. */
  dataSlot?: string

  /** The className expression — may be a plain string, a cn() call, etc. */
  className: ClassNameExpr

  /**
   * True if the JSX element spreads `{...props}`. The generator emits the
   * spread at the correct position in the element's attribute list.
   */
  propsSpread: boolean

  /**
   * Explicit attribute overrides set on the element beyond className, dataSlot,
   * and propsSpread. E.g. `role="dialog"`, `aria-labelledby={titleId}`, event
   * handlers, `ref={ref}`. Stored as a map of attribute name → raw source
   * expression string.
   */
  attributes: Record<string, string>

  /**
   * True if this element uses Radix's `asChild` composition pattern. When
   * true, `children[0]` is the composed inner element that takes this part's
   * attributes via Slot.
   */
  asChild: boolean

  /** Ordered child list — other parts, text, interpolations, or passthrough. */
  children: PartChild[]
}

/** Union of things that can appear inside a PartNode's children. */
export type PartChild =
  | { kind: "part"; part: PartNode }
  | { kind: "text"; value: string }
  | { kind: "expression"; source: string } // e.g. `{children}`, `{label}`
  | { kind: "jsx-comment"; source: string } // `{/* comment */}`
  | { kind: "passthrough"; passthrough: Passthrough }

/* ══════════════════════════════════════════════════════════════════════════
 * Base — what a part wraps
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * What a PartNode is rendering. Discriminated by `kind`.
 *
 * - `html`: a plain HTML tag like `div`, `button`, `nav`.
 * - `radix`: a Radix primitive like `DialogPrimitive.Root`. `primitive` is
 *   the namespace import name, `part` is the sub-part (Root, Trigger, etc.).
 * - `third-party`: a known library component. `library` is the enum id,
 *   `component` is the named export from that library.
 * - `component-ref`: an internal reference to another component in the same
 *   playground, e.g. Pagination's PaginationLink uses `<Button>`.
 * - `dynamic-ref`: a local variable reference computed in the body's
 *   passthrough, e.g. `const Comp = asChild ? Slot : "button"` produces
 *   `{ kind: 'dynamic-ref', localName: 'Comp' }`. The generator emits
 *   `<Comp ... />` and the passthrough emits the `const` line.
 */
export type Base =
  | { kind: "html"; tag: string }
  | { kind: "radix"; primitive: string; part: string }
  | { kind: "third-party"; library: LibraryId; component: string }
  | { kind: "component-ref"; name: string }
  | { kind: "dynamic-ref"; localName: string }

/* ══════════════════════════════════════════════════════════════════════════
 * ClassName expression
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A className expression attached to a PartNode.
 *
 * D8 — class strings are stored as strings in v2. The visual editor's class
 * tokenizer is a separate layer that parses these on load; v2 does not
 * pre-tokenize them.
 */
export type ClassNameExpr =
  | {
      /** Plain string literal, e.g. `className="flex items-center"`. */
      kind: "literal"
      value: string
    }
  | {
      /** A cva() invocation, e.g. `className={buttonVariants({ variant, size, className })}`. */
      kind: "cva-call"
      /** Name of the cva export being invoked (must match a `cvaExports[].name`). */
      cvaRef: string
      /** The argument names passed to the cva call, in order. */
      args: string[]
    }
  | {
      /** A cn() invocation wrapping one or more class sources. */
      kind: "cn-call"
      /** The source of each argument to cn(), in order. Strings are verbatim. */
      args: string[]
    }
  | {
      /** Any other expression the parser didn't model — emitted verbatim. */
      kind: "passthrough"
      source: string
    }

/* ══════════════════════════════════════════════════════════════════════════
 * Variant strategy
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * How a sub-component expresses variants. D3 — per-sub-component.
 *
 * - `cva`: uses a cva export. `cvaRef` points at a `CvaExport` by name.
 * - `data-attribute`: uses CSS data-attribute selectors keyed off `data-*`
 *   attributes set by Radix (e.g. `data-state=open`) or the component itself
 *   (e.g. `data-size=sm`). `attrs` lists the attribute names the component
 *   reads from to drive variants.
 * - `none`: no variant system.
 */
export type VariantStrategy =
  | { kind: "cva"; cvaRef: string }
  | { kind: "data-attribute"; attrs: string[] }
  | { kind: "none" }

/* ══════════════════════════════════════════════════════════════════════════
 * cva exports
 * ══════════════════════════════════════════════════════════════════════════ */

export interface CvaExport {
  /** The exported name, e.g. "buttonVariants". */
  name: string

  /** The base class string (first arg to cva). */
  baseClasses: string

  /**
   * The variants object — a map of variant group name (e.g. "variant", "size")
   * to a map of variant value name to class string.
   */
  variants: Record<string, Record<string, string>>

  /** The defaultVariants map, if present. */
  defaultVariants?: Record<string, string>

  /** True if the cva export is named-exported from the file. */
  exported: boolean

  /**
   * Set if this cva is not defined in this file but re-exported or imported
   * from another file. The parser/generator handle import resolution via this
   * field. E.g. pagination.tsx imports `buttonVariants` from button.tsx.
   */
  sourceFile?: string
}

/* ══════════════════════════════════════════════════════════════════════════
 * Context & hook exports
 * ══════════════════════════════════════════════════════════════════════════ */

export interface ContextExport {
  /** The exported context name, e.g. "CarouselContext". */
  name: string

  /** Raw source of the Context.create<...>() default value, for round-trip. */
  defaultValueSource: string

  /** Raw source of the type argument passed to createContext<...>. */
  typeArgSource: string
}

export interface HookExport {
  /** The exported hook name, e.g. "useCarousel". */
  name: string

  /** Raw source of the entire hook body, for round-trip. */
  bodySource: string
}

/* ══════════════════════════════════════════════════════════════════════════
 * Props declaration
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A TypeScript prop declaration for a sub-component. Kept shallow in v2 — we
 * capture enough shape to round-trip, not the full TypeScript type system.
 */
export type PropsDecl =
  | {
      /** Intersection of multiple prop sources, e.g. `A & B & C`. */
      kind: "intersection"
      parts: PropsPart[]
    }
  | {
      /** A single prop source. */
      kind: "single"
      part: PropsPart
    }
  | {
      /** No explicit props declaration (rare). */
      kind: "none"
    }

export type PropsPart =
  | {
      /** `React.ComponentProps<"button">` — standard HTML element props. */
      kind: "component-props"
      target: string // "button", "input", "div", …
    }
  | {
      /** `React.ComponentProps<typeof DialogPrimitive.Root>` — Radix primitive props. */
      kind: "component-props-of"
      targetExpr: string // verbatim source of the `typeof ...` expression
    }
  | {
      /** `VariantProps<typeof buttonVariants>`. */
      kind: "variant-props"
      cvaRef: string
    }
  | {
      /** Inline prop declarations, e.g. `{ asChild?: boolean }`. */
      kind: "inline"
      properties: InlineProperty[]
    }
  | {
      /** Any other prop source the parser didn't model. */
      kind: "passthrough"
      source: string
    }

export interface InlineProperty {
  name: string
  type: string // verbatim source of the TypeScript type annotation
  optional: boolean
  defaultValue?: string // verbatim source, if present in destructuring
}

/* ══════════════════════════════════════════════════════════════════════════
 * Imports
 * ══════════════════════════════════════════════════════════════════════════ */

export type ImportDecl =
  | {
      /** `import * as React from "react"` or `import React from "react"`. */
      kind: "default-namespace"
      source: string
      localName: string
      namespaceImport: boolean // true for `* as X`, false for `X`
    }
  | {
      /** `import { Slot } from "@radix-ui/react-slot"`. */
      kind: "named"
      source: string
      names: string[]
      /** Type-only named imports, e.g. `import { type VariantProps } from "..."`. */
      typeNames?: string[]
    }
  | {
      /** `import "./something.css"` — side-effect import. */
      kind: "side-effect"
      source: string
    }

/* ══════════════════════════════════════════════════════════════════════════
 * Third-party integrations
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * D6 — closed enum of supported third-party libraries. Adding a new library
 * means adding an enum value AND a corresponding adapter config type below.
 * Unknown libraries fall through to `filePassthrough` with
 * `roundTripRisk: 'unhandleable'`.
 */
export type LibraryId =
  | "radix-ui" // umbrella package (radix-ui, not @radix-ui/react-*)
  | "react-day-picker"
  | "cmdk"
  | "vaul"
  | "embla-carousel-react"
  | "sonner"
  | "react-resizable-panels"
  | "input-otp"

export interface ThirdPartyIntegration {
  library: LibraryId
  /**
   * Per-library config object. The schema is defined by the library adapter;
   * Pillar 2 will land per-library config types as needed. For v2 we keep it
   * loose as a verbatim source blob.
   */
  configSource?: string
}

/* ══════════════════════════════════════════════════════════════════════════
 * Passthrough — the escape valve
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * A typed envelope for source content the parser did not structurally model.
 * The generator emits `source` verbatim in the position implied by the field
 * that holds this Passthrough (filePassthrough, SubComponentV2.passthrough,
 * PartChild of kind 'passthrough', etc.).
 *
 * D7 — `kind` exists so the UI can display passthrough regions meaningfully
 * ("this component has 2 comments, 1 useMemo, 1 helper function the parser
 * didn't understand").
 */
export interface Passthrough {
  kind:
    | "comment" // // ... or /* ... */
    | "import" // an import the parser didn't model
    | "statement" // top-level or in-body statement (const, let, function)
    | "jsx-expression" // an expression inside JSX
    | "type-alias" // a type alias the parser didn't model
    | "raw" // anything else

  /** Verbatim source text. */
  source: string

  /** Original position, for diagnostics only. Not used for round-trip. */
  position?: {
    line: number
    column: number
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Migration helpers
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * D1 — one-way upgrade from v1 ComponentTree (M3 from-scratch model) to v2.
 *
 * Not implemented in this file — Pillar 2 or a follow-up will land the actual
 * upgrade logic. The signature is pinned here so downstream code can depend
 * on it.
 *
 * @see lib/component-tree.ts for the v1 shape
 */
export type UpgradeV1ToV2Fn = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v1: any, // typed as ComponentTree in the implementation file
) => ComponentTreeV2
