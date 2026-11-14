# @kition/tessera-tokens

The design tokens of [Kition Tessera](https://tessera.kition.ai), the design system for
professional editors: the Kit Harness Protocol theme tokens (`--kit-*`), Tessera's component
tokens, and the Paper and Graphite skins, as CSS variables and TypeScript. The Rust crate
`tessera-tokens` holds the same values.

```ts
import '@kition/tessera-tokens/tokens.css' // the Paper values on :root
import { SKINS, skinTheme } from '@kition/tessera-tokens'

// A host sends a skin to a kit's editor (Kit UI protocol, ui/initialize or ui/theme):
const theme = skinTheme('graphite')
```

Every token and its value in each skin: [tokens and skins](https://tessera.kition.ai/tokens/).
The source of every value is `tokens/*.tokens.json` (Design Tokens Community Group structure).

Apache-2.0.
