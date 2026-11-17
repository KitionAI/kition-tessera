# Textarea

Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/textarea/)

```ts
import { Textarea } from '@kition/tessera-ui'
```

## Example: Fixed and growing

```tsx
import { useState } from 'react'
import { Textarea } from '@kition/tessera-ui'

export default function Demo() {
  const [note, setNote] = useState('Grows as you type, up to five lines.')
  return (
    <div className="demo-stack">
      <Textarea rows={3} placeholder="Describe the change for the agent…" />
      <Textarea aria-label="Note" autoSize={{ minRows: 2, maxRows: 5 }} value={note} onChange={(event) => setNote(event.target.value)} />
    </div>
  )
}
```

## Textarea props

Multi-line text.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `invalid` | `boolean` |  |  |
| `autoSize` | `boolean \| AutoSize` |  | Grows with its text (between `minRows` and `maxRows` lines, when given). |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
