# TextInput

A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/text-input/)

```ts
import { TextInput } from '@kition/tessera-ui'
```

## Example: Sizes and invalid

```tsx
import { TextInput } from '@kition/tessera-ui'
import { SearchIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <div className="demo-stack">
      <TextInput placeholder="sm: kit toolbars (28)" />
      <TextInput size="md" placeholder="md: panels and settings (36)" />
      <TextInput size="lg" placeholder="lg: forms and dialogs (44)" />
      <TextInput size="md" defaultValue="not-an-email" invalid />
      <TextInput size="md" type="search" aria-label="Search users" placeholder="Search users" prefix={<SearchIcon size={16} />} />
    </div>
  )
}
```

## TextInput props

A single-line text field. `invalid` marks it (and `aria-invalid`) after a failed check.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `invalid` | `boolean` |  |  |
| `prefix` | `ReactNode` |  | An icon (or short text) inside the field before the text: a search glass, a person. |
| `wrapperClassName` | `string` |  | Classes for the box around the field and its prefix (layout: width, margins). |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
