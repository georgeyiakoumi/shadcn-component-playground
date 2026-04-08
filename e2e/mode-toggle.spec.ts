import { test, expect } from "@playwright/test"

/**
 * Pillar 6.1 — the toolbar's mode toggle was renamed Inspect/Edit →
 * Structure/Style across both stock and custom pages. The underlying
 * state values (`inspect`/`edit` for stock, `define`/`preview` for
 * custom) are unchanged; only the button labels are.
 */

test.describe("Structure/Style mode toggle", () => {
  test("starts in Structure mode by default on stock pages", async ({
    page,
  }) => {
    await page.goto("/playground/button")
    const structureButton = page.getByRole("button", { name: /structure/i })
    await expect(structureButton).toBeVisible()
  })

  test("switching to Style mode shows the right-panel empty state", async ({
    page,
  }) => {
    // Pillar 6 deleted the M2 right-panel tabs. The right panel now
    // shows an empty-state prompt until the user selects an element on
    // the canvas.
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /^style$/i }).click()
    await page.waitForTimeout(500)
    await expect(
      page.getByText(/select an element on the canvas/i),
    ).toBeVisible()
  })

  test("switching back to Structure mode", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /^style$/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole("button", { name: /^structure$/i }).click()
    await page.waitForTimeout(500)
    await expect(
      page.getByRole("button", { name: /^structure$/i }),
    ).toBeVisible()
  })
})
