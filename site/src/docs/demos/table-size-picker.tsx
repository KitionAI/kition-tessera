import { useState } from 'react'
import { TableSizePicker } from '@kition/tessera'

export default function Demo() {
  const [picked, setPicked] = useState('')
  return (
    <div className="demo-stack">
      <TableSizePicker onPick={(rows, columns) => setPicked(`${rows} × ${columns}`)} label={(rows, columns) => `${columns} × ${rows} table`} />
      <span>{picked ? `Inserted a ${picked} table` : 'Pick a size'}</span>
    </div>
  )
}
