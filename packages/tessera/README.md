# @kition/tessera

[Kition Tessera](https://tessera.kition.ai), the design system for professional editors, in one
package: design tokens and skins, Tessera Icons, and the components general-purpose design
systems do not have (ribbon, dock and floating panels, color picker and wheel, curves, timecode,
transport, keyframes, level meter) beside the base controls. Every component draws only through
theme tokens, so one theme reskins them all.

```bash
pnpm add @kition/tessera
```

The components (`/ui`) and the React icons (`/icons/react`) need React 19 and React DOM 19 or
later, an optional peer: `/tokens`, `/icons`, `/icons/registry` and `/ui/workspaceTree` do not
load React, so an app that uses only those needs none. The package contains compiled ES modules
and TypeScript declarations; use it with a bundler such as Vite. There is no root import: take
each part from its subpath.

## `@kition/tessera/ui`: components

Import the stylesheet once at the app root; it includes the default Paper theme.

```tsx
import '@kition/tessera/ui/styles.css'
import { Button } from '@kition/tessera/ui'

export const Save = () => <Button variant="primary">Save</Button>
```

Also `@kition/tessera/ui/workspaceTree` (the frame tree alone, without React) and the component
strings in `@kition/tessera/ui/locales/<locale>.json`.

## `@kition/tessera/icons`: Tessera Icons

Every icon is SVG path data on a 24 × 24 grid, so React, a canvas and SVG markup draw the same
shape.

```tsx
import { LayersIcon } from '@kition/tessera/icons/react'
import { Layers, drawIcon, toSvg } from '@kition/tessera/icons'

<LayersIcon size={16} />
drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' })
toSvg(Layers, { size: 16 })
```

Also `@kition/tessera/icons/registry` (every icon by name, with search words) and the kit app
icons in `@kition/tessera/icons/kit/<kit>.svg`.

## `@kition/tessera/tokens`: design tokens and skins

```ts
import '@kition/tessera/tokens/tokens.css' // the Paper values on :root
import { SKINS } from '@kition/tessera/tokens'

// A host sends a skin's theme tokens to a kit's editor; set here by hand:
const theme = SKINS.graphite
for (const [name, value] of Object.entries(theme.tokens)) document.documentElement.style.setProperty(name, value)
document.documentElement.dataset.colorScheme = theme.colorScheme
```

The token sources are in `@kition/tessera/tokens/tokens/*.tokens.json`.

## Coming from the three packages

`@kition/tessera` replaces `@kition/tessera-tokens`, `@kition/tessera-icons` and
`@kition/tessera-ui` with the same modules under subpaths: `@kition/tessera-<x>/<rest>` is
`@kition/tessera/<x>/<rest>`. `node scripts/migrate-to-tessera.mjs <folder>` in the
[repository](https://github.com/KitionAI/kition-tessera) rewrites a project's imports and
package.json (`--check` only reports).

## Links

- Docs, every component with live examples, icon search, tokens and skins:
  [tessera.kition.ai](https://tessera.kition.ai)
- Source, issues and changelog: [github.com/KitionAI/kition-tessera](https://github.com/KitionAI/kition-tessera)

## License

Apache-2.0; see LICENSE and NOTICE. Icons drawn from Lucide keep Lucide's ISC and MIT notices
(`dist/icons/NOTICE`, `dist/icons/LICENSE-lucide`).
