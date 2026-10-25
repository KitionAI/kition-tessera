import { useMemo, type ReactNode } from 'react'
import { RibbonButton, RibbonGroup } from '@kition/tessera'
import { SparkleIcon, SparklesIcon, createIcon } from '@kition/tessera-icons/react'
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
        <section key={batch.id} className="review-batch">
          <h2>{batch.title}</h2>
          <p className="review-note">{batch.note}</p>
          {batch.groups.map((group) => {
            const entries = Object.entries(group.labels).filter(([key]) => ICONS[`${group.prefix}${key}`])
            return (
              <div key={group.label} className="review-group">
                <h3>{group.label}</h3>
                <Gallery title="Before" entries={entries} icon={() => group.before} />
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
