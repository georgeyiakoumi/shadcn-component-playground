/**
 * Pillar 5a — end-to-end test that proves the M4 parser is wired into the
 * stock-component page.
 *
 * Opens Button via the slug route, waits for the `ParserV2Status` element
 * to load, and asserts that the parser ran successfully on the server,
 * returned a tree, and the tree's metadata is reflected in the UI.
 *
 * This is the first user-visible verification that the parser → API
 * route → hook → render pipeline works end-to-end. Pillar 5b will replace
 * this with assertions on the actual visual editor.
 *
 * Linear: GEO-290
 */

import { test, expect } from "@playwright/test"

test.describe("Pillar 5a — Parser v2 status surface", () => {
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
