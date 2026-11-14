# Tessera Icons: style

Every icon uses fine lines with round caps and joins. Tool icons can add duotone accents
that follow the skin, so dense toolbars remain readable and tools are easy to distinguish.

## Grid and geometry

- **Canvas** 24 × 24. **Live area** 20 × 20 (2 units of padding). Optical exceptions (circles,
  diagonals) may reach 21 × 21.
- **Stroke** 1.5 units (`DEFAULT_STROKE`), round caps and joins. Never pass
  another number in kit code: use `DEFAULT_STROKE`, so the whole suite moves together.
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
  rails set it to 0.25 (`.kui-tool-rail`, `.kui-tool-flyout`), and a host theme that asks
  for `iconStyle: "duotone"` sets it everywhere; elsewhere the same icon draws as plain line.
- A Lucide shape keeps Lucide's strokes and gains accents in `icons.json` (`"accents": [...]`),
  without a redraw; a redrawn icon carries them in its SVG (`data-accent="true"`).

## Metaphors

- One metaphor per action across all kits (one "insert", one "crop", one "mask").
- Kit-specific tools say what they do in that kit's terms (Film's Mark In is a brace, not a flag).
- Never another company's product metaphor (Apple's pen nib, bar chart, lectern, squiggle) and no
  trademarks in names or shapes.
- Names: lowercase kebab-case, `<object>-<variant>` (`layer-add`, `keyframe-ease-in`).

## Contributions

1. Preview each icon in a toolbar, a tool rail, and a grid under both skins at 16, 24, and 48 px.
2. Add the SVG to `packages/icons/svg/` and list it as `svg:<file>` in `icons.json`.
3. When replacing an existing drawing, retain its public name and record the original source
   (`"replaces": "lucide:layers"`) so existing Lucide aliases still resolve.
4. Add an entry to `keywords.json`, then run `pnpm build:icons` and `pnpm check`.

Lucide drawings retain the notices in `packages/icons/NOTICE` and
`packages/icons/LICENSE-lucide`. A new drawing follows these geometry rules and uses an
original metaphor.
