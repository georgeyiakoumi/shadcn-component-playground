/**
 * Alert composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/alert
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Alert>
 *       <CheckCircle2Icon />
 *       <AlertTitle>Success! Your changes have been saved</AlertTitle>
 *       <AlertDescription>
 *         This is an alert with icon, title and description.
 *       </AlertDescription>
 *     </Alert>
 *
 * ## Implementation notes
 *
 * Alert is cva-rooted (`alertVariants` with default/destructive
 * variants). The flat renderer was emitting AlertTitle and
 * AlertDescription as direct siblings of Alert, which inherited
 * Alert's grid + border + padding classes via the parser's flat
 * cn() pass — see the smoke-test DOM dump on 2026-04-09. Composition
 * rule restores the proper nesting:
 *
 *   <div role="alert" cls=alertVariants>
 *     <CheckCircle2 />
 *     <div data-slot="alert-title">...</div>
 *     <div data-slot="alert-description">...</div>
 *   </div>
 *
 * The icon is rendered as a real Lucide `<CheckCircle2 />` so the
 * `[&>svg]:size-4 [&>svg]:translate-y-0.5` selectors in the cva
 * base actually match something on the canvas.
 */

"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function AlertRender(ctx: SnippetContext): React.ReactNode {
  const alertCls = classesFor(ctx, "Alert")
  const titleCls = classesFor(ctx, "AlertTitle")
  const descriptionCls = classesFor(ctx, "AlertDescription")

  const alertPath = pathFor(ctx, "Alert")
  const titlePath = pathFor(ctx, "AlertTitle")
  const descriptionPath = pathFor(ctx, "AlertDescription")

  return (
    <div className="absolute top-1/2 left-1/2 w-[28rem] -translate-x-1/2 -translate-y-1/2">
      <div
        role="alert"
        data-node-id={alertPath}
        className={withSelectionRing(
          alertCls,
          ctx.selectedPath === alertPath,
        )}
      >
        <CheckCircle2 />
        <div
          data-node-id={titlePath}
          className={withSelectionRing(
            titleCls,
            ctx.selectedPath === titlePath,
          )}
        >
          Success! Your changes have been saved
        </div>
        <div
          data-node-id={descriptionPath}
          className={withSelectionRing(
            descriptionCls,
            ctx.selectedPath === descriptionPath,
          )}
        >
          This is an alert with icon, title and description.
        </div>
      </div>
    </div>
  )
}

export const alertRule: CompositionRule = {
  slug: "alert",
  source: "https://ui.shadcn.com/docs/components/alert (fetched 2026-04-09)",
  composition: {
    name: "Alert",
    children: [{ name: "AlertTitle" }, { name: "AlertDescription" }],
  },
  render: AlertRender,
}
