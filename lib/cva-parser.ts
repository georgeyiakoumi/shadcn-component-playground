// CVA Variant Parser — extracts variant definitions from component source code
// Parses cva() calls to discover variant props, their options, and defaults.

/* ── Types ──────────────────────────────────────────────────────── */

export interface VariantDef {
  /** The variant prop name, e.g. "variant", "size" */
  name: string
  /** All available option keys, e.g. ["default", "destructive", "outline"] */
  options: string[]
  /** The default value from defaultVariants, e.g. "default" */
  defaultValue: string
}

/* ── Parser ─────────────────────────────────────────────────────── */

/**
 * Extracts CVA variant definitions from a component source code string.
 *
 * Parses the `variants` and `defaultVariants` blocks within the first
 * `cva()` call found in the source. Returns an empty array if no cva
 * call or no variants block is found.
 */
export function parseCvaVariants(source: string): VariantDef[] {
  if (!source) return []

  // Find the cva() call — match `cva(` and then find the config object
  const cvaCallIndex = source.indexOf("cva(")
  if (cvaCallIndex === -1) return []

  // Extract the portion from the cva call onward
  const fromCva = source.slice(cvaCallIndex)

  // Find the variants block
  const variantsBlock = extractBlock(fromCva, "variants")
  if (!variantsBlock) return []

  // Find the defaultVariants block
  const defaultVariantsBlock = extractBlock(fromCva, "defaultVariants")
  const defaults = defaultVariantsBlock
    ? parseDefaults(defaultVariantsBlock)
    : {}

  // Parse each variant group from the variants block
  return parseVariantGroups(variantsBlock, defaults)
}

/* ── Internal helpers ───────────────────────────────────────────── */

/**
 * Extracts the content of a named block like `variants: { ... }` or
 * `defaultVariants: { ... }` from the source string. Returns the
 * content between the matching braces, or null if not found.
 */
function extractBlock(source: string, blockName: string): string | null {
  // Match `blockName:` followed by optional whitespace and `{`
  const pattern = new RegExp(`${blockName}\\s*:\\s*\\{`)
  const match = pattern.exec(source)
  if (!match) return null

  const startIndex = match.index + match[0].length
  let depth = 1
  let i = startIndex

  while (i < source.length && depth > 0) {
    const char = source[i]
    if (char === "{") depth++
    else if (char === "}") depth--

    // Skip string literals to avoid counting braces inside strings
    if (char === '"' || char === "'" || char === "`") {
      i = skipString(source, i, char)
      continue
    }

    i++
  }

  if (depth !== 0) return null

  // Return content between the braces (excluding the closing brace)
  return source.slice(startIndex, i - 1)
}

/**
 * Advances past a string literal, handling escape characters.
 * Returns the index after the closing quote.
 */
function skipString(source: string, start: number, quote: string): number {
  let i = start + 1
  while (i < source.length) {
    if (source[i] === "\\" && quote !== "`") {
      i += 2 // skip escaped character
      continue
    }
    if (source[i] === quote) {
      return i + 1
    }
    i++
  }
  return i
}

/**
 * Parses the defaultVariants block to extract key-value pairs.
 * e.g. `variant: "default", size: "default"` -> { variant: "default", size: "default" }
 */
function parseDefaults(block: string): Record<string, string> {
  const defaults: Record<string, string> = {}
  // Match patterns like: variant: "default" or size: "sm"
  const regex = /(\w+)\s*:\s*["']([^"']*)["']/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(block)) !== null) {
    defaults[match[1]] = match[2]
  }

  return defaults
}

/**
 * Parses the variants block into VariantDef entries.
 * The variants block contains sub-blocks like:
 *   variant: { default: "...", destructive: "...", ... },
 *   size: { default: "...", sm: "...", ... },
 */
function parseVariantGroups(
  variantsBlock: string,
  defaults: Record<string, string>,
): VariantDef[] {
  const results: VariantDef[] = []

  // Find each variant group: `name: {`
  const groupPattern = /(\w+)\s*:\s*\{/g
  let groupMatch: RegExpExecArray | null

  while ((groupMatch = groupPattern.exec(variantsBlock)) !== null) {
    const groupName = groupMatch[1]
    const groupStart = groupMatch.index + groupMatch[0].length

    // Find the matching closing brace for this group
    let depth = 1
    let i = groupStart

    while (i < variantsBlock.length && depth > 0) {
      const char = variantsBlock[i]
      if (char === "{") depth++
      else if (char === "}") depth--

      if (char === '"' || char === "'" || char === "`") {
        i = skipString(variantsBlock, i, char)
        continue
      }

      i++
    }

    const groupContent = variantsBlock.slice(groupStart, i - 1)

    // Extract the keys from this group (the option names)
    const options = extractOptionKeys(groupContent)

    if (options.length > 0) {
      results.push({
        name: groupName,
        options,
        defaultValue: defaults[groupName] ?? options[0],
      })
    }

    // Move the regex lastIndex past this group to avoid re-matching inner braces
    groupPattern.lastIndex = i
  }

  return results
}

/**
 * Extracts the top-level keys from a variant group.
 * e.g. from `default: "bg-primary ...", destructive: "bg-destructive ..."`
 * extracts ["default", "destructive"]
 *
 * Only matches keys at the top level (not nested inside strings or sub-objects).
 */
function extractOptionKeys(groupContent: string): string[] {
  const keys: string[] = []

  // Match `key:` or `"key":` patterns at the start of lines or after commas
  // The key is followed by a colon and then either a string or a newline
  const keyPattern = /(?:^|[,\n])\s*(?:["'](\w[\w-]*)["']|(\w[\w-]*))\s*:/g
  let match: RegExpExecArray | null

  while ((match = keyPattern.exec(groupContent)) !== null) {
    const key = match[1] ?? match[2]
    if (key) {
      keys.push(key)
    }
  }

  return keys
}
