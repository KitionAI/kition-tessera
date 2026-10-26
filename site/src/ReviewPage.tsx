import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { RibbonButton, RibbonGroup } from '@kition/tessera'
import { CommandGenericIcon, SparkleIcon, SparklesIcon, createIcon } from '@kition/tessera-icons/react'
import { ICONS, ICON_NAMES } from '@kition/tessera-icons/registry'
import type { IconData } from '@kition/tessera-icons'

/**
 * Redraw batches under review (docs/icon-style.md, "Process"): each batch shown where it lives
 * (before and after), and each icon at 16, 24 and 48 px with the 24 grid.
 */
const BATCHES = [
  {
    id: 'slide-motion',
    title: 'Batch 1 · Slide animations and transitions',
    note: 'Slide drew every animation with one sparkle icon and every transition with another. Each effect now shows its motion: an accented object with a motion cue for animations, slides as frames for transitions (the incoming slide accented, hidden edges not drawn).',
    groups: [
      { label: 'Animations', prefix: 'animation-', before: SparklesIcon, labels: { appear: 'Appear', fade: 'Fade', 'fly-in': 'Fly In', 'float-in': 'Float In', split: 'Split', wipe: 'Wipe', zoom: 'Zoom', pulse: 'Pulse', spin: 'Spin', 'grow-shrink': 'Grow/Shrink', 'fade-out': 'Fade Out', 'fly-out': 'Fly Out', path: 'Lines' } },
      { label: 'Transitions', prefix: 'transition-', before: SparkleIcon, labels: { none: 'None', morph: 'Morph', fade: 'Fade', push: 'Push', wipe: 'Wipe', split: 'Split', reveal: 'Reveal', cut: 'Cut', 'random-bars': 'Random Bars', shape: 'Shape', uncover: 'Uncover', cover: 'Cover', flash: 'Flash', 'fall-over': 'Fall Over', drape: 'Drape', curtains: 'Curtains', wind: 'Wind', prestige: 'Prestige' } },
    ],
  },
  {
    id: 'cad-drafting',
    title: 'Batch 2 · CAD drafting',
    note: 'CAD drew a third of its commands (draw, dimension, modify, constraints) with one fallback mark, because general icon sets have no drafting symbols. Tessera now has its own: geometry with its defining points, dimensions with extension lines and ticks, constraints as their geometric relation.',
    groups: [
      { label: 'CAD', prefix: '', before: CommandGenericIcon, labels: {"polyline": "Polyline", "arc": "Arc", "circle-center-radius": "Circle center radius", "ray": "Ray", "donut": "Donut", "revision-cloud": "Revision cloud", "multiline": "Multiline", "helix": "Helix", "center-mark": "Center mark", "region": "Region", "hatch": "Hatch", "dimension-linear": "Linear", "dimension-aligned": "Aligned", "dimension-radius": "Radius", "dimension-diameter": "Diameter", "dimension-angular": "Angular", "dimension-arc-length": "Arc length", "dimension-ordinate": "Ordinate", "dimension-baseline": "Baseline", "dimension-continue": "Continue", "leader": "Leader", "stretch": "Stretch", "extend": "Extend", "fillet": "Fillet", "chamfer": "Chamfer", "explode": "Explode", "array-rectangular": "Array rectangular", "array-polar": "Array polar", "lengthen": "Lengthen", "constraint-coincident": "Coincident", "constraint-perpendicular": "Perpendicular", "constraint-parallel": "Parallel", "constraint-tangent": "Tangent", "constraint-horizontal": "Horizontal", "constraint-vertical": "Vertical", "constraint-collinear": "Collinear", "constraint-concentric": "Concentric", "constraint-symmetric": "Symmetric", "constraint-equal": "Equal", "constraint-fix": "Fix", "lineweight": "Lineweight", "linetype": "Linetype", "polar-tracking": "Polar tracking", "ortho-mode": "Ortho mode"} },
    ],
  },
  {
    id: 'tool-accents',
    title: 'Batch 3 · Tool accents',
    note: 'The tools in tool rails (Photo, Film, Board, and the engine tools of Vector, Design, CAD) were plain line. Each now marks what it acts on with the skin accent: the brush tip, the bucket paint, the lasso selection, the area a crop keeps; a shape tool fills the shape it draws. The accents show in tool rails and duotone skins; the same icons stay plain line in menus.',
    groups: [
      { label: 'Tools', prefix: '', before: 'plain', labels: {"bandage": "Bandage", "baseline": "Baseline", "blend": "Blend", "brush": "Brush", "brush-cleaning": "Brush cleaning", "circle": "Circle", "circle-dashed": "Circle dashed", "circle-dot": "Circle dot", "cloud": "Cloud", "columns-2": "Columns 2", "copy": "Copy", "copy-plus": "Copy plus", "crop": "Crop", "diamond": "Diamond", "droplet": "Droplet", "eraser": "Eraser", "file": "File", "flame": "Flame", "frame": "Frame", "heart": "Heart", "hexagon": "Hexagon", "highlighter": "Highlighter", "lasso": "Lasso", "lasso-select": "Lasso select", "lollipop": "Lollipop", "message-square": "Message square", "mouse-pointer": "Mouse pointer", "mouse-pointer-2": "Mouse pointer 2", "music": "Music", "network": "Network", "package": "Package", "paint-bucket": "Paint bucket", "palette": "Palette", "pen-tool": "Pen tool", "pencil": "Pencil", "pentagon": "Pentagon", "pill": "Pill", "pipette": "Pipette", "rectangle-horizontal": "Rectangle horizontal", "scaling": "Scaling", "shapes": "Shapes", "sparkle": "Sparkle", "sparkles": "Sparkles", "square": "Square", "square-check": "Square check", "square-x": "Square x", "square-dashed": "Square dashed", "square-dashed-mouse-pointer": "Square dashed mouse pointer", "square-mouse-pointer": "Square mouse pointer", "stamp": "Stamp", "star": "Star", "sticky-note": "Sticky note", "triangle": "Triangle", "vector-polygon": "Vector polygon", "vector-square": "Vector square", "wand-sparkles": "Wand sparkles", "waypoints": "Waypoints", "zoom-in": "Zoom in"} },
    ],
  },
] as const

const components = new Map<string, ReturnType<typeof createIcon>>()
const componentOf = (icon: IconData) => {
  let component = components.get(icon.name)
  if (!component) components.set(icon.name, (component = createIcon(icon)))
  return component
}

export function ReviewPage() {
  return (
    <div className="page">
      <section className="page-intro">
        <h1>Redraw review</h1>
        <p>
          Icons redrawn to Tessera&apos;s style (fine line, 1.5 stroke; duotone accents for tools), batch by batch. Each batch is shown where it lives, before and after,
          then icon by icon at 16, 24 and 48 px on the 24 grid. Switch the skin to see the accents follow it.
        </p>
      </section>
      {BATCHES.map((batch) => (
        // Accents show here as in a tool rail; every "before" draws plain line.
        <section key={batch.id} className="review-batch" style={{ '--tessera-icon-accent-opacity': 0.25 } as CSSProperties}>
          <h2>{batch.title}</h2>
          <p className="review-note">{batch.note}</p>
          {batch.groups.map((group) => {
            const entries = Object.entries(group.labels).filter(([key]) => ICONS[`${group.prefix}${key}`])
            return (
              <div key={group.label} className="review-group">
                <h3>{group.label}</h3>
                <div style={{ '--tessera-icon-accent-opacity': 0 } as CSSProperties}>
                  <Gallery title="Before" entries={entries} icon={group.before === 'plain' ? (key) => componentOf(ICONS[`${group.prefix}${key}`]) : () => group.before} />
                </div>
                <Gallery title="After" entries={entries} icon={(key) => componentOf(ICONS[`${group.prefix}${key}`])} />
                <div className="review-grid">
                  {entries.map(([key, label]) => (
                    <Specimen key={key} icon={ICONS[`${group.prefix}${key}`]} label={label} />
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      ))}
      <p className="review-note">{ICON_NAMES.length} icons in the set.</p>
    </div>
  )
}

function Gallery({ title, entries, icon }: { title: string; entries: (readonly [string, string])[]; icon: (key: string) => ReturnType<typeof createIcon> }) {
  return (
    <div className="review-gallery">
      <span className="review-gallery-title">{title}</span>
      <div className="review-ribbon">
        <RibbonGroup label={title}>
          {entries.map(([key, label]) => (
            <RibbonButton key={key} icon={icon(key)} label={label} size="large" pressed={key === entries[2]?.[0]} />
          ))}
        </RibbonGroup>
      </div>
    </div>
  )
}

function Specimen({ icon, label }: { icon: IconData; label: ReactNode }) {
  const Icon = componentOf(icon)
  const grid = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => (
        <g key={i}>
          <line x1={i} y1={0} x2={i} y2={24} />
          <line x1={0} y1={i} x2={24} y2={i} />
        </g>
      )),
    [],
  )
  return (
    <figure className="review-specimen">
      <div className="review-sizes">
        <Icon size={16} />
        <Icon size={24} />
        <span className="review-large">
          <svg className="review-gridlines" viewBox="0 0 24 24" width={48} height={48} aria-hidden="true">
            {grid}
            <rect x={2} y={2} width={20} height={20} />
          </svg>
          <Icon size={48} />
        </span>
      </div>
      <figcaption>
        <strong>{label}</strong>
        <code>{icon.name}</code>
      </figcaption>
    </figure>
  )
}
