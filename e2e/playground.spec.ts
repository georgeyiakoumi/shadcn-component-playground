import { test, expect } from "@playwright/test"

test.describe("Playground - Component Loading", () => {
  test("loads button component with preview", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByText("Button", { exact: true }).first()).toBeVisible()
  })

  test("sidebar shows component categories", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByText("Inputs")).toBeVisible()
    await expect(page.getByText("Layout")).toBeVisible()
  })

  test("sidebar search filters components", async ({ page }) => {
    await page.goto("/playground/button")
    const search = page.getByPlaceholder(/search components/i)
    await search.fill("card")
    await expect(page.getByText("Card", { exact: true })).toBeVisible()
  })

  test("clicking sidebar component navigates", async ({ page }) => {
    await page.goto("/playground/button")
    // Expand Inputs category
    await page.getByText("Inputs").click()
    await page.getByText("Checkbox").click()
    await expect(page).toHaveURL(/\/playground\/checkbox/)
  })

  test("shows 'not found' for invalid slug", async ({ page }) => {
    await page.goto("/playground/nonexistent-component")
    await expect(page.getByText(/not found/i)).toBeVisible()
  })
})

test.describe("Playground - Theme Toggle", () => {
  test("toggle dark theme applies dark class to canvas", async ({ page }) => {
    await page.goto("/playground/button")
    // Click the dark theme button (Moon icon)
    await page.getByRole("button", { name: /dark theme/i }).click()
    // The canvas should have the 'dark' class
    const canvas = page.locator(".dark")
    await expect(canvas).toBeVisible()
  })

  test("toggle back to light removes dark class", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /dark theme/i }).click()
    await page.getByRole("button", { name: /light theme/i }).click()
    const darkElements = page.locator(".dark")
    await expect(darkElements).toHaveCount(0)
  })
})

test.describe("Playground - Breakpoints", () => {
  test("breakpoint buttons are visible", async ({ page }) => {
    await page.goto("/playground/button")
    await expect(page.getByRole("button", { name: "Small (640px)" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Medium (768px)" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Large (1024px)" })).toBeVisible()
  })

  test("clicking sm breakpoint constrains canvas width", async ({ page }) => {
    await page.goto("/playground/button")
    await page.getByRole("button", { name: /small/i }).click()
    const inner = page.locator("[style*='max-width: 640px']")
    await expect(inner).toBeVisible()
  })
})

test.describe("Playground - Variant Selectors", () => {
  test("button shows variant and size selectors", async ({ page }) => {
    await page.goto("/playground/button")
    // Should have variant and size prop selectors auto-discovered from cva
    // Toolbar renders them as Select (combobox) elements showing the current value
    const selectors = page.getByRole("combobox")
    await expect(selectors).toHaveCount(2)
  })

  test("badge shows variant selector only", async ({ page }) => {
    await page.goto("/playground/badge")
    // Badge has a single cva variant (variant), so one combobox in toolbar
    const selectors = page.getByRole("combobox")
    await expect(selectors).toHaveCount(1)
  })

  test("card shows no variant selectors", async ({ page }) => {
    await page.goto("/playground/card")
    // Card has no cva variants, so no combobox selectors in toolbar
    const selectors = page.getByRole("combobox")
    await expect(selectors).toHaveCount(0)
  })
})
