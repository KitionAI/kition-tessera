import { useState } from 'react'
import { Button, MenuButton, MenuItem, MenuSeparator, toast } from '@kition/tessera-ui'
import { ClipboardPasteIcon, CopyIcon, ScissorsIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [snap, setSnap] = useState(true)
  return (
    <MenuButton trigger={({ toggle }) => <Button onClick={toggle}>Edit ▾</Button>}>
      <MenuItem icon={ScissorsIcon} label="Cut" shortcut="⌘X" onSelect={() => toast('info', 'Cut')} />
      <MenuItem icon={CopyIcon} label="Copy" shortcut="⌘C" onSelect={() => toast('info', 'Copy')} />
      <MenuItem icon={ClipboardPasteIcon} label="Paste" shortcut="⌘V" onSelect={() => toast('info', 'Paste')} />
      <MenuSeparator />
      <MenuItem label="Snap to grid" checked={snap} onSelect={() => setSnap(!snap)} />
    </MenuButton>
  )
}
