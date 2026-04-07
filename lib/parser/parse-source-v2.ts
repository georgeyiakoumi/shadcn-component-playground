/**
 * shadcn-source-to-ComponentTreeV2 parser.
 *
 * Covered scope as of Pillar 2b (easy bucket — GEO-296):
 * - All 14 easy-bucket components (AspectRatio, Badge, Checkbox, Collapsible,
 *   HoverCard, Input, Label, Progress, RadioGroup, Separator, Skeleton,
 *   Sonner, Switch, Textarea, Tooltip) plus Button (2a) and anything else
 *   that happens to fit the same code paths (Card).
 * - Radix primitives via the `radix-ui` umbrella package pattern:
 *   `import { X as XPrimitive } from "radix-ui"` + `<XPrimitive.Root>`.
 * - JSX children (self-closing, element with children, nested elements).
 * - Component-ref bases (`<CheckIcon />` from lucide-react).
 * - Arrow function components (`const Foo = (...) => ...`) used by Sonner.
 * - Inline `style={{...}}` attributes captured as raw attribute source.
 * - Third-party library adapters (sonner is the first real use).
 *
 * Still out of scope (future pillars):
 * - Medium/hard bucket components (Pillar 2c/2d)
 * - Escape-hatch components (Pillar 2e)
 * - The generator (Pillar 3)
 *
 * Design doc: https://www.notion.so/33bfeeb2a07881a9b24fee494b4d4d71
 * Linear: GEO-295 (2a), GEO-296 (2b)
 *
 * AST library decision: TypeScript compiler API. Zero new dependencies,
 * native TSX, printer covers Pillar 3's generator needs. Contained in
 * `lib/parser/` so the refactor to Babel is scoped if we ever need it.
 */

import * as ts from "typescript"

import type {
  Base,
  ComponentTreeV2,
  CvaExport,
  ImportDecl,
  LibraryId,
  PartChild,
  PartNode,
  PropsDecl,
  PropsPart,
  SubComponentV2,
  ThirdPartyIntegration,
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

  const ctx: ParserContext = {
    sourceFile,
    filePath,
    source,
    radixAliases: new Map(),
    thirdPartyAliases: new Map(),
    componentRefs: new Set(),
    thirdParty: undefined,
    localComponentNames: new Set(),
    localContextNames: new Set(),
  }

  // Pre-scan: collect top-level identifier names so the JSX walker can
  // disambiguate `<LocalFoo />` (component-ref) from `<ImportedFoo />`
  // (dynamic-ref). Also surfaces React.createContext names so qualified
  // `<CtxName.Provider>` JSX tags can be resolved as local context provider
  // references rather than unknown namespaces.
  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      ctx.localComponentNames.add(stmt.name.text)
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        ctx.localComponentNames.add(decl.name.text)
        if (
          decl.initializer &&
          ts.isCallExpression(decl.initializer) &&
          isReactCreateContextCall(decl.initializer)
        ) {
          ctx.localContextNames.add(decl.name.text)
        }
      }
    }
  }

  const imports: ImportDecl[] = []
  const cvaExports: CvaExport[] = []
  const contextExports: ComponentTreeV2["contextExports"] = []
  const hookExports: ComponentTreeV2["hookExports"] = []
  const subComponents: SubComponentV2[] = []
  const directives: string[] = []
  const filePassthrough: ComponentTreeV2["filePassthrough"] = []

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
      const decl = parseImport(stmt, ctx)
      imports.push(decl)
      collectImportContext(decl, ctx)
      continue
    }

    if (ts.isVariableStatement(stmt)) {
      // Four kinds of top-level `const` we recognise:
      // (a) `const fooVariants = cva(...)` → cva export
      // (b) `const Foo = (...) => <JSX />` → arrow-function component
      // (c) `const FooContext = React.createContext<T>(default)` → context export
      // (d) anything else → error
      const cva = tryParseCvaExport(stmt, ctx)
      if (cva) {
        cvaExports.push(cva)
        continue
      }
      const arrowComponent = tryParseArrowFunctionComponent(
        stmt,
        ctx,
        subComponents.length,
      )
      if (arrowComponent) {
        subComponents.push(arrowComponent)
        continue
      }
      const contextExport = tryParseContextExport(stmt, ctx)
      if (contextExport) {
        contextExports.push(contextExport)
        continue
      }
      throw parserError(
        stmt,
        ctx,
        "Top-level variable statement is neither a cva() export, arrow-function component, nor React.createContext.",
      )
    }

    if (ts.isFunctionDeclaration(stmt)) {
      // Hook exports: function names starting with `use` followed by an
      // uppercase letter are captured as `hookExports[]` rather than
      // treated as React components. Carousel's `useCarousel` is the
      // canonical example.
      if (stmt.name && /^use[A-Z]/.test(stmt.name.text)) {
        hookExports.push({
          name: stmt.name.text,
          bodySource: stmt.getText(ctx.sourceFile),
        })
        continue
      }
      subComponents.push(parseFunctionComponent(stmt, ctx, subComponents.length))
      continue
    }

    if (ts.isExportDeclaration(stmt)) {
      // `export { Button, buttonVariants }` — structurally fine, the exports
      // are already captured by the function/cva parsers above. Skip.
      continue
    }

    if (ts.isTypeAliasDeclaration(stmt) || ts.isInterfaceDeclaration(stmt)) {
      // Top-level `type Foo = ...` or `interface Foo {}`. Capture verbatim
      // so the generator re-emits it in place. Carousel and Pagination
      // use this shape (Carousel for embla API props, Pagination for its
      // own link props type).
      filePassthrough.push({
        kind: "type-alias",
        source: stmt.getText(ctx.sourceFile),
      })
      continue
    }

    throw parserError(
      stmt,
      ctx,
      `Unhandled top-level statement: ${ts.SyntaxKind[stmt.kind]}`,
    )
  }

  return {
    name: subComponents[0]?.name ?? "Unknown",
    slug: slugFromFilePath(filePath),
    filePath,
    roundTripRisk: "handleable",
    customHandling: false,
    directives,
    filePassthrough,
    imports,
    cvaExports,
    contextExports,
    hookExports,
    subComponents,
    thirdParty: ctx.thirdParty,
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Import context collection
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Map of third-party package name → `LibraryId`. Only closed-enum libraries
 * from Pillar 1 D6 are listed; anything else stays generic.
 */
const KNOWN_LIBRARIES: Record<string, LibraryId> = {
  "radix-ui": "radix-ui",
  "react-day-picker": "react-day-picker",
  cmdk: "cmdk",
  vaul: "vaul",
  "embla-carousel-react": "embla-carousel-react",
  sonner: "sonner",
  "react-resizable-panels": "react-resizable-panels",
  "input-otp": "input-otp",
}

/**
 * Known packages whose named imports are treated as `component-ref` bases
 * when they appear as JSX tags. lucide-react is the only one in scope for 2b.
 */
const COMPONENT_REF_PACKAGES = new Set<string>([
  "lucide-react",
  "next-themes", // hooks, not components; harmless to include here
])

/**
 * After an import is parsed, update the context with any side-effects:
 * - Radix alias map (`import { X as XPrimitive } from "radix-ui"`)
 * - Third-party alias map (cmdk / vaul / react-resizable-panels / embla etc.)
 * - Component-ref set (lucide-react icons, cross-component refs from
 *   `@/components/ui/...`, sonner's `Toaster as Sonner`, etc.)
 * - Third-party library detection (populates `ctx.thirdParty`)
 */
function collectImportContext(decl: ImportDecl, ctx: ParserContext): void {
  // Library detection for the top-level `thirdParty` field.
  if (decl.kind === "named" || decl.kind === "default-namespace") {
    const libId = KNOWN_LIBRARIES[decl.source]
    if (libId !== undefined && libId !== "radix-ui") {
      // radix-ui is infrastructure, not a "third-party integration" we surface
      // on the tree. sonner/vaul/cmdk/etc. we do.
      if (ctx.thirdParty === undefined) {
        ctx.thirdParty = { library: libId }
      }
    }
  }

  // Namespace imports: `import * as ResizablePrimitive from "react-resizable-panels"`.
  // The local name becomes a third-party alias pointing at the library id.
  if (decl.kind === "default-namespace" && decl.namespaceImport) {
    const libId = KNOWN_LIBRARIES[decl.source]
    if (libId !== undefined && libId !== "radix-ui") {
      ctx.thirdPartyAliases.set(decl.localName, libId)
    }
    return
  }

  if (decl.kind !== "named") return

  // Named imports from radix-ui: extract per-specifier aliases by re-walking
  // the AST (our ImportDecl only stores local names, we need the original
  // names too).
  if (decl.source === "radix-ui") {
    populateAliasMap(ctx, "radix-ui", ctx.radixAliases)
    return
  }

  // Named imports from known non-radix third-party libraries. Same shape as
  // radix: `import { Drawer as DrawerPrimitive } from "vaul"` →
  // aliases['DrawerPrimitive'] = 'vaul'.
  const libId = KNOWN_LIBRARIES[decl.source]
  if (libId !== undefined && libId !== "radix-ui") {
    for (const local of decl.names) {
      ctx.thirdPartyAliases.set(local, libId)
    }
    // sonner has a `<Sonner />` JSX usage (not qualified), so also add the
    // local names as component-refs so the JSX walker finds them.
    for (const local of decl.names) {
      ctx.componentRefs.add(local)
    }
    return
  }

  // Component-ref packages (lucide-react, next-themes): every named import
  // becomes a known component-ref.
  if (COMPONENT_REF_PACKAGES.has(decl.source)) {
    for (const name of decl.names) {
      ctx.componentRefs.add(name)
    }
    return
  }

  // Cross-component refs: `import { Dialog, DialogContent } from "@/components/ui/dialog"`.
  // These become component-refs — the JSX walker will emit
  // `{ kind: 'component-ref', name }` when it sees them.
  if (decl.source.startsWith("@/components/ui/")) {
    for (const name of decl.names) {
      ctx.componentRefs.add(name)
    }
    return
  }
}

/**
 * Walk the raw AST to populate an alias map. Our `ImportDecl` loses the
 * `propertyName` (the "X" in `{ X as Y }`), so we re-walk the source file
 * to collect it for a given module specifier.
 */
function populateAliasMap(
  ctx: ParserContext,
  moduleSpec: string,
  target: Map<string, string>,
): void {
  for (const stmt of ctx.sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue
    if (
      !ts.isStringLiteral(stmt.moduleSpecifier) ||
      stmt.moduleSpecifier.text !== moduleSpec
    ) {
      continue
    }
    const bindings = stmt.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    for (const el of bindings.elements) {
      const localName = el.name.text
      const originalName = el.propertyName?.text ?? el.name.text
      target.set(localName, originalName)
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Internal: context + helpers
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Shared context threaded through every walker. Collects import-level
 * metadata up-front so individual JSX walkers can disambiguate tag names
 * without re-scanning the imports on every element.
 */
interface ParserContext {
  sourceFile: ts.SourceFile
  filePath: string
  source: string
  /**
   * Map of local identifier → radix-ui primitive name. Populated from
   * `import { Accordion as AccordionPrimitive } from "radix-ui"` —
   * `AccordionPrimitive` is the key, `"Accordion"` is the value. When the
   * JSX walker sees `<AccordionPrimitive.Root>` it looks up the key and
   * emits `{ kind: 'radix', primitive: 'Accordion', part: 'Root' }`.
   */
  radixAliases: Map<string, string>
  /**
   * Map of local identifier → third-party `LibraryId`. Populated from
   * default/namespace imports of known libraries. When the JSX walker sees
   * `<CommandPrimitive.Input>` and `CommandPrimitive` is in this map, it
   * emits `{ kind: 'third-party', library: 'cmdk', component: 'Input' }`.
   */
  thirdPartyAliases: Map<string, LibraryId>
  /**
   * Known component-ref names — identifiers imported from third-party packages
   * that appear as JSX tags but aren't Radix (e.g. `CheckIcon`, `CircleIcon`
   * from lucide-react, `Loader2Icon` from lucide-react, or `Sonner` from
   * `sonner`). When the JSX walker sees `<CheckIcon />` and the name is in
   * this set, it emits `{ kind: 'component-ref', name: 'CheckIcon' }`.
   */
  componentRefs: Set<string>
  /**
   * Detected third-party library integration (e.g. `sonner`, `cmdk`, `vaul`).
   * Set at most once per file. Populated when an import from a known library
   * is seen. Surfaced on the output tree's `thirdParty` field.
   */
  thirdParty: ThirdPartyIntegration | undefined
  /**
   * Set of top-level function/arrow-component/cva names defined in this
   * file. Populated by a first pass over the statements before statement
   * walking begins. When the JSX walker sees `<NavigationMenuViewport />`
   * inside `NavigationMenu`, it finds the name in this set and resolves it
   * as `{ kind: 'component-ref', name: '...' }` rather than falling through
   * to the `dynamic-ref` path.
   */
  localComponentNames: Set<string>
  /**
   * Set of top-level identifiers that were created via `React.createContext`.
   * When the JSX walker sees `<CarouselContext.Provider>` it checks this set
   * to disambiguate "qualified JSX tag that is a local React context" from
   * "qualified JSX tag that is a radix/third-party namespace".
   */
  localContextNames: Set<string>
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

  // Second argument is optional: when cva is called with just a base class
  // string and no config, the component has no variants.
  // `navigationMenuTriggerStyle` in NavigationMenu is the canonical example.
  if (!configArg) {
    return {
      name,
      baseClasses,
      variants: {},
      exported: true,
    }
  }
  if (!ts.isObjectLiteralExpression(configArg)) {
    throw parserError(
      call,
      ctx,
      "cva() second argument must be an object literal when present.",
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
 * React.createContext extraction
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Matches a `React.createContext<T>(defaultValue)` call expression.
 * Carousel and ToggleGroup use this shape; the parser picks it up in the
 * top-level pre-scan (to populate `ctx.localContextNames`) and the main
 * walker converts each into a `ContextExport` entry.
 */
function isReactCreateContextCall(expr: ts.CallExpression): boolean {
  // React.createContext(...) — property access on an identifier.
  if (ts.isPropertyAccessExpression(expr.expression)) {
    const access = expr.expression
    if (
      ts.isIdentifier(access.expression) &&
      access.expression.text === "React" &&
      ts.isIdentifier(access.name) &&
      access.name.text === "createContext"
    ) {
      return true
    }
  }
  // Bare `createContext(...)` — named import.
  if (
    ts.isIdentifier(expr.expression) &&
    expr.expression.text === "createContext"
  ) {
    return true
  }
  return false
}

/**
 * Try to parse a `const FooContext = React.createContext<T>(default)`
 * top-level variable statement. Returns null if the shape doesn't match.
 */
function tryParseContextExport(
  stmt: ts.VariableStatement,
  ctx: ParserContext,
): ComponentTreeV2["contextExports"][number] | null {
  if (stmt.declarationList.declarations.length !== 1) return null
  const decl = stmt.declarationList.declarations[0]
  if (!ts.isIdentifier(decl.name)) return null
  if (!decl.initializer || !ts.isCallExpression(decl.initializer)) return null
  const call = decl.initializer
  if (!isReactCreateContextCall(call)) return null

  const name = decl.name.text
  const typeArg = call.typeArguments?.[0]
  const defaultArg = call.arguments[0]

  return {
    name,
    typeArgSource: typeArg ? typeArg.getText(ctx.sourceFile) : "",
    defaultValueSource: defaultArg ? defaultArg.getText(ctx.sourceFile) : "",
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * Function components (function declarations + arrow functions)
 * ══════════════════════════════════════════════════════════════════════════ */

function parseFunctionComponent(
  node: ts.FunctionDeclaration,
  ctx: ParserContext,
  exportOrder: number,
): SubComponentV2 {
  if (!node.name) {
    throw parserError(node, ctx, "Function component must have a name.")
  }
  return buildSubComponent({
    name: node.name.text,
    parameters: node.parameters,
    body: node.body,
    ctx,
    exportOrder,
    node,
  })
}

/**
 * Try to parse `const Toaster = (...) => <JSX />` as a sub-component.
 * Returns null if the variable statement isn't an arrow function component.
 * Sonner is the only file in the easy bucket that uses this shape.
 */
function tryParseArrowFunctionComponent(
  stmt: ts.VariableStatement,
  ctx: ParserContext,
  exportOrder: number,
): SubComponentV2 | null {
  if (stmt.declarationList.declarations.length !== 1) return null
  const decl = stmt.declarationList.declarations[0]
  if (!ts.isIdentifier(decl.name)) return null
  if (!decl.initializer || !ts.isArrowFunction(decl.initializer)) return null
  const arrow = decl.initializer

  // Arrow body: either a block statement (`() => { return <JSX /> }`) or an
  // expression (`() => <JSX />`). We need it to be a block so we can walk
  // passthrough statements.
  if (!ts.isBlock(arrow.body)) {
    // Expression body — wrap the returned JSX directly with no passthrough.
    // None of the easy bucket uses this shape, but support it cheaply.
    const expr = arrow.body
    if (!ts.isJsxElement(expr) && !ts.isJsxSelfClosingElement(expr)) {
      return null
    }
    return buildSubComponent({
      name: decl.name.text,
      parameters: arrow.parameters,
      body: ts.factory.createBlock([ts.factory.createReturnStatement(expr)], true),
      ctx,
      exportOrder,
      node: arrow,
    })
  }

  return buildSubComponent({
    name: decl.name.text,
    parameters: arrow.parameters,
    body: arrow.body,
    ctx,
    exportOrder,
    node: arrow,
  })
}

interface BuildSubComponentArgs {
  name: string
  parameters: ts.NodeArray<ts.ParameterDeclaration>
  body: ts.Block | undefined
  ctx: ParserContext
  exportOrder: number
  /** The original AST node, for error reporting. */
  node: ts.Node
}

function buildSubComponent(args: BuildSubComponentArgs): SubComponentV2 {
  const { name, parameters, body, ctx, exportOrder, node } = args

  if (parameters.length !== 1) {
    throw parserError(
      node,
      ctx,
      "Only single-param function components are supported.",
    )
  }
  const param = parameters[0]
  if (!param.name || !ts.isObjectBindingPattern(param.name)) {
    throw parserError(
      param,
      ctx,
      "Only destructured object params are supported.",
    )
  }
  if (!param.type) {
    throw parserError(param, ctx, "Param must have a type annotation.")
  }

  const propsDecl = parsePropsType(param.type, ctx)
  const inlineDefaults = collectInlineDefaults(param.name)

  if (!body) {
    throw parserError(node, ctx, "Function component must have a body.")
  }
  const bodyStatements = body.statements

  const passthrough: SubComponentV2["passthrough"] = []
  let returnStmt: ts.ReturnStatement | null = null

  for (const bodyStmt of bodyStatements) {
    if (ts.isReturnStatement(bodyStmt)) {
      returnStmt = bodyStmt
      break
    }
    // Non-return statements before the return go into passthrough verbatim.
    // Examples: `const Comp = asChild ? Slot.Root : "button"`,
    // `const { theme = "system" } = useTheme()` (Sonner).
    passthrough.push({
      kind: "statement",
      source: bodyStmt.getText(ctx.sourceFile),
    })
  }

  if (!returnStmt || !returnStmt.expression) {
    throw parserError(node, ctx, "Function component body must return a JSX element.")
  }

  let returnExpr: ts.Expression = returnStmt.expression
  while (ts.isParenthesizedExpression(returnExpr)) {
    returnExpr = returnExpr.expression
  }

  if (!ts.isJsxSelfClosingElement(returnExpr) && !ts.isJsxElement(returnExpr)) {
    throw parserError(
      returnExpr,
      ctx,
      "Function component must return a JSX element.",
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
  node: ts.JsxSelfClosingElement | ts.JsxElement | ts.JsxFragment,
  ctx: ParserContext,
): PartNode {
  if (ts.isJsxFragment(node)) {
    throw parserError(
      node,
      ctx,
      "JSX fragments not yet supported (none of the easy bucket uses them).",
    )
  }

  const opening = ts.isJsxSelfClosingElement(node) ? node : node.openingElement

  const tagName = opening.tagName.getText(ctx.sourceFile)
  const base = resolveBase(tagName, ctx, opening)

  const attributes: Record<string, string> = {}
  let className: PartNode["className"] = {
    kind: "literal",
    value: "",
  }
  let dataSlot: string | undefined
  let propsSpread = false
  let asChild = false

  for (const attr of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attr)) {
      // Only `{...props}` is supported — shadcn's convention. Any other
      // spread target would require tracking the identifier back to its
      // declaration, which we'll do if a later bucket needs it.
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
        "Only `{...props}` spreads are supported.",
      )
    }
    if (!ts.isIdentifier(attr.name)) {
      throw parserError(
        attr,
        ctx,
        "Only identifier-named JSX attributes are supported.",
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

  // Walk children for JsxElement; self-closing elements have none.
  const children: PartChild[] = ts.isJsxElement(node)
    ? parseJsxChildren(node.children, ctx)
    : []

  return {
    base,
    ...(dataSlot !== undefined ? { dataSlot } : {}),
    className,
    propsSpread,
    attributes,
    asChild,
    children,
  }
}

/**
 * Walk a JsxElement's children array and produce `PartChild` entries.
 * Whitespace-only `JsxText` nodes are dropped (they're not meaningful for
 * the structured editor; the generator will reintroduce reasonable whitespace).
 */
function parseJsxChildren(
  children: readonly ts.JsxChild[],
  ctx: ParserContext,
): PartChild[] {
  const out: PartChild[] = []
  for (const child of children) {
    if (ts.isJsxText(child)) {
      const trimmed = child.text.trim()
      if (trimmed.length === 0) continue
      out.push({ kind: "text", value: trimmed })
      continue
    }
    if (ts.isJsxExpression(child)) {
      // Empty expression `{}` — skip.
      if (!child.expression) continue
      out.push({
        kind: "expression",
        source: child.expression.getText(ctx.sourceFile),
      })
      continue
    }
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      out.push({ kind: "part", part: parseJsxElement(child, ctx) })
      continue
    }
    // JsxText we filtered, JsxExpression we handled, the element kinds too,
    // so anything left is a future TS feature (e.g. JsxOpeningFragment).
    // Surface it as a passthrough so we don't crash.
    out.push({
      kind: "passthrough",
      passthrough: {
        kind: "raw",
        source: (child as ts.Node).getText(ctx.sourceFile),
      },
    })
  }
  return out
}

/**
 * Given the JSX tag name source (e.g. "Comp", "button", "Slot.Root",
 * "AccordionPrimitive.Root"), figure out what kind of Base this element is.
 *
 * Recognised in 2a + 2b:
 *  - lowercase single word → HTML tag
 *  - qualified `X.Y` where X is a radix-ui alias → Radix primitive part
 *  - qualified `Slot.Root` (radix-ui umbrella, no alias) → Radix primitive
 *  - single identifier that's a known component-ref → component-ref base
 *  - single identifier otherwise → dynamic-ref (local variable, like Button's
 *    `const Comp = ...`)
 */
function resolveBase(
  tagName: string,
  ctx: ParserContext,
  node: ts.Node,
): Base {
  // HTML tag: all-lowercase single identifier.
  if (/^[a-z][a-z0-9-]*$/.test(tagName)) {
    return { kind: "html", tag: tagName }
  }

  // Qualified tag: `Namespace.Part` (or deeper, but shadcn only uses 2 levels).
  if (tagName.includes(".")) {
    const [namespace, ...parts] = tagName.split(".")
    const part = parts.join(".")
    // First try the radix aliases map (most common case).
    const primitive = ctx.radixAliases.get(namespace)
    if (primitive !== undefined) {
      return { kind: "radix", primitive, part }
    }
    // Then try the third-party aliases map (vaul, cmdk, react-resizable-panels,
    // embla-carousel-react, react-day-picker, etc.).
    const libId = ctx.thirdPartyAliases.get(namespace)
    if (libId !== undefined) {
      return { kind: "third-party", library: libId, component: part }
    }
    // Local React context provider/consumer: `<CarouselContext.Provider>`
    // where `CarouselContext = React.createContext(...)` is defined in this
    // file. We emit as `dynamic-ref` with the qualified name as localName so
    // the generator round-trips it verbatim without needing a new Base kind.
    if (ctx.localContextNames.has(namespace)) {
      return { kind: "dynamic-ref", localName: tagName }
    }
    throw parserError(
      node,
      ctx,
      `Qualified JSX tag "${tagName}" does not resolve to a known radix-ui primitive, third-party library namespace, or local React context.`,
    )
  }

  // Single identifier.
  if (/^[A-Z][A-Za-z0-9_]*$/.test(tagName)) {
    if (ctx.componentRefs.has(tagName)) {
      return { kind: "component-ref", name: tagName }
    }
    // Local components defined in this same file (e.g. NavigationMenu's
    // `<NavigationMenuViewport />` appearing inside `NavigationMenu`).
    if (ctx.localComponentNames.has(tagName)) {
      return { kind: "component-ref", name: tagName }
    }
    // Fall through to dynamic-ref: a local variable defined in the function
    // body (Button's `const Comp = ...`).
    return { kind: "dynamic-ref", localName: tagName }
  }

  throw parserError(
    node,
    ctx,
    `Unrecognised JSX tag name: "${tagName}"`,
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
