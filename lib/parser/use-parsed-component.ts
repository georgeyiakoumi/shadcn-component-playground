/**
 * Client-side hook that fetches a parsed `ComponentTreeV2` for a stock
 * shadcn component slug. Wraps the `/api/parse/[slug]` server route so
 * the parser stays out of the client bundle.
 *
 * Pillar 5a (GEO-290) — first wire of the parser into a user-visible
 * surface. Pillar 5b will use the same hook to feed the M3 visual editor.
 */

"use client"

import * as React from "react"

import type { ComponentTreeV2 } from "@/lib/component-tree-v2"

/** Discriminated state union for the hook. */
export type ParsedComponentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; tree: ComponentTreeV2 }
  | { status: "error"; reason: string; httpStatus: number }

/**
 * Fetch and parse a stock shadcn component by slug. The result is cached
 * for the lifetime of the page (the API route is itself fully
 * deterministic for a given slug + repo state, so React Query / SWR isn't
 * needed for 5a).
 */
export function useParsedComponent(slug: string): ParsedComponentState {
  const [state, setState] = React.useState<ParsedComponentState>({
    status: "idle",
  })

  React.useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })

    fetch(`/api/parse/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
            reason?: string
          }
          setState({
            status: "error",
            reason: body.reason ?? body.error ?? `HTTP ${res.status}`,
            httpStatus: res.status,
          })
          return
        }
        const tree = (await res.json()) as ComponentTreeV2
        setState({ status: "ready", tree })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          status: "error",
          reason: (err as Error)?.message ?? "Network error",
          httpStatus: 0,
        })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}
