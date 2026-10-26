import { useState } from 'react'
import { Pagination } from '@kition/tessera'

export default function Demo() {
  const [page, setPage] = useState(6)
  const [size, setSize] = useState(20)
  return <Pagination page={page} pageSize={size} total={1137} pageSizeOptions={[20, 50, 100]} onChange={(next, pageSize) => { setPage(next); setSize(pageSize) }} />
}
