/**
 * Carousel composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/carousel
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <Carousel>
 *       <CarouselContent>
 *         <CarouselItem>...</CarouselItem>
 *         <CarouselItem>...</CarouselItem>
 *         <CarouselItem>...</CarouselItem>
 *       </CarouselContent>
 *       <CarouselPrevious />
 *       <CarouselNext />
 *     </Carousel>
 *
 * ## Implementation notes
 *
 * Inline family — uses `embla-carousel-react` (NOT Radix). The
 * shadcn Carousel components rely on a `CarouselContext` provided
 * by the root `Carousel` function, and `CarouselPrevious`/
 * `CarouselNext` throw if rendered outside that context.
 *
 * Rather than reimplementing embla setup in the rule, we IMPORT
 * the real shadcn Carousel exports. The "no touching components/ui"
 * freeze means we can't MODIFY them, but importing + composing is
 * fine — that's the whole point of those exports.
 *
 * The Prev/Next buttons are absolutely positioned by the source
 * (`-left-12` / `-right-12`), so they sit OUTSIDE the visual
 * carousel area. We add horizontal padding to the wrapping div so
 * they stay inside the canvas.
 *
 * No stylePath needed — none of the Carousel sub-components are
 * Portal-wrapped.
 *
 * The visible items are Card-shaped numbered tiles to match the
 * docs example.
 */

"use client"

import * as React from "react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CarouselRender(ctx: SnippetContext): React.ReactNode {
  const carouselCls = classesFor(ctx, "Carousel")
  const contentCls = classesFor(ctx, "CarouselContent")
  const itemCls = classesFor(ctx, "CarouselItem")
  const prevCls = classesFor(ctx, "CarouselPrevious")
  const nextCls = classesFor(ctx, "CarouselNext")

  const carouselPath = pathFor(ctx, "Carousel")
  const contentPath = pathFor(ctx, "CarouselContent")
  const itemPath = pathFor(ctx, "CarouselItem")
  const prevPath = pathFor(ctx, "CarouselPrevious")
  const nextPath = pathFor(ctx, "CarouselNext")

  return (
    /*
     * Centring via flex on a fully-positioned parent (`inset-0`)
     * instead of `top-1/2 left-1/2 -translate`. The translate
     * approach was leaving the wrapper's intrinsic width at
     * 0 during embla's first measurement pass, collapsing the
     * carousel content. Flex centring gives the wrapper a
     * proper layout box from the start.
     */
    <div className="absolute inset-0 flex items-center justify-center">
     <div className="w-[20rem]">
      <Carousel
        data-node-id={carouselPath}
        opts={{ loop: true }}
        className={withSelectionRing(
          carouselCls,
          ctx.selectedPath === carouselPath,
        )}
      >
        <CarouselContent
          data-node-id={contentPath}
          className={withSelectionRing(
            contentCls,
            ctx.selectedPath === contentPath,
          )}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <CarouselItem
              key={n}
              data-node-id={n === 1 ? itemPath : undefined}
              className={
                n === 1
                  ? withSelectionRing(
                      itemCls,
                      ctx.selectedPath === itemPath,
                    )
                  : itemCls
              }
            >
              {/*
                Explicit `h-[12rem]` (instead of `aspect-square`)
                because the carousel's parent doesn't have a deterministic
                width during embla's first measurement pass; aspect-ratio
                collapses to ~0 in that frame and never recovers.
              */}
              <div className="flex h-[12rem] items-center justify-center rounded-md border bg-card p-6 text-card-foreground">
                <span className="text-4xl font-semibold">{n}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/*
          Override the source's `-left-12`/`-right-12` so the
          arrow buttons sit just inside the carousel edges
          instead of bleeding into the canvas margins.
        */}
        <CarouselPrevious
          data-node-id={prevPath}
          className={withSelectionRing(
            cn(prevCls, "left-2"),
            ctx.selectedPath === prevPath,
          )}
        />
        <CarouselNext
          data-node-id={nextPath}
          className={withSelectionRing(
            cn(nextCls, "right-2"),
            ctx.selectedPath === nextPath,
          )}
        />
      </Carousel>
     </div>
    </div>
  )
}

export const carouselRule: CompositionRule = {
  slug: "carousel",
  source: "https://ui.shadcn.com/docs/components/carousel (fetched 2026-04-09)",
  composition: {
    name: "Carousel",
    children: [
      {
        name: "CarouselContent",
        children: [{ name: "CarouselItem" }],
      },
      { name: "CarouselPrevious" },
      { name: "CarouselNext" },
    ],
  },
  render: CarouselRender,
}
