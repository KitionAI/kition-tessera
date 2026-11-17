import { Disclosure, TextInput } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div style={{ maxWidth: 360 }}>
      <Disclosure title="Advanced settings">
        <TextInput size="md" defaultValue="0.7" aria-label="Temperature" />
      </Disclosure>
      <Disclosure title="Usage" defaultOpen>
        1,240 credits this month
      </Disclosure>
    </div>
  )
}
