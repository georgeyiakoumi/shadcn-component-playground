import { test, expect } from "@playwright/test"

test.describe("Component Creation", () => {
  test("new page loads with name input", async ({ page }) => {
    await page.goto("/playground/new")
    await expect(page.getByPlaceholder(/Start typing/i)).toBeVisible()
  })

  test("scratch mode shows element picker", async ({ page }) => {
    await page.goto("/playground/new?mode=scratch")
    await expect(page.getByText("Generic container").first()).toBeVisible()
    await expect(page.getByText("Clickable action").first()).toBeVisible()
  })

  test("creates a from-scratch component", async ({ page }) => {
    await page.goto("/playground/new?mode=scratch")
    await page.getByPlaceholder(/Start typing/i).fill("MyTestWidget")
    await page.getByText("Generic container").click()
    await page.getByRole("button", { name: /create/i }).click()
    await page.waitForURL(/\/playground\/custom\//, { timeout: 10000 })
  })

  test("copy mode requires selecting a component", async ({ page }) => {
    await page.goto("/playground/new?mode=copy")
    const input = page.getByPlaceholder(/Start typing/i)
    await input.fill("MyCopyTest")
    const createButton = page.getByRole("button", { name: /create/i })
    await expect(createButton).toBeDisabled()
  })
})
