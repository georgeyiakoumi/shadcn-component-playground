import { test, expect } from "@playwright/test"

async function enterEditMode(page: import("@playwright/test").Page) {
  // Pillar 6.1 — toolbar mode toggle renamed Inspect/Edit → Structure/Style.
  await page.getByRole("button", { name: /^style$/i }).click()
  await page.waitForTimeout(500)
}

test.describe("Inspect Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/button")
  })

  test("Code panel is always visible with syntax-highlighted source", async ({ page }) => {
    const codeHeading = page.locator("text=Code").first()
    await expect(codeHeading).toBeVisible()
    const codeBlock = page.locator("pre")
    await expect(codeBlock).toBeVisible()
    // Pillar 6.1 — Code panel now reads from the v2 parser's
    // `originalSource` (the live file on disk). The new-york-v4 Button
    // is a plain function, not a forwardRef, so check for `function
    // Button` instead.
    await expect(page.getByText("function Button").first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Code panel has copy button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible()
  })

  test("Outline panel is always visible", async ({ page }) => {
    await expect(page.getByText("Outline", { exact: true }).first()).toBeVisible()
  })

  test("A11y indicator is in status bar", async ({ page }) => {
    const a11yButton = page.locator("button").filter({ hasText: "A11y" })
    await expect(a11yButton).toBeVisible()
  })

  test("Semantic indicator is in status bar", async ({ page }) => {
    const htmlButton = page.locator("button").filter({ hasText: "HTML" })
    await expect(htmlButton).toBeVisible()
  })

  // Pillar 6 (GEO-291) deleted the M2 right-panel tabs (Styles / Classes
  // / Variants / Parts). The right panel now shows an empty-state prompt
  // until an element is selected. The tests below were rewritten to
  // reflect the v2 right panel.
  test("right panel shows empty-state prompt in edit mode", async ({
    page,
  }) => {
    await enterEditMode(page)
    await expect(
      page.getByText(/select an element on the canvas/i),
    ).toBeVisible()
  })

  test("right panel never renders the deleted M2 tabs", async ({ page }) => {
    await enterEditMode(page)
    await expect(page.getByRole("tab", { name: /styles/i })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: /classes/i })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: /variants/i })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: /parts/i })).toHaveCount(0)
  })

  test("compound component (Dialog) still loads in Style mode without crashing", async ({
    page,
  }) => {
    await page.goto("/playground/dialog")
    // Pillar 6.1 — toolbar mode toggle renamed.
    await page.getByRole("button", { name: /^style$/i }).click()
    await page.waitForTimeout(500)
    await expect(
      page.getByText(/select an element on the canvas/i),
    ).toBeVisible()
  })
})

test.describe("Inspect Panels - Dialog compound component", () => {
  test("Outline panel shows compound tree for Dialog", async ({ page }) => {
    await page.goto("/playground/dialog")
    await expect(page.getByText("Outline", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("DialogTrigger").first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("DialogContent").first()).toBeVisible({ timeout: 5000 })
  })
})
