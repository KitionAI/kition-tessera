# Kition Tessera documentation

The design system for professional editors and Kition kits: design tokens (`@kition/tessera-tokens`), Tessera Icons (`@kition/tessera-icons`), and components (`@kition/tessera-ui`).

These files are the same docs as [tessera.kition.ai](https://tessera.kition.ai), as Markdown: one file per guide and per component, each with when to use it, runnable examples, and its props. They are generated (`pnpm build:docs`) from the site's source in `site/src/docs/`, so they say what the site says; do not edit them by hand. The one file written by hand is [icon-style.md](icon-style.md), the drawing rules for icons.

## Getting started

- [Overview](guides/overview.md): Kition Tessera is the design system for professional editors: design tokens, Tessera Icons, and the components kits are built from.
- [Installation](guides/installation.md): Add the packages, import one stylesheet, and draw a first component; then apply a skin and give the components your strings.
- [Building with an AI assistant](guides/ai.md): Give a coding assistant Tessera’s docs as Markdown, and it writes an editor’s interface with the right components, props and tokens.
- [Theming and skins](guides/theming.md): A host sends one theme over the Kit Harness Protocol; every kit, and every Tessera component in it, follows.
- [Icons](guides/icons-guide.md): Tessera Icons: one family for interface and tool icons, in React, canvas, SVG, and Rust.
- [Tokens and skins](tokens.md): Every theme and component token, with its value in each skin.
- [Every icon](icons.md): The name, React component, and family of each Tessera icon.

## General

- [Button](components/button.md): Starts an action. One primary button per view; the rest secondary or ghost.
- [Spinner](components/spinner.md): A spinning circle for work in progress.
- [IconButton](components/icon-button.md): An icon-only button with an accessible label; `pressed` makes it a toggle.
- [Badge](components/badge.md): A small count or status beside a label.
- [Card](components/card.md): A product card: 12px radius, a hairline, a light shadow.
- [Disclosure](components/disclosure.md): A section that opens and closes under its title.

## Forms

- [TextInput](components/text-input.md): A single-line text field in three sizes: sm (toolbars), md (panels), lg (forms).
- [PasswordInput](components/password-input.md): A password field with a show and hide button outside the tab order.
- [Textarea](components/textarea.md): Multi-line text; with autoSize it grows with its text (useAutoSize does the same for a text area of your own).
- [Select](components/select.md): A drop-down: a native select drawn as Tessera’s control, for the platform’s popup and accessibility.
- [Switch](components/switch.md): An on/off switch for a setting that applies at once.
- [Field](components/field.md): A label, a control, and its hint or error, wired for screen readers.
- [NumberField](components/number-field.md): A number with a label you drag to scrub, arrows to step, and units.
- [Bar controls](components/bar-controls.md): Compact controls for options bars: Segmented, Choice, Checkbox, Hint, BarSeparator.
- [Form](components/form.md): A form that keeps its values and checks them against rules before onFinish; useForm reaches it from outside, useWatch reads one field.
- [Combobox and MultiSelect](components/combobox.md): One choice from a long list, searched as the person types or on the server with onSearch, and several choices toggled in a list.
- [NumberInput, DateTimeInput, Popconfirm](components/form-inputs.md): A number field that is empty as null, a date or date-and-time field, and a confirmation beside the button it guards.

## Data display

- [Table](components/table.md): Records in rows and columns: columns say what each shows, dataSource holds the records; pages, pinned columns, loading and empty states.
- [Tag](components/tag.md): A short status or category label on a soft tint of its tone.
- [Alert](components/alert.md): A message in the page, in its tone, with an optional action or close.
- [Descriptions](components/descriptions.md): Labelled values of one record, in columns; with Breadcrumb, Avatar, and Divider for a detail page.
- [Empty and Result](components/empty-result.md): Nothing to show yet, and the outcome of a whole page or flow, each with what to do next.
- [Skeleton](components/skeleton.md): A placeholder in the shape of content that is loading.
- [Charts](components/line-chart.md): LineChart and BarChart draw one or more series over ordered categories; PieChart draws parts of a whole, as a pie or a donut. A legend, a readout under the pointer, the chart palette tokens or a colour of yours; height="fill" takes the height of its box.

## Navigation

- [Tabs](components/tabs.md): Sections of one page under a row of tabs; arrow keys move between them.
- [AppRail](components/app-rail.md): A suite’s app switcher on the left edge: each app’s icon over its name, the open one marked, badges, the product mark above and the account below; compact shows icons only, each name as its tooltip.
- [NavMenu](components/nav-menu.md): An app’s sidebar: its pages as links under headings, the current one marked; collapses to icons.
- [Pagination](components/pagination.md): The pages of a long list on the server: the range shown, page buttons, and a page size.

## Menus and overlays

- [MenuButton](components/menu-button.md): A button that opens a menu of MenuItems, with shortcuts and check marks.
- [ContextMenu](components/context-menu.md): A menu at a point, for right-clicks.
- [Dialog](components/dialog.md): A modal (or modeless) dialog with a title, content, and actions; it traps focus and closes on Escape.
- [PreviewDialog](components/preview-dialog.md): A dialog whose values preview live in the document: the kit supplies begin, update and end.
- [Toast](components/toast.md): A short notice at the top. Render Toaster once; call toast() or toast.success(), .error(), .loading(), .promise() anywhere, with an id to replace a notice and an action button.
- [Modal](components/modal.md): A composable modal dialog for host apps: header, content, footer; it traps focus and closes on Escape or an outside press.
- [Tooltip](components/tooltip.md): A short label shown on hover or keyboard focus, for an icon or a status that needs a word.
- [Popover](components/popover.md): Floating content anchored to a trigger, positioned to stay on screen: filters, pickers, small forms.
- [Sheet](components/sheet.md): A panel that slides in from the right to edit one thing beside the work, guarding unsaved changes; from the left, it holds an app’s navigation on a phone.
- [Confirm](components/confirm.md): `useConfirm()` asks a yes-or-no question and resolves a promise; asks queue one at a time.
- [Command](components/command.md): A searchable list of commands or choices: type to filter, arrows and Enter to pick.
- [DropPanel](components/drop-panel.md): A popover anchored to an element, closing on a press outside or Escape.

## Editor chrome

- [Scrollbar](components/scrollbar.md): A persistent scrollbar for a virtual document viewport, with a proportional thumb, dragging, track clicks and keyboard navigation.
- [Ribbon](components/ribbon.md): Office-style command groups: large and small buttons, stacks, rows, and swatches; it collapses to Single line, and a ribbon too wide for its window gives way in steps (RibbonFit): small buttons, icons alone, then groups collapsed to one button each.
- [OverflowStrip](components/overflow-strip.md): A row that scrolls sideways when it does not fit: the cut edge fades, and a button there scrolls.
- [StatusBar](components/status-bar.md): The bottom bar: document facts on the left, zoom on the right.
- [TableSizePicker](components/table-size-picker.md): Pick a table size by hovering a grid.
- [Panel parts](components/panel-parts.md): Pieces of list panels: visibility eyes, in-place rename, footers, thumbnails.

## Workspace

- [WorkspaceLayout](components/workspace-layout.md): Split, tabbed, resizable panels in a tree, as video and photo editors lay out their workspaces.
- [DockArea](components/dock-area.md): A column of collapsible, resizable panel groups, remembered per kit.
- [FloatingPanels](components/floating-panels.md): Movable, resizable windows over the workspace, remembered per kit.

## Color

- [ColorPicker](components/color-picker.md): Saturation and brightness square, hue strip, hex and RGB fields.
- [ColorWheel](components/color-wheel.md): A grading wheel with a lightness slider, as colour correction panels use.
- [GradientSlider](components/gradient-slider.md): A slider drawn over its own gradient: temperature, tint, hue.
- [CurveEditor](components/curve-editor.md): Tone curves: drag points, double-click to add, with a histogram under them.
- [Histogram](components/histogram.md): A smoothed histogram of an image’s tones.

## Media and time

- [Timecode and transport](components/timecode-transport.md): A timecode field you can type or scrub, and the transport buttons of a player.
- [LevelMeter](components/level-meter.md): Audio levels with peak hold, drawn on a canvas.
- [KeyframeLane](components/keyframe-lane.md): Keyframes on a time lane: select, drag, and their interpolation shapes.

## Integration

- [Strings and elements](components/providers.md): What components ask of the app around them: strings (StringsProvider) and element states (ElementsProvider). Without them, components draw in English with every element shown.
