# Field

A label, a control, and its hint or error, wired for screen readers.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/field/)

```ts
import { Field } from '@kition/tessera-ui'
```

## When to use

- Every form control with a visible label.

## Example: Validation

```tsx
import { useState } from 'react'
import { Field, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  const [email, setEmail] = useState('not-an-email')
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  return (
    <Field label="Email" hint="We only use it to sign you in." error={valid ? undefined : 'Enter an email address.'}>
      {({ id, describedBy, invalid }) => (
        <TextInput id={id} aria-describedby={describedBy} invalid={invalid} size="md" value={email} onChange={(event) => setEmail(event.target.value)} />
      )}
    </Field>
  )
}
```

## Field props

A label, a control, and its help or error, wired together for screen readers.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  |  |
| `hint` | `ReactNode` |  | Help under the control; replaced by `error` when there is one. |
| `error` | `ReactNode` |  |  |
| `children` (required) | `ReactNode \| ((ids: { id: string; describedBy: string \| undefined; invalid: boolean }) => ReactNode)` |  | The control. Given a function, it receives the ids to put on it (`id`, `aria-describedby`). |
| `className` | `string` |  |  |

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
