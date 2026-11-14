import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import api from './api.json'
import { PLAYGROUNDS, codeOf, controlsOf } from './playgrounds'
import { DOCS } from './registry'

const all = Object.entries(PLAYGROUNDS).flatMap(([page, specs]) => specs.map((spec) => ({ page, spec })))
const props = (name: string) => (api as unknown as Record<string, { props: { name: string }[]; domProps?: boolean }>)[name]

describe('the docs playgrounds', () => {
  it('belong to docs pages that document their component', () => {
    for (const { page, spec } of all) {
      const doc = DOCS.find((entry) => entry.id === page)
      expect(doc, page).toBeDefined()
      expect(doc?.api, `${page} lists ${spec.name}`).toContain(spec.name)
    }
  })

  it('give every prop a control, and name only props the component has', () => {
    for (const { spec } of all) {
      const controls = controlsOf(spec)
      expect(controls.map((control) => control.prop)).toEqual(Object.keys(spec.props))
      const info = props(spec.name)
      const own = new Set(info.props.map((prop) => prop.name))
      const named = [...Object.keys(spec.props), ...Object.keys(spec.fixed ?? {}), ...(spec.bind ?? []).flatMap((item) => [item.prop, item.handler])]
      // A prop is the component's own, or an attribute of its HTML element.
      for (const name of named) expect(own.has(name) || info.domProps === true || name === 'children', `${spec.name}.${name}`).toBe(true)
      for (const control of controls) if (control.kind === 'select') expect(control.options, `${spec.name}.${control.prop}`).toContain(spec.props[control.prop])
    }
  })

  it('draw with their first values', () => {
    for (const { spec } of all) {
      const { children, ...values } = spec.props
      const fixed = Object.fromEntries(Object.entries(spec.fixed ?? {}).map(([prop, item]) => [prop, item.value]))
      const bound = Object.fromEntries((spec.bind ?? []).flatMap((item) => [[item.prop, item.initial], [item.handler, () => undefined]]))
      const Component = spec.component
      expect(() => renderToStaticMarkup(<Component {...values} {...fixed} {...bound}>{typeof children === 'string' ? children : (fixed.children as never)}</Component>), spec.name).not.toThrow()
    }
  })

  it('write the code of what is shown: the import, the state it holds, and only the props that say something', () => {
    const button = PLAYGROUNDS.button[0]
    expect(codeOf(button, button.props)).toBe(`import { Button } from '@kition/tessera-ui'\n\n<Button variant="primary" size="md">Save changes</Button>`)
    expect(codeOf(button, { ...button.props, loading: true, variant: 'danger' })).toContain('<Button variant="danger" size="md" loading>')
    const field = PLAYGROUNDS['number-field'][0]
    const code = codeOf(field, field.props)
    expect(code).toContain("import { useState } from 'react'")
    expect(code).toContain('const [value, setValue] = useState(80)')
    expect(code).toContain('value={value}')
    expect(code).toContain('onChange={setValue}')
    // False flags and a prop at its default are left out.
    expect(code).not.toContain('track')
    const tag = PLAYGROUNDS.tag[0]
    expect(codeOf(tag, { ...tag.props, tone: 'neutral' })).toContain('<Tag>Published</Tag>')
  })
})
