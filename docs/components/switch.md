# Switch

An on/off switch for a setting that applies at once.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/switch/)

```ts
import { Switch } from '@kition/tessera-ui'
```

## When to use

- A setting that takes effect without a Save.

## When not to

- A choice saved with a form: use Checkbox.

## Example: On, off, disabled

```tsx
import { useState } from 'react'
import { Switch } from '@kition/tessera-ui'

export default function Demo() {
  const [sync, setSync] = useState(true)
  return (
    <div className="demo-stack">
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
        <Switch checked={sync} onCheckedChange={setSync} aria-label="Sync across devices" /> Sync across devices: {sync ? 'on' : 'off'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--kit-text-muted)' }}>
        <Switch disabled aria-label="Beta features" /> Beta features (unavailable)
      </label>
    </div>
  )
}
```

## Switch props

An on/off switch for a setting that applies at once. Controlled with `checked` and `onCheckedChange`.

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
