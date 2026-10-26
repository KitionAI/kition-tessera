# Tessera Icons: style

Every icon in every Kition kit follows these rules, so a photo editor's tool rail, a spreadsheet's
ribbon and a timeline's transport read as one suite. The site's icon style lab
(`pnpm --filter @kition/tessera-site dev`, `#styles`) shows the directions that were compared.

## Decision (2026-10-25)

**Fine line for everything; duotone accents for tools.**

| Direction | Verdict | Why |
| --- | --- | --- |
| A · Fine line (1.5 stroke, round) | **Base style** | Kition's product UI is compact and restrained (kition `docs/design.md`); dense professional toolbars need light glyphs; 1.5 sits with Inter's text weight, as SF Symbols regular and Figma's UI icons do |
| B · Duotone | **Tool icons only** (`family: "tool"`) | The tool rail is where a glance must tell tools apart; an accent area that follows the skin (`--kit-icon-accent`, KHP-0007) gives tools identity without colouring every button |
| C · Bold geometric (2.25, flat caps) | Rejected | Heavy at 16 px; flat caps make short strokes look broken |
| D · Tessera tile | Rejected for interface icons | Tiles are the kit app icons' mark (brand identity B3); on every button they would blur the kits' identity |

## Grid and geometry

- **Canvas** 24 × 24. **Live area** 20 × 20 (2 units of padding). Optical exceptions (circles,
  diagonals) may reach 21 × 21.
- **Stroke** 1.5 units (`DEFAULT_STROKE`, kit-ui `ICON_STROKE`), round caps and joins. Never pass
  another number in kit code: use `ICON_STROKE`, so the whole suite moves together.
- **Corners** of rectangles: radius 2 (radius 1 for shapes smaller than 8 units).
- **Coordinates** on whole or half units, so 1.5 strokes stay sharp at 16, 24 and 48 px.
- **Gaps** between separate strokes at least 2 units (a 16 px icon must not close them).
- **Filled marks** only for dots and small solid indicators (`fills`, in the icon colour); no
  other fills in the base style.
- **Sizes**: 16 (toolbars, menus), 20 (tool rails, panels), 24 (large ribbon buttons). Icons are
  drawn for 24 and checked at 16; an icon that fails at 16 gets a `-small` drawing.

## Duotone accents (tool icons)

- A tool icon names one or two closed areas as its **accent** (the brush's bristles, the bucket's
  paint, the lasso's selection): filled with `--kit-icon-accent` at 25%, under the strokes.
- Accents mark the thing the tool acts on, never decoration; at most a third of the live area,
  except a shape tool's, which fills the shape it draws (square, ellipse, star).
- Tools that act on no area (move, rotate, hand, arrows, measuring lines) have no accent.
- A tool icon (`family: "tool"`) draws its accents everywhere. An interface icon that is also a
  tool (brush, lasso, crop) draws them only where `--tessera-icon-accent-opacity` is set: tool
  rails set it to 0.25 (kit-ui `.kui-tool-rail`, `.kui-tool-flyout`), and a host theme that asks
  for `iconStyle: "duotone"` sets it everywhere; elsewhere the same icon draws as plain line.
- A Lucide shape keeps Lucide's strokes and gains accents in `icons.json` (`"accents": [...]`),
  without a redraw; a redrawn icon carries them in its SVG (`data-accent="true"`).

## Metaphors

- One metaphor per action across all kits (one "insert", one "crop", one "mask").
- Kit-specific tools say what they do in that kit's terms (Film's Mark In is a brace, not a flag).
- Never another company's product metaphor (Apple's pen nib, bar chart, lectern, squiggle) and no
  trademarks in names or shapes.
- Names: lowercase kebab-case, `<object>-<variant>` (`layer-add`, `keyframe-ease-in`).

## Process

1. Today's set is Lucide's shapes at Tessera's stroke. Redraw in batches, starting with the
   icons most kits share (used by five or more: about 46), then each kit's tools.
2. Every batch goes on the site for review in a toolbar, a tool rail and a grid, in both skins,
   before it merges.
3. A redrawn icon moves from `lucide:` to `svg:` in `icons.json`; its name does not change, so no
   kit code changes.
   It records the icon it replaces (`"replaces": "lucide:layers"`), so lucide-react names still map
   to it.

Done so far (site `#review`): batch 1, Slide's animations and transitions; batch 2, CAD drafting;
batch 3, tool accents on the tools of every tool rail; batch 4, the 51 icons five or more kits
share, redrawn on the half-unit grid.
