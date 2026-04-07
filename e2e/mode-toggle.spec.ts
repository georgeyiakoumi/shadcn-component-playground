import { test, expect } from "@playwright/test"

test.describe("Inspect/Edit Mode Toggle", () => {
  test("starts in inspect mode by default", async ({ page }) => {
    await page.goto("/playground/button")
    const inspectButton = page.getByRole("button", { name: /inspect/i })
    await expect(inspectButton).toBeVisible()
  })

  test("switching to edit mode shows the right-panel empty state", async ({
    page,
  }) => {
    // Pillar 6 (GEO-291) deleted the M2 right-panel tabs (Styles /
    // Classes / Variants / Parts). The right panel now shows an
    // empty-state prompt until the user selects an element on the canvas.
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /edit/i }).click()
    await page.waitForTimeout(500)
    await expect(
      page.getByText(/select an element on the canvas/i),
    ).toBeVisible()
  })

  test("switching back to inspect mode", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /edit/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole("button", { name: /inspect/i }).click()
    await page.waitForTimeout(500)
    // Should be back in inspect mode
    await expect(page.getByRole("button", { name: /inspect/i })).toBeVisible()
  })
})
