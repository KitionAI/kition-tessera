import { TextInput } from '@kition/tessera'
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
