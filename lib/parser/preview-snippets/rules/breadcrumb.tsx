/**
 * Breadcrumb composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/breadcrumb
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <Breadcrumb>
 *       <BreadcrumbList>
 *         <BreadcrumbItem>
 *           <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *         </BreadcrumbItem>
 *         <BreadcrumbSeparator />
 *         <BreadcrumbItem>
 *           <BreadcrumbEllipsis />
 *         </BreadcrumbItem>
 *         <BreadcrumbSeparator />
 *         <BreadcrumbItem>
 *           <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
 *         </BreadcrumbItem>
 *         <BreadcrumbSeparator />
 *         <BreadcrumbItem>
 *           <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
 *         </BreadcrumbItem>
 *       </BreadcrumbList>
 *     </Breadcrumb>
 *
 * ## Implementation notes
 *
 * Breadcrumb is the canonical example of a "flat-renderer needs help"
 * compound — its 7 sub-components have to nest as
 * `<nav> > <ol> > <li> > <a>/<span>/<li>` and the flat renderer's
 * sibling-rendering blows the layout apart.
 *
 * The rule renders the docs example verbatim with sample copy
 * (Home / ... / Components / Breadcrumb). Sub-components used more
 * than once (BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator)
 * only carry a `data-node-id` on their FIRST instance — the rest use
 * the resolved class string but don't compete for selection. This
 * matches the pattern from `rules/dropdown-menu.tsx` and
 * `rules/menubar.tsx`.
 *
 * BreadcrumbEllipsis renders a real Lucide MoreHorizontal icon
 * directly (instead of relying on the parser to resolve `<MoreHorizontal />`
 * inside the source body), and BreadcrumbSeparator renders a real
 * ChevronRight for the same reason.
 */

"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function BreadcrumbRender(ctx: SnippetContext): React.ReactNode {
  const breadcrumbCls = classesFor(ctx, "Breadcrumb")
  const listCls = classesFor(ctx, "BreadcrumbList")
  const itemCls = classesFor(ctx, "BreadcrumbItem")
  const linkCls = classesFor(ctx, "BreadcrumbLink")
  const pageCls = classesFor(ctx, "BreadcrumbPage")
  const separatorCls = classesFor(ctx, "BreadcrumbSeparator")
  const ellipsisCls = classesFor(ctx, "BreadcrumbEllipsis")

  const breadcrumbPath = pathFor(ctx, "Breadcrumb")
  const listPath = pathFor(ctx, "BreadcrumbList")
  const itemPath = pathFor(ctx, "BreadcrumbItem")
  const linkPath = pathFor(ctx, "BreadcrumbLink")
  const pagePath = pathFor(ctx, "BreadcrumbPage")
  const separatorPath = pathFor(ctx, "BreadcrumbSeparator")
  const ellipsisPath = pathFor(ctx, "BreadcrumbEllipsis")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <nav
        aria-label="breadcrumb"
        data-node-id={breadcrumbPath}
        className={withSelectionRing(
          breadcrumbCls,
          ctx.selectedPath === breadcrumbPath,
        )}
      >
        <ol
          data-node-id={listPath}
          className={withSelectionRing(
            listCls,
            ctx.selectedPath === listPath,
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
              data-node-id={linkPath}
              className={withSelectionRing(
                linkCls,
                ctx.selectedPath === linkPath,
              )}
            >
              Home
            </a>
          </li>
          <li
            data-node-id={separatorPath}
            role="presentation"
            aria-hidden="true"
            className={withSelectionRing(
              separatorCls,
              ctx.selectedPath === separatorPath,
            )}
          >
            <ChevronRight />
          </li>
          <li className={itemCls}>
            <span
              data-node-id={ellipsisPath}
              role="presentation"
              aria-hidden="true"
              className={withSelectionRing(
                ellipsisCls,
                ctx.selectedPath === ellipsisPath,
              )}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More</span>
            </span>
          </li>
          <li role="presentation" aria-hidden="true" className={separatorCls}>
            <ChevronRight />
          </li>
          <li className={itemCls}>
            <a href="#" className={linkCls}>
              Components
            </a>
          </li>
          <li role="presentation" aria-hidden="true" className={separatorCls}>
            <ChevronRight />
          </li>
          <li className={itemCls}>
            <span
              data-node-id={pagePath}
              role="link"
              aria-disabled="true"
              aria-current="page"
              className={withSelectionRing(
                pageCls,
                ctx.selectedPath === pagePath,
              )}
            >
              Breadcrumb
            </span>
          </li>
        </ol>
      </nav>
    </div>
  )
}

export const breadcrumbRule: CompositionRule = {
  slug: "breadcrumb",
  source:
    "https://ui.shadcn.com/docs/components/breadcrumb (fetched 2026-04-09)",
  composition: {
    name: "Breadcrumb",
    children: [
      {
        name: "BreadcrumbList",
        children: [
          {
            name: "BreadcrumbItem",
            children: [
              { name: "BreadcrumbLink" },
              { name: "BreadcrumbPage" },
              { name: "BreadcrumbEllipsis" },
            ],
          },
          { name: "BreadcrumbSeparator" },
        ],
      },
    ],
  },
  render: BreadcrumbRender,
}
