# Theming and skins

A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.

[On the site](https://tessera.kition.ai/docs/theming/)

## The theme

Hosts send `theme` in `ui/initialize` and `ui/theme`: a colour scheme and the 15 `--kit-*` theme tokens, applied to the document root; components read them through CSS variables. An app that is not a kit sets the same variables in its own stylesheet.

`@kition/tessera-tokens` gives every skin’s theme ready to send (`SKINS.paper`, `SKINS.graphite`), and its tests hold each skin to WCAG AA.

```tsx
import { skinTheme } from '@kition/tessera-tokens'

kit.notify('ui/theme', { theme: skinTheme('graphite') })
```

## See also

- [Overview](overview.md): Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.
- [Installation](installation.md): Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.
- [Building with an AI assistant](ai.md): Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.
- [Icons](icons-guide.md): Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.
