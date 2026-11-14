# Changelog

Notable changes to Kition Tessera's packages (`@kition/tessera-tokens`, `@kition/tessera-icons`,
`@kition/tessera-ui`) and crates (`tessera-tokens`, `tessera-icons`). The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). All packages share one version; before
1.0 a minor version may change an API, and the change is listed under **Changed**.

## [Unreleased]

### Changed

- npm archives contain built JavaScript and declarations, CSS, locales or token and icon assets,
  and license notices. Package builds run before packing; tests and helpers stay out. Tokens
  preserve CSS side effects, and inter-package dependencies publish as `^0.1.0` ranges.
- Removed internal icon design reviews, adoption reports, migration scripts, and planning
  references from the public tree. Brand source comparisons now require `KITION_DIR`.

### Added

- Complete Apache-2.0 license text in the repository and npm packages, and a
  `THIRD_PARTY_LICENSES.txt` file in site builds with the notices for bundled dependencies.
- What npm gets is `dist/`: compiled JavaScript, one file per module, with type declarations
  (`pnpm build:packages`; `publishConfig.exports`). `pnpm check:pack` uses the packed packages
  as an outside app would: Node loads them, TypeScript finds their types, a bundle with one
  button leaves the other components out. `pnpm release:dry` validates local archives;
  `pnpm release` publishes.
- Public installation and development instructions cover package builds, type checking, tests,
  and running or previewing the documentation site. Generated Markdown and LLM references
  describe the same compiled npm distributions.
- The site links to kition.ai: Kition in the header's name, a link beside GitHub, and the kits
  section of the home page.

## [0.1.0]

The first public version, used by Kition and its sixteen kits.

### Added

- `@kition/tessera-tokens` and the crate `tessera-tokens`: the 15 Kit Harness Protocol theme
  tokens, component tokens, and the Paper and Graphite skins, generated from one JSON source as
  CSS variables, TypeScript, and Rust; every skin held to WCAG AA.
- `@kition/tessera-icons` and the crate `tessera-icons`: 598 icons as SVG path data on a 24 grid
  (React components, canvas drawing, SVG markup, Rust), tool icons with accent areas, the
  sixteen kit app icons with their colors, and a category and search words for every icon
  (`ICON_SEARCH`, `ICON_CATEGORIES`; English, and Chinese for 251 icons).
- `@kition/tessera-ui`: base controls, forms, data display, navigation, menus and overlays,
  editor chrome (ribbon, bars, panels), workspace layout (dock area, floating panels), color
  controls (picker, wheel, curves, gradient slider, histogram), and media controls (timecode,
  transport, keyframe lane, level meter); strings in en-US and zh-CN. Only its CSS is a side
  effect, so a bundler drops the components an app does not use.
- `docs/`: every guide and component page as a Markdown file (when to use it, runnable
  examples, props, keyboard), plus every token and icon, generated from the site's source with
  `pnpm build:docs`.
- The site at tessera.kition.ai: a components page with running previews, playgrounds, icon
  search by meaning, a skin workshop, a command palette, Copy for AI on every page, the Markdown
  docs under `/markdown/`, `llms.txt` and `llms-full.txt`.
