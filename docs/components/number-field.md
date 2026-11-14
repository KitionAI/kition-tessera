# NumberField

A number with a label you drag to scrub, arrows to step, and units.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/number-field/)

```ts
import { NumberField } from '@kition/tessera-ui'
```

## When to use

- Opacity, size, angle, any bounded number in a panel.

## Keyboard

| Keys | What they do |
| --- | --- |
| Up, Down | Step the value by `step`; with Shift, by ten steps. |
| Enter | Commit what is typed. As hot text: open the field to type into. |
| Escape | Put back the value before typing. With nothing typed the key is left to the page, so a dialog still closes. |

## Example: Scrub, type, or arrow

```tsx
import { useState } from 'react'
import { NumberField } from '@kition/tessera-ui'

export default function Demo() {
  const [opacity, setOpacity] = useState(80)
  const [angle, setAngle] = useState(15)
  return (
    <div className="demo-stack">
      <NumberField label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={(value) => setOpacity(value)} />
      <NumberField label="Angle" value={angle} min={-180} max={180} step={1} unit="°" onChange={(value) => setAngle(value)} />
    </div>
  )
}
```

## NumberField props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `string` |  |  |
| `name` | `string` |  | The field's accessible name and tooltip when `label` is a symbol rather than words (Photoshop's Character panel labels its fields with glyphs: tT, A↕, VA); `label` by default. |
| `value` (required) | `number` |  |  |
| `min` (required) | `number` |  |  |
| `max` (required) | `number` |  |  |
| `step` | `number` |  | Step for arrows and scrubbing; decimals shown follow it (1 → integer). |
| `unit` | `string` |  |  |
| `onChange` (required) | `(value: number, final: boolean) => void` |  | Called while scrubbing with `final: false`, and once with `final: true` on release, Enter, or blur. |
| `disabled` | `boolean` |  |  |
| `width` | `number` |  |  |
| `testId` | `string` |  |  |
| `uiId` | `string` |  | A Kit UI id when the field is a declared element. |
| `track` | `boolean` |  | A slider row: the label and field on one line, a slider from `min` to `max` under them. |
| `hot` | `boolean` |  | Hot text (Premiere's, upstream Film's `widgets::hot_number`): the value and its unit drawn as accent text, without a box or a visible label (`label` names it). Dragged sideways it scrubs by `speed` per CSS pixel (Shift ten times faster, Cmd, Ctrl, or Alt ten times finer), reporting `final: false` per move and the last value again with `final: true` on release; a click opens a field to type into, which commits on Enter or blur and leaves unchanged on Escape. |
| `speed` | `number` |  | Hot text: value units per CSS pixel dragged (`step` by default). |
| `onDone` | `() => void` |  | Hot text: called once a typed edit ends (Enter, Escape, or blur), so the editor can take the focus back. |

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
