import { useState, type Key } from 'react'
import { Button, IconButton, SelectionBar, Table, type TableColumn } from '@kition/tessera-ui'
import { CopyIcon, DownloadIcon, EllipsisIcon, FolderInputIcon, Share2Icon, StarIcon, TrashIcon } from '@kition/tessera-icons/react'

type File = { id: string; name: string; owner: string; modified: string }

const FILES: File[] = [
  { id: 'f1', name: 'Q4 plan.docx', owner: 'Ada', modified: 'Today 10:12' },
  { id: 'f2', name: 'Backlog.ktable', owner: 'Me', modified: 'Today 09:30' },
  { id: 'f3', name: 'Roadmap review.pptx', owner: 'Grace', modified: 'Yesterday' },
  { id: 'f4', name: 'Budget 2026.xlsx', owner: 'Me', modified: 'Yesterday' },
  { id: 'f5', name: 'User research.pdf', owner: 'Alan', modified: 'Oct 28' },
]

const columns: TableColumn<File>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name', ellipsis: true },
  { key: 'owner', title: 'Owner', dataIndex: 'owner', width: 110 },
  { key: 'modified', title: 'Modified', dataIndex: 'modified', width: 140 },
]

export default function Demo() {
  const [selected, setSelected] = useState<Key[]>(['f2'])
  return (
    <div style={{ position: 'relative', minHeight: 360 }}>
      <Table
        columns={columns}
        dataSource={FILES}
        rowKey="id"
        pagination={false}
        rowSelection={{ selectedKeys: selected, onChange: setSelected, rowLabel: (file) => `Select ${file.name}` }}
        rowActions={(file) => (
          <>
            <IconButton icon={Share2Icon} label={`Share ${file.name}`} />
            <IconButton icon={DownloadIcon} label={`Download ${file.name}`} />
            <IconButton icon={StarIcon} label={`Star ${file.name}`} />
            <IconButton icon={EllipsisIcon} label={`More for ${file.name}`} />
          </>
        )}
      />
      <SelectionBar count={selected.length} onClear={() => setSelected([])}>
        <Button variant="ghost" size="sm"><Share2Icon size={16} />Share</Button>
        <Button variant="ghost" size="sm"><DownloadIcon size={16} />Download</Button>
        <Button variant="ghost" size="sm"><FolderInputIcon size={16} />Move</Button>
        <Button variant="ghost" size="sm"><CopyIcon size={16} />Copy</Button>
        <Button variant="ghost" size="sm"><TrashIcon size={16} />Delete</Button>
      </SelectionBar>
    </div>
  )
}
