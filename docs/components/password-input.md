# PasswordInput

A password field with a show and hide button outside the tab order.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/password-input/)

```ts
import { PasswordInput } from '@kition/tessera-ui'
```

## Example: Show and hide

```tsx
import { PasswordInput } from '@kition/tessera-ui'

export default function Demo() {
  return <PasswordInput size="md" defaultValue="sk-test-not-a-real-key" aria-label="API key" />
}
```

## PasswordInput props

A password field with a show/hide button; the button keeps out of the tab order. `className`
goes on the field itself, as on TextInput.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `prefix` | `ReactNode` |  | An icon (or short text) inside the field before the text: a search glass, a person. |
| `invalid` | `boolean` |  |  |
| `wrapperClassName` | `string` |  | Classes for the box around the field and its show/hide button (layout: width, margins). |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
