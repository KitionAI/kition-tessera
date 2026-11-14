# Pagination

The pages of a long list on the server: the range shown, page buttons, and a page size.

Category: Navigation · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/pagination/)

```ts
import { Pagination } from '@kition/tessera-ui'
```

## When to use

- A list the server pages; Table pages its own rows.

## Example: Page 6 of 57

```tsx
import { useState } from 'react'
import { Pagination } from '@kition/tessera-ui'

export default function Demo() {
  const [page, setPage] = useState(6)
  const [size, setSize] = useState(20)
  return <Pagination page={page} pageSize={size} total={1137} pageSizeOptions={[20, 50, 100]} onChange={(next, pageSize) => { setPage(next); setSize(pageSize) }} />
}
```

## Pagination props

The pages of a long list: the range shown, page buttons, and an optional page size.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `page` (required) | `number` |  |  |
| `pageSize` (required) | `number` |  |  |
| `total` (required) | `number` |  |  |
| `onChange` (required) | `(page: number, pageSize: number) => void` |  |  |
| `pageSizeOptions` | `readonly number[]` |  | Offers these page sizes; without it the size is fixed. |
| `className` | `string` |  |  |

## See also

- [Tabs](tabs.md): Sections of one page under a row of tabs; arrow keys move between them.
- [AppRail](app-rail.md): A suite’s app switcher on the left edge: each app’s icon over its name, the open one marked, badges, the product mark above and the account below; compact shows icons only, each name as its tooltip.
- [NavMenu](nav-menu.md): An app’s sidebar: its pages as links under headings, the current one marked; collapses to icons.
