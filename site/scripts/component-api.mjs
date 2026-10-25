#!/usr/bin/env node
/**
 * Writes `src/docs/api.json`: every component @kition/tessera exports, with its JSDoc and its
 * props (name, type, required, default, doc), read with the TypeScript compiler from the package's
 * source, so the docs' API tables never drift from the code. `--check` fails when it is stale.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(site, '..')
const entry = join(root, 'packages', 'tessera', 'src', 'index.ts')
const out = join(site, 'src', 'docs', 'api.json')

const program = ts.createProgram([entry], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  allowImportingTsExtensions: true,
  resolveJsonModule: true,
  noEmit: true,
})
const checker = program.getTypeChecker()
const source = program.getSourceFile(entry)
const moduleSymbol = checker.getSymbolAtLocation(source)

const docOf = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim()
const clean = (text) => text.replace(/import\("[^"]+"\)\./g, '').replace(/\s+/g, ' ')

/** Default values from a destructured first parameter (`{ size = 'sm' }`). */
function defaultsOf(declaration) {
  const defaults = {}
  const param = declaration?.parameters?.[0]
  if (param && ts.isObjectBindingPattern(param.name)) {
    for (const element of param.name.elements) {
      if (element.initializer) defaults[(element.propertyName ?? element.name).getText()] = element.initializer.getText()
    }
  }
  return defaults
}

/** The function declaration behind an export: a function, or a forwardRef(function …) const. */
function implementation(symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
  const declaration = target.declarations?.[0]
  if (!declaration) return { target, fn: null }
  if (ts.isFunctionDeclaration(declaration)) return { target, fn: declaration }
  if (ts.isVariableDeclaration(declaration) && declaration.initializer && ts.isCallExpression(declaration.initializer)) {
    const inner = declaration.initializer.arguments[0]
    if (inner && (ts.isFunctionExpression(inner) || ts.isArrowFunction(inner))) return { target, fn: inner }
  }
  return { target, fn: null }
}

const api = {}
for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
  const name = symbol.getName()
  if (!/^[A-Z]/.test(name)) continue
  const { target, fn } = implementation(symbol)
  if (!fn) continue
  const param = fn.parameters?.[0]
  if (!param) {
    api[name] = { description: docOf(target), props: [] }
    continue
  }
  const type = checker.getTypeAtLocation(param)
  // A component's props: an object type; skip non-components (hooks, helpers) that take other shapes.
  if (!(type.flags & ts.TypeFlags.Object) && !type.isIntersection() && !type.isUnion()) continue
  const defaults = defaultsOf(fn)
  const props = []
  for (const prop of checker.getPropertiesOfType(type)) {
    const declaration = prop.valueDeclaration ?? prop.declarations?.[0]
    const file = declaration?.getSourceFile().fileName ?? ''
    // Inherited DOM attributes (from React's types) are summarised, not listed one by one.
    if (file.includes('node_modules')) continue
    const propType = checker.getTypeOfSymbolAtLocation(prop, declaration ?? param)
    // The type as written (`ReactNode`, `DockGroup[]`) reads better than the expanded one.
    const written = declaration && 'type' in declaration && declaration.type ? declaration.type.getText() : null
    props.push({
      name: prop.getName(),
      type: clean(written ?? checker.typeToString(checker.getNonNullableType(propType), undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType)),
      required: !(prop.flags & ts.SymbolFlags.Optional),
      default: defaults[prop.getName()] ?? null,
      doc: docOf(prop),
    })
  }
  const domProps = checker.getPropertiesOfType(type).some((prop) => (prop.valueDeclaration ?? prop.declarations?.[0])?.getSourceFile().fileName.includes('node_modules'))
  api[name] = { description: docOf(target), props, domProps }
}

const text = JSON.stringify(Object.fromEntries(Object.entries(api).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n'
if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(out, 'utf8')
  } catch {}
  if (current !== text) {
    console.error('src/docs/api.json is out of date: run node site/scripts/component-api.mjs')
    process.exit(1)
  }
} else {
  writeFileSync(out, text)
  console.log(`${Object.keys(api).length} components`)
}
