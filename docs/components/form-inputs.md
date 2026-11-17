# NumberInput, DateTimeInput, Popconfirm

A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/form-inputs/)

```ts
import { NumberInput, DateTimeInput, Popconfirm } from '@kition/tessera-ui'
```

## Example: Price, start time, delete

```tsx
import { useState } from 'react'
import { Button, DateTimeInput, NumberInput, Popconfirm, toast } from '@kition/tessera-ui'

export default function Demo() {
  const [price, setPrice] = useState<number | null>(0.25)
  const [start, setStart] = useState<string | null>('2026-10-25T09:00')
  return (
    <div className="demo-row" style={{ alignItems: 'flex-end' }}>
      <label style={{ display: 'grid', gap: 6 }}>
        Price per call
        <NumberInput value={price} onChange={setPrice} min={0} step={0.05} precision={2} style={{ width: 140 }} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        From
        <DateTimeInput withTime value={start} onChange={setStart} />
      </label>
      <Popconfirm title="Delete this pricing rule?" description="Calls are charged by the default rule afterwards." danger okText="Delete" onConfirm={() => toast('success', 'Rule deleted')}>
        <Button variant="danger">Delete rule</Button>
      </Popconfirm>
    </div>
  )
}
```

## NumberInput props

A field for a number, empty as `null`; arrows step it, and it rounds to `precision` when left.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| null \| ''` |  | Optional inside a `FormItem`, which supplies it. |
| `onChange` | `(value: number \| null) => void` |  |  |
| `min` | `number` |  |  |
| `max` | `number` |  |  |
| `step` | `number` | `1` |  |
| `precision` | `number` |  | Decimals kept when the field is left. |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `invalid` | `boolean` |  |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## DateTimeInput props

A date, or a date and time, from the platform's picker; cleared to `null`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` |  | Optional inside a `FormItem`, which supplies it. |
| `onChange` | `(value: string \| null) => void` |  |  |
| `withTime` | `boolean` |  | Asks for a time too. |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `invalid` | `boolean` |  |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## Popconfirm props

Asks "are you sure?" next to the button that does something, before it does.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  |  |
| `description` | `ReactNode` |  |  |
| `onConfirm` (required) | `() => void` |  |  |
| `okText` | `string` |  |  |
| `cancelText` | `string` |  |  |
| `danger` | `boolean` |  | Draws OK as a destructive button. |
| `disabled` | `boolean` |  | Lets the trigger act without asking. |
| `children` (required) | `ReactElement` |  | The button that asks. |

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
