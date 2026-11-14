#!/usr/bin/env node
/**
 * Checks that splitting one stylesheet into several, loaded in order, cannot change the cascade.
 *
 *   node scripts/check-css-order.mjs <original.css> <split.css>... [--sources <dir>...]
 *
 * Every rule of the original must appear in the split files. Two rules can only resolve
 * differently after the split when their order flipped, some selector of each has the same
 * specificity, they set the same property to different values, and one element can match both.
 * Elements are judged by the classes the sources put on one element together (every `className`
 * expression in the `--sources` directories): two selectors whose last compounds name classes
 * that never meet on one element cannot match the same element. Each remaining pair is printed;
 * any makes the command fail.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import { calculate } from 'specificity'

const args = process.argv.slice(2)
const at = args.indexOf('--sources')
const files = at < 0 ? args : args.slice(0, at)
const sourceDirs = at < 0 ? [] : args.slice(at + 1)
const [originalFile, ...splitFiles] = files

function rules(file) {
  const out = []
  postcss.parse(readFileSync(file, 'utf8')).walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return
    const context = []
    for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      if (parent.type === 'atrule') context.unshift(`@${parent.name} ${parent.params}`)
    }
    const decls = new Map()
    rule.walkDecls((decl) => decls.set(`${decl.prop}${decl.important ? '!' : ''}`, decl.value))
    // Declaration order inside one rule does not matter unless a property repeats (the map keeps the last).
    const key = `${context.join(' ')} ${rule.selector.replace(/\s+/g, ' ')} {${[...decls].map(([p, v]) => `${p}:${v}`).sort().join(';')}}`
    const selectors = rule.selectors.map((selector) => {
      const { A, B, C } = calculate(selector)
      return { text: selector, spec: `${A},${B},${C}`, subject: subjectOf(selector) }
    })
    out.push({ key, selector: rule.selector, context: context.join(' '), decls, selectors })
  })
  return out
}

/** The last compound of a selector (the element it styles): its classes and pseudo-element. */
function subjectOf(selector) {
  // Split on combinators outside parentheses.
  const parts = []
  let depth = 0
  let current = ''
  for (const char of selector.trim()) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (depth === 0 && /[\s>+~]/.test(char)) {
      if (current) parts.push(current)
      current = ''
    } else current += char
  }
  if (current) parts.push(current)
  const last = parts[parts.length - 1] ?? ''
  const pseudoElement = /::[\w-]+/.exec(last)?.[0] ?? ''
  // Classes inside :not/:has/:is/:where do not all have to be on the element; only bare ones count.
  const bare = last.replace(/:[\w-]+\((?:[^()]|\([^()]*\))*\)/g, '')
  const classes = [...bare.matchAll(/\.([\w-]+)/g)].map((match) => match[1])
  const tag = /^[a-z][\w-]*/.exec(bare)?.[0] ?? ''
  return { classes, pseudoElement, tag }
}

function sources(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sources(path))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(readFileSync(path, 'utf8'))
  }
  return out
}

/** The class sets the sources give one element: each `className` value, with `${…}` template prefixes as wildcards. */
function classSets(texts) {
  const sets = []
  for (const text of texts) {
    for (const match of text.matchAll(/className=/g)) {
      const i = match.index + 'className='.length
      let value
      if (text[i] === '"' || text[i] === "'") value = text.slice(i + 1, text.indexOf(text[i], i + 1))
      else if (text[i] === '{') {
        let depth = 0
        let j = i
        for (; j < text.length; j++) {
          if (text[j] === '{') depth++
          else if (text[j] === '}' && --depth === 0) break
        }
        value = text.slice(i, j)
      } else continue
      const exact = new Set([...value.matchAll(/(?<![\w$-])([a-z][\w-]*\w)(?![\w-]*\$\{)/g)].map((m) => m[1]))
      const prefixes = [...value.matchAll(/([a-z][\w-]*-)\$\{/g)].map((m) => m[1])
      // A className passed through from a prop (`className={className}`) adds a caller's classes.
      const open = /\b(className|props\.className|rest\.className)\b/.test(value.replace(/^\{/, '')) || /^\{\s*[a-zA-Z_.]+\s*\}?$/.test(value)
      // Given to a component (`<DropPanel className=…>`) rather than a DOM element: a caller's classes.
      const tag = /<([A-Za-z][\w.]*)[^<]*$/.exec(text.slice(Math.max(0, match.index - 2000), match.index))?.[1] ?? ''
      sets.push({ exact, prefixes, open, component: /^[A-Z]/.test(tag.split('.').pop() ?? '') })
    }
  }
  return sets
}

const sets = classSets(sourceDirs.flatMap(sources))
const covers = (set, cls) => set.exact.has(cls) || set.prefixes.some((prefix) => cls.startsWith(prefix))
/**
 * Whether the classes can be on one element: all in one `className` value, or, for a value that
 * passes a caller's `className` through, split between it and some caller's value.
 */
const meets = (classes) =>
  sets.some((set) => {
    const rest = classes.filter((cls) => !covers(set, cls))
    if (rest.length === 0) return true
    return set.open && sets.some((caller) => caller.component && !caller.open && rest.every((cls) => covers(caller, cls)))
  })

/** Whether one element can match both selectors (conservative: yes unless their classes never meet). */
function sameElement(a, b) {
  if (a.subject.pseudoElement !== b.subject.pseudoElement) return false
  if (a.subject.tag && b.subject.tag && a.subject.tag !== b.subject.tag) return false
  if (sourceDirs.length === 0 || a.subject.classes.length === 0 || b.subject.classes.length === 0) return true
  return meets([...new Set([...a.subject.classes, ...b.subject.classes])])
}

const original = rules(originalFile)
const split = splitFiles.flatMap(rules)
const position = new Map()
split.forEach((rule, index) => position.set(rule.key, [...(position.get(rule.key) ?? []), index]))

let failures = 0
for (const rule of original.filter((rule) => !position.has(rule.key))) {
  console.error(`missing after the split: ${rule.selector}`)
  failures++
}
const newIndex = original.map((rule) => position.get(rule.key)?.[0] ?? -1)
let flipped = 0
for (let i = 0; i < original.length; i++) {
  for (let j = i + 1; j < original.length; j++) {
    if (newIndex[i] < 0 || newIndex[j] < 0 || newIndex[i] < newIndex[j]) continue
    const a = original[i]
    const b = original[j]
    if (a.context !== b.context) continue
    const props = [...a.decls.keys()].filter((prop) => b.decls.has(prop) && a.decls.get(prop) !== b.decls.get(prop))
    if (props.length === 0) continue
    const pairs = a.selectors.flatMap((x) => b.selectors.filter((y) => x.spec === y.spec && sameElement(x, y)).map((y) => `${x.text}  <->  ${y.text}`))
    if (pairs.length === 0) continue
    flipped++
    console.error(`order flipped (${props.join(' ')}): ${pairs.join('; ')}`)
  }
}
failures += flipped
console.log(`${original.length} rules, ${split.length} after the split; ${flipped} pairs whose order matters flipped`)
process.exit(failures > 0 ? 1 : 0)
