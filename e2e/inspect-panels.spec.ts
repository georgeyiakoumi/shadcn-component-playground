/**
 * Inspect-panels smoke tests on stock pages.
 *
 * Trimmed for the unified-dashboard rewrite (post-PR #30):
 * - The Outline panel is gone (replaced by AssemblyPanel inside the
 *   dashboard, which lives at the bottom-left of the canvas)
 * - The mode toggle is gone for stock pages (`hideModeToggle`)
 * - The "right panel empty state" copy moved into the dashboard's
 *   Style panel
 *
 * What's still asserted:
 * - Code panel is visible with syntax-highlighted source (still
 *   rendered by the unified dashboard's CodePanel)
 * - Code panel has a copy button (unchanged)
 * - A11y + HTML status bar badges are visible (StatusBar still
 *   mounted by the dashboard)
 * - Compound components (Dialog) load without crashing
 *
 * The deleted tests are tracked for rewrite/deletion in the e2e
 * cleanup follow-up PR.
 */

import { test, expect } from "@playwright/test"

test.describe("Inspect Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/button")
  })

  test("Code panel is always visible with syntax-highlighted source", async ({
    page,
  }) => {
    const codeHeading = page.locator("text=Code").first()
    await expect(codeHeading).toBeVisible()
    const codeBlock = page.locator("pre")
    await expect(codeBlock).toBeVisible()
    // The unified dashboard's CodePanel reads the regenerated source
    // from the parsed tree. For Button (a plain function, not forwardRef
    // in the new-york-v4 registry), the source contains `function Button`.
    await expect(page.getByText("function Button").first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Code panel has copy button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible()
  })

  test("A11y indicator is in status bar", async ({ page }) => {
    const a11yButton = page.locator("button").filter({ hasText: "A11y" })
    await expect(a11yButton).toBeVisible()
  })

  test("Semantic indicator is in status bar", async ({ page }) => {
    const htmlButton = page.locator("button").filter({ hasText: "HTML" })
    await expect(htmlButton).toBeVisible()
  })

  test("compound component (Dialog) loads via unified dashboard without crashing", async ({
    page,
  }) => {
    await page.goto("/playground/dialog")
    // Unified dashboard mounts directly — no mode toggle on stock pages.
    // Wait for the download button as a proxy for "page ready".
    await expect(
      page.getByRole("button", { name: "dialog.tsx" }),
    ).toBeVisible({ timeout: 10_000 })
  })
})
