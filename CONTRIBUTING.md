# Contributing to Kition Tessera

Thank you for contributing. Tessera is used by every Kition kit and is meant for third-party
kits and hosts, so its API is public: names change deliberately, and every change keeps the
checks green.

## Scope

| Path | Contents |
| --- | --- |
| `packages/tokens` | Token sources (`tokens/*.tokens.json`) and the generator for CSS, TypeScript, and Rust |
| `packages/icons` | The icon list (`icons.json`), Tessera's drawings (`svg/`), kit app icons (`kit/`), and the generator |
| `packages/ui` | The React components, their stylesheet, and their strings (`locales/`) |
| `crates/` | The Rust crates generated from the two packages above |
| `docs/` | The Markdown docs (generated; `docs/icon-style.md`, the icon style rules, is written by hand) |
| `site/` | The site at tessera.kition.ai, and the source of the docs: `site/src/docs/registry.ts` and `site/src/docs/demos/` |

A new or changed component comes with its page in the same pull request: an entry in
`site/src/docs/registry.ts` (a one-sentence summary, when to use it, when not to), each example
as a complete file in `site/src/docs/demos/`, then `pnpm build:docs`.

## Local setup

Use Node.js 22.19 or later, pnpm 10.16.1 (pinned in `package.json`), and Rust 1.95 or later
with rustfmt and clippy. All regular builds and checks work from this checkout alone.

```bash
pnpm install --frozen-lockfile
pnpm build            # regenerate tokens and icons; compile all three npm packages into dist/
pnpm build:docs       # regenerate docs/, llms.txt, llms-full.txt, and the props tables
pnpm typecheck        # TypeScript
pnpm test             # JavaScript and React tests
pnpm check            # generated files current, types, tests, rustfmt, clippy, cargo test
pnpm check:pack       # build and pack locally; check Node, types, tree shaking, CSS, and source maps
pnpm dev              # the site at http://127.0.0.1:4340, from the packages' source
pnpm build:site       # the static site in site/dist
pnpm --filter @kition/tessera-site preview # preview the static site at http://127.0.0.1:4341
```

To compile one package, run `pnpm --filter @kition/tessera-ui build` (or use the icons or
tokens package name). `pnpm build:packages` recompiles all three without regenerating sources.
Checkout links use source exports for development; `pnpm pack` applies `publishConfig.exports`
to select built files. pnpm rewrites `workspace:^` dependencies to `^0.1.0` in the archives.
`pnpm release:dry` runs the local pack check. pnpm 10.16.1 has no `pack --dry-run` option;
the check creates temporary tarballs, inspects them, and removes them without publishing.

The site prerenders every page to static HTML at its own path (`/docs/button/`,
`/icons/layers/`) with its title, description, canonical link, and Open Graph tags, plus
`sitemap.xml`, `robots.txt`, `404.html`, the Markdown docs, and `THIRD_PARTY_LICENSES.txt`.
It is configured for hosting at
`tessera.kition.ai` as Cloudflare Workers Static Assets ([`site/wrangler.jsonc`](site/wrangler.jsonc)):
`pnpm --filter @kition/tessera-site run deploy` builds and deploys, `run deploy:check` does a
dry run without a login.

Maintainers can run `pnpm check:consumers` to compare the SDK's token copy and the original
brand assets. Select the SDK with `KITION_SDK_DIR` (or a sibling kition-sdk checkout) and the
brand sources with `KITION_DIR`. Public builds and checks need only this repository.

## How it is made

- **Tokens.** The source of every value is
  [`packages/tokens/tokens/`](packages/tokens/tokens): `base.tokens.json` (every token with its
  Paper value, in the Design Tokens Community Group structure) and one file per skin.
  `pnpm build:tokens` generates the CSS, TypeScript, and Rust.
- **Icons.** [`packages/icons/icons.json`](packages/icons/icons.json) lists the set; each icon is
  a list of SVG path strings (`paths` stroked, `fills` filled). Part of the set is drawn from
  [Lucide](https://lucide.dev) under its Lucide names (`FROM_LUCIDE` maps every lucide-react
  name), so code moves off `lucide-react` without visual change; Tessera's own drawings replace
  them over time by the rules in [`docs/icon-style.md`](docs/icon-style.md).
- **Components.** They draw only through the theme tokens and ask the app around them for two
  things: strings (`StringsProvider`; English without one, `zh-CN` included) and element states
  (`ElementsProvider`). Class names start with `kui-`.

## Rules

The full rules are in [AGENTS.md](AGENTS.md); they apply to people and to coding agents alike.
The ones that most often matter:

- **English** for code, comments, docs, token descriptions, and icon names. Component strings in
  other languages go in `packages/ui/locales/<locale>.json`, with every key of `en-US.json`.
- **Never edit generated files** (`packages/*/src/generated/`, `crates/*/src/generated.rs`,
  `docs/guides/`, `docs/components/`, `docs/README.md`, `docs/tokens.md`, `docs/icons.md`,
  `site/public/llms*.txt`, `site/src/docs/api.json`). Change the source and run `pnpm build` or
  `pnpm build:docs`.
- **Components style only through tokens.** No color, radius, font, or shadow literals; check
  the result in both skins.
- **Theme tokens belong to the Kit Harness Protocol.** Adding, renaming, or removing a token
  marked `khp` starts as a proposal to the protocol, not as a pull request here.
- **Keep what kits rely on**: `kui-` class names, exported names, and props. A change that
  breaks one is listed in `CHANGELOG.md` under **Changed**, with how to move.
- **Accessibility**: every control has a label, works from the keyboard, and shows focus; every
  skin holds WCAG AA contrast (the token tests check it).

### Icons

Read [`docs/icon-style.md`](docs/icon-style.md) first. An icon is paths on a 24 × 24 grid,
stroked at 1.5 with round caps and joins; names are lowercase kebab-case, `<object>-<variant>`
(`layer-add`, `keyframe-ease-in`). Do not use another company's product metaphor or name an icon
after a trademark. Add the drawing to `packages/icons/svg/`, list it in `icons.json`, and run
`pnpm build:icons`.

## Pull requests

1. Open an issue first for a new component or a change to an API, so the shape is agreed before
   the work.
2. Keep a pull request to one change. Add or update a test with it.
3. Run `pnpm check`; it must exit 0. Add an entry to `CHANGELOG.md` under **Unreleased**.
4. For a visual change, add screenshots in the Paper and the Graphite skin.

## Releasing (maintainers)

The three packages share one version and are published together to npm as `@kition/tessera-*`.
Checkout links use TypeScript source. npm archives contain `dist/`: compiled JavaScript,
one file per module, with type declarations (`pnpm build:packages`, `publishConfig.exports`).
Each package builds before packing; source files, tests, and test helpers stay out of the
archives. pnpm rewrites `workspace:^` to a version range when packing.

Releases are published by the [Release workflow](.github/workflows/release.yml) with npm
[trusted publishing](https://docs.npmjs.com/trusted-publishers): npm takes the workflow's
identity in place of a token, and each package gets a provenance attestation.

1. Set the version in the three `packages/*/package.json` files and in `Cargo.toml`, and move
   the changelog's **Unreleased** entries under it. `pnpm release:dry` shows locally what would
   be published and tests the packages outside the workspace. It creates temporary archives
   without publishing or calling a publish command.
2. Push a tag `v<version>`. The workflow checks the tag against the packages' version, runs the
   types, the tests and the pack check, and publishes the three packages in dependency order.
   Running the workflow by hand without ticking **publish** is a dry run.

Set up once on npmjs.com, for each of the three packages (**Settings → Trusted publishing →
GitHub Actions**): organization `KitionAI`, repository `kition-tessera`, workflow
`release.yml`, no environment, allowed action **npm publish**. A package has to exist on npm
before it can be given a trusted publisher, so its very first version is published by a
maintainer (`npm login`, then `pnpm release`).

By contributing you agree that your contribution is licensed under the
[Apache License 2.0](LICENSE). Follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md), and
report security problems privately as the [security policy](.github/SECURITY.md) says.
