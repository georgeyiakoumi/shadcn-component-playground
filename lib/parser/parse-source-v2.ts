/**
 * shadcn-source-to-ComponentTreeV2 parser.
 *
 * Pillar 2a scope: Button only. This file intentionally does only what Button
 * needs — imports, one cva export, one function component with the
 * `const Comp = asChild ? Slot.Root : "button"` dynamic-ref pattern, inline
 * props destructuring with defaults, and one root JSX element.
 *
 * Pillar 2b (easy bucket) will extend this file with Radix primitive
 * recognition, and may split it into per-concern walker files if the single
 * file gets unwieldy. For now, one file is simpler to reason about.
 *
 * Design doc: https://www.notion.so/33bfeeb2a07881a9b24fee494b4d4d71
 * Linear: GEO-295
 *
 * AST library decision: TypeScript compiler API.
 * Rationale: native TSX support, zero new dependencies (we already ship
 * `typescript`), the compiler API also exposes a printer for Pillar 3.
 * If this decision bites us later, the fallback is `@babel/parser`, but all
 * AST handling is contained in `lib/parser/` so the refactor is scoped.
 */

import * as ts from "typescript"

import type {
  ComponentTreeV2,
  CvaExport,
  ImportDecl,
  PropsDecl,
  PropsPart,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import { ParserError } from "@/lib/parser/parser-error"

/**
 * Parse a shadcn source file into a `ComponentTreeV2`.
 *
 * Pillar 2a only handles Button. Any other file, or any Button-like file
 * with constructs we don't recognise, throws a `ParserError`.
 */
export function parseSource(
  source: string,
  filePath: string,
): ComponentTreeV2 {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
    ts.ScriptKind.TSX,
  )

  const ctx: ParserContext = { sourceFile, filePath, source }

  const imports: ImportDecl[] = []
  const cvaExports: CvaExport[] = []
  const subComponents: SubComponentV2[] = []
  const directives: string[] = []

  // Capture "use client" and similar top-level directives if present.
  // TypeScript parses them as string-literal expression statements at the top
  // of the file, not as ts.DirectivePrologue-level nodes.
  // (Button doesn't have one; the logic is here so 2b gets it for free.)
  for (const stmt of sourceFile.statements) {
    if (
      ts.isExpressionStatement(stmt) &&
      ts.isStringLiteral(stmt.expression) &&
      isDirectiveCandidate(stmt.expression.text)
    ) {
      directives.push(`"${stmt.expression.text}"`)
      continue
    }
    break // directives must be at the very top
  }

  // Walk top-level statements.
  for (const stmt of sourceFile.statements) {
    // Skip directives we already captured.
    if (
      ts.isExpressionStatement(stmt) &&
      ts.isStringLiteral(stmt.expression) &&
      isDirectiveCandidate(stmt.expression.text)
    ) {
      continue
    }

    if (ts.isImportDeclaration(stmt)) {
      imports.push(parseImport(stmt, ctx))
      continue
    }

    if (ts.isVariableStatement(stmt)) {
      const cva = tryParseCvaExport(stmt, ctx)
      if (cva) {
        cvaExports.push(cva)
        continue
      }
      throw parserError(
        stmt,
        ctx,
        "Top-level variable statement is not a recognised cva() export (Pillar 2a only handles cva).",
      )
    }

    if (ts.isFunctionDeclaration(stmt)) {
      subComponents.push(parseFunctionComponent(stmt, ctx, subComponents.length))
      continue
    }

    if (ts.isExportDeclaration(stmt)) {
      // `export { Button, buttonVariants }` — structurally fine, the exports
      // are already captured by the function/cva parsers above. Skip.
      continue
    }

    throw parserError(
      stmt,
      ctx,
      `Unhandled top-level statement (Pillar 2a scope): ${ts.SyntaxKind[stmt.kind]}`,
    )
  }

  return {
    name: subComponents[0]?.name ?? "Unknown",
    slug: slugFromFilePath(filePath),
    filePath,
    roundTripRisk: "handleable",
    customHandling: false,
    directives,
    filePassthrough: [],
    imports,
    cvaExports,
    contextExports: [],
    hookExports: [],
    subComponents,
    thirdParty: undefined,
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Internal: context + helpers
 * ══════════════════════════════════════════════════════════════════════════ */

interface ParserContext {
  sourceFile: ts.SourceFile
  filePath: string
  source: string
}

function parserError(
  node: ts.Node,
  ctx: ParserContext,
  reason: string,
): ParserError {
  const { line, character } = ctx.sourceFile.getLineAndCharacterOfPosition(
    node.getStart(ctx.sourceFile),
  )
  return new ParserError({
    filePath: ctx.filePath,
    line: line + 1,
    column: character + 1,
    reason,
    nodeKind: ts.SyntaxKind[node.kind],
  })
}

function isDirectiveCandidate(text: string): boolean {
  return text === "use client" || text === "use server" || text === "use strict"
}

function slugFromFilePath(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? ""
  return fileName.replace(/\.tsx?$/, "")
}

/** Convert a PascalCase component name to a kebab-case data-slot value. */
function toDataSlot(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/* ══════════════════════════════════════════════════════════════════════════
 * Imports
 * ══════════════════════════════════════════════════════════════════════════ */

function parseImport(
  node: ts.ImportDeclaration,
  ctx: ParserContext,
): ImportDecl {
  const moduleSpec = node.moduleSpecifier
  if (!ts.isStringLiteral(moduleSpec)) {
    throw parserError(node, ctx, "Import module specifier is not a string literal.")
  }
  const source = moduleSpec.text

  // Side-effect import: `import "./thing.css"`
  if (!node.importClause) {
    return { kind: "side-effect", source }
  }

  const clause = node.importClause

  // Namespace import: `import * as X from "..."`
  if (
    clause.namedBindings &&
    ts.isNamespaceImport(clause.namedBindings)
  ) {
    return {
      kind: "default-namespace",
      source,
      localName: clause.namedBindings.name.text,
      namespaceImport: true,
    }
  }

  // Default import: `import X from "..."`
  if (clause.name && !clause.namedBindings) {
    return {
      kind: "default-namespace",
      source,
      localName: clause.name.text,
      namespaceImport: false,
    }
  }

  // Named imports: `import { a, b, type C } from "..."`
  if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    const names: string[] = []
    const typeNames: string[] = []
    for (const el of clause.namedBindings.elements) {
      if (el.isTypeOnly) {
        typeNames.push(el.name.text)
      } else {
        names.push(el.name.text)
      }
    }
    return {
      kind: "named",
      source,
      names,
      ...(typeNames.length > 0 ? { typeNames } : {}),
    }
  }

  throw parserError(
    node,
    ctx,
    "Unsupported import shape (Pillar 2a handles side-effect, namespace, default, and named imports).",
  )
}

/* ══════════════════════════════════════════════════════════════════════════
 * cva export extraction
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Try to parse a `const fooVariants = cva(baseClasses, { variants, defaultVariants })`
 * statement. Returns null if this variable statement is not a cva call.
 */
function tryParseCvaExport(
  stmt: ts.VariableStatement,
  ctx: ParserContext,
): CvaExport | null {
  if (stmt.declarationList.declarations.length !== 1) return null
  const decl = stmt.declarationList.declarations[0]
  if (!ts.isIdentifier(decl.name)) return null
  if (!decl.initializer || !ts.isCallExpression(decl.initializer)) return null
  const call = decl.initializer
  if (!ts.isIdentifier(call.expression) || call.expression.text !== "cva") {
    return null
  }

  const name = decl.name.text

  // First argument: base classes (string literal).
  const [baseArg, configArg] = call.arguments
  if (!baseArg || !ts.isStringLiteral(baseArg)) {
    throw parserError(
      call,
      ctx,
      "cva() first argument must be a string literal (Pillar 2a scope).",
    )
  }
  const baseClasses = baseArg.text

  // Second argument: config object with `variants` and optional `defaultVariants`.
  if (!configArg || !ts.isObjectLiteralExpression(configArg)) {
    throw parserError(
      call,
      ctx,
      "cva() second argument must be an object literal (Pillar 2a scope).",
    )
  }

  const variants: Record<string, Record<string, string>> = {}
  let defaultVariants: Record<string, string> | undefined

  for (const prop of configArg.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      throw parserError(prop, ctx, "cva config property must be a plain assignment.")
    }
    const key = getPropertyName(prop, ctx)
    if (key === "variants") {
      if (!ts.isObjectLiteralExpression(prop.initializer)) {
        throw parserError(
          prop.initializer,
          ctx,
          "cva variants must be an object literal.",
        )
      }
      for (const groupProp of prop.initializer.properties) {
        if (!ts.isPropertyAssignment(groupProp)) {
          throw parserError(
            groupProp,
            ctx,
            "cva variant group must be a plain assignment.",
          )
        }
        const groupName = getPropertyName(groupProp, ctx)
        if (!ts.isObjectLiteralExpression(groupProp.initializer)) {
          throw parserError(
            groupProp.initializer,
            ctx,
            `cva variant group "${groupName}" must be an object literal.`,
          )
        }
        const groupMap: Record<string, string> = {}
        for (const valueProp of groupProp.initializer.properties) {
          if (!ts.isPropertyAssignment(valueProp)) {
            throw parserError(
              valueProp,
              ctx,
              `cva variant value in group "${groupName}" must be a plain assignment.`,
            )
          }
          const valueName = getPropertyName(valueProp, ctx)
          if (!ts.isStringLiteral(valueProp.initializer) && !ts.isNoSubstitutionTemplateLiteral(valueProp.initializer)) {
            throw parserError(
              valueProp.initializer,
              ctx,
              `cva variant value "${groupName}.${valueName}" must be a string literal.`,
            )
          }
          groupMap[valueName] = valueProp.initializer.text
        }
        variants[groupName] = groupMap
      }
    } else if (key === "defaultVariants") {
      if (!ts.isObjectLiteralExpression(prop.initializer)) {
        throw parserError(
          prop.initializer,
          ctx,
          "cva defaultVariants must be an object literal.",
        )
      }
      defaultVariants = {}
      for (const dvProp of prop.initializer.properties) {
        if (!ts.isPropertyAssignment(dvProp)) {
          throw parserError(
            dvProp,
            ctx,
            "cva defaultVariants property must be a plain assignment.",
          )
        }
        const dvKey = getPropertyName(dvProp, ctx)
        if (!ts.isStringLiteral(dvProp.initializer) && !ts.isNoSubstitutionTemplateLiteral(dvProp.initializer)) {
          throw parserError(
            dvProp.initializer,
            ctx,
            `cva defaultVariants.${dvKey} must be a string literal.`,
          )
        }
        defaultVariants[dvKey] = dvProp.initializer.text
      }
    } else if (key === "compoundVariants") {
      throw parserError(
        prop,
        ctx,
        "cva compoundVariants not yet supported (Pillar 2a scope).",
      )
    } else {
      throw parserError(prop, ctx, `Unknown cva config key "${key}".`)
    }
  }

  return {
    name,
    baseClasses,
    variants,
    ...(defaultVariants ? { defaultVariants } : {}),
    exported: true,
  }
}

function getPropertyName(
  prop: ts.PropertyAssignment,
  ctx: ParserContext,
): string {
  const name = prop.name
  if (ts.isIdentifier(name)) return name.text
  if (ts.isStringLiteral(name)) return name.text
  throw parserError(prop, ctx, "Property name must be an identifier or string literal.")
}

/* ══════════════════════════════════════════════════════════════════════════
 * Function component (Button)
 * ══════════════════════════════════════════════════════════════════════════ */

function parseFunctionComponent(
  node: ts.FunctionDeclaration,
  ctx: ParserContext,
  exportOrder: number,
): SubComponentV2 {
  if (!node.name) {
    throw parserError(node, ctx, "Function component must have a name.")
  }
  const name = node.name.text

  // Parse the single destructured param — `{ className, variant, size, asChild = false, ...props }: TypeAnnotation`
  if (node.parameters.length !== 1) {
    throw parserError(
      node,
      ctx,
      "Pillar 2a only handles single-param function components.",
    )
  }
  const param = node.parameters[0]
  if (!param.name || !ts.isObjectBindingPattern(param.name)) {
    throw parserError(
      param,
      ctx,
      "Pillar 2a only handles destructured object params.",
    )
  }
  if (!param.type) {
    throw parserError(param, ctx, "Param must have a type annotation.")
  }

  const propsDecl = parsePropsType(param.type, ctx)
  const inlineDefaults = collectInlineDefaults(param.name)

  // Parse the body: capture the `const Comp = ...` statement as passthrough,
  // then find the return statement with the JSX element.
  if (!node.body) {
    throw parserError(node, ctx, "Function component must have a body.")
  }
  const bodyStatements = node.body.statements

  const passthrough: SubComponentV2["passthrough"] = []
  let returnStmt: ts.ReturnStatement | null = null

  for (const bodyStmt of bodyStatements) {
    if (ts.isReturnStatement(bodyStmt)) {
      returnStmt = bodyStmt
      break
    }
    // Any non-return statement before the return goes into passthrough verbatim.
    passthrough.push({
      kind: "statement",
      source: bodyStmt.getText(ctx.sourceFile),
    })
  }

  if (!returnStmt || !returnStmt.expression) {
    throw parserError(node, ctx, "Function component body must return a JSX element.")
  }

  // Unwrap parenthesised JSX.
  let returnExpr: ts.Expression = returnStmt.expression
  while (ts.isParenthesizedExpression(returnExpr)) {
    returnExpr = returnExpr.expression
  }

  if (!ts.isJsxSelfClosingElement(returnExpr) && !ts.isJsxElement(returnExpr)) {
    throw parserError(
      returnExpr,
      ctx,
      "Function component must return a JSX element (Pillar 2a scope).",
    )
  }

  const rootPart = parseJsxElement(returnExpr, ctx)

  // Detect the cva variant strategy by looking at the className expression.
  // For Button, the className is `cn(buttonVariants({ variant, size, className }))`
  // so the ClassNameExpr will be kind=cn-call with a cva-call inside. We want
  // to surface the strategy as `cva` regardless. Scan the part's className
  // tree for a `cva-call` kind.
  const variantStrategy: SubComponentV2["variantStrategy"] = (() => {
    const ref = findCvaRefInClassName(rootPart.className)
    if (ref) return { kind: "cva", cvaRef: ref }
    return { kind: "none" }
  })()

  // Detect data-slot attribute on the root part (structured field), then
  // remove it from the generic attributes map since it's promoted.
  const dataSlot =
    rootPart.dataSlot ?? toDataSlot(name)

  return {
    name,
    dataSlot,
    exportOrder,
    isDefaultExport: false, // Pillar 2a: shadcn uses named exports
    jsdoc: null,
    propsDecl: mergeInlineDefaults(propsDecl, inlineDefaults),
    variantStrategy,
    passthrough,
    parts: {
      root: rootPart,
    },
  }
}

/**
 * Collect default values from the destructured param pattern.
 * For `{ variant = "default", asChild = false }` returns a map of
 * name → default value source.
 */
function collectInlineDefaults(
  pattern: ts.ObjectBindingPattern,
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const el of pattern.elements) {
    if (!ts.isIdentifier(el.name)) continue
    if (el.initializer) {
      defaults[el.name.text] = el.initializer.getText()
    }
  }
  return defaults
}

/**
 * After parsing the TypeScript type annotation, fold the destructuring defaults
 * back into the corresponding inline InlineProperty entries (the PropsDecl
 * captures the type; destructuring captures the default value).
 */
function mergeInlineDefaults(
  propsDecl: PropsDecl,
  defaults: Record<string, string>,
): PropsDecl {
  if (propsDecl.kind !== "intersection") return propsDecl
  return {
    kind: "intersection",
    parts: propsDecl.parts.map((p) => {
      if (p.kind !== "inline") return p
      return {
        kind: "inline",
        properties: p.properties.map((ip) => {
          const defaultValue = defaults[ip.name]
          if (defaultValue !== undefined) {
            return { ...ip, defaultValue }
          }
          return ip
        }),
      }
    }),
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Props type annotation
 * ══════════════════════════════════════════════════════════════════════════ */

function parsePropsType(type: ts.TypeNode, ctx: ParserContext): PropsDecl {
  if (ts.isIntersectionTypeNode(type)) {
    const parts: PropsPart[] = type.types.map((t) => parsePropsPart(t, ctx))
    return { kind: "intersection", parts }
  }
  return { kind: "single", part: parsePropsPart(type, ctx) }
}

function parsePropsPart(type: ts.TypeNode, ctx: ParserContext): PropsPart {
  // React.ComponentProps<"button"> or React.ComponentProps<typeof X>
  if (ts.isTypeReferenceNode(type) && type.typeArguments?.length === 1) {
    const typeName = type.typeName.getText(ctx.sourceFile)
    if (typeName === "React.ComponentProps" || typeName === "ComponentProps") {
      const arg = type.typeArguments[0]
      if (ts.isLiteralTypeNode(arg) && ts.isStringLiteral(arg.literal)) {
        return { kind: "component-props", target: arg.literal.text }
      }
      if (ts.isTypeQueryNode(arg)) {
        return {
          kind: "component-props-of",
          targetExpr: arg.getText(ctx.sourceFile),
        }
      }
    }
    // VariantProps<typeof buttonVariants>
    if (typeName === "VariantProps") {
      const arg = type.typeArguments[0]
      if (ts.isTypeQueryNode(arg) && ts.isIdentifier(arg.exprName)) {
        return { kind: "variant-props", cvaRef: arg.exprName.text }
      }
      return {
        kind: "passthrough",
        source: type.getText(ctx.sourceFile),
      }
    }
  }

  // Inline `{ asChild?: boolean }` type literal.
  if (ts.isTypeLiteralNode(type)) {
    const properties = type.members.map((m) => {
      if (!ts.isPropertySignature(m) || !m.name || !ts.isIdentifier(m.name)) {
        throw parserError(
          m,
          ctx,
          "Pillar 2a only handles identifier-named property signatures in inline prop types.",
        )
      }
      if (!m.type) {
        throw parserError(m, ctx, "Inline prop must have a type annotation.")
      }
      return {
        name: m.name.text,
        type: m.type.getText(ctx.sourceFile),
        optional: !!m.questionToken,
      }
    })
    return { kind: "inline", properties }
  }

  return {
    kind: "passthrough",
    source: type.getText(ctx.sourceFile),
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * JSX walker
 * ══════════════════════════════════════════════════════════════════════════ */

function parseJsxElement(
  node: ts.JsxSelfClosingElement | ts.JsxElement,
  ctx: ParserContext,
): SubComponentV2["parts"]["root"] {
  const opening = ts.isJsxSelfClosingElement(node) ? node : node.openingElement

  const tagName = opening.tagName.getText(ctx.sourceFile)
  const base = resolveBase(tagName, ctx, opening)

  const attributes: Record<string, string> = {}
  let className: SubComponentV2["parts"]["root"]["className"] = {
    kind: "literal",
    value: "",
  }
  let dataSlot: string | undefined
  let propsSpread = false
  let asChild = false

  for (const attr of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attr)) {
      // Only `{...props}` is supported in 2a.
      if (
        ts.isIdentifier(attr.expression) &&
        attr.expression.text === "props"
      ) {
        propsSpread = true
        continue
      }
      throw parserError(
        attr,
        ctx,
        "Pillar 2a only handles `{...props}` spreads.",
      )
    }
    if (!ts.isIdentifier(attr.name)) {
      // e.g. namespaced attributes — Button doesn't use them.
      throw parserError(
        attr,
        ctx,
        "Pillar 2a only handles identifier-named JSX attributes.",
      )
    }
    const attrName = attr.name.text

    if (attrName === "className") {
      className = parseClassNameAttribute(attr, ctx)
      continue
    }
    if (attrName === "data-slot") {
      const value = getJsxStringAttributeValue(attr, ctx)
      if (value !== null) {
        dataSlot = value
        continue
      }
    }
    if (attrName === "asChild") {
      // `asChild` without a value is equivalent to `asChild={true}`.
      if (!attr.initializer) {
        asChild = true
        continue
      }
    }

    // Fallback: store the attribute's raw source (expression or string) as
    // an entry in `attributes`.
    attributes[attrName] = getJsxAttributeRawValue(attr, ctx)
  }

  // Only self-closing elements have no children. `ts.JsxElement` has children,
  // but for 2a (Button) the element is self-closing. Reject with a helpful
  // error if we see children.
  if (ts.isJsxElement(node) && node.children.length > 0) {
    // Filter out whitespace-only JsxText.
    const meaningful = node.children.filter((c) => {
      if (ts.isJsxText(c)) return c.text.trim().length > 0
      return true
    })
    if (meaningful.length > 0) {
      throw parserError(
        node,
        ctx,
        "Pillar 2a does not yet handle JSX children (Button is self-closing).",
      )
    }
  }

  return {
    base,
    ...(dataSlot !== undefined ? { dataSlot } : {}),
    className,
    propsSpread,
    attributes,
    asChild,
    children: [],
  }
}

/**
 * Given the tag name source (e.g. "Comp", "button", "Slot.Root"), figure out
 * what kind of Base this element is. Pillar 2a recognises:
 *  - lowercase single-word → html tag
 *  - identifier referring to a local variable (dynamic-ref)
 *  - qualified name like `Namespace.Name` → unsupported in 2a
 */
function resolveBase(
  tagName: string,
  ctx: ParserContext,
  node: ts.Node,
): SubComponentV2["parts"]["root"]["base"] {
  // HTML tag: all-lowercase single identifier.
  if (/^[a-z][a-z0-9-]*$/.test(tagName)) {
    return { kind: "html", tag: tagName }
  }
  // Single-identifier PascalCase → assume local dynamic-ref for 2a.
  // Button uses `const Comp = ...; return <Comp ... />` so `Comp` is our only
  // case here. Any other identifier will be flagged in 2b or later when
  // Radix-primitive detection lands.
  if (/^[A-Z][A-Za-z0-9_]*$/.test(tagName)) {
    return { kind: "dynamic-ref", localName: tagName }
  }
  throw parserError(
    node,
    ctx,
    `Pillar 2a does not yet handle qualified or complex tag names: "${tagName}"`,
  )
}

function parseClassNameAttribute(
  attr: ts.JsxAttribute,
  ctx: ParserContext,
): SubComponentV2["parts"]["root"]["className"] {
  if (!attr.initializer) {
    return { kind: "literal", value: "" }
  }
  // `className="foo"`
  if (ts.isStringLiteral(attr.initializer)) {
    return { kind: "literal", value: attr.initializer.text }
  }
  // `className={...}`
  if (
    ts.isJsxExpression(attr.initializer) &&
    attr.initializer.expression !== undefined
  ) {
    const expr = attr.initializer.expression
    // cn(...) call
    if (
      ts.isCallExpression(expr) &&
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === "cn"
    ) {
      // Inside cn(), we look for a cva call — `cn(buttonVariants({ variant, size, className }))`.
      const firstArg = expr.arguments[0]
      if (
        firstArg &&
        ts.isCallExpression(firstArg) &&
        ts.isIdentifier(firstArg.expression)
      ) {
        const cvaRef = firstArg.expression.text
        const cvaArg = firstArg.arguments[0]
        if (cvaArg && ts.isObjectLiteralExpression(cvaArg)) {
          const args: string[] = []
          for (const p of cvaArg.properties) {
            if (ts.isShorthandPropertyAssignment(p)) {
              args.push(p.name.text)
            } else if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
              args.push(p.name.text)
            }
          }
          return { kind: "cva-call", cvaRef, args }
        }
      }
      // Plain cn(...) with unstructured args → capture argument sources verbatim.
      return {
        kind: "cn-call",
        args: expr.arguments.map((a) => a.getText(ctx.sourceFile)),
      }
    }
    // Bare cva call: `className={buttonVariants({ variant, size, className })}`
    if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
      const cvaRef = expr.expression.text
      const cvaArg = expr.arguments[0]
      if (cvaArg && ts.isObjectLiteralExpression(cvaArg)) {
        const args: string[] = []
        for (const p of cvaArg.properties) {
          if (ts.isShorthandPropertyAssignment(p)) {
            args.push(p.name.text)
          } else if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
            args.push(p.name.text)
          }
        }
        return { kind: "cva-call", cvaRef, args }
      }
    }
    return { kind: "passthrough", source: expr.getText(ctx.sourceFile) }
  }
  return { kind: "literal", value: "" }
}

function getJsxStringAttributeValue(
  attr: ts.JsxAttribute,
  _ctx: ParserContext,
): string | null {
  if (!attr.initializer) return null
  if (ts.isStringLiteral(attr.initializer)) {
    return attr.initializer.text
  }
  return null
}

function getJsxAttributeRawValue(
  attr: ts.JsxAttribute,
  ctx: ParserContext,
): string {
  if (!attr.initializer) return "true"
  if (ts.isStringLiteral(attr.initializer)) {
    return `"${attr.initializer.text}"`
  }
  if (
    ts.isJsxExpression(attr.initializer) &&
    attr.initializer.expression !== undefined
  ) {
    return `{${attr.initializer.expression.getText(ctx.sourceFile)}}`
  }
  return ""
}

function findCvaRefInClassName(
  expr: SubComponentV2["parts"]["root"]["className"],
): string | null {
  if (expr.kind === "cva-call") return expr.cvaRef
  if (expr.kind === "cn-call") {
    // Look for the first cva-call-shaped argument. This is a best-effort
    // scan — we only have raw source strings here, so we use a simple
    // heuristic: find an identifier followed by `(` that ends in `Variants`.
    for (const arg of expr.args) {
      const match = arg.match(/([a-zA-Z_][a-zA-Z0-9_]*Variants)\s*\(/)
      if (match) return match[1]
    }
  }
  return null
}
