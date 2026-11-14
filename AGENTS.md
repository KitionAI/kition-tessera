# Kition Tessera Rules

Kition Tessera is Kition's design system: tokens, icons, and components for kit editors, hosts,
and kit engines. It is open source (Apache-2.0) and meant for third-party kits and hosts, so its
API is public and changes deliberately.

## Language and privacy

- English for everything in this repository: code, comments, docs, token descriptions, icon
  names. The exceptions are component strings in `packages/ui/locales/<locale>.json` (every
  locale has every key of `en-US.json`) and the words people search icons by in other
  languages (`zh` in `packages/icons/keywords.json`), which are searched and never shown: the site, the
  README and the Markdown docs stay in English.
- Never write a real local username, home directory, or absolute host path into a tracked file.
  Scripts find sibling repositories relative to this one or through environment variables.

## Tokens

- `packages/tokens/tokens/*.tokens.json` is the only source of token values. Never edit the
  generated files (`packages/tokens/src/generated/`, `crates/kition-tessera-tokens/src/generated.rs`);
  run `pnpm build:tokens`.
- Tokens marked `khp` are the Kit Harness Protocol theme tokens (Kit UI protocol, section 4).
  Their names belong to the protocol: add, rename, or remove one only through a KHP proposal, in
  the protocol first.
- Paper is the default skin: primary purple `#5645d4`, white
  and light-neutral surfaces, 8px control radius, 12px card radius.
- Brand purple belongs to Kition; no kit brand color uses it.
- Until kit-editor imports the generated tokens, `pnpm check:consumers` must pass: change a value
  here and in that copy together.

## Icons

- `packages/icons/icons.json` lists the set. Never edit the generated files
  (`packages/icons/src/generated/`, `crates/kition-tessera-icons/src/generated.rs`); run
  `pnpm build:icons`.
- `packages/icons/keywords.json` gives every icon its category and the words people call it by
  (English; Chinese in `zh`): a new icon needs an entry, or the build fails. The site's search
  and `ICON_SEARCH` read it.
- Icon names are lowercase kebab-case, `<object>-<variant>` (`layer-add`, `keyframe-ease-in`).
- Icons are paths on a 24 × 24 grid, stroked with round caps and joins; a shape may be filled only
  in the icon color. No other styling, groups, or `<use>`.
- Never use another company's product metaphor (Apple's pen nib, bar chart, lectern, squiggle) or
  name an icon after a trademark.
- Kit app icons (`packages/icons/kit/<kit>.svg`, `<kit>-small.svg`) and kit colors
  (`packages/icons/kit/colors.json`, `KIT_COLORS`) are Kition's original brand artwork:
  copy maintainer-supplied updates unchanged. `pnpm check:consumers` compares them with
  the brand source checkout selected by `KITION_DIR`.
- Icons from Lucide keep Lucide's licenses (`NOTICE`, `LICENSE-lucide`). Bump the pinned Lucide
  version only on purpose: the pixel test compares every icon against it.

## Components

- Components style only through tokens and keep the `kui-` class names kits already target.
- They reach the editor only through `context.tsx` (strings, element states); never import a
  Kit Harness Protocol package or anything kit-specific.
- Icons come from `@kition/tessera-icons`; an icon prop is an `IconComponent`, so a kit may pass
  Tessera or lucide-react icons.

## Documentation

- The source of every docs page is `site/src/docs/registry.ts` and the demos in
  `site/src/docs/demos/`. `pnpm build:docs` generates from them the Markdown in `docs/` (one
  file per guide and component, `tokens.md`, `icons.md`, `README.md`), `site/public/llms.txt`,
  `site/public/llms-full.txt`, and `site/src/docs/api.json`. Never edit those by hand;
  `docs/icon-style.md` is the one hand-written file in `docs/`.
- A new or changed component comes with its page in the same change. A page says what the
  component is in one sentence, when to use it, and when not to (naming what to use instead).
- A demo is a complete file a reader can paste: a default export, imports only from
  `@kition/tessera-*` and React, no site helpers except the `demo-*` layout classes.
- Props tables come from the JSDoc on the components' props: describe a prop where it is declared.
- Say only what is true of the code today; mark a proposal as a proposal. Name other companies'
  products only in comparisons.
- Site chrome styles through the theme tokens, so the skin switch reskins every page; the home
  page's marketing sections may use their own colours. Every page has a real path and is
  prerendered: add new pages to `site/src/routes.ts`.
- User-visible changes go in `CHANGELOG.md` under **Unreleased**.

## Checks

Run `pnpm check` before reporting work done; it must exit 0. After a change to the site, also run
`pnpm build:site`.
