# Installation

Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.

[On the site](https://tessera.kition.ai/docs/installation/)

## Install

Components need React 19 or later. `@kition/tessera-ui` brings the tokens and the icons with it; add `@kition/tessera-icons` to import icons yourself, and `@kition/tessera-tokens` to read skins in code.

The npm distributions contain compiled ES modules, TypeScript declarations, stylesheets, and public assets. Use them in a React app with a bundler such as Vite. A linked checkout uses TypeScript source for local development; pnpm pack selects built output for npm.

```tsx
pnpm add @kition/tessera-ui @kition/tessera-icons @kition/tessera-tokens
```

## First component

Import the stylesheet once, at the root of the app; it carries the Paper skin’s token values, so components draw without any other setup. Class names start with `kui-`.

```tsx
import '@kition/tessera-ui/styles.css'
import { Button, IconButton } from '@kition/tessera-ui'
import { LayersIcon } from '@kition/tessera-icons/react'

export function Toolbar() {
  return (
    <>
      <IconButton icon={LayersIcon} label="Layers" />
      <Button variant="primary">Save</Button>
    </>
  )
}
```

## Apply a skin

A skin is a colour scheme and one value per theme token. Set the tokens on the document root (or on any element, to skin only what is inside it) and mark the colour scheme. A kit does not do this itself: its host sends the theme (see Theming and skins).

```tsx
import { SKINS } from '@kition/tessera-tokens'

const theme = SKINS.graphite
const root = document.documentElement
for (const [name, value] of Object.entries(theme.tokens)) root.style.setProperty(name, value)
root.dataset.colorScheme = theme.colorScheme
```

## Strings

Without a provider, components speak English. Wrap the app in `StringsProvider` for another language (`zh-CN` is included) or your own wording; see Strings and elements.

```tsx
import { StringsProvider, TESSERA_CATALOGS, createStrings } from '@kition/tessera-ui'

<StringsProvider strings={createStrings(TESSERA_CATALOGS, 'zh-CN')}>
  <App />
</StringsProvider>
```

## Rules for code that uses Tessera

Take colours, radii, fonts and shadows from the tokens (`var(--kit-primary)`), never as literals, so every skin applies.

Use the Tessera component when there is one (Button, IconButton, Modal, Popover, Select, NumberField) instead of styling a raw element.

Give every icon-only control a label; take icons from Tessera Icons so strokes match.

## See also

- [Overview](overview.md): Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.
- [Building with an AI assistant](ai.md): Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.
- [Theming and skins](theming.md): A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.
- [Icons](icons-guide.md): Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.
