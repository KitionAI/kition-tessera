import { useState } from 'react'
import { Button } from '@kition/tessera-ui'
import { PlusIcon, SettingsIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [saving, setSaving] = useState(false)
  return (
    <div className="demo-row">
      <Button
        variant="primary"
        size="md"
        loading={saving}
        onClick={() => {
          setSaving(true)
          setTimeout(() => setSaving(false), 1500)
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
      <Button variant="secondary" size="md">
        <PlusIcon /> New record
      </Button>
      <Button variant="ghost" size="md" iconOnly aria-label="Settings">
        <SettingsIcon />
      </Button>
      <Button variant="secondary" size="sm" iconOnly aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  )
}
