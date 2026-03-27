export type SemanticSeverity = "error" | "warning" | "info"

export interface SemanticIssue {
  id: string
  severity: SemanticSeverity
  title: string
  description: string
  element?: string
  suggestion: string
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function issue(
  id: string,
  severity: SemanticSeverity,
  title: string,
  description: string,
  suggestion: string,
  element?: string,
): SemanticIssue {
  return { id, severity, title, description, suggestion, element }
}

/* ── Checks ────────────────────────────────────────────────────────── */

function checkDivAsButton(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const divClickRegex = /<div\b[^>]*onClick[^>]*>/gi
  let match
  while ((match = divClickRegex.exec(source)) !== null) {
    const tag = match[0]
    if (!/role\s*=\s*["']button["']/i.test(tag)) {
      issues.push(
        issue(
          "div-as-button",
          "error",
          "div with onClick should be a button",
          "Using a <div> as a clickable element prevents keyboard navigation and screen reader recognition.",
          "Replace with <button> or <Button> for proper semantics.",
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

function checkDivAsLink(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  // div/span with href-like content or navigation-like onClick
  const divNavRegex = /<(div|span)\b[^>]*onClick[^>]*>[^<]*(navigate|router\.push|window\.location|href)[^<]*<\/(div|span)>/gi
  let match
  while ((match = divNavRegex.exec(source)) !== null) {
    issues.push(
      issue(
        "div-as-link",
        "warning",
        `<${match[1]}> used for navigation should be a link`,
        "Navigation should use <a> or <Link> elements for proper semantics and accessibility.",
        "Replace with <a href=\"...\"> or Next.js <Link>.",
        match[0].slice(0, 80),
      ),
    )
  }
  return issues
}

function checkHeadingHierarchy(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const headingRegex = /<h([1-6])\b/gi
  const levels: number[] = []
  let match
  while ((match = headingRegex.exec(source)) !== null) {
    levels.push(parseInt(match[1], 10))
  }
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      issues.push(
        issue(
          "heading-hierarchy",
          "warning",
          `Heading skips from h${levels[i - 1]} to h${levels[i]}`,
          "Headings should follow a sequential order for proper document outline.",
          `Add an h${levels[i - 1] + 1} between the two headings.`,
        ),
      )
    }
  }
  return issues
}

function checkListStructure(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  // Check for <li> without parent <ul> or <ol> in the source
  if (/<li\b/i.test(source) && !/<[uo]l\b/i.test(source)) {
    issues.push(
      issue(
        "orphan-li",
        "error",
        "List items without a list parent",
        "<li> elements should be direct children of <ul> or <ol>.",
        "Wrap <li> elements in a <ul> or <ol>.",
      ),
    )
  }
  return issues
}

function checkTableHeaders(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const hasTable = /(<Table\b|<table\b)/i.test(source)
  const hasHeader = /(<TableHeader|<thead|<th\b)/i.test(source)
  if (hasTable && !hasHeader) {
    issues.push(
      issue(
        "table-no-header",
        "warning",
        "Table without headers",
        "Tables should have header rows to describe column content.",
        "Add <TableHeader> with <TableHead> cells, or <thead> with <th> elements.",
      ),
    )
  }
  return issues
}

function checkNavElement(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  // Multiple links without a nav wrapper
  const linkCount = (source.match(/<(a|Link)\b/gi) || []).length
  const hasNav = /<nav\b/i.test(source) || /role\s*=\s*["']navigation["']/i.test(source)
  if (linkCount >= 3 && !hasNav) {
    issues.push(
      issue(
        "missing-nav",
        "warning",
        "Multiple links without <nav> wrapper",
        "Groups of navigation links should be wrapped in a <nav> element.",
        "Wrap the link group in <nav> for screen reader landmark navigation.",
      ),
    )
  }
  return issues
}

function checkDivForTextBlocks(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  // div with className containing "description" or "text" that's likely a paragraph
  const textDivRegex = /<div\b[^>]*className\s*=\s*["'][^"']*(?:text-sm|text-base|text-lg|text-muted)[^"']*["'][^>]*>[^<]{20,}<\/div>/gi
  let match
  while ((match = textDivRegex.exec(source)) !== null) {
    issues.push(
      issue(
        "div-as-paragraph",
        "info",
        "div with text content could be a <p>",
        "Text blocks should use semantic <p> elements for proper document structure.",
        "Replace <div> with <p> for paragraph content.",
        match[0].slice(0, 60),
      ),
    )
  }
  return issues
}

function checkSemanticSections(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const sectionHints = [
    { pattern: /className\s*=\s*["'][^"']*\bheader\b[^"']*["']/i, element: "header", suggestion: "<header>" },
    { pattern: /className\s*=\s*["'][^"']*\bfooter\b[^"']*["']/i, element: "footer", suggestion: "<footer>" },
    { pattern: /className\s*=\s*["'][^"']*\bsidebar\b[^"']*["']/i, element: "sidebar", suggestion: "<aside>" },
    { pattern: /className\s*=\s*["'][^"']*\bmain-content\b[^"']*["']/i, element: "main content", suggestion: "<main>" },
  ]

  for (const hint of sectionHints) {
    if (hint.pattern.test(source) && !new RegExp(`<${hint.suggestion.replace(/[<>]/g, "")}\\b`, "i").test(source)) {
      issues.push(
        issue(
          `semantic-${hint.element}`,
          "info",
          `Consider using ${hint.suggestion} instead of div`,
          `A div with "${hint.element}" in its class name suggests it should use the semantic ${hint.suggestion} element.`,
          `Replace the div with ${hint.suggestion} for better document semantics.`,
        ),
      )
    }
  }
  return issues
}

function checkFormFieldset(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const inputCount = (source.match(/<(Input|Textarea|Select|Checkbox|RadioGroup|Switch)\b/gi) || []).length
  const hasFieldset = /<fieldset\b/i.test(source)
  if (inputCount >= 3 && !hasFieldset) {
    issues.push(
      issue(
        "form-fieldset",
        "info",
        "Multiple form inputs without fieldset",
        "Groups of related form controls should be wrapped in a <fieldset> with a <legend>.",
        "Add <fieldset> and <legend> to group related inputs.",
      ),
    )
  }
  return issues
}

function checkLandmarkRegions(source: string): SemanticIssue[] {
  const issues: SemanticIssue[] = []
  const lines = source.split("\n").length
  const hasLandmark =
    /<(nav|main|header|footer|aside|section|article)\b/i.test(source) ||
    /role\s*=\s*["'](navigation|main|banner|contentinfo|complementary|region)["']/i.test(source)

  if (lines > 30 && !hasLandmark) {
    issues.push(
      issue(
        "no-landmarks",
        "info",
        "No landmark regions found",
        "Larger components benefit from landmark regions for screen reader navigation.",
        "Consider using <nav>, <main>, <section>, or <aside> where appropriate.",
      ),
    )
  }
  return issues
}

/* ── Main ──────────────────────────────────────────────────────────── */

export function checkSemanticHtml(source: string): SemanticIssue[] {
  return [
    ...checkDivAsButton(source),
    ...checkDivAsLink(source),
    ...checkHeadingHierarchy(source),
    ...checkListStructure(source),
    ...checkTableHeaders(source),
    ...checkNavElement(source),
    ...checkDivForTextBlocks(source),
    ...checkSemanticSections(source),
    ...checkFormFieldset(source),
    ...checkLandmarkRegions(source),
  ]
}
