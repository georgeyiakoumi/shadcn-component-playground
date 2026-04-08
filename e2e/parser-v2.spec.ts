/**
 * Pillar 5a — end-to-end test that proves the M4 parser is wired into the
 * stock-component page.
 *
 * Originally asserted on a `parser-v2-status` debug surface in the old
 * StructurePanel footer. That surface was deleted in the unified-
 * dashboard rewrite — the stock page now mounts <UnifiedDashboard>
 * directly with a parsed tree, no intermediate status panel.
 *
 * This entire spec is skipped because:
 * 1. The parser-v2-status testid is gone
 * 2. The parser → API → hook pipeline is now validated implicitly by
 *    the round-trip-fidelity spec (which loads Button/Card/Sheet
 *    through the unified dashboard and exports them byte-equivalently
 *    via the toolbar's ExportDialog)
 * 3. The unit tests in `lib/parser/__tests__/round-trip.test.ts` and
 *    `lib/parser/__tests__/dashboard-parsed-tree.test.ts` cover the
 *    same parser → tree → generator path with deeper assertions
 *
 * TODO: rewrite or delete this spec in the e2e cleanup follow-up PR.
 *
 * Linear: GEO-290
 */

import { test, expect } from "@playwright/test"

test.describe.skip("Pillar 5a — Parser v2 status surface (DEPRECATED — see header)", () => {
  test("Button page shows parser-v2 ready state with correct metadata", async ({
    page,
  }) => {
    await page.goto("/playground/button")

    const status = page.getByTestId("parser-v2-status")
    await expect(status).toBeVisible()
    // Wait for the loading → ready transition (the API call completes
    // server-side in milliseconds; the round-trip latency dominates).
    await expect(status).toHaveAttribute("data-state", "ready", {
      timeout: 10_000,
    })

    // Tree-derived metadata is present in data attributes.
    await expect(status).toHaveAttribute("data-component-name", "Button")
    await expect(status).toHaveAttribute("data-cva-export-count", "1")
    await expect(status).toHaveAttribute("data-round-trip-risk", "handleable")
    await expect(status).toHaveAttribute("data-sub-component-count", "1")
  })

  test("Card page shows parser-v2 ready state with multi-sub-component count", async ({
    page,
  }) => {
    await page.goto("/playground/card")
    const status = page.getByTestId("parser-v2-status")
    await expect(status).toBeVisible()
    await expect(status).toHaveAttribute("data-state", "ready", {
      timeout: 10_000,
    })
    await expect(status).toHaveAttribute("data-component-name", "Card")
    // Card has 7 sub-components in the new-york-v4 registry.
    const subCount = await status.getAttribute("data-sub-component-count")
    expect(Number(subCount)).toBeGreaterThan(1)
  })

  test("Invalid slug returns parser-v2 error state cleanly", async ({
    page,
  }) => {
    // Navigate via the API directly — confirms the route handles unknown
    // slugs without crashing the page.
    const response = await page.request.get("/api/parse/this-does-not-exist")
    expect(response.status()).toBe(404)
  })
})
