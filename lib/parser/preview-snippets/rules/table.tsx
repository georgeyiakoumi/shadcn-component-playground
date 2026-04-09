/**
 * Table composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/table
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <Table>
 *       <TableCaption>A list of your recent invoices.</TableCaption>
 *       <TableHeader>
 *         <TableRow>
 *           <TableHead className="w-[100px]">Invoice</TableHead>
 *           <TableHead>Status</TableHead>
 *           <TableHead>Method</TableHead>
 *           <TableHead className="text-right">Amount</TableHead>
 *         </TableRow>
 *       </TableHeader>
 *       <TableBody>
 *         <TableRow>
 *           <TableCell className="font-medium">INV001</TableCell>
 *           <TableCell>Paid</TableCell>
 *           <TableCell>Credit Card</TableCell>
 *           <TableCell className="text-right">$250.00</TableCell>
 *         </TableRow>
 *       </TableBody>
 *     </Table>
 *
 * ## Implementation notes
 *
 * The flat renderer's failure mode for Table was a hydration error:
 * `<thead>` cannot be a child of `<div>`. The cause: the parser sees
 * Table sub-components as flat siblings, so the renderer emits
 * `<thead>` as a direct child of the Table root, which is itself a
 * `<div>` wrapper around `<table>` (per Table's source — the outer
 * `<div data-slot="table-container">` provides the overflow-x-auto).
 * The composition rule fixes this by emitting the real `<table>`
 * hierarchy directly: `<div> > <table> > <thead>/<tbody>` etc.
 *
 * `stylePath: [0]` on Table because the user-styleable classes live
 * on the inner `<table>` (parts.root.children[0]) — the outer `<div>`
 * just has the hardcoded `relative w-full overflow-x-auto` classes
 * from source. Same pattern as DialogContent / SheetContent /
 * AlertDialogContent. Both reads (classesFor) and edits (Style panel)
 * route through this stylePath.
 *
 * The rule extends the docs example with a few extra rows so
 * TableFooter has something below it to demonstrate. TableHead vs
 * TableCell distinction is shown by the header row vs body rows.
 */

"use client"

import * as React from "react"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function TableRender(ctx: SnippetContext): React.ReactNode {
  const tableCls = classesFor(ctx, "Table")
  const headerCls = classesFor(ctx, "TableHeader")
  const bodyCls = classesFor(ctx, "TableBody")
  const footerCls = classesFor(ctx, "TableFooter")
  const rowCls = classesFor(ctx, "TableRow")
  const headCls = classesFor(ctx, "TableHead")
  const cellCls = classesFor(ctx, "TableCell")
  const captionCls = classesFor(ctx, "TableCaption")

  const tablePath = pathFor(ctx, "Table")
  const headerPath = pathFor(ctx, "TableHeader")
  const bodyPath = pathFor(ctx, "TableBody")
  const footerPath = pathFor(ctx, "TableFooter")
  const rowPath = pathFor(ctx, "TableRow")
  const headPath = pathFor(ctx, "TableHead")
  const cellPath = pathFor(ctx, "TableCell")
  const captionPath = pathFor(ctx, "TableCaption")

  return (
    <div className="absolute top-1/2 left-1/2 w-[36rem] -translate-x-1/2 -translate-y-1/2">
      {/*
        Outer wrapper mirrors the source's `<div data-slot="table-container">`
        with its hardcoded relative + overflow-x-auto classes. The user-
        styleable Table classes go on the inner `<table>` via stylePath: [0].
      */}
      <div className="relative w-full overflow-x-auto">
        <table
          data-node-id={tablePath}
          className={withSelectionRing(
            tableCls,
            ctx.selectedPath === tablePath,
          )}
        >
          <caption
            data-node-id={captionPath}
            className={withSelectionRing(
              captionCls,
              ctx.selectedPath === captionPath,
            )}
          >
            A list of your recent invoices.
          </caption>
          <thead
            data-node-id={headerPath}
            className={withSelectionRing(
              headerCls,
              ctx.selectedPath === headerPath,
            )}
          >
            <tr
              data-node-id={rowPath}
              className={withSelectionRing(
                rowCls,
                ctx.selectedPath === rowPath,
              )}
            >
              <th
                data-node-id={headPath}
                className={withSelectionRing(
                  headCls,
                  ctx.selectedPath === headPath,
                )}
                style={{ width: "100px" }}
              >
                Invoice
              </th>
              <th className={headCls}>Status</th>
              <th className={headCls}>Method</th>
              <th className={`${headCls} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody
            data-node-id={bodyPath}
            className={withSelectionRing(
              bodyCls,
              ctx.selectedPath === bodyPath,
            )}
          >
            <tr className={rowCls}>
              <td
                data-node-id={cellPath}
                className={withSelectionRing(
                  `${cellCls} font-medium`,
                  ctx.selectedPath === cellPath,
                )}
              >
                INV001
              </td>
              <td className={cellCls}>Paid</td>
              <td className={cellCls}>Credit Card</td>
              <td className={`${cellCls} text-right`}>$250.00</td>
            </tr>
            <tr className={rowCls}>
              <td className={`${cellCls} font-medium`}>INV002</td>
              <td className={cellCls}>Pending</td>
              <td className={cellCls}>PayPal</td>
              <td className={`${cellCls} text-right`}>$150.00</td>
            </tr>
            <tr className={rowCls}>
              <td className={`${cellCls} font-medium`}>INV003</td>
              <td className={cellCls}>Unpaid</td>
              <td className={cellCls}>Bank Transfer</td>
              <td className={`${cellCls} text-right`}>$350.00</td>
            </tr>
          </tbody>
          <tfoot
            data-node-id={footerPath}
            className={withSelectionRing(
              footerCls,
              ctx.selectedPath === footerPath,
            )}
          >
            <tr className={rowCls}>
              <td className={cellCls} colSpan={3}>
                Total
              </td>
              <td className={`${cellCls} text-right`}>$750.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export const tableRule: CompositionRule = {
  slug: "table",
  source: "https://ui.shadcn.com/docs/components/table (fetched 2026-04-09)",
  composition: {
    name: "Table",
    // Table source root is `<div data-slot="table-container">`, the
    // real styleable classes are on the inner `<table>` at children[0].
    // Same pattern as DialogContent / SheetContent.
    stylePath: [0],
    children: [
      { name: "TableCaption" },
      {
        name: "TableHeader",
        children: [
          {
            name: "TableRow",
            children: [{ name: "TableHead" }, { name: "TableCell" }],
          },
        ],
      },
      { name: "TableBody" },
      { name: "TableFooter" },
    ],
  },
  render: TableRender,
}
