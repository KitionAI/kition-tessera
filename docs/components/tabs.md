# Tabs

Sections of one page under a row of tabs; arrow keys move between them.

Category: Navigation · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/tabs/)

```ts
import { Tabs } from '@kition/tessera-ui'
```

## When not to

- Two or three views of the same data: use Segmented.

## Keyboard

| Keys | What they do |
| --- | --- |
| Left, Right | Open the previous or the next tab, wrapping at the ends; disabled tabs are skipped. |
| Home, End | Open the first or the last tab. |

## Example: With a range control

```tsx
import { Segmented, Tabs } from '@kition/tessera-ui'
import { useState } from 'react'

export default function Demo() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d')
  return (
    <Tabs
      extra={<Segmented label="Range" value={range} onChange={setRange} segments={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }]} />}
      items={[
        { key: 'usage', label: 'Usage', children: `Generations in the last ${range}.` },
        { key: 'ledger', label: 'Credit ledger', children: 'Every credit added and spent.' },
        { key: 'keys', label: 'API keys', children: 'Keys this account created.' },
        { key: 'audit', label: 'Audit log', disabled: true },
      ]}
    />
  )
}
```

## Tabs props

Sections of one page under a row of tabs; arrow keys move between tabs.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` (required) | `readonly TabItem[]` |  |  |
| `activeKey` | `string` |  | The open tab, when the screen holds it (with `onChange`); otherwise `defaultActiveKey` or the first. |
| `defaultActiveKey` | `string` |  |  |
| `onChange` | `(key: string) => void` |  |  |
| `extra` | `ReactNode` |  | Content at the end of the tab row (a filter, an action). |
| `className` | `string` |  |  |
| `testId` | `string` |  |  |

## See also

- [AppRail](app-rail.md): A suite’s app switcher on the left edge: each app’s icon over its name, the open one marked, badges, the product mark above and the account below; compact shows icons only, each name as its tooltip.
- [NavMenu](nav-menu.md): An app’s sidebar: its pages as links under headings, the current one marked; collapses to icons.
- [Pagination](pagination.md): The pages of a long list on the server: the range shown, page buttons, and a page size.
