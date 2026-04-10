/**
 * Calendar composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/calendar
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <Calendar
 *       mode="single"
 *       selected={date}
 *       onSelect={setDate}
 *       className="rounded-lg border"
 *     />
 *
 * ## Implementation notes
 *
 * Calendar wraps `react-day-picker` (DayPicker) — a full third-party
 * component with its own DOM shape that can't be meaningfully
 * rendered from a ComponentTree. The parser captures it as a single
 * `component-ref` root pointing at `DayPicker`, which the flat
 * renderer falls through to a placeholder pill.
 *
 * Fix: import the real shadcn Calendar component (same trick as
 * Carousel in Batch 3) and render it directly with `mode="single"`
 * and a hardcoded selected date so the canvas shows a real,
 * interactive calendar. The user can navigate months, see today
 * highlighted, and see a selected date — all powered by
 * react-day-picker's built-in behaviour.
 *
 * The composition tree has only one node (Calendar) since the
 * internal DayPicker cells aren't individual sub-components the
 * parser tracks. Style panel edits on Calendar apply to the root
 * wrapper's className.
 */

"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function CalendarRender(ctx: SnippetContext): React.ReactNode {
  const calendarCls = classesFor(ctx, "Calendar")
  const calendarPath = pathFor(ctx, "Calendar")

  // Hardcode a selected date so the canvas shows a visible selection.
  // Using a stable date (15th of current month) rather than `new Date()`
  // to avoid hydration mismatches between server + client.
  const [selected, setSelected] = React.useState<Date | undefined>(
    () => {
      const d = new Date()
      d.setDate(15)
      return d
    },
  )

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        data-node-id={calendarPath}
        className={withSelectionRing(
          `rounded-lg border ${calendarCls}`,
          ctx.selectedPath === calendarPath,
        )}
      />
    </div>
  )
}

export const calendarRule: CompositionRule = {
  slug: "calendar",
  source:
    "https://ui.shadcn.com/docs/components/calendar (fetched 2026-04-09)",
  composition: {
    name: "Calendar",
  },
  render: CalendarRender,
}
