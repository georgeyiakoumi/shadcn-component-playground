import { test, expect } from "@playwright/test"

/**
 * Pillar 6.1 — the toolbar's mode toggle was renamed Inspect/Edit →
 * Structure/Style across both stock and custom pages.
 *
 * The unified-dashboard rewrite (post-PR #30) hid the mode toggle for
 * stock pages entirely (`hideModeToggle` on the toolbar) — there's no
 * Define mode for parsed shadcn trees in v1, so a one-button toggle
 * would be confusing. The from-scratch page still has the toggle.
 *
 * This entire spec is skipped because every test in it asserted on the
 * stock page's mode toggle, which no longer exists. The from-scratch
 * page's toggle is covered indirectly by `creation.spec.ts` (Define
 * mode is the entry point for new components).
 *
 * TODO: rewrite or delete in the e2e cleanup follow-up PR.
 */

test.describe.skip("Structure/Style mode toggle (DEPRECATED — see header)", () => {
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
