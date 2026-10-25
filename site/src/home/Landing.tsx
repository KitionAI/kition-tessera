import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ColorPicker,
  ColorWheel,
  CurveEditor,
  Histogram,
  IconButton,
  NumberField,
  RGB_IDENTITY,
  RibbonButton,
  RibbonGroup,
  RibbonStack,
  Segmented,
  TimecodeField,
  TransportBar,
  type CurvePoint,
  type RGB,
} from '@kition/tessera'
import {
  BoldIcon,
  BrushIcon,
  ChartColumnIcon,
  ClipboardPasteIcon,
  CopyIcon,
  CropIcon,
  EraserIcon,
  ItalicIcon,
  LassoIcon,
  LayersIcon,
  MoveIcon,
  PenToolIcon,
  PlayIcon,
  ScissorsIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TextAlignCenterIcon,
  TextAlignStartIcon,
  TypeIcon,
  createIcon,
  type IconComponent,
} from '@kition/tessera-icons/react'
import { ICONS, ICON_NAMES, KIT_ICONS } from '@kition/tessera-icons/registry'
import { KHP_TOKENS, SKINS, SKIN_IDS, type SkinId } from '@kition/tessera-tokens'

const KIT_ORDER = ['note', 'table', 'board', 'photo', 'film', 'doc', 'sheet', 'slide', 'pdf', 'vector', 'design', 'effect', 'cad']
const KIT_NAMES: Record<string, string> = {
  note: 'Note',
  table: 'Table',
  board: 'Board',
  photo: 'Photo',
  film: 'Film',
  doc: 'Doc',
  sheet: 'Sheet',
  slide: 'Slide',
  pdf: 'PDF',
  vector: 'Vector',
  design: 'Design',
  effect: 'Effect',
  cad: 'CAD',
}

const kitFiles = import.meta.glob('../../../packages/icons/kit/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const kitUrl = (kit: string) => Object.entries(kitFiles).find(([path]) => path.endsWith(`/${kit}.svg`))?.[1]

const skinStyle = (id: SkinId) => ({ ...SKINS[id].tokens, colorScheme: SKINS[id].colorScheme }) as CSSProperties

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const components = new Map<string, IconComponent>()
const iconOf = (name: string) => {
  let component = components.get(name)
  if (!component) components.set(name, (component = createIcon(ICONS[name])))
  return component
}

export function Landing({ skin }: { skin: SkinId }) {
  return (
    <div className="lx">
      <Hero skin={skin} />
      <IconMarquee />
      <Bento />
      <Kits />
      <Closing />
    </div>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero({ skin }: { skin: SkinId }) {
  const stage = useRef<HTMLDivElement>(null)
  // Pointer parallax: the floating cards lean toward the pointer, each by its own depth.
  useEffect(() => {
    const element = stage.current
    if (!element || reducedMotion()) return
    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        element.style.setProperty('--px', x.toFixed(3))
        element.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])
  return (
    <section className="lx-hero">
      <div className="lx-aurora" aria-hidden="true">
        <span className="lx-blob lx-blob-a" />
        <span className="lx-blob lx-blob-b" />
        <span className="lx-blob lx-blob-c" />
        <span className="lx-grid" />
      </div>
      <div className="lx-hero-copy">
        <a className="lx-pill" href="#review">
          <span className="lx-pill-dot" /> New · 51 CAD drafting icons and every slide transition redrawn
        </a>
        <h1 className="lx-title">
          Every <span className="lx-gradient">kit.</span>
          <br />
          One design language.
        </h1>
        <p className="lx-lede">
          Kition Tessera is the design system for AI-native professional software: icons, design tokens and editor components that a photo editor, a spreadsheet and a
          timeline share, so they read as one suite and any host can reskin them all at once.
        </p>
        <div className="lx-actions">
          <a className="lx-cta" href="#components">
            Explore components
          </a>
          <a className="lx-ghost" href="#icons">
            Browse {ICON_NAMES.length} icons
          </a>
          <CopyCommand text="pnpm add @kition/tessera" />
        </div>
      </div>
      <div className="lx-stage" ref={stage} style={skinStyle(skin)}>
        <div className="lx-stage-main">
          <EditorWindow />
        </div>
        <FloatCard className="lx-float-wheel" depth={26} label="ColorWheel">
          <WheelDemo />
        </FloatCard>
        <FloatCard className="lx-float-curve" depth={18} label="CurveEditor">
          <CurveDemo />
        </FloatCard>
        <FloatCard className="lx-float-transport" depth={30} label="TransportBar">
          <TransportDemo />
        </FloatCard>
        <FloatCard className="lx-float-icons" depth={14} label="Tessera Icons">
          <div className="lx-icon-chips">
            {['pen-tool', 'lasso', 'animation-fly-in', 'transition-push', 'dimension-aligned', 'fillet', 'array-polar', 'clip-insert'].map((name) => {
              const Icon = iconOf(name)
              return (
                <span key={name} className="lx-chip" title={name}>
                  <Icon size={20} />
                </span>
              )
            })}
          </div>
        </FloatCard>
      </div>
    </section>
  )
}

function CopyCommand({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="lx-command"
      onClick={() => {
        void navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
    >
      <span className="lx-command-prompt">$</span> {text}
      <span className="lx-command-hint">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function FloatCard({ className, depth, label, children }: { className: string; depth: number; label: string; children: ReactNode }) {
  return (
    <div className={`lx-float ${className}`} style={{ '--depth': depth } as CSSProperties}>
      <div className="lx-float-inner">
        <span className="lx-float-label">{label}</span>
        {children}
      </div>
    </div>
  )
}

const TOOLS: [string, IconComponent][] = [
  ['Move', MoveIcon],
  ['Lasso', LassoIcon],
  ['Crop', CropIcon],
  ['Brush', BrushIcon],
  ['Eraser', EraserIcon],
  ['Pen', PenToolIcon],
  ['Type', TypeIcon],
]

function EditorWindow() {
  const [tool, setTool] = useState(3)
  const [exposure, setExposure] = useState(12)
  const [rgb, setRgb] = useState<RGB>([86, 69, 212])
  const bins = useMemo(() => Array.from({ length: 128 }, (_, i) => Math.exp(-((i - 50) ** 2) / 500) * 900 + Math.exp(-((i - 100) ** 2) / 120) * 400 + 30), [])
  return (
    <div className="lx-window">
      <div className="lx-window-bar">
        <span className="lx-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <img src={kitUrl('photo')} alt="" width={16} height={16} />
        <span>Harbor at dusk.psd</span>
      </div>
      <div className="lx-window-ribbon">
        <RibbonGroup label="Clipboard">
          <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
          <RibbonStack>
            <RibbonButton icon={ScissorsIcon} label="Cut" />
            <RibbonButton icon={CopyIcon} label="Copy" />
          </RibbonStack>
        </RibbonGroup>
        <RibbonGroup label="Layer">
          <RibbonButton icon={LayersIcon} label="Layers" size="large" />
          <RibbonButton icon={ChartColumnIcon} label="Levels" size="large" />
        </RibbonGroup>
      </div>
      <div className="lx-window-body">
        <div className="lx-rail">
          {TOOLS.map(([label, Icon], i) => (
            <IconButton key={label} icon={Icon} label={label} pressed={tool === i} onClick={() => setTool(i)} />
          ))}
        </div>
        <div className="lx-canvas" />
        <div className="lx-panel">
          <div className="lx-panel-title">Adjust</div>
          <Histogram bins={bins} height={44} />
          <NumberField label="Exposure" value={exposure} min={-100} max={100} onChange={(value) => setExposure(value)} />
          <ColorPicker value={rgb} onChange={(value) => setRgb(value)} />
        </div>
      </div>
    </div>
  )
}

function WheelDemo() {
  const [value, setValue] = useState<[number, number]>([0.25, -0.15])
  const [lightness, setLightness] = useState(0)
  return <ColorWheel label="Midtones" value={value} lightness={lightness} onChange={(next) => setValue(next)} onLightness={(next) => setLightness(next)} />
}

function CurveDemo({ size = 180 }: { size?: number }) {
  const [points, setPoints] = useState<CurvePoint[]>([...RGB_IDENTITY.slice(0, 1), [0.28, 0.18], [0.72, 0.86], ...RGB_IDENTITY.slice(1)])
  return (
    <div style={{ width: size }}>
      <CurveEditor kind="rgb" points={points} onChange={(next) => setPoints(next)} />
    </div>
  )
}

function TransportDemo() {
  const [time, setTime] = useState(83.4)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => setTime((value) => value + 0.04), 40)
    return () => clearInterval(timer)
  }, [playing])
  return (
    <div className="lx-transport">
      <TimecodeField label="Playhead" value={time} fps={25} onChange={(seconds) => setTime(seconds)} accent />
      <TransportBar
        buttons={[
          { id: 'back', label: 'Back', icon: SkipBackIcon, onPress: () => setTime(0) },
          { id: 'play', label: playing ? 'Pause' : 'Play', icon: PlayIcon, large: true, pressed: playing, onPress: () => setPlaying(!playing) },
          { id: 'fwd', label: 'Forward', icon: SkipForwardIcon, onPress: () => setTime(time + 5) },
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------- marquee */

function IconMarquee() {
  const rows = useMemo(() => {
    const names = [...ICON_NAMES]
    const third = Math.ceil(names.length / 3)
    return [names.slice(0, third), names.slice(third, third * 2), names.slice(third * 2)]
  }, [])
  return (
    <section className="lx-marquee-section">
      <div className="lx-section-head lx-center">
        <p className="lx-eyebrow">Tessera Icons</p>
        <h2>
          {ICON_NAMES.length} icons. <span className="lx-gradient">One stroke.</span>
        </h2>
        <p>A 24 grid, a 1.5 line, round caps, and accents that follow the skin: from Undo to a polar array, every kit draws the same family.</p>
      </div>
      <div className="lx-marquee">
        {rows.map((row, i) => (
          <div key={i} className={`lx-marquee-row ${i % 2 ? 'lx-reverse' : ''}`} style={{ '--speed': `${110 + i * 25}s` } as CSSProperties}>
            {[...row, ...row].map((name, j) => {
              const Icon = iconOf(name)
              return (
                <a key={`${name}-${j}`} className="lx-marquee-tile" href={`#icons/${name}`} title={name} tabIndex={j < row.length ? 0 : -1}>
                  <Icon size={22} />
                </a>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- bento */

function Bento() {
  const [skin, setSkin] = useState<SkinId>('graphite')
  return (
    <section className="lx-section">
      <div className="lx-section-head">
        <p className="lx-eyebrow">Components</p>
        <h2>Built for the work professional editors do.</h2>
        <p>General design systems stop at forms and tables. Tessera goes on: ribbons, docks, wheels, curves, timelines, meters, all styled only by theme tokens.</p>
      </div>
      <div className="lx-bento">
        <div className="lx-cell lx-cell-skin" style={skinStyle(skin)} data-scheme={SKINS[skin].colorScheme}>
          <div className="lx-cell-head">
            <strong>One theme, every kit</strong>
            <div className="lx-skin-switch" role="group" aria-label="Skin">
              {SKIN_IDS.map((id) => (
                <button key={id} type="button" aria-pressed={skin === id} onClick={() => setSkin(id)}>
                  {id === 'paper' ? 'Paper' : id === 'graphite' ? 'Graphite' : id}
                </button>
              ))}
            </div>
          </div>
          <div className="lx-mini-ribbon">
            <RibbonGroup label="Font">
              <RibbonStack>
                <RibbonButton icon={BoldIcon} label="Bold" size="icon" pressed />
                <RibbonButton icon={ItalicIcon} label="Italic" size="icon" />
              </RibbonStack>
            </RibbonGroup>
            <RibbonGroup label="Paragraph">
              <Segmented
                label="Align"
                value="start"
                onChange={() => undefined}
                segments={[
                  { value: 'start', icon: TextAlignStartIcon, label: 'Left' },
                  { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
                ]}
              />
            </RibbonGroup>
            <RibbonGroup label="Insert">
              <RibbonButton icon={iconOf('animation-fly-in')} label="Fly In" size="large" />
              <RibbonButton icon={iconOf('transition-cover')} label="Cover" size="large" />
            </RibbonGroup>
          </div>
          <div className="lx-skin-body">
            <table className="lx-skin-sheet">
              <thead>
                <tr>
                  <th />
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>D</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Design', '42,000', '38,500', '−8%'],
                  ['Engineering', '180,000', '171,200', '−5%'],
                  ['Marketing', '65,000', '70,100', '+8%'],
                  ['Total', '287,000', '279,800', '−3%'],
                ].map((row, i) => (
                  <tr key={row[0]}>
                    <th>{i + 1}</th>
                    {row.map((cell, j) => (
                      <td key={j} data-selected={i === 1 && j === 2 ? true : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lx-skin-bars" aria-hidden="true">
              {[62, 88, 54, 96, 71].map((height, i) => (
                <span key={i} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <p className="lx-cell-note">A host sends one theme over the Kit Harness Protocol; every kit takes it, readable at WCAG AA.</p>
        </div>
        <div className="lx-cell lx-cell-wheel">
          <span className="lx-cell-tag">ColorWheel</span>
          <WheelDemo />
        </div>
        <div className="lx-cell lx-cell-tokens">
          <span className="lx-cell-tag">{KHP_TOKENS.length} theme tokens</span>
          <div className="lx-swatches">
            {SKIN_IDS.map((id) => (
              <div key={id} className="lx-swatch-col">
                {['--kit-primary', '--kit-surface', '--kit-surface-muted', '--kit-canvas', '--kit-text', '--kit-border'].map((token) => (
                  <span key={token} style={{ background: SKINS[id].tokens[token as keyof (typeof SKINS)['paper']['tokens']] }} title={`${id} ${token}`} />
                ))}
                <small>{id}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="lx-cell lx-cell-code">
          <span className="lx-cell-tag">ui/theme</span>
          <pre>
            <code>
              {`{
  "theme": {
    "colorScheme": "dark",
    "tokens": {
      "--kit-primary": "#8b7ff0",
      "--kit-surface": "#1b1e23",
      "--kit-radius-card": "12px"
    }
  }
}`}
            </code>
          </pre>
        </div>
        <div className="lx-cell lx-cell-cad">
          <span className="lx-cell-tag">Tool icons, with accents</span>
          <div className="lx-tool-grid">
            {['polyline', 'arc', 'dimension-linear', 'dimension-angular', 'fillet', 'chamfer', 'array-rectangular', 'constraint-tangent', 'hatch', 'animation-spin', 'transition-reveal', 'clip-extract'].map((name) => {
              const Icon = iconOf(name)
              return (
                <span key={name} title={name}>
                  <Icon size={26} />
                </span>
              )
            })}
          </div>
        </div>
        <div className="lx-cell lx-cell-curve">
          <span className="lx-cell-tag">CurveEditor</span>
          <CurveDemo size={130} />
        </div>
        <div className="lx-cell lx-cell-transport">
          <span className="lx-cell-tag">Timecode and transport</span>
          <TransportDemo />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- kits */

function Kits() {
  const kits = KIT_ORDER.filter((kit) => KIT_ICONS.includes(kit))
  return (
    <section className="lx-section">
      <div className="lx-section-head lx-center">
        <p className="lx-eyebrow">Kition kits</p>
        <h2>Thirteen kits. One family.</h2>
      </div>
      <div className="lx-kits">
        {kits.map((kit) => (
          <figure key={kit} className="lx-kit">
            <img src={kitUrl(kit)} alt="" width={56} height={56} />
            <figcaption>{KIT_NAMES[kit] ?? kit}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- closing */

function Closing() {
  return (
    <section className="lx-closing">
      <div className="lx-closing-inner">
        <h2>Build your kit on Tessera.</h2>
        <p>Tokens, icons and components in three packages, for React, the canvas, and Rust engines.</p>
        <div className="lx-actions lx-center-row">
          <a className="lx-cta lx-cta-light" href="#components">
            Start with components
          </a>
          <CopyCommand text="pnpm add @kition/tessera @kition/tessera-icons" />
        </div>
      </div>
    </section>
  )
}
