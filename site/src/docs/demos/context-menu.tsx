import { useState } from 'react'
import { ContextMenu, MenuItem, type ContextMenuPoint } from '@kition/tessera-ui'
import { CopyIcon, TrashIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [at, setAt] = useState<ContextMenuPoint | null>(null)
  return (
    <>
      <div
        className="demo-target"
        onContextMenu={(event) => {
          event.preventDefault()
          setAt({ x: event.clientX, y: event.clientY })
        }}
      >
        Right-click here
      </div>
      <ContextMenu at={at} onClose={() => setAt(null)} label="Layer">
        <MenuItem icon={CopyIcon} label="Duplicate layer" onSelect={() => setAt(null)} />
        <MenuItem icon={TrashIcon} label="Delete layer" onSelect={() => setAt(null)} />
      </ContextMenu>
    </>
  )
}
