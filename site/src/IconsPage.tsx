import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { DEFAULT_STROKE, toSvg, type IconData } from '@kition/tessera-icons'
import { DownloadIcon, XIcon, createIcon, type IconComponent } from '@kition/tessera-icons/react'
import { FROM_LUCIDE, ICONS, ICON_CATEGORIES, ICON_NAMES, ICON_SEARCH, KIT_COLORS, KIT_ICONS } from '@kition/tessera-icons/registry'
import { Button, IconButton, RibbonButton, RibbonGroup, Segmented, Sheet, Switch, toast } from '@kition/tessera-ui'
import { searchIcons } from './icons/search'
import { CodeBlock } from './shell/Code'
import { CopyForAI } from './shell/CopyForAI'
import { PageHero } from './shell/PageHero'

const kitFiles = import.meta.glob('@tessera/packages/icons/kit/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const kitUrl = (file: string) => Object.entries(kitFiles).find(([path]) => path.endsWith(`/${file}`))?.[1]

/** Every lucide-react name that maps to each icon. */
const ALIASES = new Map<string, string[]>()
for (const [alias, name] of Object.entries(FROM_LUCIDE)) ALIASES.set(name, [...(ALIASES.get(name) ?? []), alias])

const SIZES = ['16', '20', '24', '32']
const FAMILIES = [
  { value: 'all', label: 'All' },
  { value: 'ui', label: 'Interface' },
  { value: 'tool', label: 'Tools' },
]
/** The categories that have icons, in the order keywords.json lists them. */
const CATEGORIES = Object.keys(ICON_CATEGORIES).filter((id) => ICON_NAMES.some((name) => ICON_SEARCH[name].category === id))
const COUNTS = { ui: ICON_NAMES.filter((name) => ICONS[name].family === 'ui').length, tool: ICON_NAMES.filter((name) => ICONS[name].family === 'tool').length }

type TesseraIcon = ReturnType<typeof createIcon>
const components = new Map<string, TesseraIcon>()
function componentOf(name: string): TesseraIcon {
  let component = components.get(name)
  if (!component) components.set(name, (component = createIcon(ICONS[name])))
  return component
}
const pascal = (name: string) =>
  name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')

/**
 * Tessera Icons as a tool for finding one: search by name or meaning, narrow by family and
 * category, look at the result as a grid or inside an interface, and take an icon as React,
 * SVG, canvas or Rust code, or as a file.
 */
export function IconsPage({ initial = null }: { initial?: string | null }) {
  const known = initial && ICONS[initial] ? initial : null
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('all')
  const [category, setCategory] = useState<string | null>(null)
  const [size, setSize] = useState('24')
  const [stroke, setStroke] = useState(DEFAULT_STROKE)
  const [accent, setAccent] = useState(true)
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState<string | null>(known)
  const [picked, setPicked] = useState<string[]>([])
  const narrow = useNarrow()

  // A search in the address (`/icons/?q=delete`), read once the page has drawn.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('q')) setQuery(params.get('q')!)
    if (params.get('family') === 'ui' || params.get('family') === 'tool') setFamily(params.get('family')!)
    if (params.get('category') && CATEGORIES.includes(params.get('category')!)) setCategory(params.get('category'))
  }, [])
  // What is searched and shown goes into the address, so it can be shared.
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (family !== 'all') params.set('family', family)
    if (category) params.set('category', category)
    history.replaceState(history.state, '', `${selected ? `/icons/${selected}/` : '/icons/'}${params.size ? `?${params}` : ''}`)
  }, [query, family, category, selected])

  const names = useMemo(() => searchIcons(query).filter((name) => (family === 'all' || ICONS[name].family === family) && (!category || ICON_SEARCH[name].category === category)), [query, family, category])
  const style = { '--tessera-icon-accent-opacity': accent ? 0.28 : 0 } as CSSProperties

  const select = (name: string, add: boolean) => {
    if (add) setPicked((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]))
    else setSelected(name === selected ? null : name)
  }
  const detail = selected ? <IconDetail name={selected} stroke={stroke} accent={accent} onClose={() => setSelected(null)} onPick={(name) => setSelected(name)} /> : null

  return (
    <>
      <PageHero
        tone="icons"
        eyebrow="Icons"
        title="Tessera Icons"
        actions={<CopyForAI markdown="icons.md" subject="Tessera Icons (@kition/tessera-icons)" importLine="import { LayersIcon } from '@kition/tessera-icons/react'" />}
      >
        <p>
          {ICON_NAMES.length} icons on one 24 grid at a 1.5 stroke: {COUNTS.ui} for the interface and {COUNTS.tool} for professional tools, whose accents follow the skin. React, a canvas, SVG and a Rust
          engine draw the same shape.
        </p>
      </PageHero>
      <div className="page icons" style={style}>
        <div className="icons-bar">
          <div className="icons-bar-row">
            <input
              className="icons-search"
              type="search"
              placeholder="Search by name or meaning: delete, align, round corner…"
              aria-label="Search icons by name or meaning"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus={!known}
            />
            <Segmented label="Family" value={family} onChange={setFamily} segments={FAMILIES} />
            <span className="icons-count" aria-live="polite">
              {names.length} of {ICON_NAMES.length}
            </span>
          </div>
          <div className="icons-bar-row">
            <div className="icons-chips" role="group" aria-label="Category">
              <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
                All
              </button>
              {CATEGORIES.map((id) => (
                <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(category === id ? null : id)}>
                  {ICON_CATEGORIES[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="icons-bar-row icons-options">
            <Segmented label="Size" value={size} onChange={setSize} segments={SIZES.map((value) => ({ value, label: value }))} />
            <label className="icons-stroke">
              Stroke {stroke.toFixed(2)}
              <input type="range" min={1} max={2.5} step={0.25} value={stroke} onChange={(event) => setStroke(Number(event.target.value))} />
            </label>
            <label className="icons-accent">
              <Switch checked={accent} onCheckedChange={setAccent} aria-label="Tool icon accents" /> Accents
            </label>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              segments={[
                { value: 'grid', label: 'Grid' },
                { value: 'interface', label: 'In an interface' },
              ]}
            />
          </div>
        </div>

        <div className="icons-layout">
          <div className="icons-main">
            {names.length === 0 ? (
              <p className="icons-none">
                No icon matches “{query.trim()}”{category || family !== 'all' ? ' in this selection' : ''}. Try another word, or{' '}
                <a href="https://github.com/KitionAI/kition-tessera/issues/new?template=feature_request.yml">ask for the icon</a>.
              </p>
            ) : view === 'grid' ? (
              <div className="icons-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Number(size) + 34}px, 1fr))` }}>
                {names.map((name) => {
                  const Icon = componentOf(name)
                  return (
                    <button key={name} type="button" className="icons-tile" title={name} aria-label={name} aria-pressed={selected === name} data-picked={picked.includes(name) || undefined} onClick={(event) => select(name, event.shiftKey)}>
                      <Icon size={Number(size)} strokeWidth={stroke} accent={accent} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <InInterface names={names} stroke={stroke} accent={accent} onSelect={(name) => setSelected(name)} />
            )}
            {view === 'grid' && names.length > 0 ? <p className="icons-hint">Click an icon for its code. Shift-click to pick several.</p> : null}
          </div>
          {narrow ? (
            <Sheet open={detail !== null} onClose={() => setSelected(null)} title={selected ?? ''} width={360} testId="icon-sheet">
              {detail}
            </Sheet>
          ) : (
            detail
          )}
        </div>

        {picked.length ? <Picked names={picked} onClear={() => setPicked([])} /> : null}

        <section className="icons-kits" aria-labelledby="icons-kits">
          <h2 id="icons-kits">Kit app icons</h2>
          <p className="icons-kits-note">One full-colour tile per Kition kit, with a small cut for 16 px. They are Kition trademarks: use them to name a kit, not as interface icons.</p>
          <div className="icons-kit-grid">
            {KIT_ICONS.map((kit) => (
              <figure key={kit} className="icons-kit">
                <img src={kitUrl(`${kit}.svg`)} alt="" width={56} height={56} />
                <figcaption>
                  <strong>{KIT_COLORS[kit]?.name ?? kit}</strong>
                  <span>
                    <img src={kitUrl(`${kit}-small.svg`)} alt="" width={16} height={16} />
                    <code>{kit}.svg</code>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

/** Whether the screen is too narrow for the detail panel beside the grid. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const media = matchMedia('(max-width: 980px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return narrow
}

/** The first matches where icons live: a toolbar, a tool rail with accents, a ribbon, and buttons. */
function InInterface({ names, stroke, accent, onSelect }: { names: string[]; stroke: number; accent: boolean; onSelect: (name: string) => void }) {
  const bar = names.slice(0, 18)
  const rail = names.slice(0, 9)
  const ribbon = names.slice(0, 6)
  const sized = (name: string): IconComponent => {
    const Icon = componentOf(name)
    return (props) => <Icon {...props} strokeWidth={stroke} accent={accent} />
  }
  const words = (name: string) => name.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
  return (
    <div className="icons-contexts">
      <figure>
        <figcaption>Toolbar, 16 px</figcaption>
        <div className="icons-context-bar">
          {bar.map((name) => (
            <IconButton key={name} icon={sized(name)} label={name} onClick={() => onSelect(name)} />
          ))}
        </div>
      </figure>
      <div className="icons-context-split">
        <figure>
          <figcaption>Tool rail</figcaption>
          <div className="icons-context-rail kui-tool-rail">
            {rail.map((name, i) => (
              <IconButton key={name} icon={sized(name)} label={name} pressed={i === 0} onClick={() => onSelect(name)} />
            ))}
          </div>
        </figure>
        <figure>
          <figcaption>Ribbon</figcaption>
          <div className="icons-context-ribbon">
            <RibbonGroup label="Large">
              {ribbon.slice(0, 3).map((name) => (
                <RibbonButton key={name} icon={sized(name)} label={words(name)} size="large" onClick={() => onSelect(name)} />
              ))}
            </RibbonGroup>
            <RibbonGroup label="Small">
              {ribbon.slice(3).map((name) => (
                <RibbonButton key={name} icon={sized(name)} label={words(name)} onClick={() => onSelect(name)} />
              ))}
            </RibbonGroup>
          </div>
          <figcaption>Buttons</figcaption>
          <div className="icons-context-buttons">
            {ribbon.slice(0, 4).map((name, i) => {
              const Icon = sized(name)
              return (
                <Button key={name} variant={i === 0 ? 'primary' : 'secondary'} size="md" onClick={() => onSelect(name)}>
                  <Icon size={16} /> {words(name)}
                </Button>
              )
            })}
          </div>
        </figure>
      </div>
      {names.length > bar.length ? <p className="icons-hint">Showing the first {bar.length} of {names.length} matches. Narrow the search to see others here.</p> : null}
    </div>
  )
}

const svgFile = (icon: IconData, stroke: number, size = 24) => toSvg(icon, { size, strokeWidth: stroke }).replace(/currentColor/g, '#1a1a1a')

function download(name: string, data: Blob) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(data)
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

/** The icon as a PNG of `pixels` square, drawn from its SVG. */
function downloadPng(icon: IconData, stroke: number, pixels: number) {
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = pixels
    canvas.getContext('2d')?.drawImage(image, 0, 0, pixels, pixels)
    canvas.toBlob((blob) => blob && download(`${icon.name}.png`, blob), 'image/png')
  }
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFile(icon, stroke, pixels))}`
}

const CODE_KINDS = [
  { value: 'react', label: 'React' },
  { value: 'svg', label: 'SVG' },
  { value: 'canvas', label: 'Canvas' },
  { value: 'rust', label: 'Rust' },
]

function IconDetail({ name, stroke, accent, onClose, onPick }: { name: string; stroke: number; accent: boolean; onClose: () => void; onPick: (name: string) => void }) {
  const icon = ICONS[name]
  const Icon = componentOf(name)
  const [kind, setKind] = useState('react')
  const [grid, setGrid] = useState(true)
  const component = `${pascal(name)}Icon`
  const code: Record<string, string> = {
    react: `import { ${component} } from '@kition/tessera-icons/react'\n\n<${component} size={16} />`,
    svg: toSvg(icon, { size: 24, strokeWidth: stroke }),
    canvas: `import { ${pascal(name)}, drawIcon } from '@kition/tessera-icons'\n\ndrawIcon(ctx, ${pascal(name)}, x, y, { size: 16 })`,
    rust: `use tessera_icons::${name.replace(/-/g, '_').toUpperCase()};\n\nfor path in ${name.replace(/-/g, '_').toUpperCase()}.paths { /* stroke it */ }`,
  }
  const info = ICON_SEARCH[name]
  const related = useMemo(() => ICON_NAMES.filter((other) => other !== name && other.split('-')[0] === name.split('-')[0]).slice(0, 8), [name])
  const Sized: IconComponent = (props) => <Icon {...props} strokeWidth={stroke} accent={accent} />
  return (
    <aside className="icons-detail" aria-label={name}>
      <div className="icons-detail-head">
        <h3>{name}</h3>
        <button type="button" className="icons-detail-close" onClick={onClose} aria-label="Close">
          <XIcon size={16} />
        </button>
      </div>
      <div className="icons-detail-art" data-grid={grid || undefined}>
        <Icon size={120} strokeWidth={stroke} accent={accent} />
      </div>
      <div className="icons-detail-row">
        <div className="icons-detail-sizes">
          {[16, 20, 24, 32, 48].map((value) => (
            <span key={value} title={`${value} px`}>
              <Icon size={value} strokeWidth={stroke} accent={accent} />
            </span>
          ))}
        </div>
        <label className="icons-accent">
          <Switch checked={grid} onCheckedChange={setGrid} aria-label="Show the 24 grid" /> Grid
        </label>
      </div>
      <div className="icons-detail-uses">
        <IconButton icon={Sized} label={name} />
        <IconButton icon={Sized} label={name} pressed />
        <Button variant="secondary" size="sm">
          <Sized size={16} /> Label
        </Button>
        <Button variant="primary" size="sm">
          <Sized size={16} /> Label
        </Button>
      </div>
      <Segmented label="Code" value={kind} onChange={setKind} segments={CODE_KINDS} />
      <CodeBlock code={code[kind]} label={CODE_KINDS.find((item) => item.value === kind)?.label} />
      <div className="icons-detail-downloads">
        <Button variant="secondary" size="sm" onClick={() => download(`${name}.svg`, new Blob([svgFile(icon, stroke)], { type: 'image/svg+xml' }))}>
          <DownloadIcon size={15} /> SVG
        </Button>
        <Button variant="secondary" size="sm" onClick={() => downloadPng(icon, stroke, 256)}>
          <DownloadIcon size={15} /> PNG 256
        </Button>
      </div>
      <dl className="icons-facts">
        <dt>Family</dt>
        <dd>{icon.family === 'tool' ? 'Tool (with accents)' : 'Interface'}</dd>
        <dt>Category</dt>
        <dd>{ICON_CATEGORIES[info.category]}</dd>
        <dt>Also found as</dt>
        {/* The words in other languages are searched, not listed: the site is in English. */}
        <dd>{info.keywords.filter((word) => /^[\x20-\x7e]+$/.test(word)).join(', ')}</dd>
        {ALIASES.get(name)?.length ? (
          <>
            <dt>lucide-react</dt>
            <dd>{ALIASES.get(name)!.join(', ')}</dd>
          </>
        ) : null}
      </dl>
      {related.length ? (
        <div className="icons-related">
          <p>Related</p>
          {related.map((other) => {
            const Other = componentOf(other)
            return (
              <button key={other} type="button" title={other} aria-label={other} onClick={() => onPick(other)}>
                <Other size={20} strokeWidth={stroke} accent={accent} />
              </button>
            )
          })}
        </div>
      ) : null}
    </aside>
  )
}

/** The icons picked with Shift: their import line, their names, or all of them as one SVG sprite. */
function Picked({ names, onClear }: { names: string[]; onClear: () => void }) {
  const copy = (text: string, done: string) => {
    void navigator.clipboard?.writeText(text)
    toast.success(done)
  }
  const sprite = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${names
      .map((name) => {
        const icon = ICONS[name]
        return `  <symbol id="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon.paths.map((d) => `<path d="${d}"/>`).join('')}${icon.fills.map((d) => `<path d="${d}" fill="currentColor" stroke="none"/>`).join('')}</symbol>`
      })
      .join('\n')}\n</svg>\n`
  return (
    <div className="icons-picked" role="region" aria-label="Picked icons">
      <strong>{names.length} picked</strong>
      <div className="icons-picked-list">
        {names.slice(0, 12).map((name) => {
          const Icon = componentOf(name)
          return <Icon key={name} size={18} />
        })}
      </div>
      <Button variant="secondary" size="sm" onClick={() => copy(`import { ${names.map((name) => `${pascal(name)}Icon`).join(', ')} } from '@kition/tessera-icons/react'`, 'Import line copied')}>
        Copy import
      </Button>
      <Button variant="secondary" size="sm" onClick={() => copy(names.join('\n'), 'Names copied')}>
        Copy names
      </Button>
      <Button variant="secondary" size="sm" onClick={() => download('tessera-icons.svg', new Blob([sprite()], { type: 'image/svg+xml' }))}>
        <DownloadIcon size={15} /> SVG sprite
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}
