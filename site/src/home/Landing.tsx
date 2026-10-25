import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Button,
  ColorPicker,
  Histogram,
  IconButton,
  NumberField,
  RibbonButton,
  RibbonGroup,
  RibbonStack,
  Segmented,
  TimecodeField,
  TransportBar,
  type RGB,
} from '@kition/tessera'
import {
  BoldIcon,
  BrushIcon,
  ChartColumnIcon,
  ClipboardPasteIcon,
  ClipInsertIcon,
  CopyIcon,
  CropIcon,
  EraserIcon,
  ItalicIcon,
  LassoIcon,
  LayersIcon,
  MarkInIcon,
  MarkOutIcon,
  MoveIcon,
  PenToolIcon,
  PlayIcon,
  ScissorsIcon,
  SigmaIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SunMediumIcon,
  TableIcon,
  TextAlignCenterIcon,
  TextAlignStartIcon,
  TypeIcon,
  createIcon,
  type IconComponent,
} from '@kition/tessera-icons/react'
import { ICONS, ICON_NAMES, KIT_ICONS } from '@kition/tessera-icons/registry'
import { KHP_TOKENS, SKINS, SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import iconKits from './iconKits.json'

const KITS = ['note', 'table', 'board', 'photo', 'film', 'doc', 'sheet', 'slide', 'pdf', 'vector', 'design', 'effect', 'cad'] as const
const KIT_COLORS: Record<string, string> = {
  note: '#7b6cf0',
  doc: '#4a7cf0',
  table: '#16a594',
  sheet: '#2aa857',
  board: '#e0a800',
  slide: '#e0711f',
  design: '#ef4a6c',
  vector: '#78a81e',
  photo: '#159fc4',
  effect: '#bf5ee0',
  film: '#7d8299',
  pdf: '#ea5243',
  cad: '#6a8aa8',
}

const kitFiles = import.meta.glob('../../../packages/icons/kit/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const kitUrl = (kit: string) => Object.entries(kitFiles).find(([path]) => path.endsWith(`/${kit}.svg`))?.[1]

/** The kit that uses an icon most specifically, for its tile's hue; shared icons are the brand's. */
function hueOf(name: string) {
  const scopes = (iconKits as Record<string, string[]>)[name] ?? []
  const kits = scopes.filter((scope) => (KITS as readonly string[]).includes(scope))
  if (scopes.length >= 5 || kits.length === 0) return '#7b6cf0'
  return KIT_COLORS[kits.sort((a, b) => KITS.indexOf(a as never) - KITS.indexOf(b as never))[0]]
}

const skinStyle = (id: SkinId) => ({ ...SKINS[id].tokens, colorScheme: SKINS[id].colorScheme }) as CSSProperties

export function Landing({ skin }: { skin: SkinId }) {
  return (
    <div className="landing">
      <Hero skin={skin} />
      <EveryKit />
      <Layers />
    </div>
  )
}

function Hero({ skin }: { skin: SkinId }) {
  return (
    <section className="landing-hero">
      <MosaicWall />
      <div className="landing-hero-inner">
        <div className="landing-copy">
          <p className="landing-kicker">Kition Tessera</p>
          <h1>One design language for every kit.</h1>
          <p className="landing-lede">
            A tessera is one tile of a mosaic. Kition Tessera is the tiles every Kition kit is built from: icons, design tokens and editor components, so a photo editor, a
            spreadsheet and a timeline read as one suite, and any host can reskin them all at once.
          </p>
          <div className="landing-actions">
            <a className="landing-cta" href="#components">
              Explore components
            </a>
            <a className="landing-link" href="#icons">
              Browse {ICON_NAMES.length} icons
            </a>
          </div>
        </div>
        <div className="landing-window-slot" style={skinStyle(skin)}>
          <MiniEditor kit="photo" title="Harbor at dusk.psd">
            <PhotoBody />
          </MiniEditor>
        </div>
      </div>
    </section>
  )
}

/** Every icon as a small tile, in bands of the kit hues; tiles light up under the pointer. */
function MosaicWall() {
  const tiles = useMemo(
    () =>
      [...ICON_NAMES]
        .map((name) => ({ name, hue: hueOf(name), Icon: createIcon(ICONS[name]) }))
        .sort((a, b) => a.hue.localeCompare(b.hue))
        .slice(0, 260),
    [],
  )
  return (
    <div className="mosaic-wall" aria-hidden="true">
      {tiles.map(({ name, hue, Icon }) => (
        <span key={name} className="mosaic-tile" style={{ '--hue': hue } as CSSProperties}>
          <Icon size={16} strokeWidth={1.75} />
        </span>
      ))}
    </div>
  )
}

/** A small editor window built only from Tessera components. */
function MiniEditor({ kit, title, ribbon, children }: { kit: string; title: string; ribbon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mini-editor">
      <div className="mini-titlebar">
        <img src={kitUrl(kit)} alt="" width={18} height={18} />
        <span>{title}</span>
      </div>
      {ribbon ? <div className="mini-ribbon">{ribbon}</div> : null}
      <div className="mini-body">{children}</div>
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

function PhotoBody() {
  const [tool, setTool] = useState(3)
  const [rgb, setRgb] = useState<RGB>([86, 69, 212])
  const [exposure, setExposure] = useState(12)
  const bins = useMemo(() => Array.from({ length: 128 }, (_, i) => Math.exp(-((i - 50) ** 2) / 500) * 900 + Math.exp(-((i - 100) ** 2) / 120) * 400 + 30), [])
  return (
    <div className="photo-body">
      <div className="mini-rail">
        {TOOLS.map(([label, Icon], i) => (
          <IconButton key={label} icon={Icon} label={label} pressed={tool === i} onClick={() => setTool(i)} />
        ))}
      </div>
      <div className="mini-canvas photo-canvas" />
      <div className="mini-panel">
        <div className="mini-panel-title">
          <LayersIcon size={14} /> Adjust
        </div>
        <Histogram bins={bins} height={48} />
        <NumberField label="Exposure" value={exposure} min={-100} max={100} onChange={(value) => setExposure(value)} />
        <ColorPicker value={rgb} onChange={(value) => setRgb(value)} />
      </div>
    </div>
  )
}

function EveryKit() {
  const [skin, setSkin] = useState<SkinId>('paper')
  return (
    <section className="landing-section">
      <div className="landing-section-head">
        <div>
          <h2>Same tiles, every kit.</h2>
          <p>
            Three kits, three kinds of work, one set of icons and components. Switch the skin: a host sends one theme over the Kit Harness Protocol and every kit takes it at
            once.
          </p>
        </div>
        <div className="skin-switch" role="group" aria-label="Skin">
          {SKIN_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={skin === id} onClick={() => setSkin(id)}>
              {id === 'paper' ? 'Paper' : id === 'graphite' ? 'Graphite' : id}
            </button>
          ))}
        </div>
      </div>
      <div className="kit-row" style={skinStyle(skin)} data-color-scheme={SKINS[skin].colorScheme}>
        <MiniEditor kit="sheet" title="Budget 2027.xlsx" ribbon={<SheetRibbon />}>
          <SheetBody />
        </MiniEditor>
        <MiniEditor kit="film" title="Launch film.kfilm" ribbon={<FilmRibbon />}>
          <FilmBody />
        </MiniEditor>
        <MiniEditor kit="slide" title="Kickoff.pptx" ribbon={<SlideRibbon />}>
          <SlideBody />
        </MiniEditor>
      </div>
    </section>
  )
}

function SheetRibbon() {
  return (
    <>
      <RibbonGroup label="Clipboard">
        <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
      </RibbonGroup>
      <RibbonGroup label="Font">
        <RibbonStack>
          <RibbonButton icon={BoldIcon} label="Bold" size="icon" pressed />
          <RibbonButton icon={ItalicIcon} label="Italic" size="icon" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Insert">
        <RibbonButton icon={ChartColumnIcon} label="Chart" size="large" />
        <RibbonButton icon={SigmaIcon} label="Sum" size="large" />
      </RibbonGroup>
    </>
  )
}

function SheetBody() {
  const rows = [
    ['Design', '42,000', '38,500'],
    ['Engineering', '180,000', '171,200'],
    ['Marketing', '65,000', '70,100'],
    ['Total', '287,000', '279,800'],
  ]
  return (
    <table className="mini-sheet">
      <thead>
        <tr>
          <th />
          <th>A</th>
          <th>B</th>
          <th>C</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
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
  )
}

function FilmRibbon() {
  return (
    <>
      <RibbonGroup label="Marks">
        <RibbonStack>
          <RibbonButton icon={MarkInIcon} label="Mark In" size="icon" />
          <RibbonButton icon={MarkOutIcon} label="Mark Out" size="icon" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Edit">
        <RibbonButton icon={ClipInsertIcon} label="Insert" size="large" />
        <RibbonButton icon={ScissorsIcon} label="Razor" size="large" />
      </RibbonGroup>
    </>
  )
}

function FilmBody() {
  const [time, setTime] = useState(12.4)
  return (
    <div className="film-body">
      <div className="mini-canvas film-canvas" />
      <div className="film-controls">
        <TimecodeField label="Playhead" value={time} fps={25} onChange={(seconds) => setTime(seconds)} accent />
        <TransportBar
          buttons={[
            { id: 'back', label: 'Back', icon: SkipBackIcon, onPress: () => setTime(0) },
            { id: 'play', label: 'Play', icon: PlayIcon, large: true, onPress: () => setTime(time + 1) },
            { id: 'fwd', label: 'Forward', icon: SkipForwardIcon, onPress: () => setTime(time + 5) },
          ]}
        />
        <div className="film-track" aria-label="Timeline">
          {[
            ['Intro', 18],
            ['Interview', 34],
            ['B-roll', 22],
            ['Outro', 14],
          ].map(([label, width]) => (
            <span key={label} style={{ flexBasis: `${width}%` }}>
              {label}
            </span>
          ))}
          <i style={{ left: `${Math.min(96, (time / 40) * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

function SlideRibbon() {
  return (
    <>
      <RibbonGroup label="Clipboard">
        <RibbonStack>
          <RibbonButton icon={ScissorsIcon} label="Cut" />
          <RibbonButton icon={CopyIcon} label="Copy" />
        </RibbonStack>
      </RibbonGroup>
      <RibbonGroup label="Insert">
        <RibbonButton icon={TableIcon} label="Table" size="large" />
        <RibbonButton icon={SunMediumIcon} label="Theme" size="large" />
      </RibbonGroup>
    </>
  )
}

function SlideBody() {
  const [align, setAlign] = useState<'start' | 'center'>('start')
  return (
    <div className="slide-body">
      <div className="slide-page" data-align={align}>
        <strong>Kickoff</strong>
        <span>One suite, every kit</span>
      </div>
      <div className="slide-controls">
        <Segmented
          label="Alignment"
          value={align}
          onChange={setAlign}
          segments={[
            { value: 'start', icon: TextAlignStartIcon, label: 'Left' },
            { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
          ]}
        />
        <Button variant="primary" size="sm">
          Present
        </Button>
      </div>
    </div>
  )
}

function Layers() {
  const cards = [
    { href: '#icons', count: String(ICON_NAMES.length), unit: 'icons', title: 'Tessera Icons', body: `${KIT_ICONS.length} kit icons and one stroke style, as React components, canvas paths and Rust, so the editor and the engine draw the same shapes.` },
    { href: '#tokens', count: String(KHP_TOKENS.length), unit: 'theme tokens', title: 'Tokens and skins', body: `The Kit Harness Protocol's theme tokens with ${SKIN_IDS.length} skins. A host sends one theme; every kit follows, readable at WCAG AA.` },
    { href: '#components', count: '40+', unit: 'components', title: 'Components', body: 'What professional editors need and general design systems lack: ribbons, docks, color wheels, curves, timelines, meters.' },
  ]
  return (
    <section className="landing-section">
      <h2>Three layers, one system.</h2>
      <div className="layer-cards">
        {cards.map((card) => (
          <a key={card.href} className="layer-card" href={card.href}>
            <span className="layer-count">
              {card.count} <small>{card.unit}</small>
            </span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
