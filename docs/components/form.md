# Form

A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.

Category: Forms · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/form/)

```ts
import { Form, FormItem } from '@kition/tessera-ui'
```

## When to use

- A settings page, a create or edit dialog, any form with validation.

## When not to

- One setting that applies at once: use a Switch on its own.

## Example: Rules, help, reset

Submit with the email empty to see the errors; they re-check as you type.

```tsx
import { Button, Checkbox, Form, FormItem, NumberInput, Select, TextInput, toast, useForm, useWatch } from '@kition/tessera-ui'

type Values = { email: string; credits: number | null; reason: string; plan: string; notify: boolean }

export default function Demo() {
  const form = useForm<Values>()
  const credits = useWatch<number>('credits', form)
  return (
    <div style={{ maxWidth: 420 }}>
      <Form<Values> form={form} initialValues={{ email: '', credits: 100, reason: '', plan: 'pro', notify: true }} onFinish={(values) => toast('success', 'Credits added', `${values.credits} credits for ${values.email}`)}>
        <FormItem name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
          <TextInput size="md" placeholder="ada@example.com" />
        </FormItem>
        <FormItem name="credits" label="Credits" rules={[{ required: true }, { min: 1, max: 100000 }]} extra={credits ? `About $${(credits / 100).toFixed(2)} of usage.` : undefined}>
          <NumberInput size="md" min={1} step={10} />
        </FormItem>
        <FormItem name="plan" label="Plan">
          <Select size="md">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
          </Select>
        </FormItem>
        <FormItem name="reason" label="Reason" rules={[{ required: true, whitespace: true }, { max: 120 }]} extra="Recorded in the credit ledger.">
          <TextInput size="md" />
        </FormItem>
        <FormItem name="notify" valuePropName="checked">
          <Checkbox label="Email the person" />
        </FormItem>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="submit" variant="primary" size="md">Add credits</Button>
          <Button size="md" onClick={() => form.resetFields()}>Reset</Button>
        </div>
      </Form>
    </div>
  )
}
```

## Form props

A form that keeps its fields' values and checks them before `onFinish`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `form` | `FormInstance<T>` |  |  |
| `initialValues` | `Partial<T>` |  | The values it starts with (read once). |
| `onFinish` | `(values: T) => void` |  | Called with the values when the person submits and every field passes. |
| `onValuesChange` | `(changed: Partial<T>, values: T) => void` |  |  |
| `layout` | `FormLayout`: `'vertical'`, `'inline'` | `'vertical'` | `vertical` (default): labels above controls; `inline`: fields in a row (filters). |
| `disabled` | `boolean` | `false` |  |
| `className` | `string` |  |  |
| `id` | `string` |  |  |
| `children` (required) | `ReactNode` |  |  |

## FormItem props

A labelled control bound to one field of the form around it, with its rules and error.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` |  | The field's name in the values; without it the item only lays out a label and a control. |
| `label` | `ReactNode` |  |  |
| `rules` | `readonly FormRule[]` | `[]` |  |
| `extra` | `ReactNode` |  | Help under the control (replaced by the error while there is one). |
| `required` | `boolean` |  | Marks the label as required (implied by a `required` rule). |
| `valuePropName` | `string` | `'value'` | The control's prop that holds the value: `checked` for a check box or switch. |
| `trigger` | `string` | `'onChange'` | The control's prop that reports a change: `onCheckedChange` for a switch. |
| `getValueFromEvent` | `(...args: any[]) => unknown` | `fromEvent` | The value from what the control reports (an event's `target.value` or `checked`, or the value itself, by default). |
| `dependencies` | `readonly string[]` | `[]` | Fields whose changes re-check this one (a confirmation of a password). |
| `hidden` | `boolean` |  | Kept in the values but not drawn. |
| `className` | `string` |  |  |
| `children` (required) | `ReactNode` |  | One control element. |

## See also

- [TextInput](text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](switch.md): An on/off switch for a setting that applies at once.
- [Field](field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Combobox and MultiSelect](combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.
