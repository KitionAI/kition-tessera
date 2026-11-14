# Overview

Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.

[On the site](https://tessera.kition.ai/docs/overview/)

## Three packages

`@kition/tessera-tokens`: the Kit Harness Protocol theme tokens (`--kit-*`), component tokens, and skins (Paper, Graphite) as CSS variables, TypeScript, and Rust.

`@kition/tessera-icons`: every icon as SVG path data on a 24 grid, as React components (`LayersIcon`), canvas drawing (`drawIcon`), SVG markup (`toSvg`), and the Rust crate `tessera-icons` for engines.

`@kition/tessera-ui`: the components on these pages. They draw only through the theme tokens, so a host restyles all of them by sending one theme.

```tsx
import '@kition/tessera-ui/styles.css'
import { Button, ColorPicker } from '@kition/tessera-ui'
import { LayersIcon } from '@kition/tessera-icons/react'
```

## Principles

Built for professional software: ribbons, docks, colour wheels, curves, timelines and meters sit beside buttons and fields.

Styled only by tokens: no component hard-codes a colour, radius or shadow; skins and hosts change them all.

One icon family: a 24 grid, a 1.5 stroke, round caps; tool icons carry accents in the skin colour.

Accessible by default: labels, keyboard use, focus rings, and every skin held to WCAG AA contrast.

## See also

- [Installation](installation.md): Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.
- [Building with an AI assistant](ai.md): Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.
- [Theming and skins](theming.md): A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.
- [Icons](icons-guide.md): Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.
