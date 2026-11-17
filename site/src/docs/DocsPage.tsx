import { BlocksIcon, BookOpenIcon, CompassIcon, LayersIcon, LayoutGridIcon, MenuIcon, PaletteIcon, PanelsTopLeftIcon, PlayIcon, PuzzleIcon, TableIcon, TextCursorInputIcon, type IconComponent } from '@kition/tessera-icons/react'
import { Sheet } from '@kition/tessera-ui'
import { useEffect, useMemo, useState } from 'react'
import { CodeBlock, CopyButton, highlight } from '../shell/Code'
import { CopyForAI } from '../shell/CopyForAI'
import { PageHero } from '../shell/PageHero'
import api from './api.json'
import { demoOf, loadDemos } from './demos'
import { Playground } from './Playground'
import { PLAYGROUNDS } from './playgrounds'
import { CATEGORIES, DOCS, type DocEntry } from './registry'

type Prop = { name: string; type: string; required: boolean; default: string | null; doc: string }
type Api = Record<string, { description: string; props: Prop[]; domProps?: boolean }>

/** What a docs page needs before it draws: its demos. */
export async function preload(id: string | null) {
  await loadDemos((DOCS.find((doc) => doc.id === id) ?? DOCS[0]).demos?.map((item) => item.id) ?? [])
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** Inline `code` in prose. */
function Prose({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => (part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>))}
    </>
  )
}

const CATEGORY_ICONS: Record<string, IconComponent> = {
  'Getting started': BookOpenIcon,
  General: BlocksIcon,
  Forms: TextCursorInputIcon,
  'Data display': TableIcon,
  Navigation: CompassIcon,
  'Menus and overlays': LayersIcon,
  'Editor chrome': PanelsTopLeftIcon,
  Workspace: LayoutGridIcon,
  Color: PaletteIcon,
  'Media and time': PlayIcon,
  Integration: PuzzleIcon,
}

const isGuide = (entry: DocEntry) => entry.category === 'Getting started'

export function DocsPage({ id }: { id: string }) {
  const entry = DOCS.find((doc) => doc.id === id) ?? DOCS[0]
  const [menu, setMenu] = useState(false)
  // Braces: Chrome's scrollTo returns a promise, which React would take for a clean-up function.
  useEffect(() => {
    window.scrollTo(0, 0)
    setMenu(false)
  }, [entry.id])
  const index = DOCS.indexOf(entry)
  const previous = DOCS[index - 1]
  const next = DOCS[index + 1]
  const importLine = entry.api?.length ? `import { ${entry.api.join(', ')} } from '@kition/tessera-ui'` : undefined
  return (
    <div className="docs">
      <aside className="docs-sidebar" aria-label="Documentation">
        <DocsNav current={entry.id} />
      </aside>
      {/* Narrow screens: the same list in a panel from the left. */}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Docs" side="left" width={300} testId="docs-menu">
        <DocsNav current={entry.id} />
      </Sheet>
      <div className="docs-body">
        <PageHero
          tone={isGuide(entry) ? 'docs' : 'components'}
          eyebrow={
            <>
              <button type="button" className="docs-menu-button" onClick={() => setMenu(true)} aria-label="Open the list of pages">
                <MenuIcon size={16} />
              </button>
              {isGuide(entry) ? 'Docs' : <a href="/components/">Components</a>} <span aria-hidden="true">/</span> {entry.category}
            </>
          }
          title={entry.title}
          actions={<CopyForAI markdown={`${isGuide(entry) ? 'guides' : 'components'}/${entry.id}.md`} subject={isGuide(entry) ? `the “${entry.title}” guide` : `the ${entry.title} component${(entry.api?.length ?? 0) > 1 ? 's' : ''}`} importLine={importLine} />}
        >
          <p>
            <Prose text={entry.summary} />
          </p>
          {importLine ? (
            <div className="docs-import">
              <code>{highlight(importLine)}</code>
              <CopyButton text={importLine} />
            </div>
          ) : null}
        </PageHero>
        <div className="docs-content">
          <article className="docs-main">
            {entry.id === 'overview' ? <StartHere /> : null}
            {PLAYGROUNDS[entry.id] ? <Playground key={entry.id} specs={PLAYGROUNDS[entry.id]} /> : null}
            {entry.when || entry.whenNot ? <WhenToUse entry={entry} /> : null}
            {entry.sections?.map((section) => (
              <section key={section.heading} className="docs-section" id={`guide-${slug(section.heading)}`}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph, i) => (
                  <p key={i}>
                    <Prose text={paragraph} />
                  </p>
                ))}
                {section.code ? <CodeBlock code={section.code} /> : null}
              </section>
            ))}
            {entry.keyboard?.length ? (
              <section className="docs-section" id="keyboard">
                <h2>Keyboard</h2>
                <div className="docs-api">
                  <table>
                    <thead>
                      <tr>
                        <th>Keys</th>
                        <th>What they do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.keyboard.map(([keys, action]) => (
                        <tr key={keys}>
                          <td>
                            <kbd>{keys}</kbd>
                          </td>
                          <td>
                            <Prose text={action} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            {entry.demos?.length ? (
              <section className="docs-section">
                <h2>Examples</h2>
                {entry.demos.map((item) => (
                  <Demo key={item.id} id={item.id} title={item.title} note={item.note} />
                ))}
              </section>
            ) : null}
            {entry.api?.length ? (
              <section className="docs-section">
                <h2>Props</h2>
                {entry.api.map((name) => (
                  <ApiTable key={name} name={name} />
                ))}
              </section>
            ) : null}
            <nav className="docs-pager" aria-label="Previous and next page">
              {previous ? (
                <a href={`/docs/${previous.id}/`}>
                  <small>Previous</small>
                  {previous.title}
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={`/docs/${next.id}/`} className="docs-next">
                  <small>Next</small>
                  {next.title}
                </a>
              ) : null}
            </nav>
          </article>
          <TableOfContents entry={entry} />
        </div>
      </div>
    </div>
  )
}

/** Every page by category, with a filter; the current page is marked. */
function DocsNav({ current }: { current: string }) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const words = query.trim().toLowerCase()
    return CATEGORIES.map((category) => ({
      category,
      docs: DOCS.filter((doc) => doc.category === category && (!words || `${doc.title} ${doc.summary} ${(doc.api ?? []).join(' ')}`.toLowerCase().includes(words))),
    })).filter((group) => group.docs.length > 0)
  }, [query])
  return (
    <>
      <input className="docs-search" type="search" placeholder="Filter pages" aria-label="Filter pages" value={query} onChange={(event) => setQuery(event.target.value)} />
      <nav aria-label="Pages">
        {groups.map((group) => {
          const Icon = CATEGORY_ICONS[group.category]
          return (
            <div key={group.category} className="docs-group">
              <p className="docs-group-title">
                {Icon ? <Icon size={14} /> : null} {group.category}
              </p>
              {group.docs.map((doc) => (
                <a key={doc.id} href={`/docs/${doc.id}/`} aria-current={doc.id === current ? 'page' : undefined}>
                  {doc.title}
                </a>
              ))}
            </div>
          )
        })}
        {groups.length === 0 ? <p className="docs-none">No page matches.</p> : null}
      </nav>
    </>
  )
}

/** Where to go from the overview. */
const STARTS: { href: string; title: string; text: string; icon: IconComponent }[] = [
  { href: '/docs/installation/', title: 'Install', text: 'Add the packages and draw a first component.', icon: PlayIcon },
  { href: '/components/', title: 'Components', text: 'Every component, running, with a playground.', icon: BlocksIcon },
  { href: '/icons/', title: 'Icons', text: 'Search by name or meaning; copy React, SVG, canvas or Rust.', icon: PaletteIcon },
  { href: '/tokens/', title: 'Tokens and skins', text: 'Make a skin and take it as the theme a host sends.', icon: LayersIcon },
  { href: '/docs/ai/', title: 'With an AI assistant', text: 'Give it the docs as Markdown, and check what it wrote.', icon: PuzzleIcon },
]
function StartHere() {
  return (
    <div className="docs-starts">
      {STARTS.map(({ href, title, text, icon: Icon }) => (
        <a key={href} href={href}>
          <span>
            <Icon size={18} />
          </span>
          <strong>{title}</strong>
          <small>{text}</small>
        </a>
      ))}
    </div>
  )
}

function WhenToUse({ entry }: { entry: DocEntry }) {
  return (
    <div className="docs-when">
      {entry.when ? (
        <div>
          <h3>When to use</h3>
          <ul>
            {entry.when.map((item) => (
              <li key={item}>
                <Prose text={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {entry.whenNot ? (
        <div>
          <h3>When not to</h3>
          <ul>
            {entry.whenNot.map((item) => (
              <li key={item}>
                <Prose text={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Demo({ id, title, note }: { id: string; title: string; note?: string }) {
  const { Component, source } = demoOf(id) ?? { Component: null, source: '' }
  const code = source.trim()
  const long = code.split('\n').length > 14
  const [open, setOpen] = useState(false)
  return (
    <div className="docs-demo" id={`demo-${id}`}>
      <div className="docs-demo-head">
        <strong>{title}</strong>
        {note ? <p>{note}</p> : null}
      </div>
      <div className="docs-demo-stage">{Component ? <Component /> : <em>Missing demo {id}</em>}</div>
      <div className="docs-demo-code" data-collapsed={long && !open ? true : undefined}>
        <CodeBlock code={code} label={`${id}.tsx`} />
        {long ? (
          <button type="button" className="docs-demo-more" onClick={() => setOpen(!open)}>
            {open ? 'Show less' : `Show all ${code.split('\n').length} lines`}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ApiTable({ name }: { name: string }) {
  const info = (api as Api)[name]
  if (!info) return <p>No API data for {name}.</p>
  return (
    <div className="docs-api" id={`api-${name}`}>
      <h3>{name}</h3>
      {info.description ? (
        <p className="docs-api-desc">
          <Prose text={info.description} />
        </p>
      ) : null}
      {info.props.length ? (
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {info.props.map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code>{prop.name}</code>
                  {prop.required ? <span className="docs-required">required</span> : null}
                </td>
                <td>
                  <code className="docs-type">{prop.type}</code>
                </td>
                <td>{prop.default ? <code>{prop.default}</code> : '—'}</td>
                <td>
                  <Prose text={prop.doc || ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="docs-api-desc">No props.</p>
      )}
      {info.domProps ? <p className="docs-api-note">Also takes the attributes of its HTML element (`className`, `aria-*`, events…).</p> : null}
    </div>
  )
}

function TableOfContents({ entry }: { entry: DocEntry }) {
  const items = [
    ...(entry.sections?.map((section) => ({ id: `guide-${slug(section.heading)}`, label: section.heading })) ?? []),
    ...(entry.keyboard?.length ? [{ id: 'keyboard', label: 'Keyboard' }] : []),
    ...(entry.demos?.map((item) => ({ id: `demo-${item.id}`, label: item.title })) ?? []),
    ...(entry.api?.map((name) => ({ id: `api-${name}`, label: `${name} API` })) ?? []),
  ]
  if (items.length < 2) return <div className="docs-toc" />
  return (
    <nav className="docs-toc" aria-label="On this page">
      <p>On this page</p>
      {items.map((item) => (
        <button key={item.label} type="button" onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
