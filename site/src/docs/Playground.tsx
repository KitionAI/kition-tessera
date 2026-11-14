import { useEffect, useMemo, useState } from 'react'
import { Segmented, Select, Switch, TextInput } from '@kition/tessera-ui'
import { RotateCcwIcon } from '@kition/tessera-icons/react'
import { SKIN_IDS, type SkinId } from '@kition/tessera-tokens'
import { CodeBlock } from '../shell/Code'
import { SKIN_NAMES, skinStyle } from '../shell/skin'
import { codeOf, controlsOf, type Control, type Playground as Spec, type Value } from './playgrounds'

type View = 'page' | SkinId | 'both'

/**
 * A component to try: controls for its props on the right, the component in the middle, and
 * under it the code that draws exactly what is shown. The preview takes the page's skin, one
 * skin, or both side by side. What is set goes into the address, so a set-up can be shared.
 */
export function Playground({ specs }: { specs: Spec[] }) {
  const [index, setIndex] = useState(0)
  const spec = specs[index] ?? specs[0]
  return <One key={spec.name} spec={spec} tabs={specs.length > 1 ? { names: specs.map((item) => item.name), index, onPick: setIndex } : null} />
}

function One({ spec, tabs }: { spec: Spec; tabs: { names: string[]; index: number; onPick: (index: number) => void } | null }) {
  const controls = useMemo(() => controlsOf(spec), [spec])
  const [values, setValues] = useState<Record<string, Value>>(spec.props)
  const [bound, setBound] = useState<Record<string, unknown>>(() => Object.fromEntries((spec.bind ?? []).map((item) => [item.prop, item.initial])))
  const [view, setView] = useState<View>('page')

  // Values in the address, read once the page has drawn (the prerendered page shows the defaults).
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('component') && params.get('component') !== spec.name) return
    const next: Record<string, Value> = {}
    for (const control of controls) {
      const text = params.get(control.prop)
      if (text === null) continue
      if (control.kind === 'boolean') next[control.prop] = text === 'true'
      else if (control.kind === 'number') {
        if (Number.isFinite(Number(text))) next[control.prop] = Number(text)
      } else if (control.kind !== 'select' || control.options.includes(text)) next[control.prop] = text
    }
    if (Object.keys(next).length) setValues((current) => ({ ...current, ...next }))
  }, [controls, spec.name])

  const set = (prop: string, value: Value) => {
    const next = { ...values, [prop]: value }
    setValues(next)
    const params = new URLSearchParams()
    if (tabs) params.set('component', spec.name)
    for (const [key, item] of Object.entries(next)) if (item !== spec.props[key]) params.set(key, String(item))
    history.replaceState(history.state, '', `${location.pathname}${params.size ? `?${params}` : ''}`)
  }
  const reset = () => {
    setValues(spec.props)
    setBound(Object.fromEntries((spec.bind ?? []).map((item) => [item.prop, item.initial])))
    history.replaceState(history.state, '', location.pathname)
  }

  const Component = spec.component
  const { children, ...props } = values
  const fixed = Object.fromEntries(Object.entries(spec.fixed ?? {}).map(([prop, item]) => [prop, item.value]))
  const handlers = Object.fromEntries((spec.bind ?? []).map((item) => [item.handler, (value: unknown) => setBound((current) => ({ ...current, [item.prop]: value }))]))
  const element = (
    <div style={{ width: spec.width, height: spec.height, maxWidth: '100%' }}>
      <Component {...props} {...fixed} {...bound} {...handlers}>
        {typeof children === 'string' ? children : (fixed.children as never)}
      </Component>
    </div>
  )
  const changed = Object.entries(values).some(([prop, value]) => value !== spec.props[prop])

  return (
    <section className="play" aria-label={`${spec.name} playground`}>
      <div className="play-bar">
        {tabs ? (
          <div className="play-tabs" role="tablist" aria-label="Component">
            {tabs.names.map((name, i) => (
              <button key={name} type="button" role="tab" aria-selected={i === tabs.index} onClick={() => tabs.onPick(i)}>
                {name}
              </button>
            ))}
          </div>
        ) : (
          <strong>Playground</strong>
        )}
        <div className="play-tools">
          <Segmented
            label="Preview skin"
            value={view}
            onChange={(next) => setView(next)}
            segments={[{ value: 'page', label: 'Page skin' }, ...SKIN_IDS.map((id) => ({ value: id, label: SKIN_NAMES[id] ?? id })), { value: 'both', label: 'Side by side' }]}
          />
          <button type="button" className="play-reset" onClick={reset} disabled={!changed} aria-label="Reset the playground" title="Reset">
            <RotateCcwIcon size={15} />
          </button>
        </div>
      </div>
      <div className="play-body">
        <div className="play-stage" data-view={view}>
          {view === 'page' ? (
            <div className="play-pane">{element}</div>
          ) : (
            (view === 'both' ? SKIN_IDS : [view]).map((id) => (
              <div key={id} className="play-pane" style={skinStyle(id)} data-color-scheme-of={id}>
                {view === 'both' ? <span className="play-pane-name">{SKIN_NAMES[id] ?? id}</span> : null}
                {element}
              </div>
            ))
          )}
        </div>
        <div className="play-controls">
          <p>Props</p>
          {controls.length === 0 ? <span className="play-none">This component is set by its content.</span> : null}
          {controls.map((control) => (
            <ControlRow key={control.prop} control={control} value={values[control.prop]} onChange={(value) => set(control.prop, value)} />
          ))}
        </div>
      </div>
      <CodeBlock code={codeOf(spec, values)} label="What is shown" />
    </section>
  )
}

function ControlRow({ control, value, onChange }: { control: Control; value: Value; onChange: (value: Value) => void }) {
  const id = `play-${control.prop}`
  return (
    <div className="play-control" data-kind={control.kind}>
      <label htmlFor={id}>{control.prop}</label>
      {control.kind === 'boolean' ? (
        <Switch id={id} checked={value === true} onCheckedChange={(checked) => onChange(checked)} />
      ) : control.kind === 'select' ? (
        <Select id={id} size="sm" value={String(value)} onChange={(event) => onChange(event.target.value)}>
          {control.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      ) : control.kind === 'number' ? (
        <TextInput id={id} size="sm" type="number" value={String(value)} min={control.min} max={control.max} step={control.step} onChange={(event) => event.target.value !== '' && onChange(Number(event.target.value))} />
      ) : (
        <TextInput id={id} size="sm" value={String(value)} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}
