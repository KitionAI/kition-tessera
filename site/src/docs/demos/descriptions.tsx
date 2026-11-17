import { Avatar, Breadcrumb, Descriptions, Divider, Tag } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div>
      <Breadcrumb items={[{ title: <a href="#users">Users</a> }, { title: 'Ada Lovelace' }]} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
        <Avatar name="Ada Lovelace" size={36} />
        <strong>Ada Lovelace</strong>
        <Tag tone="success">active</Tag>
      </div>
      <Divider>Account</Divider>
      <Descriptions
        columns={3}
        items={[
          { label: 'Email', children: 'ada@example.com' },
          { label: 'Plan', children: 'Pro (yearly)' },
          { label: 'Credits', children: '12,400' },
          { label: 'Signed up', children: '2026-03-14 09:21' },
          { label: 'Last active', children: '2 hours ago' },
          { label: 'Notes', children: 'Moved from the Team plan after the trial.', span: 3 },
        ]}
      />
    </div>
  )
}
