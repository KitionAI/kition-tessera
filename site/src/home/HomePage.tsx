import { useEffect, useMemo, useRef, useState } from 'react'
import { createIcon } from '@kition/tessera-icons/react'
import { ICONS, ICON_NAMES, KIT_ICONS } from '@kition/tessera-icons/registry'
import { KHP_TOKENS, SKIN_IDS } from '@kition/tessera-tokens'
import iconKits from './iconKits.json'
import { hasWebGL, mountMosaic, type MosaicHandle, type MosaicTile, type Theme } from './mosaic'

/** Kit order (Kition Universe's) and the kit hues (kition kits/kit-colors.json). */
const KITS = ['note', 'table', 'board', 'photo', 'film', 'doc', 'sheet', 'slide', 'pdf', 'vector', 'design', 'effect', 'cad', 'layout', 'html'] as const
const KIT_COLORS: Record<string, string> = {
  note: '#7b6cf0',
  doc: '#4a7cf0',
  table: '#16a594',
  sheet: '#2aa857',
  board: '#e0a800',
  slide: '#e0711f',
  design: '#ef4a6c',
  layout: '#e04aa0',
  html: '#d9693a',
  vector: '#78a81e',
  photo: '#159fc4',
  effect: '#bf5ee0',
  film: '#7d8299',
  pdf: '#ea5243',
  cad: '#6a8aa8',
}
const SHARED = '#8b7dff'

const kitFiles = import.meta.glob('../../../packages/icons/kit/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const kitUrl = (file: string) => Object.entries(kitFiles).find(([path]) => path.endsWith(`/${file}`))?.[1]

function buildTiles(): MosaicTile[] {
  const usage = iconKits as Record<string, string[]>
  const icons = ICON_NAMES.map((name): MosaicTile => {
    const scopes = usage[name] ?? []
    const kits = scopes.filter((scope) => (KITS as readonly string[]).includes(scope))
    const shared = scopes.length >= 5 || kits.length === 0
    const kit = shared ? null : kits.sort((a, b) => KITS.indexOf(a as never) - KITS.indexOf(b as never))[0]
    return { id: name, label: name, kind: 'icon', arm: kit ? KITS.indexOf(kit as never) : -1, color: kit ? KIT_COLORS[kit] : SHARED, paths: ICONS[name].paths, fills: ICONS[name].fills }
  })
  const kits = KIT_ICONS.map(
    (kit): MosaicTile => ({ id: `kit:${kit}`, label: `${kit} kit`, kind: 'kit', arm: Math.max(0, KITS.indexOf(kit as never)), color: KIT_COLORS[kit] ?? SHARED, image: kitUrl(`${kit}.svg`) }),
  )
  return [...kits, ...icons]
}

export function HomePage({ dark }: { dark: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const handle = useRef<MosaicHandle | null>(null)
  const [assembled, setAssembled] = useState(false)
  const [hover, setHover] = useState<{ tile: MosaicTile; x: number; y: number } | null>(null)
  const [webgl] = useState(hasWebGL)
  const tiles = useMemo(buildTiles, [])
  const theme: Theme = dark ? 'dark' : 'light'
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    if (!webgl || !host.current) return
    let disposed = false
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    void mountMosaic(host.current, tiles, {
      theme: themeRef.current,
      reducedMotion: reduced,
      onHover: (tile, x, y) => setHover(tile ? { tile, x, y } : null),
      onPick: (tile) => {
        location.hash = tile.kind === 'kit' ? '#icons' : `#icons/${tile.id}`
      },
    }).then((mounted) => {
      if (disposed) mounted.dispose()
      else handle.current = mounted
    })
    return () => {
      disposed = true
      handle.current?.dispose()
      handle.current = null
    }
  }, [tiles, webgl])

  useEffect(() => handle.current?.setTheme(theme), [theme])
  useEffect(() => handle.current?.setAssembled(assembled), [assembled])

  const shared = tiles.filter((tile) => tile.kind === 'icon' && tile.arm < 0).length

  return (
    <div className="home" data-theme={theme} data-assembled={assembled || undefined}>
      <div ref={host} className="home-stage">
        {webgl ? null : <StaticMosaic tiles={tiles} />}
      </div>
      <div className="home-hero">
        <p className="home-kicker">Kition Tessera</p>
        <h1>
          The design system for
          <br />
          AI-native professional software.
        </h1>
        <p className="home-lede">
          Every tile is a tessera. Icons, tokens and components that every kit is built from, so a photo editor, a timeline and a spreadsheet look like one suite, and any
          host can reskin them all.
        </p>
        <div className="home-actions">
          <button type="button" className="home-primary" onClick={() => setAssembled(!assembled)} disabled={!webgl}>
            {assembled ? 'Scatter into the galaxy' : 'Assemble the mosaic'}
          </button>
          <a className="home-secondary" href="#icons">
            Browse icons
          </a>
          <a className="home-secondary" href="#components">
            Components
          </a>
        </div>
        <dl className="home-stats">
          <div>
            <dt>{ICON_NAMES.length}</dt>
            <dd>icons</dd>
          </div>
          <div>
            <dt>{KIT_ICONS.length}</dt>
            <dd>kit icons</dd>
          </div>
          <div>
            <dt>{KHP_TOKENS.length}</dt>
            <dd>KHP theme tokens</dd>
          </div>
          <div>
            <dt>{SKIN_IDS.length}</dt>
            <dd>skins</dd>
          </div>
        </dl>
      </div>
      <p className="home-legend">
        {assembled
          ? 'The mosaic: every icon, banded by the kit that uses it. Click a tile to open it.'
          : `One arm per kit. The ${shared} icons near the core are shared by many kits. Drag to orbit, scroll to zoom, click a tile to open it.`}
      </p>
      {hover ? (
        <div className="home-tooltip" style={{ left: hover.x, top: hover.y }}>
          {hover.tile.label}
        </div>
      ) : null}
    </div>
  )
}

/** Without WebGL: the mosaic as a flat grid. */
function StaticMosaic({ tiles }: { tiles: MosaicTile[] }) {
  return (
    <div className="static-mosaic">
      {tiles
        .filter((tile) => tile.kind === 'icon')
        .sort((a, b) => a.arm - b.arm)
        .map((tile) => {
          const Icon = createIcon(ICONS[tile.id])
          return (
            <a key={tile.id} href={`#icons/${tile.id}`} style={{ background: tile.color }} title={tile.label}>
              <Icon size={18} color="#fff" />
            </a>
          )
        })}
    </div>
  )
}
