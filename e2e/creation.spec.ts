import { test, expect } from "@playwright/test"

test.describe("Component Creation", () => {
  test("opens create dialog from homepage button", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /create from scratch/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByPlaceholder(/status badge/i)).toBeVisible()
  })

  test("shows base element selector in dialog", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /create from scratch/i }).click()
    await expect(page.getByText("Base HTML element")).toBeVisible()
  })

  test("creates a component from the dialog", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /create from scratch/i }).click()
    await page.getByPlaceholder(/status badge/i).fill("MyTestWidget")
    await page.getByRole("button", { name: /create component/i }).click()
    await page.waitForURL(/\/playground\/custom\//, { timeout: 10000 })
  })

  test("/playground/new redirects to homepage", async ({ page }) => {
    await page.goto("/playground/new")
    await page.waitForURL("/", { timeout: 5000 })
  })
})
