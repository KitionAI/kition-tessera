# Icons

Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.

[On the site](https://tessera.kition.ai/docs/icons-guide/)

## Use

Browse and copy every icon on the Icons page. Tool icons (`family: "tool"`) carry accent areas filled with `--kit-icon-accent`; pass `accent={false}` for plain line.

```tsx
import { LayersIcon } from '@kition/tessera-icons/react'
import { Layers, drawIcon, toSvg } from '@kition/tessera-icons'

<LayersIcon size={16} />
drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' })
```

## Style

24 grid with a 20 live area, 1.5 round strokes, radius 2 corners, half-unit coordinates, 2-unit gaps; one metaphor per action. The full rules are in docs/icon-style.md.

## See also

- [Overview](overview.md): Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.
- [Installation](installation.md): Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.
- [Building with an AI assistant](ai.md): Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.
- [Theming and skins](theming.md): A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.
