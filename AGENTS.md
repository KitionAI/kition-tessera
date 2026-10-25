# Kition Tessera Rules

Kition Tessera is Kition's design system: tokens, icons, and components for kit editors, hosts,
and kit engines. It is open source (Apache-2.0) and meant for third-party kits and hosts, so its
API is public and changes deliberately.

## Language and privacy

- English for everything in this repository: code, comments, docs, token descriptions, icon
  names.
- Never write a real local username, home directory, or absolute host path into a tracked file.
  Scripts find sibling repositories relative to this one or through environment variables.

## Tokens

- `packages/tokens/tokens/*.tokens.json` is the only source of token values. Never edit the
  generated files (`packages/tokens/src/generated/`, `crates/tessera-tokens/src/generated.rs`);
  run `pnpm build:tokens`.
- Tokens marked `khp` are the Kit Harness Protocol theme tokens (Kit UI protocol, section 4).
  Their names belong to the protocol: add, rename, or remove one only through a KHP proposal, in
  the protocol first.
- Paper is the default skin and follows kition `docs/design.md`: primary purple `#5645d4`, white
  and light-neutral surfaces, 8px control radius, 12px card radius.
- Brand purple belongs to Kition; no kit brand color uses it.
- Until kit-ui and Kition import the generated tokens, `pnpm check:consumers` must pass: change
  a value here and in those copies together.

## Icons

- `packages/icons/icons.json` lists the set. Never edit the generated files
  (`packages/icons/src/generated/`, `crates/tessera-icons/src/generated.rs`); run
  `pnpm build:icons`.
- Icon names are lowercase kebab-case, `<object>-<variant>` (`layer-add`, `keyframe-ease-in`).
- Icons are paths on a 24 × 24 grid, stroked with round caps and joins; a shape may be filled only
  in the icon color. No other styling, groups, or `<use>`.
- Never use another company's product metaphor (Apple's pen nib, bar chart, lectern, squiggle) or
  name an icon after a trademark.
- Icons from Lucide keep Lucide's licenses (`NOTICE`, `LICENSE-lucide`). Bump the pinned Lucide
  version only on purpose: the pixel test compares every icon against it.

## Checks

Run `pnpm check` before reporting work done; it must exit 0.
