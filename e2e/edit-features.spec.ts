import { test, expect } from "@playwright/test"

async function enterEditMode(page: import("@playwright/test").Page) {
  // Pillar 6.1 — toolbar mode toggle renamed Inspect/Edit → Structure/Style.
  await page.getByRole("button", { name: /^style$/i }).click()
  await page.waitForTimeout(500)
}

/**
 * Pillar 6 (GEO-291) tests for the M2 → v2 right-panel transition.
 *
 * Skipped after the unified-dashboard rewrite (post-PR #30):
 * - The "right panel empty state until selection" assertion still
 *   holds in spirit but the empty-state copy lives inside the
 *   dashboard's Style panel now, not a standalone <RightPanel>.
 * - The "toolbar Export disabled on stock pages" assertion is INVERTED
 *   by this PR — the unified flow now ENABLES the toolbar Export for
 *   parsed trees by passing `slug + source`. The disabled state is
 *   the from-scratch flow's empty-component case (no styles yet).
 *
 * Both behaviours are covered by other surfaces:
 * - Round-trip via toolbar Export → `round-trip-fidelity.spec.ts`
 * - Right-panel empty state → covered by the unified dashboard's own
 *   "Select a component above to edit its styles." copy, which lives
 *   inside the dashboard component
 *
 * TODO: rewrite or delete in the e2e cleanup follow-up PR.
 */

test.describe.skip("Edit mode — right panel empty state (DEPRECATED — see header)", () => {
  test("right panel shows the 'select an element' empty state in edit mode", async ({
    page,
  }) => {
    await page.goto("/playground/button")
    await enterEditMode(page)
    await expect(
      page.getByText(/select an element on the canvas/i),
    ).toBeVisible()
  })
})

test.describe.skip("Edit mode — toolbar Export button (DEPRECATED — see header)", () => {
  test("Export button is visible in the toolbar", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(
      page.getByRole("button", { name: /export/i }),
    ).toBeVisible()
  })

  test("toolbar Export is disabled on stock-component pages (Pillar 6)", async ({
    page,
  }) => {
    // Stock pages no longer pass `source` to the toolbar — the M2
    // Export dialog branch is gone. The button shows its disabled
    // state. The Download .tsx button in the right panel is the
    // replacement (covered by `e2e/edit-export.spec.ts`).
    await page.goto("/playground/button")
    const exportButton = page.getByRole("button", { name: /export/i })
    await expect(exportButton).toBeDisabled()
  })
})
