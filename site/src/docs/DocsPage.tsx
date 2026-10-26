import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Toaster } from '@kition/tessera-ui'
import api from './api.json'
import { CATEGORIES, DOCS, type DocEntry } from './registry'

type Prop = { name: string; type: string; required: boolean; default: string | null; doc: string }
type Api = Record<string, { description: string; props: Prop[]; domProps?: boolean }>

const demoModules = import.meta.glob('./demos/*.tsx', { eager: true }) as Record<string, { default: ComponentType }>
const demoSources = import.meta.glob('./demos/*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const demo = (id: string) => ({ Component: demoModules[`./demos/${id}.tsx`]?.default, source: demoSources[`./demos/${id}.tsx`] ?? '' })

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

export function DocsPage({ id }: { id: string }) {
  const entry = DOCS.find((doc) => doc.id === id) ?? DOCS[0]
  const [query, setQuery] = useState('')
  // Braces: Chrome's scrollTo returns a promise, which React would take for a clean-up function.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [entry.id])
  const groups = useMemo(() => {
    const words = query.trim().toLowerCase()
    return CATEGORIES.map((category) => ({
      category,
      docs: DOCS.filter((doc) => doc.category === category && (!words || `${doc.title} ${doc.summary} ${(doc.api ?? []).join(' ')}`.toLowerCase().includes(words))),
    })).filter((group) => group.docs.length > 0)
  }, [query])
  const index = DOCS.indexOf(entry)
  const previous = DOCS[index - 1]
  const next = DOCS[index + 1]
  return (
    <div className="docs">
      <Toaster />
      <aside className="docs-sidebar" aria-label="Documentation">
        <input className="docs-search" type="search" placeholder="Search components" value={query} onChange={(event) => setQuery(event.target.value)} />
        <nav>
          {groups.map((group) => (
            <div key={group.category} className="docs-group">
              <p className="docs-group-title">{group.category}</p>
              {group.docs.map((doc) => (
                <a key={doc.id} href={`/docs/${doc.id}/`} aria-current={doc.id === entry.id ? 'page' : undefined}>
                  {doc.title}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <article className="docs-main">
        <p className="docs-crumb">{entry.category}</p>
        <h1>{entry.title}</h1>
        <p className="docs-summary">
          <Prose text={entry.summary} />
        </p>
        {entry.api?.length ? (
          <pre className="docs-import">
            <code>{`import { ${entry.api.join(', ')} } from '@kition/tessera-ui'`}</code>
          </pre>
        ) : null}
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
            <h2>API</h2>
            {entry.api.map((name) => (
              <ApiTable key={name} name={name} />
            ))}
          </section>
        ) : null}
        <nav className="docs-pager">
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
  const { Component, source } = demo(id)
  const [showCode, setShowCode] = useState(false)
  return (
    <div className="docs-demo" id={`demo-${id}`}>
      <div className="docs-demo-stage">{Component ? <Component /> : <em>Missing demo {id}</em>}</div>
      <div className="docs-demo-meta">
        <div>
          <strong>{title}</strong>
          {note ? <p>{note}</p> : null}
        </div>
        <button type="button" className="kui-button" data-size="sm" onClick={() => setShowCode(!showCode)}>
          {showCode ? 'Hide code' : 'Show code'}
        </button>
      </div>
      {showCode ? <CodeBlock code={source.trim()} /> : null}
    </div>
  )
}

function CodeBlock({ code }: { code: string }): ReactNode {
  const [copied, setCopied] = useState(false)
  return (
    <div className="docs-code">
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
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
                  {prop.required ? <span className="docs-required" title="Required">*</span> : null}
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
