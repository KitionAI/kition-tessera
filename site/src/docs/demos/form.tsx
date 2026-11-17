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
