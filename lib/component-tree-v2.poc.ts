/**
 * Proof-of-concept: hand-written ComponentTreeV2 for `components/ui/button.tsx`.
 *
 * This file exists as a compile-time test of the v2 schema. If this file
 * typechecks, the schema can losslessly express the Button component. No
 * runtime assertions — the TypeScript compiler is the test.
 *
 * Source: components/ui/button.tsx (new-york-v4 variant, post-GEO-282 refresh)
 * Design doc: https://www.notion.so/33bfeeb2a07881b7a7bce13177051f8f
 * Linear: GEO-286
 *
 * NOTE: the cva variant class strings below are truncated with `...` because
 * the purpose of this PoC is schema validation, not byte-equivalence. The
 * parser in Pillar 2 will read the real strings from source.
 */

import type { ComponentTreeV2 } from "./component-tree-v2"

export const buttonTreePoC: ComponentTreeV2 = {
  name: "Button",
  slug: "button",
  filePath: "components/ui/button.tsx",
  roundTripRisk: "handleable",
  customHandling: false,

  directives: ['"use client"'],

  filePassthrough: [],

  imports: [
    {
      kind: "default-namespace",
      source: "react",
      localName: "React",
      namespaceImport: true,
    },
    {
      kind: "named",
      source: "@radix-ui/react-slot",
      names: ["Slot"],
    },
    {
      kind: "named",
      source: "class-variance-authority",
      names: ["cva"],
      typeNames: ["VariantProps"],
    },
    {
      kind: "named",
      source: "@/lib/utils",
      names: ["cn"],
    },
  ],

  cvaExports: [
    {
      name: "buttonVariants",
      baseClasses:
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ...",
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 ...",
          destructive: "bg-destructive text-white shadow-xs ...",
          outline: "border bg-background shadow-xs ...",
          secondary: "bg-secondary text-secondary-foreground shadow-xs ...",
          ghost: "hover:bg-accent hover:text-accent-foreground ...",
          link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
          default: "h-9 px-4 py-2 has-[>svg]:px-3",
          sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
          lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
          icon: "size-9",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
      exported: true,
    },
  ],

  contextExports: [],
  hookExports: [],

  subComponents: [
    {
      name: "Button",
      dataSlot: "button",
      exportOrder: 0,
      isDefaultExport: false,
      jsdoc: null,

      propsDecl: {
        kind: "intersection",
        parts: [
          { kind: "component-props", target: "button" },
          { kind: "variant-props", cvaRef: "buttonVariants" },
          {
            kind: "inline",
            properties: [
              {
                name: "asChild",
                type: "boolean",
                optional: true,
                defaultValue: "false",
              },
            ],
          },
        ],
      },

      variantStrategy: { kind: "cva", cvaRef: "buttonVariants" },

      passthrough: [
        {
          kind: "statement",
          source: 'const Comp = asChild ? Slot : "button"',
        },
      ],

      parts: {
        root: {
          // The root renders `<Comp ... />` where Comp comes from the
          // passthrough statement above. `dynamic-ref` is how v2 expresses
          // this without having to parse the ternary.
          base: { kind: "dynamic-ref", localName: "Comp" },
          dataSlot: "button",
          className: {
            kind: "cva-call",
            cvaRef: "buttonVariants",
            args: ["variant", "size", "className"],
          },
          propsSpread: true,
          attributes: {},
          asChild: false,
          children: [],
        },
      },
    },
  ],

  thirdParty: undefined,
}
