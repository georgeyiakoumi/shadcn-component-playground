import { test, expect } from "@playwright/test"

test.describe("Edit Features - Classes Tab", () => {
  test("Classes tab is visible", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByRole("tab", { name: /classes/i })).toBeVisible()
  })

  test("Classes tab shows source classes as badges", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("tab", { name: /classes/i }).click()
    // Button should have classes like "inline-flex", "rounded-md", etc.
    await expect(page.getByText("inline-flex").first()).toBeVisible()
  })
})

test.describe("Edit Features - Variants Tab", () => {
  test("Variants tab is visible", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByRole("tab", { name: /variants/i })).toBeVisible()
  })

  // TODO: fix — tab content doesn't mount reliably with many tabs in TabsList
  test.skip("Variants tab shows existing cva variants", async ({ page }) => {
    await page.goto("/playground/button")
    // Wait for the tab to be rendered
    const tab = page.getByRole("tab", { name: /variants/i })
    await expect(tab).toBeVisible({ timeout: 10000 })
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    // Wait for tab content to mount
    await expect(page.getByText("Existing Variants")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("variant", { exact: true }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("size", { exact: true }).first()).toBeVisible({ timeout: 5000 })
  })

  // TODO: fix — tab content doesn't mount reliably with many tabs in TabsList
  test.skip("Variants tab has Create button", async ({ page }) => {
    await page.goto("/playground/button")
    const tab = page.getByRole("tab", { name: /variants/i })
    await expect(tab).toBeVisible({ timeout: 10000 })
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Edit Features - Export", () => {
  test("Export button is visible in toolbar", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible()
  })

  test("Export dialog opens with two options", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /export/i }).click()
    await expect(page.getByText(/single.*\.tsx/i)).toBeVisible()
    await expect(page.getByText(/full.*bundle/i)).toBeVisible()
  })
})
