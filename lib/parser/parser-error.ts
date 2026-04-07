/**
 * Structured error for the shadcn-source-to-ComponentTreeV2 parser.
 *
 * Thrown when the parser encounters a construct it does not understand and
 * cannot safely round-trip. Carries enough context (file path, line, column,
 * reason) for the editor UI to highlight the offending line.
 *
 * Pillar 2 principle (GEO-287): "Honest about failure. Structured errors
 * point at the unhandleable construct rather than silent partial parses."
 */
export class ParserError extends Error {
  readonly filePath: string
  readonly line: number
  readonly column: number
  readonly reason: string
  readonly nodeKind?: string

  constructor(params: {
    filePath: string
    line: number
    column: number
    reason: string
    /** The AST SyntaxKind name of the offending node, for diagnostics. */
    nodeKind?: string
  }) {
    super(
      `[parser] ${params.filePath}:${params.line}:${params.column} — ${params.reason}`,
    )
    this.name = "ParserError"
    this.filePath = params.filePath
    this.line = params.line
    this.column = params.column
    this.reason = params.reason
    this.nodeKind = params.nodeKind
  }
}
