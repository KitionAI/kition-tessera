import { useMemo, useState } from 'react'
import { DEFAULT_STROKE, toSvg, type IconData } from '@kition/tessera-icons'
import { createIcon } from '@kition/tessera-icons/react'
import { FROM_LUCIDE, ICONS, ICON_NAMES, KIT_ICONS } from '@kition/tessera-icons/registry'

const kitFiles = import.meta.glob('../../packages/icons/kit/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const kitUrl = (file: string) => Object.entries(kitFiles).find(([path]) => path.endsWith(`/${file}`))?.[1]

/** Every lucide-react name that maps to each icon, for search and the detail panel. */
const ALIASES = new Map<string, string[]>()
for (const [alias, name] of Object.entries(FROM_LUCIDE)) ALIASES.set(name, [...(ALIASES.get(name) ?? []), alias])

const SIZES = [16, 20, 24, 32, 48]

export function IconsPage() {
  const [query, setQuery] = useState('')
  const [size, setSize] = useState(24)
  const [stroke, setStroke] = useState(DEFAULT_STROKE)
  const [selected, setSelected] = useState<string | null>(null)

  const names = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return ICON_NAMES
    return ICON_NAMES.filter((name) => {
      const hay = `${name} ${(ALIASES.get(name) ?? []).join(' ')}`.toLowerCase()
      return words.every((word) => hay.includes(word))
    })
  }, [query])

  const filled = ICON_NAMES.filter((name) => ICONS[name].fills.length > 0).length

  return (
    <div className="page">
      <section className="page-intro">
        <h1>Tessera Icons</h1>
        <p>
          {ICON_NAMES.length} interface icons and {KIT_ICONS.length} kit icons. Every icon is SVG path data on a 24 × 24 grid, so React, a canvas
          and Rust engines draw the same shape. This first set is the Lucide icons Kition&apos;s repositories use today ({filled} with filled marks); Tessera&apos;s own
          drawings replace them over time.
        </p>
      </section>

      <h2>Kit icons</h2>
      <div className="kit-grid">
        {KIT_ICONS.map((kit) => (
          <figure key={kit} className="kit-tile">
            <img src={kitUrl(`${kit}.svg`)} alt="" width={64} height={64} />
            <img src={kitUrl(`${kit}-small.svg`)} alt="" width={16} height={16} />
            <figcaption>{kit}</figcaption>
          </figure>
        ))}
      </div>

      <h2>Interface icons</h2>
      <div className="toolbar">
        <input className="search" type="search" placeholder={`Search ${ICON_NAMES.length} icons (name or lucide-react name)`} value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        <label>
          Size
          <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>
        <label>
          Stroke {stroke.toFixed(2)}
          <input type="range" min={1} max={2.5} step={0.25} value={stroke} onChange={(event) => setStroke(Number(event.target.value))} />
        </label>
        <span className="count">{names.length} shown</span>
      </div>

      <div className="icon-layout">
        <div className="icon-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(96, size + 64)}px, 1fr))` }}>
          {names.map((name) => (
            <IconTile key={name} icon={ICONS[name]} size={size} stroke={stroke} selected={selected === name} onSelect={() => setSelected(name)} />
          ))}
          {names.length === 0 ? <p className="empty">No icon matches “{query}”.</p> : null}
        </div>
        {selected ? <IconDetail icon={ICONS[selected]} stroke={stroke} onClose={() => setSelected(null)} /> : null}
      </div>
    </div>
  )
}

const components = new Map<string, ReturnType<typeof createIcon>>()
function componentOf(icon: IconData) {
  let component = components.get(icon.name)
  if (!component) {
    component = createIcon(icon)
    components.set(icon.name, component)
  }
  return component
}

function IconTile({ icon, size, stroke, selected, onSelect }: { icon: IconData; size: number; stroke: number; selected: boolean; onSelect: () => void }) {
  const Icon = componentOf(icon)
  return (
    <button type="button" className="icon-tile" aria-pressed={selected} onClick={onSelect} title={icon.name}>
      <Icon size={size} strokeWidth={stroke} />
      <span>{icon.name}</span>
    </button>
  )
}

const pascal = (name: string) =>
  name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')

function IconDetail({ icon, stroke, onClose }: { icon: IconData; stroke: number; onClose: () => void }) {
  const Icon = componentOf(icon)
  const component = `${pascal(icon.name)}Icon`
  const [copied, setCopied] = useState<string | null>(null)
  const snippets = [
    { id: 'react', label: 'React', text: `import { ${component} } from '@kition/tessera-icons/react'\n\n<${component} size={16} />` },
    { id: 'canvas', label: 'Canvas', text: `import { ${pascal(icon.name)}, drawIcon } from '@kition/tessera-icons'\n\ndrawIcon(ctx, ${pascal(icon.name)}, x, y, { size: 16 })` },
    { id: 'rust', label: 'Rust', text: `tessera_icons::${icon.name.replace(/-/g, '_').toUpperCase()}.paths` },
    { id: 'svg', label: 'SVG', text: toSvg(icon, { size: 24, strokeWidth: stroke }) },
  ]
  const copy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1200)
  }
  return (
    <aside className="icon-detail" aria-label={icon.name}>
      <div className="icon-detail-head">
        <h3>{icon.name}</h3>
        <button type="button" className="kui-button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="icon-sizes">
        {[16, 20, 24, 48].map((value) => (
          <div key={value} className="icon-size">
            <Icon size={value} strokeWidth={stroke} />
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="icon-grid-view" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="192" height="192">
          {Array.from({ length: 25 }, (_, i) => (
            <g key={i}>
              <line x1={i} y1={0} x2={i} y2={24} stroke="var(--kit-border)" strokeWidth={0.05} />
              <line x1={0} y1={i} x2={24} y2={i} stroke="var(--kit-border)" strokeWidth={0.05} />
            </g>
          ))}
          <g fill="none" stroke="var(--kit-primary)" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
            {icon.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
            {icon.fills.map((d, i) => (
              <path key={`f${i}`} d={d} fill="var(--kit-primary)" />
            ))}
          </g>
        </svg>
      </div>
      <dl className="icon-facts">
        <dt>Family</dt>
        <dd>{icon.family}</dd>
        <dt>Paths</dt>
        <dd>
          {icon.paths.length} stroked{icon.fills.length ? `, ${icon.fills.length} filled` : ''}
        </dd>
        <dt>lucide-react</dt>
        <dd>{(ALIASES.get(icon.name) ?? []).join(', ') || '—'}</dd>
      </dl>
      {snippets.map((snippet) => (
        <div key={snippet.id} className="snippet">
          <div className="snippet-head">
            <span>{snippet.label}</span>
            <button type="button" className="kui-button" onClick={() => copy(snippet.id, snippet.text)}>
              {copied === snippet.id ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>{snippet.text}</pre>
        </div>
      ))}
    </aside>
  )
}
