/**
 * Pillar 5a — small status surface that proves the M4 parser is wired into
 * the user-visible page. Calls `/api/parse/[slug]` via the
 * `useParsedComponent` hook and displays a one-line summary of what the
 * parser found: component name, sub-component count, cva export count,
 * round-trip risk bucket.
 *
 * This is intentionally minimal. Pillar 5b will replace it with the full
 * visual editor integration. The element exists so:
 *
 * 1. The integration is provable via a Playwright assertion
 * 2. Manual smoke-testing in the browser confirms the API → hook → render
 *    pipeline works end-to-end
 * 3. Anyone reading the code can see exactly where the parser surfaces
 *
 * Linear: GEO-290
 */

"use client"

import * as React from "react"

import { useParsedComponent } from "@/lib/parser/use-parsed-component"

interface ParserV2StatusProps {
  slug: string
}

export function ParserV2Status({ slug }: ParserV2StatusProps) {
  const state = useParsedComponent(slug)

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div
        className="flex items-center gap-2 text-xs text-muted-foreground"
        data-testid="parser-v2-status"
        data-state="loading"
      >
        <span>Parser v2: loading…</span>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div
        className="flex items-center gap-2 text-xs text-destructive"
        data-testid="parser-v2-status"
        data-state="error"
      >
        <span>Parser v2: {state.reason}</span>
      </div>
    )
  }

  const { tree } = state
  const cvaCount = tree.cvaExports.length
  const subCount = tree.subComponents.length
  const risk = tree.roundTripRisk

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      data-testid="parser-v2-status"
      data-state="ready"
      data-component-name={tree.name}
      data-sub-component-count={subCount}
      data-cva-export-count={cvaCount}
      data-round-trip-risk={risk}
    >
      <span className="font-medium text-foreground">Parser v2</span>
      <span>·</span>
      <span>{tree.name}</span>
      <span>·</span>
      <span>
        {subCount} sub-{subCount === 1 ? "component" : "components"}
      </span>
      {cvaCount > 0 && (
        <>
          <span>·</span>
          <span>
            {cvaCount} cva export{cvaCount === 1 ? "" : "s"}
          </span>
        </>
      )}
      <span>·</span>
      <span>{risk}</span>
    </div>
  )
}
