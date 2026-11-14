import { useEffect, useRef, useState } from 'react'
import { drawIcon } from '@kition/tessera-icons'
import { BrushIcon, ExplodeIcon, HandIcon, RotateCcwIcon, SearchIcon, type IconComponent } from '@kition/tessera-icons/react'
import { ICONS, ICON_NAMES } from '@kition/tessera-icons/registry'

/**
 * The hero mosaic, a canvas to play with: hundreds of icon tiles assemble into the Kit Grid
 * (Kition's K on a 3 × 3 grid) in bands of the kits' hues, then a small Tessera toolbar picks what
 * the pointer does: Magnify (a dock-style lens that names the icon under it), Push (tiles flee the
 * pointer and spring back), Paint (drag to repaint tiles, flipping them like cards; empty slots
 * light up), and Explode (scatter and reassemble). Any click sends a shock wave through the tiles.
 * Canvas 2D with spring physics; each glyph is drawn once with drawIcon and blitted.
 */

const HUES = ['#7b6cf0', '#4a7cf0', '#159fc4', '#16a594', '#2aa857', '#78a81e', '#e0a800', '#e0711f', '#ea5243', '#ef4a6c', '#e04aa0', '#bf5ee0']
const PAINTS = ['#ff8fc6', '#ffd29a', '#7be3c4', '#8fb8ff', '#b9adff', '#ffffff']
/** The Kit Grid: the stem (column 0) and the keys at (2, 0), (1, 1), (2, 2); the rest are empty slots. */
const LIT = new Set(['0,0', '0,1', '0,2', '2,0', '1,1', '2,2'])
const PER_CELL = 6
const GAP_CELLS = 1
const DIM = 'rgba(180, 170, 255, 0.35)'

type Mode = 'lens' | 'push' | 'paint' | 'explode'

type Tile = {
  tx: number
  ty: number
  sx: number
  sy: number
  rot: number
  delay: number
  /** Spring offset from the target, and its velocity. */
  ox: number
  oy: number
  vx: number
  vy: number
  scale: number
  lift: number
  flash: number
  ambient: boolean
  lit: boolean
  baseLit: boolean
  hue: string
  baseHue: string
  /** A card flip in progress: from colour to colour, 0 → 1. */
  flip: number
  flipTo: string
  flipLit: boolean
  glyph: number
}

type Ripple = { x: number; y: number; t0: number; hit: Set<Tile> }

const ease = (t: number) => 1 - Math.pow(1 - t, 3)
const easeBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

const TOOLS: { mode: Mode; label: string; icon: IconComponent; hint: string }[] = [
  { mode: 'lens', label: 'Magnify', icon: SearchIcon, hint: 'Hover to magnify and name an icon' },
  { mode: 'push', label: 'Push', icon: HandIcon, hint: 'Sweep through the tiles' },
  { mode: 'paint', label: 'Paint', icon: BrushIcon, hint: 'Drag to paint your own mosaic' },
  { mode: 'explode', label: 'Explode', icon: ExplodeIcon, hint: 'Click to scatter the mark' },
]

export function MosaicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('lens')
  const [paint, setPaint] = useState(PAINTS[0])
  const control = useRef({ mode: 'lens' as Mode, paint: PAINTS[0], reset: () => undefined as void, explode: () => undefined as void })
  control.current.mode = mode
  control.current.paint = paint

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const found = canvas.getContext('2d')
    if (!found) return
    const ctx: CanvasRenderingContext2D = found
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = rng(7)
    const dpr = Math.min(devicePixelRatio || 1, 2)

    const names = ICON_NAMES.filter((_, i) => i % 3 === 0).slice(0, 140)
    let tileSize = 22
    let sprites: HTMLCanvasElement[] = []
    const makeSprites = () => {
      const px = Math.round(tileSize * 1.6 * 0.62 * dpr)
      sprites = names.map((name) => {
        const sprite = document.createElement('canvas')
        sprite.width = sprite.height = px
        drawIcon(sprite.getContext('2d')!, ICONS[name], 0, 0, { size: px, color: '#ffffff', strokeWidth: 2 })
        return sprite
      })
    }

    let tiles: Tile[] = []
    let width = 0
    let height = 0
    let start = performance.now()
    const ripples: Ripple[] = []
    const pointer = { x: -9999, y: -9999, down: false, inside: false }

    function tileAt(tx: number, ty: number, lit: boolean, ambient: boolean, band: number): Tile {
      const hue = HUES[Math.floor(band / 2.2) % HUES.length]
      return {
        tx, ty, sx: tx, sy: ty, rot: 0, delay: 0, ox: 0, oy: 0, vx: 0, vy: 0, scale: 1, lift: 0, flash: 0,
        ambient, lit, baseLit: lit, hue, baseHue: hue, flip: 1, flipTo: hue, flipLit: lit, glyph: Math.floor(random() * names.length),
      }
    }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const cells = 3 * PER_CELL + 2 * GAP_CELLS
      tileSize = Math.max(12, Math.min(26, Math.floor((Math.min(width, height) * 0.8) / cells)))
      makeSprites()
      const pitch = tileSize + Math.max(2, tileSize * 0.14)
      const markSize = cells * pitch
      const ox = width / 2 - markSize / 2
      const oy = height / 2 - markSize / 2 + 18
      tiles = []
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const lit = LIT.has(`${cx},${cy}`)
          for (let j = 0; j < PER_CELL; j++) {
            for (let i = 0; i < PER_CELL; i++) {
              const gx = cx * (PER_CELL + GAP_CELLS) + i
              const gy = cy * (PER_CELL + GAP_CELLS) + j
              tiles.push(tileAt(ox + gx * pitch, oy + gy * pitch, lit, false, gx + gy))
            }
          }
        }
      }
      // The stem spans the full height: its joints between cells.
      for (const gy of [PER_CELL, 2 * PER_CELL + 1]) {
        for (let i = 0; i < PER_CELL; i++) tiles.push(tileAt(ox + i * pitch, oy + gy * pitch, true, false, i + gy))
      }
      const ambient = Math.round((width * height) / (pitch * pitch * 9))
      for (let n = 0; n < ambient; n++) {
        const x = random() * width
        const y = random() * height
        if (Math.abs(x - width / 2) < markSize / 2 + pitch && Math.abs(y - (oy + markSize / 2)) < markSize / 2 + pitch) continue
        tiles.push(tileAt(x, y, false, true, n))
      }
      scatter(true)
    }

    /** Sends every tile out; they assemble from the centre outward. */
    function scatter(first: boolean) {
      start = performance.now()
      const cx = width / 2
      const cy = height / 2
      for (const tile of tiles) {
        const angle = random() * Math.PI * 2
        const distance = (first ? 0.6 : 0.4) * Math.max(width, height) * (0.5 + random())
        tile.sx = (first ? cx : tile.tx) + Math.cos(angle) * distance
        tile.sy = (first ? cy : tile.ty) + Math.sin(angle) * distance
        tile.rot = (random() - 0.5) * 4
        tile.ox = tile.oy = tile.vx = tile.vy = 0
        tile.delay = (Math.hypot(tile.tx - cx, tile.ty - cy) / Math.max(width, height)) * 900 + random() * 260
      }
    }

    const flipTo = (tile: Tile, hue: string, lit: boolean) => {
      if (tile.flipTo === hue && tile.flipLit === lit && tile.flip >= 1) return
      tile.flip = 0
      tile.flipTo = hue
      tile.flipLit = lit
    }

    control.current.reset = () => {
      tiles.forEach((tile, i) => {
        setTimeout(() => flipTo(tile, tile.baseHue, tile.baseLit), (i % 40) * 12)
      })
    }
    control.current.explode = () => scatter(false)

    const tileUnder = () => {
      let best: Tile | null = null
      let bestDistance = tileSize * 0.9
      for (const tile of tiles) {
        if (tile.ambient) continue
        const d = Math.hypot(tile.tx + tile.ox + tileSize / 2 - pointer.x, tile.ty + tile.oy + tileSize / 2 - pointer.y)
        if (d < bestDistance) {
          best = tile
          bestDistance = d
        }
      }
      return best
    }

    const paintAt = () => {
      for (const tile of tiles) {
        const d = Math.hypot(tile.tx + tileSize / 2 - pointer.x, tile.ty + tileSize / 2 - pointer.y)
        if (d < tileSize * 1.1 && !tile.ambient) flipTo(tile, control.current.paint, true)
      }
    }

    const roundRect = (x: number, y: number, s: number, r: number) => {
      ctx.beginPath()
      ctx.roundRect(x, y, s, s, r)
    }

    let frame = 0
    let last = performance.now()
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)
      if (document.hidden) return
      const dt = Math.min(2, (now - last) / 16.67)
      last = now
      const elapsed = reduced ? 1e6 : now - start
      const mode = control.current.mode
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      const sweep = reduced ? -1 : (((now / 1000) % 6) / 6) * (width + height) * 1.4 - height * 0.4
      for (let r = ripples.length - 1; r >= 0; r--) if (now - ripples[r].t0 > 1600) ripples.splice(r, 1)

      const front: Tile[] = []
      for (const tile of tiles) {
        // Spring back to the target, plus the active tool's force.
        const cx = tile.tx + tile.ox + tileSize / 2
        const cy = tile.ty + tile.oy + tileSize / 2
        const dx = cx - pointer.x
        const dy = cy - pointer.y
        const d = Math.hypot(dx, dy) || 1
        let fx = -0.09 * tile.ox
        let fy = -0.09 * tile.oy
        let targetScale = 1
        if (pointer.inside && !tile.ambient) {
          if (mode === 'push' && d < 160) {
            const f = Math.pow(1 - d / 160, 2) * 4.2
            fx += (dx / d) * f
            fy += (dy / d) * f
          } else if (mode === 'lens' && d < 120) {
            const k = Math.pow(1 - d / 120, 2)
            targetScale = 1 + k * 1.5
            fx += (dx / d) * k * 1.6
            fy += (dy / d) * k * 1.6
          }
        }
        for (const ripple of ripples) {
          const radius = Math.max(0, now - ripple.t0) * 0.75
          const rd = Math.hypot(cx - ripple.x, cy - ripple.y) || 1
          if (!ripple.hit.has(tile) && Math.abs(rd - radius) < tileSize) {
            ripple.hit.add(tile)
            const strength = Math.max(0, 1 - radius / 700) * 9
            tile.vx += ((cx - ripple.x) / rd) * strength
            tile.vy += ((cy - ripple.y) / rd) * strength
            tile.flash = 1
          }
        }
        tile.vx = (tile.vx + fx * dt) * Math.pow(0.82, dt)
        tile.vy = (tile.vy + fy * dt) * Math.pow(0.82, dt)
        tile.ox += tile.vx * dt
        tile.oy += tile.vy * dt
        tile.scale += (targetScale - tile.scale) * Math.min(1, 0.25 * dt)
        tile.flash = Math.max(0, tile.flash - 0.04 * dt)
        if (tile.flip < 1) {
          tile.flip = Math.min(1, tile.flip + 0.07 * dt)
          if (tile.flip >= 0.5) {
            tile.hue = tile.flipTo
            tile.lit = tile.flipLit
          }
        }
        const moving = Math.hypot(tile.ox, tile.oy)
        tile.lift += (Math.min(1, moving / 30 + (tile.scale - 1)) - tile.lift) * 0.2
        if (tile.scale > 1.05 || tile.flash > 0.2) front.push(tile)
        else drawTile(tile, elapsed, sweep)
      }
      front.sort((a, b) => a.scale - b.scale)
      for (const tile of front) drawTile(tile, elapsed, sweep)

      if (mode === 'lens' && pointer.inside && !reduced) {
        const tile = tileUnder()
        if (tile) label(names[tile.glyph], tile.tx + tile.ox + tileSize / 2, tile.ty + tile.oy - tileSize * 0.5)
      }
      for (const ripple of ripples) {
        const age = Math.max(0, now - ripple.t0) / 1600
        ctx.globalAlpha = Math.max(0, 0.5 - age * 0.5)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, Math.max(0, now - ripple.t0) * 0.75, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    function drawTile(tile: Tile, elapsed: number, sweep: number) {
      const t = Math.min(1, Math.max(0, (elapsed - tile.delay) / 1100))
      const k = tile.ambient ? ease(t) : easeBack(t)
      const x = tile.sx + (tile.tx - tile.sx) * k + tile.ox
      const y = tile.sy + (tile.ty - tile.sy) * k + tile.oy
      const rot = tile.rot * (1 - ease(t)) + tile.vx * 0.02
      const shine = sweep > 0 ? Math.max(0, 1 - Math.abs(x + y - sweep) / 90) : 0
      const size = tileSize * tile.scale * (tile.ambient ? 0.8 : 1) * (1 + tile.flash * 0.25)
      // A flip squeezes the tile to nothing and back.
      const flipScale = tile.flip < 1 ? Math.abs(Math.cos(tile.flip * Math.PI)) : 1
      ctx.save()
      ctx.translate(x + tileSize / 2, y + tileSize / 2)
      ctx.rotate(rot)
      ctx.scale(Math.max(0.04, flipScale), 1)
      ctx.globalAlpha = (tile.ambient ? 0.16 + tile.lift * 0.4 : tile.lit ? 1 : 0.2 + tile.lift * 0.5) * Math.min(1, t * 1.6)
      if (tile.lit) {
        ctx.shadowColor = tile.hue
        ctx.shadowBlur = 8 + tile.lift * 20 + shine * 24 + tile.flash * 30
      }
      roundRect(-size / 2, -size / 2, size, size * 0.26)
      ctx.fillStyle = tile.lit ? tile.hue : DIM
      ctx.fill()
      ctx.shadowBlur = 0
      if (tile.lit || tile.lift > 0.3 || tile.flash > 0.2) {
        const gradient = ctx.createLinearGradient(0, -size / 2, 0, size / 2)
        gradient.addColorStop(0, `rgba(255,255,255,${0.3 + shine * 0.5 + tile.flash * 0.4})`)
        gradient.addColorStop(0.55, 'rgba(255,255,255,0)')
        ctx.fillStyle = gradient
        roundRect(-size / 2, -size / 2, size, size * 0.26)
        ctx.fill()
        const sprite = sprites[tile.glyph]
        if (sprite) {
          const glyph = size * 0.62
          ctx.globalAlpha *= tile.lit && tile.hue === '#ffffff' ? 0 : 1
          ctx.drawImage(sprite, -glyph / 2, -glyph / 2, glyph, glyph)
        }
      }
      ctx.restore()
    }

    function label(text: string, x: number, y: number) {
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
      const w = ctx.measureText(text).width + 16
      const lx = Math.min(width - w - 4, Math.max(4, x - w / 2))
      const ly = Math.max(4, y - 30)
      ctx.globalAlpha = 0.92
      ctx.fillStyle = '#0d0a26'
      ctx.beginPath()
      ctx.roundRect(lx, ly, w, 22, 6)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, lx + 8, ly + 15)
    }

    const position = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }
    const onMove = (event: PointerEvent) => {
      position(event)
      pointer.inside = true
      if (pointer.down && control.current.mode === 'paint') paintAt()
    }
    const onDown = (event: PointerEvent) => {
      position(event)
      pointer.down = true
      canvas.setPointerCapture?.(event.pointerId)
      const mode = control.current.mode
      if (reduced) return
      if (mode === 'paint') paintAt()
      else if (mode === 'explode') scatter(false)
      else ripples.push({ x: pointer.x, y: pointer.y, t0: performance.now(), hit: new Set() })
    }
    const onUp = () => {
      pointer.down = false
    }
    const onLeave = () => {
      pointer.inside = false
      pointer.down = false
      pointer.x = pointer.y = -9999
    }
    const observer = new ResizeObserver(layout)
    observer.observe(canvas)
    layout()
    frame = requestAnimationFrame(draw)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const tool = TOOLS.find((item) => item.mode === mode)!
  return (
    <div className="lx-play" data-mode={mode}>
      <div className="lx-play-bar" role="toolbar" aria-label="Mosaic tools">
        {TOOLS.map(({ mode: id, label, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={mode === id} title={label} onClick={() => setMode(id)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
        <i className="lx-play-sep" />
        {mode === 'paint'
          ? PAINTS.map((color) => (
              <button key={color} type="button" className="lx-play-swatch" aria-pressed={paint === color} aria-label={`Paint ${color}`} style={{ background: color }} onClick={() => setPaint(color)} />
            ))
          : null}
        <button type="button" title="Reset colours" onClick={() => control.current.reset()}>
          <RotateCcwIcon size={18} />
        </button>
      </div>
      <canvas ref={canvasRef} className="lx-mosaic" aria-label="The Kition mark assembled from Tessera icon tiles; a toolbar picks how the pointer plays with them." role="img" />
      <span className="lx-intro-hint">
        {tool.hint}
        {mode === 'lens' || mode === 'push' ? ' · click for a shock wave' : ''}
      </span>
    </div>
  )
}
