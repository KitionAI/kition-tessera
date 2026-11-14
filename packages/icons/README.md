# @kition/tessera-icons

Tessera Icons, the icon set of [Kition Tessera](https://tessera.kition.ai): every icon is a list
of SVG path strings on a 24 × 24 grid, so React, a canvas `Path2D`, and Rust draw the same
shape. The Rust crate `kition-tessera-icons` holds the same icons.

```tsx
import { LayersIcon } from '@kition/tessera-icons/react'
import { Layers, drawIcon, toSvg } from '@kition/tessera-icons'

<LayersIcon size={16} />                                    // props match lucide-react's
drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' }) // canvas, also in workers
toSvg(Layers, { size: 16 })                                 // SVG markup
```

Search every icon: [tessera.kition.ai/icons](https://tessera.kition.ai/icons/). React is an
optional peer dependency, needed only for `@kition/tessera-icons/react`.

Apache-2.0. Icons drawn from Lucide keep Lucide's ISC and MIT notices (`NOTICE`,
`LICENSE-lucide`). The kit app icons in `kit/` are trademarks of Kition AI.
