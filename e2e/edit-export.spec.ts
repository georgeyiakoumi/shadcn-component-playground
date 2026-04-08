/**
 * Pillar 5b — end-to-end smoke test for the edit-export UI surface.
 *
 * Originally asserted on the old StructurePanel-footer Download .tsx
 * button + Reset button + inspect/edit mode toggle on the stock page.
 * Those affordances were deleted in the unified-dashboard rewrite:
 *
 * - Download is now the toolbar's ExportDialog (the same one the
 *   from-scratch flow uses). Covered by `round-trip-fidelity.spec.ts`.
 * - Reset is now in the toolbar's `extraActions` slot, only visible
 *   when the tree is dirty.
 * - Inspect/edit mode toggle is gone for stock pages (no Define mode
 *   for parsed trees in v1 — `hideModeToggle` on the toolbar).
 *
 * This entire spec is skipped because every test in it relied on the
 * old surface. The new flow is covered by:
 * - `round-trip-fidelity.spec.ts` (browser-level Download → bytes)
 * - `lib/parser/__tests__/dashboard-parsed-tree.test.ts` (unit-level
 *   edit path on parsed trees)
 *
 * TODO: rewrite or delete this spec in the e2e cleanup follow-up PR
 * once the new flow has been visualised in a few sessions and the
 * right shape settles.
 *
 * Linear: GEO-302
 */

import { test, expect } from "@playwright/test"

test.describe.skip("Pillar 5b — edit-export UI controls (DEPRECATED — see header)", () => {
  test("Download .tsx and Reset buttons are absent in inspect mode", async ({
    page,
  }) => {
    await page.goto("/playground/card")
    // Wait for the page to settle.
    await expect(page.getByTestId("parser-v2-status")).toBeVisible()
    // Inspect mode should not show the edit-export controls.
    await expect(page.getByTestId("download-tsx-button")).toHaveCount(0)
    await expect(page.getByTestId("reset-edits-button")).toHaveCount(0)
  })

  test("Download .tsx button appears in edit mode and is always enabled (Reset gated)", async ({
    page,
  }) => {
    await page.goto("/playground/card")
    // Wait for the parser status to confirm the page is wired up.
    await expect(page.getByTestId("parser-v2-status")).toHaveAttribute(
      "data-state",
      "ready",
      { timeout: 10_000 },
    )
    // Switch to edit mode.
    await page.getByRole("button", { name: /^style$/i }).click()
    // The Download button is visible AND clickable even with no edits — the
    // user can always grab a clean copy of the source. The data-dirty flag
    // tells the test (and curious users via DevTools) whether edits exist.
    const download = page.getByTestId("download-tsx-button")
    await expect(download).toBeVisible()
    await expect(download).toBeEnabled()
    await expect(download).toHaveAttribute("data-dirty", "false")
    // Reset stays disabled because there's nothing to revert to.
    const reset = page.getByTestId("reset-edits-button")
    await expect(reset).toBeVisible()
    await expect(reset).toBeDisabled()
  })

  test("Switching to inspect mode hides the edit-export controls again", async ({
    page,
  }) => {
    await page.goto("/playground/card")
    await expect(page.getByTestId("parser-v2-status")).toHaveAttribute(
      "data-state",
      "ready",
      { timeout: 10_000 },
    )
    await page.getByRole("button", { name: /^style$/i }).click()
    await expect(page.getByTestId("download-tsx-button")).toBeVisible()
    await page.getByRole("button", { name: /^structure$/i }).click()
    await expect(page.getByTestId("download-tsx-button")).toHaveCount(0)
  })
})
