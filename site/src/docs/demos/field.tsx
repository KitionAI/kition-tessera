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
