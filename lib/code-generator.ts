// Code Generator — name utilities only.
//
// Pillar 6 (GEO-291) deleted the M2 source-string-patching path.
// GEO-305 Step 6 deleted the v1 from-scratch generator (`generateFromScratch`,
// `generateFromTree`, `generateComponentCode`) — the v2 generator
// (`lib/parser/generate-from-tree-v2.ts`) is the only generator now.
//
// What survives in this file is the case-conversion helpers, which are
// genuinely universal and used by the from-scratch builder UI for naming
// components and sub-components.

/**
 * Converts a kebab-case or space-separated string to PascalCase.
 * e.g. "my-button" -> "MyButton", "alert dialog" -> "AlertDialog"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, char: string | undefined) =>
      char ? char.toUpperCase() : "",
    )
    .replace(/^(.)/, (_, char: string) => char.toUpperCase())
}

/**
 * Converts a kebab-case or space-separated string to camelCase.
 * e.g. "my-button" -> "myButton", "alert dialog" -> "alertDialog"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}
