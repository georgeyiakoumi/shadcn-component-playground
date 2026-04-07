import { test, expect } from "@playwright/test"

async function enterEditMode(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /edit/i }).click()
  await page.waitForTimeout(500)
}

/**
 * Pillar 6 (GEO-291) deleted the M2 right-panel tabs (Styles / Classes /
 * Variants / Parts) and the M2 toolbar Export dialog branch for stock
 * components. The tests below were rewritten to reflect the v2 unified
 * editor surface:
 *
 * - The right panel shows an empty state until an element is selected
 * - Stock components export via the Download .tsx button in the right
 *   panel (covered by `e2e/edit-export.spec.ts`), not the toolbar Export
 * - The toolbar Export button still exists for the M3 from-scratch path
 *   but is disabled on stock pages (no `source` passed)
 */

test.describe("Edit mode — right panel empty state", () => {
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

test.describe("Edit mode — toolbar Export button", () => {
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
