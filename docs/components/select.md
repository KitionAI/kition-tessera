# Select

A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/select/)

```ts
import { Select } from '@kition/tessera-ui'
```

## When not to

- Two or three options always visible: use Segmented or Choice.

## Example: Sizes

```tsx
import { Select } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-stack">
      <Select defaultValue="sheet" aria-label="Kit">
        <option value="sheet">Sheet</option>
        <option value="slide">Slide</option>
        <option value="photo">Photo</option>
      </Select>
      <Select size="lg" defaultValue="slide" aria-label="Kit (large)">
        <option value="sheet">Sheet</option>
        <option value="slide">Slide</option>
      </Select>
    </div>
  )
}
```

## Select props

A drop-down. It stays a native select, as kits' do, for the platform's popup and accessibility,
drawn as Tessera's control. Children are `<option>`s.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `ControlSize`: `'sm'`, `'md'`, `'lg'` | `'sm'` |  |
| `invalid` | `boolean` |  |  |

Also takes the attributes of its HTML element (`className`, `aria-*`, events).

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
