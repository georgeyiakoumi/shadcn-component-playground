export type Severity = "error" | "warning" | "info"

export interface A11yIssue {
  id: string
  severity: Severity
  title: string
  description: string
  element?: string
  suggestion: string
  wcagCriteria?: string
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function issue(
  id: string,
  severity: Severity,
  title: string,
  description: string,
  suggestion: string,
  wcagCriteria?: string,
  element?: string,
): A11yIssue {
  return { id, severity, title, description, suggestion, wcagCriteria, element }
}

/* ── Checks ────────────────────────────────────────────────────────── */

function checkImgAlt(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const imgRegex = /<img\b[^>]*>/gi
  let match
  while ((match = imgRegex.exec(source)) !== null) {
    const tag = match[0]
    if (!/\balt\s*[={]/i.test(tag)) {
      issues.push(
        issue(
          "img-alt",
          "error",
          "Image missing alt text",
          "Images must have an alt attribute for screen readers.",
          'Add an alt attribute: <img alt="Description" /> or alt="" for decorative images.',
          "1.1.1",
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

function checkIconButtonLabel(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  // Match Button with size="icon" but no aria-label or sr-only text
  const iconBtnRegex = /<Button[^>]*size\s*=\s*["']icon["'][^>]*>/gi
  let match
  while ((match = iconBtnRegex.exec(source)) !== null) {
    const tag = match[0]
    if (!/aria-label/i.test(tag) && !/aria-labelledby/i.test(tag)) {
      issues.push(
        issue(
          "icon-btn-label",
          "error",
          "Icon button missing accessible label",
          "Buttons with only an icon have no accessible name for screen readers.",
          'Add aria-label="Description" to the Button.',
          "4.1.2",
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

function checkFormLabels(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const inputRegex = /<(Input|Textarea)\b[^>]*>/gi
  let match
  while ((match = inputRegex.exec(source)) !== null) {
    const tag = match[0]
    if (
      !/aria-label/i.test(tag) &&
      !/aria-labelledby/i.test(tag) &&
      !/id\s*=\s*["'][^"']+["']/i.test(tag)
    ) {
      issues.push(
        issue(
          "form-label",
          "warning",
          `${match[1]} may be missing a label`,
          "Form inputs should be associated with a label for accessibility.",
          "Add a <Label htmlFor=\"id\"> or aria-label to the input.",
          "1.3.1",
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

function checkDialogDescription(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  if (
    /DialogContent/i.test(source) &&
    !/DialogDescription/i.test(source)
  ) {
    issues.push(
      issue(
        "dialog-desc",
        "warning",
        "Dialog missing description",
        "DialogContent should include a DialogDescription for screen readers.",
        "Add <DialogDescription> inside DialogContent.",
        "4.1.2",
      ),
    )
  }
  if (
    /AlertDialogContent/i.test(source) &&
    !/AlertDialogDescription/i.test(source)
  ) {
    issues.push(
      issue(
        "alert-dialog-desc",
        "warning",
        "AlertDialog missing description",
        "AlertDialogContent should include an AlertDialogDescription.",
        "Add <AlertDialogDescription> inside AlertDialogContent.",
        "4.1.2",
      ),
    )
  }
  return issues
}

function checkDivClickHandler(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const divClickRegex = /<(div|span)\b[^>]*onClick[^>]*>/gi
  let match
  while ((match = divClickRegex.exec(source)) !== null) {
    const tag = match[0]
    if (!/role\s*=/i.test(tag) || !/tabIndex/i.test(tag)) {
      issues.push(
        issue(
          "div-click",
          "error",
          `Click handler on non-interactive <${match[1]}>`,
          "Non-interactive elements with click handlers are not keyboard accessible.",
          `Use a <button> instead, or add role="button" and tabIndex={0}.`,
          "2.1.1",
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

function checkPositiveTabindex(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const tabIndexRegex = /tabIndex\s*[={]\s*(\d+)/gi
  let match
  while ((match = tabIndexRegex.exec(source)) !== null) {
    const value = parseInt(match[1], 10)
    if (value > 0) {
      issues.push(
        issue(
          "positive-tabindex",
          "warning",
          "Positive tabIndex value",
          `tabIndex={${value}} disrupts the natural tab order.`,
          "Use tabIndex={0} to add to natural flow, or tabIndex={-1} for programmatic focus only.",
          "2.4.3",
          match[0],
        ),
      )
    }
  }
  return issues
}

function checkAutofocus(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  if (/autoFocus/i.test(source)) {
    issues.push(
      issue(
        "autofocus",
        "info",
        "autoFocus detected",
        "Auto-focusing an element can be disorienting for screen reader users.",
        "Consider whether autoFocus is necessary, or manage focus programmatically.",
      ),
    )
  }
  return issues
}

function checkHeadingHierarchy(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
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
          "heading-skip",
          "warning",
          `Heading level skipped: h${levels[i - 1]} → h${levels[i]}`,
          "Headings should not skip levels for proper document structure.",
          `Add an h${levels[i - 1] + 1} between h${levels[i - 1]} and h${levels[i]}.`,
          "1.3.1",
        ),
      )
    }
  }
  return issues
}

function checkColorContrast(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  // Only flag if custom text + bg colours are used together (not token-based)
  const customColorRegex = /text-(red|green|blue|yellow|orange|pink|purple|gray)-\d+/
  const customBgRegex = /bg-(red|green|blue|yellow|orange|pink|purple|gray)-\d+/
  if (customColorRegex.test(source) && customBgRegex.test(source)) {
    issues.push(
      issue(
        "color-contrast",
        "info",
        "Custom colours detected — verify contrast",
        "Custom text and background colour combinations should meet WCAG AA contrast ratio of 4.5:1.",
        "Use a contrast checker to verify the colour combination meets requirements.",
        "1.4.3",
      ),
    )
  }
  return issues
}

function checkButtonType(source: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const btnRegex = /<button\b[^>]*>/gi
  let match
  while ((match = btnRegex.exec(source)) !== null) {
    const tag = match[0]
    if (!/type\s*=/i.test(tag)) {
      issues.push(
        issue(
          "button-type",
          "info",
          "Button missing type attribute",
          "Buttons without a type attribute default to type=\"submit\", which may cause unintended form submissions.",
          'Add type="button" for non-submit buttons.',
          undefined,
          tag.slice(0, 80),
        ),
      )
    }
  }
  return issues
}

/* ── Main ──────────────────────────────────────────────────────────── */

export function checkAccessibility(source: string): A11yIssue[] {
  return [
    ...checkImgAlt(source),
    ...checkIconButtonLabel(source),
    ...checkFormLabels(source),
    ...checkDialogDescription(source),
    ...checkDivClickHandler(source),
    ...checkPositiveTabindex(source),
    ...checkAutofocus(source),
    ...checkHeadingHierarchy(source),
    ...checkColorContrast(source),
    ...checkButtonType(source),
  ]
}
