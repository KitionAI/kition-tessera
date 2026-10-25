import { useState, type ReactElement } from 'react'
import { ICONS } from '@kition/tessera-icons/registry'
import type { IconData } from '@kition/tessera-icons'

/**
 * Candidate directions for Tessera's own icon style, drawn automatically from today's paths so
 * the owner can compare them in place. They explore a direction; the final icons are redrawn by
 * hand to the chosen style's rules.
 */
const SAMPLE = [
  'pen-tool', 'brush', 'eraser', 'lasso', 'crop', 'pipette', 'paint-bucket', 'stamp',
  'type', 'move', 'hand', 'square-dashed-mouse-pointer', 'spline', 'parallelogram', 'ruler', 'grid-3x3',
  'layers', 'image', 'wand-sparkles', 'sun-medium', 'mark-in', 'clip-insert', 'play', 'scissors',
  'table', 'chart-column', 'bold', 'align-center-horizontal', 'undo-2', 'redo-2', 'save', 'sparkles',
  'search', 'settings', 'folder-open', 'file-plus', 'share-2', 'message-square', 'zoom-in',
]

const TOOLBAR = ['undo-2', 'redo-2', 'save', 'scissors', 'bold', 'align-center-horizontal', 'image', 'table', 'chart-column', 'sparkles', 'share-2']
const RAIL = ['square-dashed-mouse-pointer', 'move', 'hand', 'lasso', 'crop', 'pen-tool', 'brush', 'eraser', 'stamp', 'paint-bucket', 'pipette', 'type', 'zoom-in']

type Style = { id: string; name: string; note: string; draw: (icon: IconData, size: number) => ReactElement }

/** Whether a path's last subpath closes, so a two-tone style can fill it. */
const closed = (d: string) => /[zZ]\s*$/.test(d)

const svg = (size: number, children: React.ReactNode, extra: React.SVGProps<SVGSVGElement> = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...extra}>
    {children}
  </svg>
)

const STYLES: Style[] = [
  {
    id: 'today',
    name: 'Today (Lucide)',
    note: '1.75 stroke, round caps. What every kit draws now.',
    draw: (icon, size) =>
      svg(
        size,
        <>
          {icon.paths.map((d, i) => <path key={i} d={d} />)}
          {icon.fills.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" />)}
        </>,
        { strokeWidth: 1.75 },
      ),
  },
  {
    id: 'fine',
    name: 'A · Fine line',
    note: '1.5 stroke, round caps: light and precise, close to SF Symbols regular.',
    draw: (icon, size) =>
      svg(
        size,
        <>
          {icon.paths.map((d, i) => <path key={i} d={d} />)}
          {icon.fills.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" />)}
        </>,
        { strokeWidth: size <= 16 ? 1.6 : 1.5 },
      ),
  },
  {
    id: 'duotone',
    name: 'B · Duotone',
    note: 'Line plus closed areas filled with the skin\'s accent at 22%: echoes the kit icons and the mosaic, and follows the skin. Drawn automatically it is faint, because most of today\'s shapes are open lines; redrawn, each icon gets a filled area on purpose.',
    draw: (icon, size) =>
      svg(
        size,
        <>
          {icon.paths.filter(closed).map((d, i) => <path key={`t${i}`} d={d} fill="var(--kit-primary)" fillOpacity={0.22} stroke="none" />)}
          {icon.paths.map((d, i) => <path key={i} d={d} />)}
          {icon.fills.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" />)}
        </>,
        { strokeWidth: 1.6 },
      ),
  },
  {
    id: 'bold',
    name: 'C · Bold geometric',
    note: '2.25 stroke, flat caps, sharp joins: firm, closer to professional tool palettes.',
    draw: (icon, size) =>
      svg(
        size,
        <>
          {icon.paths.map((d, i) => <path key={i} d={d} />)}
          {icon.fills.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" />)}
        </>,
        { strokeWidth: 2.25, strokeLinecap: 'butt', strokeLinejoin: 'miter' },
      ),
  },
  {
    id: 'tile',
    name: 'D · Tessera tile',
    note: 'The glyph on a soft rounded tile: the tessera itself. Strong identity; heavier in dense toolbars.',
    draw: (icon, size) => (
      <span className="lab-tile" style={{ width: size + 8, height: size + 8 }}>
        {svg(
          size - 4,
          <>
            {icon.paths.map((d, i) => <path key={i} d={d} />)}
            {icon.fills.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" />)}
          </>,
          { strokeWidth: 2 },
        )}
      </span>
    ),
  },
]

export function StyleLab() {
  const [size, setSize] = useState(24)
  return (
    <div className="page">
      <section className="page-intro">
        <h1>Icon style lab</h1>
        <p>
          Candidate directions for Tessera&apos;s own icon style, drawn automatically from today&apos;s shapes so they can be compared in place, in a toolbar, and in a tool
          rail, under both skins. Pick a direction; the icons are then redrawn by hand to its rules, batch by batch, and every kit follows (they all draw Tessera Icons now).
        </p>
      </section>
      <div className="toolbar">
        <label>
          Size
          <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
            {[16, 20, 24, 32].map((value) => (
              <option key={value} value={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>
      </div>
      {STYLES.map((style) => (
        <section key={style.id} className="lab-style">
          <header>
            <h2>{style.name}</h2>
            <p>{style.note}</p>
          </header>
          <div className="lab-context">
            <div className="lab-bar" aria-label={`${style.name} toolbar`}>
              {TOOLBAR.map((name) => (
                <span key={name} className="lab-button" title={name}>
                  {style.draw(ICONS[name], 16)}
                </span>
              ))}
            </div>
            <div className="lab-rail" aria-label={`${style.name} tool rail`}>
              {RAIL.map((name, i) => (
                <span key={name} className="lab-button" data-active={i === 5 || undefined} title={name}>
                  {style.draw(ICONS[name], 18)}
                </span>
              ))}
            </div>
          </div>
          <div className="lab-grid">
            {SAMPLE.filter((name) => ICONS[name]).map((name) => (
              <figure key={name} className="lab-cell" title={name}>
                {style.draw(ICONS[name], size)}
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
