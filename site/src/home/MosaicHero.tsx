import { useEffect, useRef } from 'react'
import { drawIcon } from '@kition/tessera-icons'
import { ICONS, ICON_NAMES } from '@kition/tessera-icons/registry'

/**
 * The hero mosaic: hundreds of icon tiles fly in and assemble into the Kit Grid (Kition's K on a
 * 3 × 3 grid), coloured in bands of the kits' hues. A light sweeps across it; tiles near the
 * pointer lift toward it; a click scatters the mark and it assembles again. Canvas 2D, with each
 * glyph pre-drawn once (drawIcon) and blitted, so a few hundred tiles stay at 60 fps.
 */

const HUES = ['#7b6cf0', '#4a7cf0', '#159fc4', '#16a594', '#2aa857', '#78a81e', '#e0a800', '#e0711f', '#ea5243', '#ef4a6c', '#e04aa0', '#bf5ee0']
/** The Kit Grid: the stem (column 0) and the keys at (2, 0), (1, 1), (2, 2); the rest are empty slots. */
const LIT = new Set(['0,0', '0,1', '0,2', '2,0', '1,1', '2,2'])
const PER_CELL = 6
const GAP_CELLS = 1 // tiles of gap between cells

type Tile = {
  tx: number
  ty: number
  x: number
  y: number
  sx: number
  sy: number
  rot: number
  lit: boolean
  ambient: boolean
  hue: string
  glyph: number
  delay: number
  lift: number
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3)
const easeBack = (t: number) => {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

export function MosaicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = rng(7)
    const dpr = Math.min(devicePixelRatio || 1, 2)

    // Glyph sprites: a sample of the set, drawn white once.
    const names = ICON_NAMES.filter((_, i) => i % 3 === 0).slice(0, 120)
    let tileSize = 22
    let sprites: HTMLCanvasElement[] = []
    const makeSprites = () => {
      const px = Math.round(tileSize * 0.62 * dpr)
      sprites = names.map((name) => {
        const sprite = document.createElement('canvas')
        sprite.width = sprite.height = px
        const g = sprite.getContext('2d')!
        drawIcon(g, ICONS[name], 0, 0, { size: px, color: '#ffffff', strokeWidth: 2 })
        return sprite
      })
    }

    let tiles: Tile[] = []
    let width = 0
    let height = 0
    let start = performance.now()
    const pointer = { x: -9999, y: -9999 }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const cells = 3 * PER_CELL + 2 * GAP_CELLS
      tileSize = Math.max(12, Math.min(26, Math.floor(Math.min(width, height) * 0.82 / cells)))
      makeSprites()
      const pitch = tileSize + Math.max(2, tileSize * 0.14)
      const markSize = cells * pitch
      const ox = width / 2 - markSize / 2
      const oy = height / 2 - markSize / 2
      tiles = []
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const lit = LIT.has(`${cx},${cy}`)
          for (let j = 0; j < PER_CELL; j++) {
            for (let i = 0; i < PER_CELL; i++) {
              const gx = cx * (PER_CELL + GAP_CELLS) + i
              const gy = cy * (PER_CELL + GAP_CELLS) + j
              // The stem spans the full height: fill the gaps between its cells too.
              tiles.push(tileAt(ox + gx * pitch, oy + gy * pitch, lit, false, gx + gy))
            }
          }
        }
      }
      // Stem joints: rows between the stem's cells.
      for (const gy of [PER_CELL, 2 * PER_CELL + 1]) {
        for (let i = 0; i < PER_CELL; i++) tiles.push(tileAt(ox + i * pitch, oy + gy * pitch, true, false, i + gy))
      }
      // Ambient tiles scattered around the mark, faint.
      const ambient = Math.round((width * height) / (pitch * pitch * 9))
      for (let n = 0; n < ambient; n++) {
        const x = random() * width
        const y = random() * height
        if (Math.abs(x - width / 2) < markSize / 2 + pitch && Math.abs(y - height / 2) < markSize / 2 + pitch) continue
        tiles.push(tileAt(x, y, false, true, n))
      }
      scatter(true)
    }

    function tileAt(tx: number, ty: number, lit: boolean, ambient: boolean, band: number): Tile {
      return { tx, ty, x: tx, y: ty, sx: tx, sy: ty, rot: 0, lit, ambient, hue: HUES[Math.floor(band / 2.2) % HUES.length], glyph: Math.floor(random() * names.length), delay: 0, lift: 0 }
    }

    /** Sends every tile out from a random start; they assemble from the centre outward. */
    function scatter(first: boolean) {
      start = performance.now()
      const cx = width / 2
      const cy = height / 2
      for (const tile of tiles) {
        const angle = random() * Math.PI * 2
        const distance = (first ? 0.6 : 0.35) * Math.max(width, height) * (0.5 + random())
        tile.sx = first ? cx + Math.cos(angle) * distance : tile.x + Math.cos(angle) * distance * 0.5
        tile.sy = first ? cy + Math.sin(angle) * distance : tile.y + Math.sin(angle) * distance * 0.5
        tile.rot = (random() - 0.5) * 3
        tile.delay = (Math.hypot(tile.tx - cx, tile.ty - cy) / Math.max(width, height)) * 900 + random() * 260
      }
    }

    const roundRect = (x: number, y: number, s: number, r: number) => {
      ctx.beginPath()
      ctx.roundRect(x, y, s, s, r)
    }

    let frame = 0
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw)
      if (document.hidden) return
      const elapsed = reduced ? 1e6 : now - start
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      // The light sweep: a diagonal band moving across the mark every few seconds.
      const sweep = reduced ? -1 : (((now / 1000) % 5) / 5) * (width + height) * 1.4 - height * 0.4
      for (const tile of tiles) {
        const t = Math.min(1, Math.max(0, (elapsed - tile.delay) / 1100))
        const k = tile.ambient ? ease(t) : easeBack(t)
        tile.x = tile.sx + (tile.tx - tile.sx) * k
        tile.y = tile.sy + (tile.ty - tile.sy) * k
        const rot = tile.rot * (1 - ease(t))
        const dx = pointer.x - tile.x
        const dy = pointer.y - tile.y
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 150)
        tile.lift += (near - tile.lift) * 0.15
        const lift = tile.lift
        const shine = sweep > 0 ? Math.max(0, 1 - Math.abs(tile.x + tile.y - sweep) / 90) : 0
        const size = tileSize * (1 + lift * 0.28) * (tile.ambient ? 0.8 : 1)
        const ox = tile.x - lift * dx * 0.06
        const oy = tile.y - lift * dy * 0.06 - lift * 6
        ctx.save()
        ctx.translate(ox + size / 2, oy + size / 2)
        ctx.rotate(rot + lift * Math.atan2(dy, dx) * 0.05)
        ctx.globalAlpha = (tile.ambient ? 0.16 + lift * 0.5 : tile.lit ? 1 : 0.18 + lift * 0.4) * Math.min(1, t * 1.6)
        if (tile.lit) {
          ctx.shadowColor = tile.hue
          ctx.shadowBlur = 8 + lift * 22 + shine * 24
        }
        roundRect(-size / 2, -size / 2, size, size * 0.26)
        ctx.fillStyle = tile.lit ? tile.hue : 'rgba(180, 170, 255, 0.35)'
        ctx.fill()
        ctx.shadowBlur = 0
        if (tile.lit || lift > 0.2) {
          // Glass: a light top half.
          ctx.globalAlpha *= 0.9
          const gradient = ctx.createLinearGradient(0, -size / 2, 0, size / 2)
          gradient.addColorStop(0, `rgba(255,255,255,${0.32 + shine * 0.5})`)
          gradient.addColorStop(0.55, 'rgba(255,255,255,0)')
          ctx.fillStyle = gradient
          roundRect(-size / 2, -size / 2, size, size * 0.26)
          ctx.fill()
          const sprite = sprites[tile.glyph]
          if (sprite) {
            const glyph = size * 0.62
            ctx.drawImage(sprite, -glyph / 2, -glyph / 2, glyph, glyph)
          }
        }
        ctx.restore()
      }
    }

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }
    const onLeave = () => {
      pointer.x = pointer.y = -9999
    }
    const onClick = () => {
      if (!reduced) scatter(false)
    }
    const observer = new ResizeObserver(layout)
    observer.observe(canvas)
    layout()
    frame = requestAnimationFrame(draw)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('click', onClick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="lx-mosaic" aria-label="The Kition mark assembled from Tessera icon tiles. Click to scatter it." role="img" />
}
