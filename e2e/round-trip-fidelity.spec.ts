/**
 * Pillar 4 — round-trip fidelity smoke test in a real browser.
 *
 * The Vitest unit-level round-trip test (`lib/parser/__tests__/round-trip.test.ts`)
 * proves that `generate(parse(source))` is byte-equivalent to `source` for
 * all 44 components in `components/ui/`. That's the parser+generator
 * library contract.
 *
 * THIS test proves the same property end-to-end through the **actual UI**:
 * the same source travels server-side parser → JSON over HTTP → React
 * state hydration → in-memory tree → client-side generator → Blob →
 * browser download. Any byte that gets dropped, transformed, or escaped
 * along that pipeline would fail this test.
 *
 * Three representative components are exercised:
 * - **Card** — multi-sub-component file, plain HTML bases, cn-call className
 * - **Button** — single component, cva-call className, dynamic-ref Base
 * - **Sheet** — multi-sub-component, Radix Dialog primitives, child portal
 *
 * The toolbar now has a direct download button (no dialog) showing
 * `{slug}.tsx`. Clicking it triggers an immediate file download.
 *
 * Linear: GEO-289
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { test, expect } from "@playwright/test"

const REPO_ROOT = path.resolve(__dirname, "..")

function loadOriginal(slug: string): string {
  return readFileSync(
    path.join(REPO_ROOT, "components", "ui", `${slug}.tsx`),
    "utf-8",
  )
}

const COMPONENTS = ["card", "button", "sheet"]

for (const slug of COMPONENTS) {
  test(`round-trip — Export → Download for ${slug} produces byte-equivalent source`, async ({
    page,
  }) => {
    await page.goto(`/playground/${slug}`)

    // Wait for the download button to appear. It renders as a primary
    // button showing `{slug}.tsx` once the parsed tree has hydrated and
    // the source has been regenerated.
    const downloadButton = page.getByRole("button", { name: `${slug}.tsx` })
    await expect(downloadButton).toBeVisible({ timeout: 10_000 })

    // Click + capture the download.
    const [downloadEvent] = await Promise.all([
      page.waitForEvent("download"),
      downloadButton.click(),
    ])

    // The download's filename should match the slug.
    expect(downloadEvent.suggestedFilename()).toBe(`${slug}.tsx`)

    // Read the downloaded file and compare byte-for-byte against the
    // original source on disk. Any drift fails the test.
    const downloadedPath = await downloadEvent.path()
    const downloadedBytes = readFileSync(downloadedPath, "utf-8")
    const originalBytes = loadOriginal(slug)
    expect(downloadedBytes).toBe(originalBytes)
  })
}
