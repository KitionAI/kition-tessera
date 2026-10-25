# Kition Tessera

**The design system for AI-native professional software.**

A tessera is one tile of a mosaic. Tessera is the tiles Kition's kits are built from: design
tokens, an icon set, and the components professional editors need (ribbons, dock panels, color
pickers, curves, timelines, keyframes, level meters) that general-purpose design systems do not
have.

Tessera implements the theme contract of the Kit Harness Protocol (KHP): the `--kit-*` theme
tokens of the Kit UI protocol, which a host sends in `ui/initialize` and `ui/theme`. Any kit that
follows that contract can be reskinned by any host; Tessera is the quickest way to follow it.

## Packages

| Package | What | Status |
| --- | --- | --- |
| [`@kition/tessera-tokens`](packages/tokens) | Design tokens as CSS variables and TypeScript; skins (Paper, Graphite) as KHP themes | 0.1 |
| [`tessera-tokens`](crates/tessera-tokens) (Rust) | The same tokens for kit engines that draw on the canvas | 0.1 |
| [`@kition/tessera-icons`](packages/icons) | Tessera Icons: every icon as SVG path data, React components, canvas drawing; kit app icons | 0.1 |
| [`tessera-icons`](crates/tessera-icons) (Rust) | The same icons for kit engines | 0.1 |
| [`@kition/tessera`](packages/tessera) | Components: base controls, ribbon, dock and floating panels, color controls, curves, histogram, level meter, timecode, transport, keyframes, workspace layout | 0.1 |

## Tokens

```ts
import '@kition/tessera-tokens/tokens.css'
import { SKINS, skinTheme } from '@kition/tessera-tokens'

// A host sends a skin to a kit's editor (Kit UI protocol, ui/initialize or ui/theme):
const theme = skinTheme('graphite')
```

The source of truth is [`packages/tokens/tokens/`](packages/tokens/tokens): `base.tokens.json`
(every token with its Paper value; Design Tokens Community Group structure, CSS values) and one
file per skin in `skins/`. `pnpm build:tokens` generates the CSS, TypeScript, and Rust.

## Icons

```tsx
import { LayersIcon } from '@kition/tessera-icons/react'
import { Layers, drawIcon, toSvg } from '@kition/tessera-icons'

<LayersIcon size={16} />          // props match lucide-react's
drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' })   // canvas, also in workers
toSvg(Layers, { size: 16 })
```

Every icon is a list of SVG path strings on a 24 × 24 grid (`paths` stroked, `fills` filled), so
React, a canvas `Path2D`, and Rust draw identical shapes. The set is listed in
[`packages/icons/icons.json`](packages/icons/icons.json). The first set is the 405 Lucide icons
Kition's repositories use today, under their Lucide names, so code moves off `lucide-react`
without visual change (`FROM_LUCIDE` maps every lucide-react name); Tessera's own drawings
replace them over time. Kit app icons are full-color tiles in `packages/icons/kit/`.

## Components

```tsx
import '@kition/tessera/styles.css'
import { Button, ColorPicker, ElementsProvider, StringsProvider } from '@kition/tessera'
```

Components draw only through the theme tokens. They ask the editor around them for two things:
strings (`StringsProvider`; English without one, `zh-CN` included) and element states
(`ElementsProvider`: whether an element id is hidden or disabled, and extra items such as a host's
buttons). `@kition/kit-ui` fills both from the Kit UI protocol and re-exports the components
under their old names, so kits need no change. Class names keep the `kui-` prefix kits style
against.

## Preview site

```bash
pnpm --filter @kition/tessera-site dev   # http://127.0.0.1:4340
```

Icons (search, sizes, strokes, usage snippets), tokens and skins, and every component live, with
a skin switch.

## Development

```bash
pnpm install
pnpm build            # regenerate tokens and icons
pnpm check            # generated files current, types, tests, rustfmt, clippy, cargo test
pnpm check:consumers  # the token copies in kition-sdk's kit-ui and in Kition still match
pnpm usage:lucide     # the lucide icons Kition's repositories import (--write adds new ones)
```

`check:consumers` and `usage:lucide` look for `kition`, `kition-sdk`, and the `kition-<kit>`
repositories next to this one; set `KITION_DIR`, `KITION_SDK_DIR`, or `KITION_WORKSPACE` to point
elsewhere.

## License

Apache-2.0. Icons drawn from Lucide keep Lucide's ISC and MIT notices; see
[`packages/icons/NOTICE`](packages/icons/NOTICE). The Kition and Tessera names and the kit app
icons are trademarks of Kition AI.
