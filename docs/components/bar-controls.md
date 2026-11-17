# Bar controls

Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/bar-controls/)

```ts
import { Segmented, Choice, Checkbox, Hint, BarSeparator } from '@kition/tessera-ui'
```

## When to use

- A tool’s options above the canvas.

## Example: An options bar

```tsx
import { useState } from 'react'
import { BarSeparator, Checkbox, Choice, Hint, Segmented } from '@kition/tessera-ui'
import { TextAlignCenterIcon, TextAlignEndIcon, TextAlignStartIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start')
  const [snap, setSnap] = useState(true)
  const [mode, setMode] = useState<'normal' | 'multiply' | 'screen'>('normal')
  return (
    <div className="demo-row">
      <Segmented
        label="Alignment"
        value={align}
        onChange={setAlign}
        segments={[
          { value: 'start', icon: TextAlignStartIcon, label: 'Left' },
          { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
          { value: 'end', icon: TextAlignEndIcon, label: 'Right' },
        ]}
      />
      <BarSeparator />
      <Choice label="Mode" value={mode} onChange={setMode} choices={[['normal', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen']]} />
      <Checkbox label="Snap" checked={snap} onChange={setSnap} />
      <Hint>Alt-drag to copy</Hint>
    </div>
  )
}
```

## Segmented props

Buttons of which one is pressed: icons (selection modes, alignment) or words (24h, 7d, 30d).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | The group's accessible name (for example "Selection mode"). |
| `value` (required) | `V` |  |  |
| `segments` (required) | `readonly Segment<V>[]` |  |  |
| `disabled` | `boolean` |  |  |
| `onChange` (required) | `(value: V) => void` |  |  |
| `testId` | `string` |  | Each button's test id is `${testId}-${value}`. |

## Choice props

A drop-down choice with its label before it.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `string` |  |  |
| `quiet` | `boolean` |  | Draws no visible label (the drop-down still has `label` as its name). |
| `value` (required) | `V` |  |  |
| `choices` (required) | `readonly (readonly [V, string])[]` |  |  |
| `disabled` | `boolean` |  |  |
| `onChange` (required) | `(value: V) => void` |  |  |
| `testId` | `string` |  |  |

## Checkbox props

A check box with its label.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  |  |
| `checked` | `boolean` | `false` |  |
| `disabled` | `boolean` |  |  |
| `onChange` | `(checked: boolean) => void` |  |  |
| `testId` | `string` |  |  |
| `id` | `string` |  |  |

## Hint props

A muted usage hint in a row.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |
| `testId` | `string` |  |  |

## BarSeparator props

A hairline between groups of controls in a row.

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
