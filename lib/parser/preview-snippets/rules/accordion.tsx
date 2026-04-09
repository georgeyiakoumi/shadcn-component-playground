/**
 * Accordion composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/accordion
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Accordion type="single" collapsible>
 *       <AccordionItem value="item-1">
 *         <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *         <AccordionContent>
 *           Yes. It adheres to the WAI-ARIA design pattern.
 *         </AccordionContent>
 *       </AccordionItem>
 *     </Accordion>
 *
 * ## Implementation notes
 *
 * Inline family — no Portal, no floating. Accordion is a single
 * Radix Root with N Item children, each containing a Trigger and
 * Content.
 *
 * **AccordionTrigger's source root is `Accordion.Header`**
 * (a wrapper `<h3>` with literal `"flex"` class) with the real
 * styleable `Accordion.Trigger` primitive at `children[0]`. We
 * set `stylePath: [0]` to route reads/writes to the inner
 * Trigger.
 *
 * **AccordionContent's source root is `Accordion.Content`** with
 * animation classes (`data-[state=closed]:animate-accordion-up`,
 * etc.), and an inner `<div>` with the user-facing padding classes
 * (`pt-0 pb-4`) at `children[0]`. The padding is what users
 * typically want to edit, so `stylePath: [0]` routes there.
 * Animation classes on the outer wrapper are rarely edited.
 *
 * We render THREE items (the docs example has three FAQ-style
 * entries) with `defaultValue="item-1"` so the first item is
 * expanded by default for styling visibility.
 */

"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function AccordionRender(ctx: SnippetContext): React.ReactNode {
  const accordionCls = classesFor(ctx, "Accordion")
  const itemCls = classesFor(ctx, "AccordionItem")
  const triggerCls = classesFor(ctx, "AccordionTrigger")
  const contentCls = classesFor(ctx, "AccordionContent")

  const accordionPath = pathFor(ctx, "Accordion")
  const itemPath = pathFor(ctx, "AccordionItem")
  const triggerPath = pathFor(ctx, "AccordionTrigger")
  const contentPath = pathFor(ctx, "AccordionContent")

  // Three sample FAQ items that closely match the docs example.
  const items = [
    {
      value: "item-1",
      trigger: "Is it accessible?",
      content: "Yes. It adheres to the WAI-ARIA design pattern.",
    },
    {
      value: "item-2",
      trigger: "Is it styled?",
      content:
        "Yes. It comes with default styles that matches the other components' aesthetic.",
    },
    {
      value: "item-3",
      trigger: "Is it animated?",
      content: "Yes. It's animated by default, but you can disable it if you prefer.",
    },
  ]

  return (
    <div className="absolute top-1/2 left-1/2 w-[32rem] -translate-x-1/2 -translate-y-1/2">
      <AccordionPrimitive.Root
        type="single"
        collapsible
        defaultValue="item-1"
        data-node-id={accordionPath}
        className={withSelectionRing(
          accordionCls,
          ctx.selectedPath === accordionPath,
        )}
      >
        {items.map((item, i) => (
          <AccordionPrimitive.Item
            key={item.value}
            value={item.value}
            // Only the FIRST item carries the data-node-id + selection
            // ring. Otherwise every item would try to be "the
            // AccordionItem" simultaneously and clicks would fight
            // for the same selection. Rest get the classes but no
            // selection wiring — they're preview-only duplicates.
            data-node-id={i === 0 ? itemPath : undefined}
            className={
              i === 0
                ? withSelectionRing(
                    itemCls,
                    ctx.selectedPath === itemPath,
                  )
                : itemCls
            }
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                data-node-id={i === 0 ? triggerPath : undefined}
                className={
                  i === 0
                    ? withSelectionRing(
                        triggerCls,
                        ctx.selectedPath === triggerPath,
                      )
                    : triggerCls
                }
              >
                {item.trigger}
                <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              {/*
                The inner div is the real styleable AccordionContent
                part (children[0] in the parser tree). Its data-node-id
                + selection matches the pathFor stylePath routing.
              */}
              <div
                data-node-id={i === 0 ? contentPath : undefined}
                className={
                  i === 0
                    ? withSelectionRing(
                        cn("pt-0 pb-4", contentCls),
                        ctx.selectedPath === contentPath,
                      )
                    : cn("pt-0 pb-4", contentCls)
                }
              >
                {item.content}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  )
}

export const accordionRule: CompositionRule = {
  slug: "accordion",
  source:
    "https://ui.shadcn.com/docs/components/accordion (fetched 2026-04-09)",
  composition: {
    name: "Accordion",
    children: [
      {
        name: "AccordionItem",
        children: [
          {
            name: "AccordionTrigger",
            // Source: Header (literal "flex") wraps Trigger at [0].
            // Styleable classes live on Trigger — route there.
            stylePath: [0],
          },
          {
            name: "AccordionContent",
            // Source: Content wrapper has animation classes; the
            // real padding div is at children[0]. Route to inner
            // div where users actually edit pt/pb.
            stylePath: [0],
          },
        ],
      },
    ],
  },
  render: AccordionRender,
}
