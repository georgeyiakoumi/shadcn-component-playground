/**
 * NavigationMenu composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/navigation-menu
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <NavigationMenu>
 *       <NavigationMenuList>
 *         <NavigationMenuItem>
 *           <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
 *           <NavigationMenuContent>
 *             <NavigationMenuLink>Link A</NavigationMenuLink>
 *             <NavigationMenuLink>Link B</NavigationMenuLink>
 *           </NavigationMenuContent>
 *         </NavigationMenuItem>
 *         <NavigationMenuItem>
 *           <NavigationMenuLink>Item Two</NavigationMenuLink>
 *         </NavigationMenuItem>
 *       </NavigationMenuList>
 *     </NavigationMenu>
 *
 * ## Implementation notes
 *
 * Hybrid: the navigation bar itself (Root + List + Item + Trigger)
 * is inline, but Content has two render modes governed by the
 * `viewport` prop on the Root:
 *
 * 1. `viewport={true}` (default in shadcn): Content is rendered
 *    INSIDE a separate NavigationMenuViewport div positioned
 *    `absolute top-full` below the bar. Selecting + styling
 *    Content in this mode is awkward because the rendering
 *    isn't where you'd expect.
 *
 * 2. `viewport={false}`: Content renders directly inline below
 *    its parent NavigationMenuItem via the cascade selector
 *    `group-data-[viewport=false]/navigation-menu:*` classes
 *    that already exist in the source. Easier to style + reason
 *    about. We use this mode for the canvas preview.
 *
 * Content is NOT Portal-wrapped — it's a direct child of the
 * NavigationMenuItem, so no `stylePath` is needed.
 *
 * `defaultValue="item-one"` on the Root opens the first menu by
 * default; we don't need blocked close handlers because
 * NavigationMenu doesn't dismiss on outside click in the same way
 * (it's hover/keyboard driven).
 *
 * NavigationMenuViewport is a separate sub-component the parser
 * tracks for `viewport={true}` mode, but we don't render it in
 * the canvas preview (we use `viewport={false}`).
 */

"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

/*
 * KNOWN PARSER LIMITATION (follow-up ticket TBD):
 *
 * NavigationMenuTrigger's source has
 *   className={cn(navigationMenuTriggerStyle(), "group", className)}
 *
 * The parser stores `navigationMenuTriggerStyle()` as a literal
 * string token in the cn-call args, rather than resolving it
 * against the cva exported from the same file. So when we read
 * `triggerCls` we get something like
 *   "navigationMenuTriggerStyle() group "
 * which is obviously broken.
 *
 * Workaround: detect the literal token and substitute the real
 * cva output at render time. We import `navigationMenuTriggerStyle`
 * from the canonical source so any future changes there flow
 * through automatically.
 *
 * Proper fix is parser-side: nested cva-call expressions inside
 * cn-call args should be recognised as references and resolved
 * via `tree.cvaExports`. Out of scope for GEO-306; logging as
 * a follow-up.
 */
function resolveNavTriggerCls(rawCls: string): string {
  const literal = "navigationMenuTriggerStyle()"
  if (!rawCls.includes(literal)) return rawCls
  return rawCls.replace(literal, navigationMenuTriggerStyle())
}

function NavigationMenuRender(ctx: SnippetContext): React.ReactNode {
  const navCls = classesFor(ctx, "NavigationMenu")
  const listCls = classesFor(ctx, "NavigationMenuList")
  const itemCls = classesFor(ctx, "NavigationMenuItem")
  const triggerCls = resolveNavTriggerCls(classesFor(ctx, "NavigationMenuTrigger"))
  const contentCls = classesFor(ctx, "NavigationMenuContent")
  const linkCls = classesFor(ctx, "NavigationMenuLink")

  const navPath = pathFor(ctx, "NavigationMenu")
  const listPath = pathFor(ctx, "NavigationMenuList")
  const itemPath = pathFor(ctx, "NavigationMenuItem")
  const triggerPath = pathFor(ctx, "NavigationMenuTrigger")
  const contentPath = pathFor(ctx, "NavigationMenuContent")
  const linkPath = pathFor(ctx, "NavigationMenuLink")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      {/*
        Controlled `value="item-one"` (no `onValueChange`) locks
        Item One's content open. Without this, hovering or
        clicking other parts of the canvas dismisses the open
        menu and the user can't style Content.

        `data-viewport="false"` activates the inline-render mode
        of NavigationMenuContent (the cascade selectors in source
        switch on this attribute). The source NavigationMenu()
        wrapper sets this from a React prop; we replicate it as
        a raw DOM attribute since we're rendering Radix primitives
        directly.
      */}
      <NavigationMenuPrimitive.Root
        value="item-one"
        data-node-id={navPath}
        data-viewport="false"
        className={withSelectionRing(
          navCls,
          ctx.selectedPath === navPath,
        )}
      >
        <NavigationMenuPrimitive.List
          data-node-id={listPath}
          className={withSelectionRing(
            listCls,
            ctx.selectedPath === listPath,
          )}
        >
          <NavigationMenuPrimitive.Item
            value="item-one"
            data-node-id={itemPath}
            className={withSelectionRing(
              itemCls,
              ctx.selectedPath === itemPath,
            )}
          >
            <NavigationMenuPrimitive.Trigger
              data-node-id={triggerPath}
              onPointerMove={(e) => e.preventDefault()}
              onPointerLeave={(e) => e.preventDefault()}
              className={withSelectionRing(
                triggerCls,
                ctx.selectedPath === triggerPath,
              )}
            >
              Item One
            </NavigationMenuPrimitive.Trigger>
            <NavigationMenuPrimitive.Content
              data-node-id={contentPath}
              onPointerEnter={(e) => e.preventDefault()}
              onPointerLeave={(e) => e.preventDefault()}
              className={withSelectionRing(
                cn("min-w-[12rem]", contentCls),
                ctx.selectedPath === contentPath,
              )}
            >
              <NavigationMenuPrimitive.Link
                data-node-id={linkPath}
                className={withSelectionRing(
                  linkCls,
                  ctx.selectedPath === linkPath,
                )}
              >
                Introduction
              </NavigationMenuPrimitive.Link>
              <NavigationMenuPrimitive.Link className={linkCls}>
                Installation
              </NavigationMenuPrimitive.Link>
              <NavigationMenuPrimitive.Link className={linkCls}>
                Typography
              </NavigationMenuPrimitive.Link>
            </NavigationMenuPrimitive.Content>
          </NavigationMenuPrimitive.Item>
          <NavigationMenuPrimitive.Item value="item-two" className={itemCls}>
            <NavigationMenuPrimitive.Link className={linkCls}>
              Item Two
            </NavigationMenuPrimitive.Link>
          </NavigationMenuPrimitive.Item>
        </NavigationMenuPrimitive.List>
      </NavigationMenuPrimitive.Root>
    </div>
  )
}

export const navigationMenuRule: CompositionRule = {
  slug: "navigation-menu",
  source:
    "https://ui.shadcn.com/docs/components/navigation-menu (fetched 2026-04-09)",
  composition: {
    name: "NavigationMenu",
    children: [
      {
        name: "NavigationMenuList",
        children: [
          {
            name: "NavigationMenuItem",
            children: [
              { name: "NavigationMenuTrigger" },
              {
                name: "NavigationMenuContent",
                children: [{ name: "NavigationMenuLink" }],
              },
            ],
          },
        ],
      },
    ],
  },
  render: NavigationMenuRender,
}
