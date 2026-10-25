import { useState } from 'react'
import { IconButton } from '@kition/tessera'
import { BoldIcon, ItalicIcon, UnderlineIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [bold, setBold] = useState(true)
  return (
    <div className="demo-row">
      <IconButton icon={BoldIcon} label="Bold" pressed={bold} onClick={() => setBold(!bold)} />
      <IconButton icon={ItalicIcon} label="Italic" />
      <IconButton icon={UnderlineIcon} label="Underline" disabled />
    </div>
  )
}
