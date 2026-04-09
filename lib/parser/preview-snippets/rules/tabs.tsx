/**
 * Tabs composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/tabs
 * Fetched: 2026-04-09
 *
 * Docs Usage example:
 *
 *     <Tabs defaultValue="account">
 *       <TabsList>
 *         <TabsTrigger value="account">Account</TabsTrigger>
 *         <TabsTrigger value="password">Password</TabsTrigger>
 *       </TabsList>
 *       <TabsContent value="account">
 *         Make changes to your account here.
 *       </TabsContent>
 *       <TabsContent value="password">
 *         Change your password here.
 *       </TabsContent>
 *     </Tabs>
 *
 * ## Implementation notes
 *
 * Inline family — no Portal, no floating positioning. Tabs renders
 * as a normal flex-column with the List at the top and Content
 * below. No close handlers to block; Tabs doesn't "close", it
 * switches between values via the trigger clicks.
 *
 * All four sub-components have real classes on `parts.root`:
 * no stylePath needed. TabsList has a cva variant (default/line)
 * but the rule doesn't need to interact with it — the user picks
 * it via the Variants popover and the flat renderer's variant
 * resolution handles the className output.
 *
 * We render TWO triggers + TWO content panes to match the docs
 * example. Active tab is "account" by default; user can click to
 * switch to "password" — Radix handles the rest.
 */

"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function TabsRender(ctx: SnippetContext): React.ReactNode {
  const tabsCls = classesFor(ctx, "Tabs")
  const listCls = classesFor(ctx, "TabsList")
  const triggerCls = classesFor(ctx, "TabsTrigger")
  const contentCls = classesFor(ctx, "TabsContent")

  const tabsPath = pathFor(ctx, "Tabs")
  const listPath = pathFor(ctx, "TabsList")
  const triggerPath = pathFor(ctx, "TabsTrigger")
  const contentPath = pathFor(ctx, "TabsContent")

  return (
    /*
     * Visual preview matching the shadcn docs example:
     * https://ui.shadcn.com/docs/components/radix/tabs
     *
     * Horizontal tabs (Overview / Analytics / Reports / Settings)
     * with a single active content pane below showing an overview
     * card.
     */
    <div className="absolute top-1/2 left-1/2 w-[32rem] -translate-x-1/2 -translate-y-1/2">
      <TabsPrimitive.Root
        defaultValue="overview"
        orientation="horizontal"
        data-node-id={tabsPath}
        data-orientation="horizontal"
        className={withSelectionRing(
          tabsCls,
          ctx.selectedPath === tabsPath,
        )}
      >
        {/*
          `data-variant="default"` is CRITICAL — the real TabsList
          source sets it as a JSX attribute (not a className), so the
          parser never captures it. Without it, the trigger's
          `group-data-[variant=default]/tabs-list:data-[state=active]:bg-background`
          selector can't match and the active tab has no white bg.
        */}
        <TabsPrimitive.List
          data-node-id={listPath}
          data-variant="default"
          className={withSelectionRing(
            listCls,
            ctx.selectedPath === listPath,
          )}
        >
          <TabsPrimitive.Trigger
            value="overview"
            data-node-id={triggerPath}
            className={withSelectionRing(
              triggerCls,
              ctx.selectedPath === triggerPath,
            )}
          >
            Overview
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="analytics" className={triggerCls}>
            Analytics
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="reports" className={triggerCls}>
            Reports
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="settings" className={triggerCls}>
            Settings
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>
        <TabsPrimitive.Content
          value="overview"
          data-node-id={contentPath}
          className={withSelectionRing(
            contentCls,
            ctx.selectedPath === contentPath,
          )}
        >
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <h3 className="text-base font-semibold">Overview</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View your key metrics and recent project activity. Track
              progress across all your active projects.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              You have 12 active projects and 3 pending tasks.
            </p>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="analytics" className={contentCls}>
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <h3 className="text-base font-semibold">Analytics</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View analytics and insights across your projects.
            </p>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="reports" className={contentCls}>
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <h3 className="text-base font-semibold">Reports</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate and download reports.
            </p>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="settings" className={contentCls}>
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <h3 className="text-base font-semibold">Settings</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your account and preferences.
            </p>
          </div>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  )
}

export const tabsRule: CompositionRule = {
  slug: "tabs",
  source: "https://ui.shadcn.com/docs/components/tabs (fetched 2026-04-09)",
  composition: {
    name: "Tabs",
    children: [
      {
        name: "TabsList",
        children: [{ name: "TabsTrigger" }],
      },
      { name: "TabsContent" },
    ],
  },
  render: TabsRender,
}
