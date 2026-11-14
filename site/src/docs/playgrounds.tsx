/**
 * The playgrounds of the docs: for a page, one or more components whose props the reader changes
 * with controls while the component and its code follow. A playground names the props it offers
 * (their controls come from api.json where the prop is the component's own, or are spelled out
 * for HTML attributes such as `disabled`), the props it holds fixed, and the values the component
 * reports back (`bind`).
 */
import type { ComponentType } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ColorPicker,
  ColorWheel,
  Disclosure,
  Empty,
  GradientSlider,
  Histogram,
  IconButton,
  LevelMeter,
  NumberField,
  Pagination,
  PasswordInput,
  Result,
  RibbonButton,
  SLIDER_GRADIENTS,
  Segmented,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  Tag,
  TextInput,
  Textarea,
  TimecodeField,
} from '@kition/tessera-ui'
import { ClipboardPasteIcon, LayersIcon, TextAlignCenterIcon, TextAlignEndIcon, TextAlignStartIcon } from '@kition/tessera-icons/react'
import api from './api.json'

export type Control =
  | { prop: string; kind: 'boolean' }
  | { prop: string; kind: 'select'; options: readonly string[] }
  | { prop: string; kind: 'text' }
  | { prop: string; kind: 'number'; min?: number; max?: number; step?: number }

export type Value = string | number | boolean

export type Playground = {
  /** The component's name, as it is imported. */
  name: string
  // Each component takes its own props.
  component: ComponentType<any>
  /** The props the controls change, in the controls' order, with their first values. `children` is the text inside. */
  props: Record<string, Value>
  /** Controls for props api.json cannot describe (HTML attributes, numbers that need a range). */
  controls?: Control[]
  /** Props held fixed: the value the component gets, and how the code writes it. */
  fixed?: Record<string, { value: unknown; code: string }>
  /** Values the component reports back: the prop, its first value, the handler, and how the code names both. */
  bind?: { prop: string; initial: unknown; handler: string; state: string }[]
  /** Other imports the code needs. */
  imports?: string
  /** A width for components that fill their box. */
  width?: number
  height?: number
}

type ApiProp = { name: string; type: string; default: string | null; options?: string[] }
const API = api as unknown as Record<string, { props: ApiProp[] }>

/** The control of each prop a playground offers: spelled out, or read from the component's types. */
export function controlsOf(playground: Playground): Control[] {
  return Object.keys(playground.props).map((prop) => {
    const own = playground.controls?.find((control) => control.prop === prop)
    if (own) return own
    if (prop === 'children') return { prop, kind: 'text' }
    const info = API[playground.name]?.props.find((item) => item.name === prop)
    if (!info) throw new Error(`${playground.name} has no prop ${prop}: give the playground a control for it`)
    if (info.options) return { prop, kind: 'select', options: info.options }
    if (info.type === 'boolean') return { prop, kind: 'boolean' }
    if (info.type === 'number') return { prop, kind: 'number' }
    return { prop, kind: 'text' }
  })
}

/** A prop's default as the component declares it (`'sm'` → `sm`), when it has one. */
function defaultOf(playground: Playground, prop: string): Value | undefined {
  const text = API[playground.name]?.props.find((item) => item.name === prop)?.default
  if (text == null) return undefined
  if (text === 'true' || text === 'false') return text === 'true'
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  const quoted = /^'(.*)'$/.exec(text)
  return quoted ? quoted[1] : undefined
}

/** The JSX that draws the playground with `values`: only the props that say something. */
export function codeOf(playground: Playground, values: Record<string, Value>): string {
  const parts: string[] = []
  for (const [prop, value] of Object.entries(values)) {
    if (prop === 'children' || value === '' || value === false || value === defaultOf(playground, prop)) continue
    parts.push(value === true ? prop : typeof value === 'number' ? `${prop}={${value}}` : `${prop}="${value}"`)
  }
  for (const [prop, { code }] of Object.entries(playground.fixed ?? {})) if (prop !== 'children') parts.push(/^'[^']*'$/.test(code) ? `${prop}="${code.slice(1, -1)}"` : `${prop}={${code}}`)
  for (const { prop, handler, state } of playground.bind ?? []) parts.push(`${prop}={${state}}`, `${handler}={set${state[0].toUpperCase()}${state.slice(1)}}`)
  // The text inside, or fixed content written as an expression.
  const children = typeof values.children === 'string' ? values.children : playground.fixed?.children ? `{${playground.fixed.children.code}}` : null
  const open = `<${playground.name}`
  const close = children ? `>${children}</${playground.name}>` : ' />'
  const line = `${open}${parts.length ? ` ${parts.join(' ')}` : ''}${close}`
  const jsx = line.length <= 76 ? line : `${open}\n${parts.map((part) => `  ${part}`).join('\n')}\n${children ? `>\n  ${children}\n</${playground.name}>` : '/>'}`
  const states = (playground.bind ?? []).map(({ initial, state }) => `const [${state}, set${state[0].toUpperCase()}${state.slice(1)}] = useState(${JSON.stringify(initial)})`)
  const imports = [`import { ${playground.name} } from '@kition/tessera-ui'`, playground.imports, states.length ? "import { useState } from 'react'" : null].filter(Boolean)
  return [...imports, '', ...states, ...(states.length ? [''] : []), jsx].join('\n')
}

const bins = Array.from({ length: 128 }, (_, i) => Math.round(Math.exp(-((i - 46) ** 2) / 480) * 900 + Math.exp(-((i - 100) ** 2) / 130) * 420 + 30))
const align = [
  { value: 'start', icon: TextAlignStartIcon, label: 'Left' },
  { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
  { value: 'end', icon: TextAlignEndIcon, label: 'Right' },
]
const tabs = [
  { key: 'layers', label: 'Layers', children: 'Layers of the document' },
  { key: 'channels', label: 'Channels', children: 'Colour channels' },
  { key: 'paths', label: 'Paths', children: 'Vector paths' },
]
const disabled: Control = { prop: 'disabled', kind: 'boolean' }

/** The playgrounds, by the id of the docs page that shows them. */
export const PLAYGROUNDS: Record<string, Playground[]> = {
  button: [{ name: 'Button', component: Button, props: { variant: 'primary', size: 'md', loading: false, disabled: false, children: 'Save changes' }, controls: [disabled] }],
  'icon-button': [{ name: 'IconButton', component: IconButton, props: { label: 'Layers', pressed: false, disabled: false }, controls: [disabled], fixed: { icon: { value: LayersIcon, code: 'LayersIcon' } }, imports: "import { LayersIcon } from '@kition/tessera-icons/react'" }],
  badge: [{ name: 'Badge', component: Badge, props: { children: 'New' } }],
  tag: [{ name: 'Tag', component: Tag, props: { tone: 'success', children: 'Published' } }],
  alert: [{ name: 'Alert', component: Alert, props: { tone: 'warning', title: 'Your trial ends in 3 days', description: 'Add a payment method to keep your workspace.' }, width: 440 }],
  spinner: [{ name: 'Spinner', component: Spinner, props: { size: 20, label: 'Saving…' }, controls: [{ prop: 'size', kind: 'number', min: 12, max: 48 }] }],
  disclosure: [{ name: 'Disclosure', component: Disclosure, props: { title: 'Advanced', defaultOpen: true, children: 'Settings most people never change.' }, width: 360 }],
  'text-input': [{ name: 'TextInput', component: TextInput, props: { size: 'md', placeholder: 'Layer name', invalid: false, disabled: false }, controls: [{ prop: 'placeholder', kind: 'text' }, disabled], width: 280 }],
  'password-input': [{ name: 'PasswordInput', component: PasswordInput, props: { size: 'md', placeholder: 'Password', invalid: false, disabled: false }, controls: [{ prop: 'placeholder', kind: 'text' }, disabled], width: 280 }],
  textarea: [{ name: 'Textarea', component: Textarea, props: { placeholder: 'Notes for the reviewer', rows: 3, invalid: false, autoSize: false, disabled: false }, controls: [{ prop: 'placeholder', kind: 'text' }, { prop: 'rows', kind: 'number', min: 1, max: 10 }, { prop: 'autoSize', kind: 'boolean' }, disabled], width: 320 }],
  select: [
    {
      name: 'Select',
      component: Select,
      props: { size: 'md', invalid: false, disabled: false },
      controls: [disabled],
      fixed: { children: { value: ['Normal', 'Multiply', 'Screen', 'Overlay'].map((mode) => <option key={mode}>{mode}</option>), code: "['Normal', 'Multiply', 'Screen', 'Overlay'].map((mode) => <option key={mode}>{mode}</option>)" } },
      width: 220,
    },
  ],
  switch: [{ name: 'Switch', component: Switch, props: { disabled: false }, controls: [disabled], fixed: { 'aria-label': { value: 'Snap to grid', code: "'Snap to grid'" } }, bind: [{ prop: 'checked', initial: true, handler: 'onCheckedChange', state: 'checked' }] }],
  'number-field': [
    {
      name: 'NumberField',
      component: NumberField,
      props: { label: 'Opacity', min: 0, max: 100, step: 1, unit: '%', track: false, hot: false, disabled: false },
      bind: [{ prop: 'value', initial: 80, handler: 'onChange', state: 'value' }],
      width: 220,
    },
  ],
  'bar-controls': [
    { name: 'Segmented', component: Segmented, props: { label: 'Align', disabled: false }, fixed: { segments: { value: align, code: 'segments' } }, bind: [{ prop: 'value', initial: 'start', handler: 'onChange', state: 'value' }] },
    { name: 'Checkbox', component: Checkbox, props: { label: 'Anti-alias', disabled: false }, bind: [{ prop: 'checked', initial: true, handler: 'onChange', state: 'checked' }] },
  ],
  tabs: [{ name: 'Tabs', component: Tabs, props: {}, fixed: { items: { value: tabs, code: 'items' } }, bind: [{ prop: 'activeKey', initial: 'layers', handler: 'onChange', state: 'activeKey' }], width: 420 }],
  pagination: [{ name: 'Pagination', component: Pagination, props: { total: 564, pageSize: 10 }, controls: [{ prop: 'total', kind: 'number', min: 0, max: 5000, step: 10 }, { prop: 'pageSize', kind: 'number', min: 5, max: 100, step: 5 }], bind: [{ prop: 'page', initial: 6, handler: 'onChange', state: 'page' }] }],
  skeleton: [{ name: 'Skeleton', component: Skeleton, props: { lines: 3, width: 320 }, controls: [{ prop: 'lines', kind: 'number', min: 1, max: 8 }, { prop: 'width', kind: 'number', min: 80, max: 480, step: 20 }] }],
  descriptions: [{ name: 'Avatar', component: Avatar, props: { name: 'Ada Lovelace', size: 40 }, controls: [{ prop: 'size', kind: 'number', min: 16, max: 96, step: 4 }] }],
  'empty-result': [
    { name: 'Empty', component: Empty, props: { title: 'No feedback yet', description: 'Messages people send from the app arrive here.' }, width: 360 },
    { name: 'Result', component: Result, props: { status: 'forbidden', title: 'Access denied', description: 'Your account cannot open the admin console.' }, width: 360 },
  ],
  'color-picker': [{ name: 'ColorPicker', component: ColorPicker, props: { disabled: false }, bind: [{ prop: 'value', initial: [86, 69, 212], handler: 'onChange', state: 'color' }], width: 220 }],
  'color-wheel': [
    {
      name: 'ColorWheel',
      component: ColorWheel,
      props: { label: 'Midtones', size: 140, disabled: false },
      controls: [{ prop: 'size', kind: 'number', min: 80, max: 220, step: 10 }],
      bind: [
        { prop: 'value', initial: [0.25, -0.15], handler: 'onChange', state: 'value' },
        { prop: 'lightness', initial: 0, handler: 'onLightness', state: 'lightness' },
      ],
    },
  ],
  'gradient-slider': [
    {
      name: 'GradientSlider',
      component: GradientSlider,
      props: { label: 'Temperature', min: -100, max: 100, decimals: 0, disabled: false },
      fixed: { stops: { value: SLIDER_GRADIENTS.temperature, code: 'SLIDER_GRADIENTS.temperature' } },
      bind: [{ prop: 'value', initial: 10, handler: 'onChange', state: 'value' }],
      width: 300,
    },
  ],
  histogram: [{ name: 'Histogram', component: Histogram, props: { height: 100, smooth: true, scale: 'interior' }, controls: [{ prop: 'height', kind: 'number', min: 40, max: 200, step: 10 }], fixed: { bins: { value: bins, code: 'bins' } }, width: 320 }],
  'timecode-transport': [{ name: 'TimecodeField', component: TimecodeField, props: { label: 'Playhead', fps: 25, dropFrame: false, accent: true }, controls: [{ prop: 'fps', kind: 'number', min: 12, max: 60 }], bind: [{ prop: 'value', initial: 83.4, handler: 'onChange', state: 'seconds' }] }],
  'level-meter': [{ name: 'LevelMeter', component: LevelMeter, props: { orientation: 'vertical', floor: -60 }, controls: [{ prop: 'floor', kind: 'number', min: -96, max: -24, step: 6 }], fixed: { peaks: { value: [-9, -14], code: '[-9, -14]' }, holds: { value: [-4, -8], code: '[-4, -8]' }, labels: { value: ['L', 'R'], code: "['L', 'R']" } }, width: 120, height: 180 }],
  ribbon: [{ name: 'RibbonButton', component: RibbonButton, props: { label: 'Paste', size: 'large', pressed: false, primary: false, disabled: false }, controls: [disabled], fixed: { icon: { value: ClipboardPasteIcon, code: 'ClipboardPasteIcon' } }, imports: "import { ClipboardPasteIcon } from '@kition/tessera-icons/react'" }],
}
