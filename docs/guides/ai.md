# Building with an AI assistant

Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.

[On the site](https://tessera.kition.ai/docs/ai/)

## What to give it

Every guide and component page is also a Markdown file with the same content: what the component is, when to use it and when not to, each example as a complete file, and its props with their types and values.

An assistant that reads the web: point it at `https://tessera.kition.ai/llms.txt` (an index, one line per page, each linking to its Markdown) or at `https://tessera.kition.ai/llms-full.txt` (the whole reference in one file).

An assistant that works in your repository: check out kition-tessera next to your project and let it read `docs/README.md`, then `docs/components/<name>.md` for the component it needs, `docs/icons.md` to find an icon by what it means, and `docs/tokens.md` for the tokens.

On this site, every page has a Copy for AI button: the page as Markdown, or a prompt that points at it.

## A prompt that works

Name the components you expect, point at the docs, and state the three rules. Assistants follow rules that are written down.

```tsx
Build the layers panel of a photo editor with Kition Tessera.

Read first: https://tessera.kition.ai/llms-full.txt
Use Panel, PanelFooter, EyeButton, Thumbnail, IconButton and NumberField from @kition/tessera-ui,
and icons from @kition/tessera-icons/react.

Rules:
- Use a Tessera component where there is one; do not style a raw <button> or <input>.
- Take every colour, radius, font and shadow from the --kit-* tokens, never as a literal.
- Give every icon-only control a label.
```

## Check what it wrote

Colours: search the result for `#` and `rgb(`. A literal colour in interface code means the skin will not apply there; it should be `var(--kit-surface)`, `var(--kit-text-muted)`, `var(--kit-primary)` and the like.

Components: a raw `<button className=…>` with its own styles is a Button, an IconButton or a RibbonButton that was missed.

Icons: imports come from `@kition/tessera-icons/react`, named as on the Icons page (`layer-add` is `LayerAddIcon`). An icon the assistant made up will not compile; search the Icons page by meaning for the real one.

Skins: open the result in the Paper and the Graphite skin. Anything that stays light in Graphite is a hard-coded value.

## See also

- [Overview](overview.md): Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.
- [Installation](installation.md): Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.
- [Theming and skins](theming.md): A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.
- [Icons](icons-guide.md): Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.
