# Tokens and skins

Every value a Tessera component draws with is a CSS variable. The 15 theme tokens are the Kit Harness Protocol's (Kit UI protocol, section 4): a host sends them in `ui/initialize` and `ui/theme`, and every kit that follows the protocol takes the skin. The component tokens are Tessera's own layout values. A skin (Paper, Graphite) is one value per theme token.

Package: `@kition/tessera-tokens` (CSS variables, TypeScript) and the Rust crate `kition-tessera-tokens` · [On the site](https://tessera.kition.ai/tokens/) · [Theming guide](guides/theming.md)

```ts
import '@kition/tessera-tokens/tokens.css' // the Paper values on :root
import { SKINS, skinTheme } from '@kition/tessera-tokens'

const theme = skinTheme('graphite') // { colorScheme, tokens }, ready to send as ui/theme
```

## Theme tokens (sent by hosts)

| Token | Paper | Graphite | Meaning |
| --- | --- | --- | --- |
| `--kit-font-sans` | `Inter, system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', sans-serif` | `Inter, system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', sans-serif` | Interface font stack |
| `--kit-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | Monospace font stack |
| `--kit-surface` | `#ffffff` | `#1b1e23` | Editor background |
| `--kit-surface-muted` | `#fafaf9` | `#22262c` | Panels, rails, ribbon background |
| `--kit-canvas` | `#f6f5f4` | `#15171b` | Behind the document (pasteboard) |
| `--kit-text` | `#1a1a1a` | `#eceff1` | Primary text |
| `--kit-text-muted` | `#5d5b54` | `#a9b0ba` | Secondary text |
| `--kit-border` | `#e5e3df` | `#33373e` | Hairlines and control borders |
| `--kit-primary` | `#5645d4` | `#8b7ff0` | Primary action, selection, focus |
| `--kit-primary-text` | `#ffffff` | `#0b0a1f` | Text on primary |
| `--kit-primary-soft` | `rgba(86, 69, 212, 0.1)` | `rgba(86, 69, 212, 0.1)` | Selected and hovered backgrounds |
| `--kit-danger` | `#e03131` | `#e03131` | Destructive and error |
| `--kit-radius-control` | `8px` | `8px` | Buttons, inputs |
| `--kit-radius-card` | `12px` | `12px` | Cards, panels, dialogs |
| `--kit-shadow-card` | `0 1px 2px rgba(15, 15, 15, 0.06), 0 4px 16px rgba(15, 15, 15, 0.06)` | `0 1px 2px rgba(15, 15, 15, 0.06), 0 4px 16px rgba(15, 15, 15, 0.06)` | Card and popover shadow |

## Component tokens (Tessera's own)

| Token | Paper | Graphite | Meaning |
| --- | --- | --- | --- |
| `--kit-meter-bg` | `#e9e8e4` | `#e9e8e4` | Level meter track |
| `--kit-meter-ok` | `#2f9e44` | `#2f9e44` | Level meter green gradient, at the floor |
| `--kit-meter-ok-high` | `#40c057` | `#40c057` | Level meter green gradient, at -12 dB |
| `--kit-meter-warn` | `#e8a200` | `#e8a200` | Level meter yellow band |
| `--kit-meter-clip` | `#e03131` | `#e03131` | Level meter red band |
| `--kui-bar-height` | `36px` | `36px` | The top strip of both shells |
| `--kui-ribbon-row` | `24px` | `24px` | A ribbon row |
| `--kui-tab-underline` | `2px` | `2px` | The selected tab's underline |
| `--kui-tab-selected-weight` | `600` | `600` | The selected tab's font weight |
| `--kui-hover` | `color-mix(in srgb, var(--kit-text) 7%, transparent)` | `color-mix(in srgb, var(--kit-text) 7%, transparent)` | A control under the pointer: neutral, unlike a pressed toggle's --kit-primary-soft |
| `--kui-select-chevron` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d5b54' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d5b54' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` | Chevron-down for drop-downs, in --kit-text-muted (a data URI cannot read a variable) |
| `--kui-success` | `#18794e` | `#18794e` | Success: done, active, paid (tags, alerts, results); text on its own soft tint |
| `--kui-warning` | `#ad5700` | `#ad5700` | Warning: pending, needs attention (tags, alerts, results); text on its own soft tint |
| `--kui-chart-1` | `#5645d4` | `#5645d4` | Chart series 1: lines and their legend swatches, in order |
| `--kui-chart-2` | `#0d74ce` | `#0d74ce` | Chart series 2: lines and their legend swatches, in order |
| `--kui-chart-3` | `#18794e` | `#18794e` | Chart series 3: lines and their legend swatches, in order |
| `--kui-chart-4` | `#ad5700` | `#ad5700` | Chart series 4: lines and their legend swatches, in order |
| `--kui-chart-5` | `#ce2c31` | `#ce2c31` | Chart series 5: lines and their legend swatches, in order |
| `--kui-chart-6` | `#8145b5` | `#8145b5` | Chart series 6: lines and their legend swatches, in order |

## Rules

- A component never hard-codes a colour, radius, font, or shadow: it reads a token.
- An app that is not a kit sets the same variables in its own stylesheet.
- Every skin is held to WCAG AA contrast by the token package’s tests.
- The source of every value is `packages/tokens/tokens/*.tokens.json`.
