/**
 * The component docs: one entry per page, grouped for the sidebar. Each names the demos it shows
 * (files in ./demos, whose own source is shown under them) and the components whose API tables it
 * lists (read from api.json, generated from the package's types). Guides are prose pages.
 */

export type DocEntry = {
  id: string
  title: string
  category: string
  /** One sentence: what it is. */
  summary: string
  when?: string[]
  whenNot?: string[]
  demos?: { id: string; title: string; note?: string }[]
  /** Components whose props tables the page lists. */
  api?: string[]
  /** Prose sections for guides: a heading and paragraphs (inline `code` allowed). */
  sections?: { heading: string; body: string[]; code?: string }[]
}

export const CATEGORIES = ['Getting started', 'General', 'Forms', 'Menus and overlays', 'Editor chrome', 'Workspace', 'Color', 'Media and time', 'Integration'] as const

export const DOCS: DocEntry[] = [
  // Getting started
  {
    id: 'overview',
    title: 'Overview',
    category: 'Getting started',
    summary: 'Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.',
    sections: [
      {
        heading: 'Three packages',
        body: [
          '`@kition/tessera-tokens`: the Kit Harness Protocol theme tokens (`--kit-*`), component tokens, and skins (Paper, Graphite) as CSS variables, TypeScript, and Rust.',
          '`@kition/tessera-icons`: every icon as SVG path data on a 24 grid, as React components (`LayersIcon`), canvas drawing (`drawIcon`), SVG markup (`toSvg`), and the Rust crate `tessera-icons` for engines.',
          '`@kition/tessera`: the components on these pages. They draw only through the theme tokens, so a host restyles all of them by sending one theme.',
        ],
        code: "import '@kition/tessera/styles.css'\nimport { Button, ColorPicker } from '@kition/tessera'\nimport { LayersIcon } from '@kition/tessera-icons/react'",
      },
      {
        heading: 'Principles',
        body: [
          'Built for professional software: ribbons, docks, colour wheels, curves, timelines and meters sit beside buttons and fields.',
          'Styled only by tokens: no component hard-codes a colour, radius or shadow; skins and hosts change them all.',
          'One icon family: a 24 grid, a 1.5 stroke, round caps; tool icons carry accents in the skin colour.',
          'Accessible by default: labels, keyboard use, focus rings, and every skin held to WCAG AA contrast.',
        ],
      },
    ],
  },
  {
    id: 'kits',
    title: 'Using Tessera in a kit',
    category: 'Getting started',
    summary: 'How a Kition kit editor uses Tessera: everything arrives through @kition/kit-ui, under the names kits already use.',
    sections: [
      {
        heading: 'Import from kit-ui',
        body: [
          'A kit editor depends on `@kition/kit-ui` only. kit-ui re-exports every Tessera component under its usual name, wires them to the Kit UI protocol (the host’s theme, locale, hidden and disabled elements, host buttons), and loads Tessera’s stylesheet from its own.',
          'Icons come from `@kition/tessera-icons/react` when the kit lists it in package.json, or from kit-ui’s `TesseraIcons` namespace otherwise. Bundlers keep only the icons a kit uses.',
        ],
        code: "import '@kition/kit-ui/styles.css'\nimport { Button, RibbonGroup, RibbonButton, NumberField, TesseraIcons } from '@kition/kit-ui'\nimport { LayersIcon } from '@kition/tessera-icons/react' // or TesseraIcons.LayersIcon",
      },
      {
        heading: 'Icons for engine commands',
        body: [
          'Ribbons and menus built from engine commands get their icons from kit-ui’s rules: a command’s verb first (`edit.undo`, `layer.mergeDown`), then what it acts on, then the neutral command mark.',
          'A kit names icons for the commands the rules cannot read in `web/src/commandIcons.ts`, imported once from `main.tsx`.',
        ],
        code: "import { registerCommandIcons } from '@kition/kit-ui'\nimport { DimensionAlignedIcon, FilletIcon } from '@kition/tessera-icons/react'\n\nregisterCommandIcons({\n  dimaligned: DimensionAlignedIcon,\n  fillet: FilletIcon,\n})",
      },
      {
        heading: 'Rules for kits',
        body: [
          'Draw every colour, radius and shadow from the theme tokens (`var(--kit-*)`), never literal values, so skins reach your editor.',
          'Pass icon sizes and `strokeWidth={ICON_STROKE}` from kit-ui; never a number of your own.',
          'New icons go into Tessera (`packages/icons/svg/`, docs/icon-style.md), not into the kit.',
          'Give elements a Kit UI id (`uiId`, `RibbonGroup id`) so hosts can hide or disable them.',
        ],
      },
      {
        heading: 'A new kit',
        body: ['kition-sdk’s `tools/new-kit-ui.mjs` scaffolds a kit editor on kit-ui and Tessera Icons, with its dev server allowed to read kition-tessera.'],
        code: 'node tools/new-kit-ui.mjs --repo ../kition-mykit --id kit.mykit --name MyKit --crate mykit --module kition_mykit_sdk --class MyKitDocument --sample sample.mykit --accept .mykit --port 5300',
      },
    ],
  },
  {
    id: 'theming',
    title: 'Theming and skins',
    category: 'Getting started',
    summary: 'A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.',
    sections: [
      {
        heading: 'The theme',
        body: [
          'Hosts send `theme` in `ui/initialize` and `ui/theme`: a colour scheme and the 15 `--kit-*` theme tokens. kit-ui applies them to the document root; components read them through CSS variables.',
          '`@kition/tessera-tokens` gives every skin’s theme ready to send (`SKINS.paper`, `SKINS.graphite`), and its tests hold each skin to WCAG AA.',
        ],
        code: "import { skinTheme } from '@kition/tessera-tokens'\n\nkit.notify('ui/theme', { theme: skinTheme('graphite') })",
      },
      {
        heading: 'Proposal: KitTheme 2.0',
        body: ['KHP-0007 (draft) widens the theme to 35 tokens with fallbacks (chrome, panels, fields, overlays, accents), adds density and icon style, and defines a portable `skin.json`.'],
      },
    ],
  },
  {
    id: 'icons-guide',
    title: 'Icons',
    category: 'Getting started',
    summary: 'Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.',
    sections: [
      {
        heading: 'Use',
        body: ['Browse and copy every icon on the Icons page. Tool icons (`family: "tool"`) carry accent areas filled with `--kit-icon-accent`; pass `accent={false}` for plain line.'],
        code: "import { LayersIcon } from '@kition/tessera-icons/react'\nimport { Layers, drawIcon, toSvg } from '@kition/tessera-icons'\n\n<LayersIcon size={16} />\ndrawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' })",
      },
      {
        heading: 'Style',
        body: ['24 grid with a 20 live area, 1.5 round strokes, radius 2 corners, half-unit coordinates, 2-unit gaps; one metaphor per action. The full rules are in docs/icon-style.md; redraws are reviewed on the Redraw review page.'],
      },
    ],
  },

  // General
  { id: 'button', title: 'Button', category: 'General', summary: 'Starts an action. One primary button per view; the rest secondary or ghost.', when: ['The main action of a dialog or panel (primary).', 'Other actions beside it (secondary, ghost).', 'Destructive actions after a choice (danger).'], whenNot: ['Navigation to another page: use a link.', 'Toolbar commands: use IconButton or a ribbon button.'], demos: [{ id: 'button-variants', title: 'Variants', note: 'Secondary is outlined; subtle is a quiet filled button; a disabled filled button turns muted, not faint.' }, { id: 'button-sizes', title: 'Sizes', note: 'Without a size the button keeps the 30px of editor chrome.' }, { id: 'button-states', title: 'Loading, icons, icon only', note: 'Icons inside a button draw at 16px; an icon-only button is square and needs an aria-label.' }], api: ['Button'] },
  { id: 'spinner', title: 'Spinner', category: 'General', summary: 'A spinning circle for work in progress.', when: ['Inside a button while its action runs (Button `loading`).', 'Next to a status that is still updating.'], whenNot: ['Long work with known progress: show the progress.'], demos: [{ id: 'spinner', title: 'Sizes and a label' }], api: ['Spinner'] },
  { id: 'icon-button', title: 'IconButton', category: 'General', summary: 'An icon-only button with an accessible label; `pressed` makes it a toggle.', when: ['Toolbars, tool rails, panel headers.'], whenNot: ['An action whose icon is not obvious: use a Button with a label.'], demos: [{ id: 'icon-button', title: 'Toggles in a bar' }], api: ['IconButton'] },
  { id: 'card', title: 'Card', category: 'General', summary: 'A product card: 12px radius, a hairline, a light shadow.', when: ['Grouping settings or a summary on a page.'], demos: [{ id: 'card', title: 'Header and content' }], api: ['Card', 'CardHeader', 'CardContent'] },
  { id: 'disclosure', title: 'Disclosure', category: 'General', summary: 'A section that opens and closes under its title.', when: ['Advanced settings most people do not need.'], demos: [{ id: 'disclosure', title: 'Closed and open' }], api: ['Disclosure'] },

  // Forms
  { id: 'text-input', title: 'TextInput', category: 'Forms', summary: 'A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).', demos: [{ id: 'text-input', title: 'Sizes and invalid' }], api: ['TextInput'] },
  { id: 'password-input', title: 'PasswordInput', category: 'Forms', summary: 'A password field with a show and hide button outside the tab order.', demos: [{ id: 'password-input', title: 'Show and hide' }], api: ['PasswordInput'] },
  { id: 'textarea', title: 'Textarea', category: 'Forms', summary: 'Multi-line text.', demos: [{ id: 'textarea', title: 'Prompt' }], api: ['Textarea'] },
  { id: 'select', title: 'Select', category: 'Forms', summary: 'A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.', whenNot: ['Two or three options always visible: use Segmented or Choice.'], demos: [{ id: 'select', title: 'Sizes' }], api: ['Select'] },
  { id: 'switch', title: 'Switch', category: 'Forms', summary: 'An on/off switch for a setting that applies at once.', when: ['A setting that takes effect without a Save.'], whenNot: ['A choice saved with a form: use Checkbox.'], demos: [{ id: 'switch', title: 'On, off, disabled' }], api: ['Switch'] },
  { id: 'field', title: 'Field', category: 'Forms', summary: 'A label, a control, and its hint or error, wired for screen readers.', when: ['Every form control with a visible label.'], demos: [{ id: 'field', title: 'Validation' }], api: ['Field'] },
  { id: 'number-field', title: 'NumberField', category: 'Forms', summary: 'A number with a label you drag to scrub, arrows to step, and units.', when: ['Opacity, size, angle, any bounded number in a panel.'], demos: [{ id: 'number-field', title: 'Scrub, type, or arrow' }], api: ['NumberField'] },
  { id: 'bar-controls', title: 'Bar controls', category: 'Forms', summary: 'Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.', when: ['A tool’s options above the canvas.'], demos: [{ id: 'bar-controls', title: 'An options bar' }], api: ['Segmented', 'Choice', 'Checkbox', 'Hint', 'BarSeparator'] },

  // Menus and overlays
  { id: 'menu-button', title: 'MenuButton', category: 'Menus and overlays', summary: 'A button that opens a menu of MenuItems, with shortcuts and check marks.', demos: [{ id: 'menu-button', title: 'Edit menu' }], api: ['MenuButton', 'MenuItem', 'MenuSeparator'] },
  { id: 'context-menu', title: 'ContextMenu', category: 'Menus and overlays', summary: 'A menu at a point, for right-clicks.', demos: [{ id: 'context-menu', title: 'Right-click' }], api: ['ContextMenu'] },
  { id: 'dialog', title: 'Dialog', category: 'Menus and overlays', summary: 'A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.', when: ['A short task that needs values before it runs.'], whenNot: ['Long forms: use a panel or a page.'], demos: [{ id: 'dialog', title: 'Image size' }], api: ['Dialog'] },
  { id: 'preview-dialog', title: 'PreviewDialog', category: 'Menus and overlays', summary: 'A dialog whose values preview live in the document: the kit supplies begin, update and end.', when: ['Filters and adjustments (blur, levels) people tune by eye.'], demos: [{ id: 'preview-dialog', title: 'A filter' }], api: ['PreviewDialog'] },
  { id: 'toast', title: 'Toast', category: 'Menus and overlays', summary: 'A short notice in the corner. Render Toaster once; call toast() anywhere.', demos: [{ id: 'toast', title: 'Levels' }], api: ['Toaster'] },
  { id: 'modal', title: 'Modal', category: 'Menus and overlays', summary: 'A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.', when: ['Confirming details or collecting a few values in an app (rename, share, create).'], whenNot: ['A kit tool’s settings: use Dialog.', 'Editing beside the work: use Sheet.'], demos: [{ id: 'modal', title: 'Rename' }], api: ['Modal', 'ModalContent', 'ModalHeader', 'ModalTitle', 'ModalDescription', 'ModalFooter'] },
  { id: 'popover', title: 'Popover', category: 'Menus and overlays', summary: 'Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.', when: ['Filter, sort, and group controls of a table.', 'A picker under a button.'], whenNot: ['A list of commands: use MenuButton.'], demos: [{ id: 'popover', title: 'A filter' }], api: ['Popover', 'PopoverContent'] },
  { id: 'sheet', title: 'Sheet', category: 'Menus and overlays', summary: 'A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes.', when: ['Editing a record’s field, a connection, a rule.'], whenNot: ['A quick question: use Modal or Confirm.'], demos: [{ id: 'sheet', title: 'Edit a field', note: 'With unsaved changes, Escape, the backdrop, and the close button ask first.' }], api: ['Sheet'] },
  { id: 'confirm', title: 'Confirm', category: 'Menus and overlays', summary: '`useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.', when: ['Before deleting or discarding.'], whenNot: ['Questions with more than two answers: use Modal.'], demos: [{ id: 'confirm', title: 'Delete', note: 'A danger confirm puts focus on Cancel.' }], api: ['ConfirmProvider'] },
  { id: 'command', title: 'Command', category: 'Menus and overlays', summary: 'A searchable list of commands or choices: type to filter, arrows and Enter to pick.', when: ['A command palette, a searchable picker inside a popover.'], demos: [{ id: 'command', title: 'A command palette' }], api: ['Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem', 'CommandSeparator', 'CommandShortcut'] },
  { id: 'drop-panel', title: 'DropPanel', category: 'Menus and overlays', summary: 'A popover anchored to an element, closing on a press outside or Escape.', demos: [{ id: 'drop-panel', title: 'A setting under a button' }], api: ['DropPanel'] },

  // Editor chrome
  { id: 'ribbon', title: 'Ribbon', category: 'Editor chrome', summary: 'Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line.', when: ['A kit’s Home, Insert, Format tabs.'], demos: [{ id: 'ribbon', title: 'Home tab' }], api: ['RibbonGroup', 'RibbonButton', 'RibbonStack', 'RibbonRow', 'RibbonItem', 'ColorGrid'] },
  { id: 'overflow-strip', title: 'OverflowStrip', category: 'Editor chrome', summary: 'A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.', when: ['A ribbon’s groups or a tool’s options bar in a narrow window.'], whenNot: ['Vertical lists: let the panel scroll.'], demos: [{ id: 'overflow-strip', title: 'Options bar', note: 'The row is wider than its box; use the arrows at the faded edges.' }], api: ['OverflowStrip'] },
  { id: 'status-bar', title: 'StatusBar', category: 'Editor chrome', summary: 'The bottom bar: document facts on the left, zoom on the right.', demos: [{ id: 'status-bar', title: 'Zoom' }], api: ['StatusBar', 'StatusSpacer', 'ZoomControl'] },
  { id: 'table-size-picker', title: 'TableSizePicker', category: 'Editor chrome', summary: 'Pick a table size by hovering a grid.', demos: [{ id: 'table-size-picker', title: 'Insert a table' }], api: ['TableSizePicker'] },
  { id: 'panel-parts', title: 'Panel parts', category: 'Editor chrome', summary: 'Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.', when: ['Layers, tracks, pages panels.'], demos: [{ id: 'panel-parts', title: 'A layer row' }], api: ['EyeButton', 'RenameField', 'PanelFooter', 'Thumbnail', 'Panel'] },

  // Workspace
  { id: 'workspace-layout', title: 'WorkspaceLayout', category: 'Workspace', summary: 'Split, tabbed, resizable panels in a tree, as video and photo editors lay out their workspaces.', demos: [{ id: 'workspace-layout', title: 'Editing workspace', note: 'Drag the gutters; drag tabs between groups.' }], api: ['WorkspaceLayout'] },
  { id: 'dock-area', title: 'DockArea', category: 'Workspace', summary: 'A column of collapsible, resizable panel groups, remembered per kit.', demos: [{ id: 'dock-area', title: 'Right dock' }], api: ['DockArea'] },
  { id: 'floating-panels', title: 'FloatingPanels', category: 'Workspace', summary: 'Movable, resizable windows over the workspace, remembered per kit.', demos: [{ id: 'floating-panels', title: 'A floating bin' }], api: ['FloatingPanels'] },

  // Color
  { id: 'color-picker', title: 'ColorPicker', category: 'Color', summary: 'Saturation and brightness square, hue strip, hex and RGB fields.', demos: [{ id: 'color-picker', title: 'Pick a colour' }], api: ['ColorPicker'] },
  { id: 'color-wheel', title: 'ColorWheel', category: 'Color', summary: 'A grading wheel with a lightness slider, as colour correction panels use.', demos: [{ id: 'color-wheel', title: 'Shadows wheel' }], api: ['ColorWheel'] },
  { id: 'gradient-slider', title: 'GradientSlider', category: 'Color', summary: 'A slider drawn over its own gradient: temperature, tint, hue.', demos: [{ id: 'gradient-slider', title: 'White balance' }], api: ['GradientSlider'] },
  { id: 'curve-editor', title: 'CurveEditor', category: 'Color', summary: 'Tone curves: drag points, double-click to add, with a histogram under them.', demos: [{ id: 'curve-editor', title: 'An RGB curve' }], api: ['CurveEditor'] },
  { id: 'histogram', title: 'Histogram', category: 'Color', summary: 'A smoothed histogram of an image’s tones.', demos: [{ id: 'histogram', title: 'Luminance' }], api: ['Histogram'] },

  // Media and time
  { id: 'timecode-transport', title: 'Timecode and transport', category: 'Media and time', summary: 'A timecode field you can type or scrub, and the transport buttons of a player.', demos: [{ id: 'timecode-transport', title: 'A player' }], api: ['TimecodeField', 'TransportBar'] },
  { id: 'level-meter', title: 'LevelMeter', category: 'Media and time', summary: 'Audio levels with peak hold, drawn on a canvas.', demos: [{ id: 'level-meter', title: 'Stereo' }], api: ['LevelMeter'] },
  { id: 'keyframe-lane', title: 'KeyframeLane', category: 'Media and time', summary: 'Keyframes on a time lane: select, drag, and their interpolation shapes.', demos: [{ id: 'keyframe-lane', title: 'Three keyframes' }], api: ['KeyframeLane'] },

  // Integration
  { id: 'providers', title: 'Strings and elements', category: 'Integration', summary: 'What components ask of the editor around them: strings (StringsProvider) and element states (ElementsProvider). kit-ui provides both; other hosts provide their own.', demos: [{ id: 'providers', title: 'A host without kit-ui', note: 'zh-CN strings; one group disabled, one hidden by the host.' }], api: ['StringsProvider', 'ElementsProvider', 'Element'] },
]
