// Export Utilities — single .tsx download and full .zip bundle
// Runs entirely client-side using Blob URLs and jszip.

import JSZip from "jszip"
import { componentSources } from "@/lib/component-source"

/* ── Dependency detection ──────────────────────────────────────── */

/**
 * Parses import statements to find which `@/components/ui/*` a component
 * depends on. Returns an array of component slugs.
 *
 * e.g. `import { Button } from "@/components/ui/button"` -> ["button"]
 */
export function detectDependencies(source: string): string[] {
  const deps: string[] = []
  // Match: from "@/components/ui/slug" or from '@/components/ui/slug'
  const importPattern =
    /from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g

  let match: RegExpExecArray | null
  while ((match = importPattern.exec(source)) !== null) {
    const slug = match[1]
    if (slug && !deps.includes(slug)) {
      deps.push(slug)
    }
  }

  return deps
}

/* ── File size estimation ──────────────────────────────────────── */

/**
 * Returns a human-readable size string for a code string.
 */
export function estimateFileSize(code: string): string {
  const bytes = new Blob([code]).size
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

/* ── Single .tsx export ────────────────────────────────────────── */

/**
 * Downloads a single .tsx file by creating a temporary Blob URL and
 * triggering a click on a hidden anchor element.
 */
export function exportAsTsx(filename: string, code: string): void {
  const blob = new Blob([code], { type: "text/typescript;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.endsWith(".tsx") ? filename : `${filename}.tsx`
  anchor.style.display = "none"

  document.body.appendChild(anchor)
  anchor.click()

  // Clean up
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/* ── Full .zip bundle export ───────────────────────────────────── */

// The cn() utility source — matches the actual lib/utils.ts in the project
const CN_UTILITY_SOURCE = `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`

/**
 * Creates and downloads a .zip bundle containing the generated component,
 * all its shadcn/ui dependencies, and the cn() utility.
 */
export async function exportAsZip(
  componentSlug: string,
  componentCode: string,
  dependencies: string[],
): Promise<void> {
  const zip = new JSZip()

  // Add the main component
  zip.file(`components/ui/${componentSlug}.tsx`, componentCode)

  // Add each dependency's source from componentSources
  for (const dep of dependencies) {
    const depSource = componentSources[dep]
    if (depSource) {
      zip.file(`components/ui/${dep}.tsx`, depSource)
    }
  }

  // Add the cn() utility
  zip.file("lib/utils.ts", CN_UTILITY_SOURCE)

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${componentSlug}-bundle.zip`
  anchor.style.display = "none"

  document.body.appendChild(anchor)
  anchor.click()

  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
