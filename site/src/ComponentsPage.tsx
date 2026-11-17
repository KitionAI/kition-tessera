import { useEffect, useMemo, useRef, useState } from 'react'
import { Segmented } from '@kition/tessera-ui'
import { SlidersHorizontalIcon } from '@kition/tessera-icons/react'
import api from './docs/api.json'
import { demoOf, loadDemos } from './docs/demos'
import { PLAYGROUNDS } from './docs/playgrounds'
import { CATEGORIES, DOCS, type DocEntry } from './docs/registry'
import { PageHero } from './shell/PageHero'

/** The components general design systems do not have: shown first, live. */
const FEATURED = ['ribbon', 'color-wheel', 'curve-editor', 'color-picker', 'timecode-transport', 'histogram', 'keyframe-lane', 'gradient-slider', 'level-meter']
/** Featured demos that fill the width they are given (the others sit at their own size, centred). */
const FILL = ['keyframe-lane', 'level-meter', 'histogram']
const featuredDemo = (doc: DocEntry) => doc.demos?.[0]?.id ?? null

const GROUPS: { id: string; label: string; categories: string[] }[] = [
  { id: 'all', label: 'All', categories: [] },
  { id: 'base', label: 'Base', categories: ['General', 'Forms', 'Data display', 'Navigation', 'Menus and overlays'] },
  { id: 'editor', label: 'Editor', categories: ['Editor chrome', 'Workspace', 'Integration'] },
  { id: 'color', label: 'Color', categories: ['Color'] },
  { id: 'media', label: 'Media', categories: ['Media and time'] },
]

const COMPONENTS = DOCS.filter((doc) => doc.category !== 'Getting started')
const COUNT = Object.keys(api).length

/** What the page needs before it draws: the demos of the featured row. */
export async function preload() {
  await loadDemos(FEATURED.map((id) => featuredDemo(DOCS.find((doc) => doc.id === id)!)).filter((id): id is string => id !== null))
}

/**
 * Every component on one page: the ones made for professional editors first, each running, then
 * the rest by category, each card a small running preview that loads as it scrolls into view.
 */
export function ComponentsPage() {
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase()
    const categories = GROUPS.find((item) => item.id === group)?.categories ?? []
    return COMPONENTS.filter((doc) => (categories.length === 0 || categories.includes(doc.category)) && (!words || `${doc.title} ${doc.summary} ${(doc.api ?? []).join(' ')}`.toLowerCase().includes(words)))
  }, [group, query])
  const filtered = group !== 'all' || query.trim() !== ''
  const featured = FEATURED.map((id) => DOCS.find((doc) => doc.id === id)!).filter(Boolean)
  return (
    <>
      <PageHero tone="components" eyebrow="Components" title="From a button to a timeline">
        <p>
          {COUNT} components on {COMPONENTS.length} pages. Base controls sit beside the ones only professional editors need, and every one draws through the theme tokens alone: switch the skin
          above and this whole page follows.
        </p>
      </PageHero>
      <div className="page gallery">
        <div className="gallery-bar">
          <Segmented label="Kind of component" value={group} onChange={setGroup} segments={GROUPS.map((item) => ({ value: item.id, label: item.label }))} />
          <input className="gallery-search" type="search" placeholder={`Filter ${COMPONENTS.length} pages`} aria-label="Filter components" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {!filtered ? (
          <section aria-labelledby="gallery-featured">
            <h2 id="gallery-featured">Made for professional editors</h2>
            <p className="gallery-note">Ribbons, colour, curves and time. These are running components: drag them.</p>
            <div className="gallery-featured">
              {featured.map((doc) => (
                <FeaturedCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        ) : null}
        {CATEGORIES.filter((category) => shown.some((doc) => doc.category === category)).map((category) => (
          <section key={category} aria-label={category}>
            <h2>
              {category} <span className="gallery-count">{shown.filter((doc) => doc.category === category).length}</span>
            </h2>
            <div className="gallery-grid">
              {shown
                .filter((doc) => doc.category === category)
                .map((doc) => (
                  <Card key={doc.id} doc={doc} />
                ))}
            </div>
          </section>
        ))}
        {shown.length === 0 ? <p className="gallery-none">No component matches “{query.trim()}”.</p> : null}
      </div>
    </>
  )
}

/** A running demo with the page's name under it; the name is the link, so the demo stays usable. */
function FeaturedCard({ doc }: { doc: DocEntry }) {
  const demo = featuredDemo(doc)
  const Component = demo ? demoOf(demo)?.Component : null
  return (
    <article className="gallery-feature">
      <div className="gallery-feature-stage" data-fill={FILL.includes(doc.id) || undefined}>
        {Component ? <Component /> : null}
      </div>
      <a href={`/docs/${doc.id}/`}>
        <strong>{doc.title}</strong>
        <span>{plain(doc.summary)}</span>
      </a>
    </article>
  )
}

/** A page's card: a small preview of its first demo (not interactive; the card is a link), its name and what it is. */
function Card({ doc }: { doc: DocEntry }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const demo = featuredDemo(doc)
  const [ready, setReady] = useState(false)
  // The preview loads when the card nears the viewport.
  useEffect(() => {
    const element = ref.current
    if (!element || !demo) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        void loadDemos([demo]).then(() => setReady(true))
      },
      { rootMargin: '300px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [demo])
  const Component = ready && demo ? demoOf(demo)?.Component : null
  return (
    <a ref={ref} className="gallery-card" href={`/docs/${doc.id}/`}>
      <div className="gallery-card-stage" aria-hidden="true">
        <div className="gallery-card-preview" inert>
          {Component ? <Component /> : null}
        </div>
      </div>
      <div className="gallery-card-text">
        <strong>
          {doc.title}
          {PLAYGROUNDS[doc.id] ? (
            <span className="gallery-badge" title="This page has a playground">
              <SlidersHorizontalIcon size={12} /> Playground
            </span>
          ) : null}
        </strong>
        <span>{plain(doc.summary)}</span>
      </div>
    </a>
  )
}

const plain = (text: string) => text.replace(/`/g, '')
