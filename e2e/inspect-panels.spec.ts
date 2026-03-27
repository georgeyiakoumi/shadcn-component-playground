import { test, expect } from "@playwright/test"

test.describe("Inspect Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/button")
  })

  test("Code tab shows syntax-highlighted source", async ({ page }) => {
    await page.getByRole("tab", { name: /code/i }).click()
    // Shiki renders into a <pre> with highlighted code
    const codeBlock = page.locator("pre")
    await expect(codeBlock).toBeVisible()
    // Should contain actual component source (forwardRef, cva)
    await expect(page.getByText("forwardRef")).toBeVisible()
  })

  test("Code tab has copy button", async ({ page }) => {
    await page.getByRole("tab", { name: /code/i }).click()
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible()
  })

  test("Structure tab shows component info", async ({ page }) => {
    const tab = page.getByRole("tab", { name: /structure/i })
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.getByText("Button").first()).toBeVisible({ timeout: 5000 })
  })

  test("Styles tab shows categorised classes", async ({ page }) => {
    await page.getByRole("tab", { name: /styles/i }).click()
    // Should show at least some TW class categories
    await expect(page.getByText(/spacing|typography|layout|colour/i).first()).toBeVisible()
  })

  test("A11y tab shows accessibility results", async ({ page }) => {
    await page.getByRole("tab", { name: /a11y/i }).click()
    await expect(page.getByText("Accessibility", { exact: true })).toBeVisible()
  })

  test("Semantic tab shows semantic HTML results", async ({ page }) => {
    await page.getByRole("tab", { name: /semantic/i }).click()
    await expect(page.getByText("Semantic HTML", { exact: true })).toBeVisible()
  })

  test("compound component shows Parts tab", async ({ page }) => {
    await page.goto("/playground/dialog")
    await expect(page.getByRole("tab", { name: /parts/i })).toBeVisible()
  })

  test("non-compound component hides Parts tab", async ({ page }) => {
    // Button is not compound
    const partsTab = page.getByRole("tab", { name: /parts/i })
    await expect(partsTab).toHaveCount(0)
  })
})

test.describe("Inspect Panels - Dialog compound component", () => {
  test("Parts tab lists sub-components with toggles", async ({ page }) => {
    await page.goto("/playground/dialog")
    const tab = page.getByRole("tab", { name: /parts/i })
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.getByText("DialogTrigger").first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("DialogContent").first()).toBeVisible({ timeout: 5000 })
  })

  test("Structure tab shows compound tree for Dialog", async ({ page }) => {
    await page.goto("/playground/dialog")
    const tab = page.getByRole("tab", { name: /structure/i })
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    await page.waitForTimeout(500)
    await expect(page.getByText("DialogTrigger").first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("DialogContent").first()).toBeVisible({ timeout: 5000 })
  })
})
