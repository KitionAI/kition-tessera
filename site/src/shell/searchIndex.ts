/**
 * Everything the command palette finds: pages (guides and components, also by the names of the
 * components they document), icons (by name and by the words people call them, English and
 * Chinese), and tokens. Loaded the first time the palette opens, so
 * pages that never open it do not carry the icon set.
 */
import { ICONS, ICON_NAMES, ICON_SEARCH, FROM_LUCIDE } from '@kition/tessera-icons/registry'
import { TOKENS } from '@kition/tessera-tokens'
import { DOCS } from '../docs/registry'

export type SearchEntry =
  | { kind: 'page'; id: string; title: string; text: string; words: string; href: string; guide: boolean }
  | { kind: 'icon'; id: string; title: string; text: string; words: string; href: string }
  | { kind: 'token'; id: string; title: string; text: string; words: string; value: string }

const aliases = new Map<string, string[]>()
for (const [alias, name] of Object.entries(FROM_LUCIDE)) aliases.set(name, [...(aliases.get(name) ?? []), alias])

export const ENTRIES: SearchEntry[] = [
  ...DOCS.map((doc) => ({
    kind: 'page' as const,
    id: doc.id,
    title: doc.title,
    text: doc.summary.replace(/`/g, ''),
    words: `${doc.title} ${doc.category} ${(doc.api ?? []).join(' ')} ${doc.summary}`.toLowerCase(),
    href: `/docs/${doc.id}/`,
    guide: doc.category === 'Getting started',
  })),
  ...ICON_NAMES.map((name) => ({ kind: 'icon' as const, id: name, title: name, text: ICONS[name].family === 'tool' ? 'Tool icon' : 'Icon', words: `${name} ${name.replace(/-/g, ' ')} ${(aliases.get(name) ?? []).join(' ')} ${(ICON_SEARCH[name]?.keywords ?? []).join(' ')}`.toLowerCase(), href: `/icons/${name}/` })),
  ...TOKENS.map((token) => ({ kind: 'token' as const, id: token.name, title: token.name, text: token.description, words: `${token.name} ${token.description}`.toLowerCase(), value: token.value })),
]

export { ICONS }

/** The entries matching every word of `query`, best first: a title that starts with it, then one that holds it, then the rest. */
export function search(query: string, limit: Record<SearchEntry['kind'], number>): SearchEntry[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const first = words[0]
  const scored: { entry: SearchEntry; score: number }[] = []
  for (const entry of ENTRIES) {
    if (!words.every((word) => entry.words.includes(word))) continue
    const title = entry.title.toLowerCase().replace(/^--(kit|kui)-/, '')
    scored.push({ entry, score: title === first ? 0 : title.startsWith(first) ? 1 : title.includes(first) ? 2 : 3 })
  }
  scored.sort((a, b) => a.score - b.score || a.entry.title.length - b.entry.title.length)
  const taken: Record<string, number> = {}
  return scored.filter(({ entry }) => (taken[entry.kind] = (taken[entry.kind] ?? 0) + 1) <= limit[entry.kind]).map(({ entry }) => entry)
}
