# Combobox and MultiSelect

One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/combobox/)

```ts
import { Combobox, MultiSelect } from '@kition/tessera-ui'
```

## When to use

- Picking a user, a record, a country: more choices than a Select shows well.

## When not to

- A handful of fixed choices: use Select.

## Example: Search and pick

```tsx
import { useState } from 'react'
import { Combobox } from '@kition/tessera-ui'

const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth']

export default function Demo() {
  const [person, setPerson] = useState<number | undefined>(2)
  return (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Person"
        size="md"
        placeholder="Search people"
        value={person}
        onChange={setPerson}
        options={PEOPLE.map((name, index) => ({ value: index + 1, label: index === 5 ? `${name} (no GitHub)` : name, disabled: index === 5 }))}
      />
    </div>
  )
}
```

## Example: Several choices

```tsx
import { useState } from 'react'
import { MultiSelect } from '@kition/tessera-ui'

const MODES = ['free', 'reward', 'paid', 'hosted'].map((value) => ({ value, label: value }))

export default function Demo() {
  const [modes, setModes] = useState(['paid', 'hosted'])
  return (
    <div style={{ maxWidth: 280 }}>
      <MultiSelect label="Mode" placeholder="Any mode" size="md" values={modes} onChange={setModes} options={MODES} />
    </div>
  )
}
```

## Combobox props

One choice from a long list, searched as the person types; the choice can be cleared.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `V \| undefined` |  |  |
| `onChange` (required) | `(value: V \| undefined) => void` |  |  |
| `options` (required) | `readonly ComboboxOption<V>[]` |  |  |
| `onSearch` | `(query: string) => void` |  | Search on the server: called with each query, and the options shown are the caller's. Without it, the options are filtered here. |
| `loading` | `boolean` |  |  |
| `placeholder` | `string` |  |  |
| `emptyText` | `ReactNode` |  | Shown when nothing matches. |
| `label` (required) | `string` |  | The control's accessible name. |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `disabled` | `boolean` |  |  |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## MultiSelect props

Several choices from a list: the chosen ones in the field, toggled in a list (searchable once it is long).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `values` (required) | `readonly V[]` |  |  |
| `onChange` (required) | `(values: V[]) => void` |  |  |
| `options` (required) | `readonly ComboboxOption<V>[]` |  |  |
| `placeholder` | `string` |  | Shown when nothing is chosen. |
| `label` (required) | `string` |  | The control's accessible name. |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `disabled` | `boolean` |  |  |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

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
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
