import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test("loads with heading and command palette", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /shadcn playground/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search components/i)).toBeVisible()
  })

  test("shows component categories in command palette", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Inputs")).toBeVisible()
    await expect(page.getByText("Layout")).toBeVisible()
    await expect(page.getByText("Feedback")).toBeVisible()
  })

  test("search filters components", async ({ page }) => {
    await page.goto("/")
    const search = page.getByPlaceholder(/search components/i)
    await search.fill("button")
    await expect(page.locator("[cmdk-item]").filter({ hasText: "Button" })).toBeVisible()
  })

  test("search with synonym finds component", async ({ page }) => {
    await page.goto("/")
    const search = page.getByPlaceholder(/search components/i)
    await search.fill("modal")
    await expect(page.locator("[cmdk-item]").filter({ hasText: "Dialog" }).first()).toBeVisible()
  })

  test("clicking a component navigates to playground", async ({ page }) => {
    await page.goto("/")
    await page.locator("[cmdk-item]").filter({ hasText: "Button" }).first().click()
    await expect(page).toHaveURL(/\/playground\/button/)
  })

  test("From Scratch and From Existing buttons are visible", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /from scratch/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /from existing/i })).toBeVisible()
  })
})
