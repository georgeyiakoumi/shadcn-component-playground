/**
 * Parse a stock shadcn component file and return its `ComponentTreeV2`.
 *
 * Server-side route. The parser depends on the TypeScript compiler (~5MB)
 * which we deliberately keep out of the client bundle. The slug page calls
 * this endpoint to fetch a parsed tree on demand.
 *
 * Pillar 5a (GEO-290) — first wire of the parser into the user-visible
 * surface. Current scope: read-only proof-of-life. The page displays
 * metadata extracted from the tree to confirm the integration works
 * end-to-end. Pillar 5b will pipe the tree into the M3 visual editor.
 *
 * Pillar 1 / Lesson #16 (Respect the source) — the source we read here is
 * the live file in `components/ui/`, not the embedded `componentSources`
 * map. That map will be deleted in Pillar 6 once the parser is the only
 * source of truth.
 */

import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

import { parseSource } from "@/lib/parser/parse-source-v2"
import { ParserError } from "@/lib/parser/parser-error"

const REPO_ROOT = process.cwd()
const COMPONENTS_DIR = path.join(REPO_ROOT, "components", "ui")

// Slug whitelist guard: anything that doesn't match `^[a-z][a-z0-9-]*$`
// (one lowercase word with optional dashes) is rejected before we touch the
// filesystem. Defends against path traversal even though we also resolve
// the path against COMPONENTS_DIR below.
const SAFE_SLUG = /^[a-z][a-z0-9-]*$/

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params

  if (!SAFE_SLUG.test(slug)) {
    return NextResponse.json(
      { error: `Invalid slug: ${slug}` },
      { status: 400 },
    )
  }

  const filePath = path.join(COMPONENTS_DIR, `${slug}.tsx`)
  // Defense in depth: ensure the resolved path is still inside COMPONENTS_DIR.
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(COMPONENTS_DIR) + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  let source: string
  try {
    source = await readFile(filePath, "utf-8")
  } catch {
    return NextResponse.json(
      { error: `Component not found: ${slug}` },
      { status: 404 },
    )
  }

  try {
    const tree = parseSource(source, `components/ui/${slug}.tsx`)
    return NextResponse.json(tree)
  } catch (err) {
    if (err instanceof ParserError) {
      return NextResponse.json(
        {
          error: "ParserError",
          filePath: err.filePath,
          line: err.line,
          column: err.column,
          reason: err.reason,
          nodeKind: err.nodeKind,
        },
        { status: 422 },
      )
    }
    return NextResponse.json(
      { error: (err as Error).message ?? "Unknown parser failure" },
      { status: 500 },
    )
  }
}
