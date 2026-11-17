/**
 * Finding an icon by its name or by what people call it: the words of its name, its lucide-react
 * names, and its keywords (English, and Chinese where written). Every word of the query has to
 * match; a word of four letters or more may be one letter off. Matching is by words on this
 * page's own data, with no model behind it.
 */
import { FROM_LUCIDE, ICON_NAMES, ICON_SEARCH } from '@kition/tessera-icons/registry'

type Entry = { name: string; parts: string[]; aliases: string[]; keywords: readonly string[] }

const aliases = new Map<string, string[]>()
for (const [alias, name] of Object.entries(FROM_LUCIDE)) aliases.set(name, [...(aliases.get(name) ?? []), alias.toLowerCase()])

const ENTRIES: Entry[] = ICON_NAMES.map((name) => ({ name, parts: name.split('-'), aliases: aliases.get(name) ?? [], keywords: ICON_SEARCH[name]?.keywords ?? [] }))

/** Whether two words differ by one letter changed, added, or dropped. */
function near(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (a.length < b.length) j++
    else {
      i++
      j++
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

/** How well one word of the query matches an icon: lower is better, null is no match. */
function score(entry: Entry, word: string): number | null {
  if (entry.name === word) return 0
  if (entry.parts[0] === word) return 1
  if (entry.parts.includes(word)) return 2
  if (entry.keywords.includes(word)) return 3
  if (entry.name.startsWith(word)) return 4
  if (entry.parts.some((part) => part.startsWith(word))) return 5
  if (entry.keywords.some((keyword) => keyword.startsWith(word))) return 6
  if (entry.name.includes(word) || entry.aliases.some((alias) => alias.includes(word))) return 7
  // Chinese is written without spaces: a keyword inside the query, or the query inside a keyword.
  if (entry.keywords.some((keyword) => keyword.includes(word) || (/[^\x00-\x7f]/.test(keyword) && word.includes(keyword)))) return 8
  if (word.length >= 4 && (entry.parts.some((part) => near(part, word)) || entry.keywords.some((keyword) => near(keyword, word)))) return 10
  return null
}

/** The names of the icons that match `query`, best first; every icon, in order, for an empty query. */
export function searchIcons(query: string): string[] {
  const words = query.trim().toLowerCase().split(/[\s,]+/).filter(Boolean)
  if (words.length === 0) return [...ICON_NAMES]
  const found: { name: string; total: number }[] = []
  for (const entry of ENTRIES) {
    let total = 0
    for (const word of words) {
      const value = score(entry, word)
      if (value === null) {
        total = -1
        break
      }
      total += value
    }
    if (total >= 0) found.push({ name: entry.name, total })
  }
  return found.sort((a, b) => a.total - b.total || a.name.length - b.name.length || a.name.localeCompare(b.name)).map((item) => item.name)
}
