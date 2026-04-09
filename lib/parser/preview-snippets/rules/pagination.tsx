/**
 * Pagination composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/pagination
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <Pagination>
 *       <PaginationContent>
 *         <PaginationItem>
 *           <PaginationPrevious href="#" />
 *         </PaginationItem>
 *         <PaginationItem>
 *           <PaginationLink href="#">1</PaginationLink>
 *         </PaginationItem>
 *         <PaginationItem>
 *           <PaginationLink href="#" isActive>2</PaginationLink>
 *         </PaginationItem>
 *         <PaginationItem>
 *           <PaginationLink href="#">3</PaginationLink>
 *         </PaginationItem>
 *         <PaginationItem>
 *           <PaginationEllipsis />
 *         </PaginationItem>
 *         <PaginationItem>
 *           <PaginationNext href="#" />
 *         </PaginationItem>
 *       </PaginationContent>
 *     </Pagination>
 *
 * ## Implementation notes
 *
 * Pagination has 7 sub-components total. PaginationLink uses
 * `buttonVariants` cva from the Button component, applied via cn()
 * inside the source. PaginationPrevious / PaginationNext are wrappers
 * around PaginationLink with hardcoded chevron icons + text labels.
 *
 * The rule renders the docs example verbatim with 3 page numbers
 * (1, 2-active, 3), an ellipsis, and previous/next controls. Sub-
 * components used multiple times only carry a `data-node-id` on
 * their first instance — same pattern as Breadcrumb and the menu
 * rules.
 *
 * The chevrons inside Previous / Next render as real Lucide icons
 * (ChevronLeft / ChevronRight) directly, and the ellipsis renders
 * a real MoreHorizontal so the size-9 + center alignment classes
 * have something to wrap.
 */

"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

/*
 * KNOWN PARSER LIMITATION (followup ticket TBD, similar to
 * NavigationMenu's `navigationMenuTriggerStyle()` workaround):
 *
 * PaginationLink's source has
 *   className={cn(buttonVariants({ variant, size }), className)}
 *
 * The parser stores `buttonVariants({...})` as a literal text token
 * in the cn-call args (same family as ternary expressions and
 * function-call expressions), so reading `linkCls` via the normal
 * `classesFor` path returns nothing useful.
 *
 * Workaround: import `buttonVariants` from the canonical source and
 * apply it directly. The cva variant choice mirrors the source —
 * `outline` for the active page, `ghost` for inactive, `default` size
 * (which matches what PaginationPrevious / PaginationNext explicitly
 * pass). Same trick as navigation-menu.tsx + the ternary fix in
 * carousel.tsx.
 */
const linkActiveCls = buttonVariants({ variant: "outline", size: "default" })
const linkInactiveCls = buttonVariants({ variant: "ghost", size: "default" })

function PaginationRender(ctx: SnippetContext): React.ReactNode {
  const paginationCls = classesFor(ctx, "Pagination")
  const contentCls = classesFor(ctx, "PaginationContent")
  const itemCls = classesFor(ctx, "PaginationItem")
  const linkCls = classesFor(ctx, "PaginationLink")
  const previousCls = classesFor(ctx, "PaginationPrevious")
  const nextCls = classesFor(ctx, "PaginationNext")
  const ellipsisCls = classesFor(ctx, "PaginationEllipsis")

  const paginationPath = pathFor(ctx, "Pagination")
  const contentPath = pathFor(ctx, "PaginationContent")
  const itemPath = pathFor(ctx, "PaginationItem")
  const linkPath = pathFor(ctx, "PaginationLink")
  const previousPath = pathFor(ctx, "PaginationPrevious")
  const nextPath = pathFor(ctx, "PaginationNext")
  const ellipsisPath = pathFor(ctx, "PaginationEllipsis")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <nav
        role="navigation"
        aria-label="pagination"
        data-node-id={paginationPath}
        className={withSelectionRing(
          paginationCls,
          ctx.selectedPath === paginationPath,
        )}
      >
        <ul
          data-node-id={contentPath}
          className={withSelectionRing(
            contentCls,
            ctx.selectedPath === contentPath,
          )}
        >
          <li
            data-node-id={itemPath}
            className={withSelectionRing(
              itemCls,
              ctx.selectedPath === itemPath,
            )}
          >
            <a
              href="#"
              aria-label="Go to previous page"
              data-node-id={previousPath}
              className={withSelectionRing(
                cn(linkInactiveCls, "gap-1 px-2.5", previousCls),
                ctx.selectedPath === previousPath,
              )}
            >
              <ChevronLeft />
              <span>Previous</span>
            </a>
          </li>
          <li className={itemCls}>
            <a
              href="#"
              data-node-id={linkPath}
              className={withSelectionRing(
                cn(linkInactiveCls, linkCls),
                ctx.selectedPath === linkPath,
              )}
            >
              1
            </a>
          </li>
          <li className={itemCls}>
            <a
              href="#"
              aria-current="page"
              data-active="true"
              className={cn(linkActiveCls, linkCls)}
            >
              2
            </a>
          </li>
          <li className={itemCls}>
            <a href="#" className={cn(linkInactiveCls, linkCls)}>
              3
            </a>
          </li>
          <li className={itemCls}>
            <span
              aria-hidden
              data-node-id={ellipsisPath}
              className={withSelectionRing(
                ellipsisCls,
                ctx.selectedPath === ellipsisPath,
              )}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More pages</span>
            </span>
          </li>
          <li className={itemCls}>
            <a
              href="#"
              aria-label="Go to next page"
              data-node-id={nextPath}
              className={withSelectionRing(
                cn(linkInactiveCls, "gap-1 px-2.5", nextCls),
                ctx.selectedPath === nextPath,
              )}
            >
              <span>Next</span>
              <ChevronRight />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export const paginationRule: CompositionRule = {
  slug: "pagination",
  source:
    "https://ui.shadcn.com/docs/components/pagination (fetched 2026-04-09)",
  composition: {
    name: "Pagination",
    children: [
      {
        name: "PaginationContent",
        children: [
          {
            name: "PaginationItem",
            children: [
              { name: "PaginationLink" },
              { name: "PaginationPrevious" },
              { name: "PaginationNext" },
              { name: "PaginationEllipsis" },
            ],
          },
        ],
      },
    ],
  },
  render: PaginationRender,
}
