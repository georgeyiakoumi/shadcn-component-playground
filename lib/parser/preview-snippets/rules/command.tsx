/**
 * Command composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/command
 * Fetched: 2026-04-09
 *
 * Docs Usage example (abridged):
 *
 *     <Command>
 *       <CommandInput placeholder="Type a command..." />
 *       <CommandList>
 *         <CommandEmpty>No results found.</CommandEmpty>
 *         <CommandGroup heading="Suggestions">
 *           <CommandItem>Calendar</CommandItem>
 *           <CommandItem>Search Emoji</CommandItem>
 *           <CommandItem>Calculator</CommandItem>
 *         </CommandGroup>
 *         <CommandSeparator />
 *         <CommandGroup heading="Settings">
 *           <CommandItem>Profile</CommandItem>
 *           <CommandItem>Settings</CommandItem>
 *         </CommandGroup>
 *       </CommandList>
 *     </Command>
 *
 * ## Implementation notes
 *
 * Inline family — uses `cmdk` (NOT Radix). No Portal, no popper, no
 * floating positioning. Renders as a normal flex column with the
 * input at the top and the list below.
 *
 * No `defaultOpen` concept; the Command palette is always visible
 * when its parent is rendered. The `shouldFilter` prop is set to
 * `false` so typing in the input doesn't accidentally hide items
 * during canvas interaction.
 *
 * `CommandDialog` (the Dialog-wrapped variant) is intentionally NOT
 * the rule's composition root — it's a convenience export. The
 * rule targets the inline `Command` form because that's what the
 * parser will see in source.
 *
 * No stylePath needed; all sub-components have their classes on
 * `parts.root`.
 */

"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CommandRender(ctx: SnippetContext): React.ReactNode {
  const commandCls = classesFor(ctx, "Command")
  const inputCls = classesFor(ctx, "CommandInput")
  const listCls = classesFor(ctx, "CommandList")
  const emptyCls = classesFor(ctx, "CommandEmpty")
  const groupCls = classesFor(ctx, "CommandGroup")
  const separatorCls = classesFor(ctx, "CommandSeparator")
  const itemCls = classesFor(ctx, "CommandItem")
  const shortcutCls = classesFor(ctx, "CommandShortcut")

  const commandPath = pathFor(ctx, "Command")
  const inputPath = pathFor(ctx, "CommandInput")
  const listPath = pathFor(ctx, "CommandList")
  const emptyPath = pathFor(ctx, "CommandEmpty")
  const groupPath = pathFor(ctx, "CommandGroup")
  const separatorPath = pathFor(ctx, "CommandSeparator")
  const itemPath = pathFor(ctx, "CommandItem")
  const shortcutPath = pathFor(ctx, "CommandShortcut")

  return (
    <div className="absolute top-1/2 left-1/2 w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-md">
      <CommandPrimitive
        shouldFilter={false}
        data-node-id={commandPath}
        className={withSelectionRing(
          commandCls,
          ctx.selectedPath === commandPath,
        )}
      >
        <div
          data-slot="command-input-wrapper"
          className="flex h-9 items-center gap-2 border-b px-3"
        >
          <SearchIcon className="size-4 shrink-0 opacity-50" />
          <CommandPrimitive.Input
            placeholder="Type a command or search..."
            data-node-id={inputPath}
            className={withSelectionRing(
              inputCls,
              ctx.selectedPath === inputPath,
            )}
          />
        </div>
        <CommandPrimitive.List
          data-node-id={listPath}
          className={withSelectionRing(
            listCls,
            ctx.selectedPath === listPath,
          )}
        >
          {/*
            CommandEmpty only renders when there are zero results.
            It's wired up here for selection/styling purposes — the
            user can click it in the AssemblyPanel to style it
            even though it's not visually rendered while items
            exist.
          */}
          <CommandPrimitive.Empty
            data-node-id={emptyPath}
            className={withSelectionRing(
              emptyCls,
              ctx.selectedPath === emptyPath,
            )}
          >
            No results found.
          </CommandPrimitive.Empty>
          <CommandPrimitive.Group
            heading="Suggestions"
            data-node-id={groupPath}
            className={withSelectionRing(
              groupCls,
              ctx.selectedPath === groupPath,
            )}
          >
            <CommandPrimitive.Item
              data-node-id={itemPath}
              className={withSelectionRing(
                itemCls,
                ctx.selectedPath === itemPath,
              )}
            >
              Calendar
              <span
                data-node-id={shortcutPath}
                className={withSelectionRing(
                  shortcutCls,
                  ctx.selectedPath === shortcutPath,
                )}
              >
                ⌘C
              </span>
            </CommandPrimitive.Item>
            <CommandPrimitive.Item className={itemCls}>
              Search Emoji
              <span className={shortcutCls}>⌘E</span>
            </CommandPrimitive.Item>
            <CommandPrimitive.Item className={itemCls}>
              Calculator
            </CommandPrimitive.Item>
          </CommandPrimitive.Group>
          <CommandPrimitive.Separator
            data-node-id={separatorPath}
            className={withSelectionRing(
              separatorCls,
              ctx.selectedPath === separatorPath,
            )}
          />
          <CommandPrimitive.Group heading="Settings" className={groupCls}>
            <CommandPrimitive.Item className={itemCls}>
              Profile
              <span className={shortcutCls}>⌘P</span>
            </CommandPrimitive.Item>
            <CommandPrimitive.Item className={itemCls}>
              Settings
              <span className={shortcutCls}>⌘S</span>
            </CommandPrimitive.Item>
          </CommandPrimitive.Group>
        </CommandPrimitive.List>
      </CommandPrimitive>
    </div>
  )
}

export const commandRule: CompositionRule = {
  slug: "command",
  source: "https://ui.shadcn.com/docs/components/command (fetched 2026-04-09)",
  composition: {
    name: "Command",
    children: [
      { name: "CommandInput" },
      {
        name: "CommandList",
        children: [
          { name: "CommandEmpty" },
          {
            name: "CommandGroup",
            children: [
              { name: "CommandItem" },
              { name: "CommandShortcut" },
            ],
          },
          { name: "CommandSeparator" },
        ],
      },
    ],
  },
  render: CommandRender,
}
