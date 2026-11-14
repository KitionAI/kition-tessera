# Tessera Icons: every icon

598 icons and 16 kit app icons. Each icon is SVG path data on a 24 × 24 grid, stroked at 1.5 with round caps and joins, so React, a canvas, and a Rust engine draw the same shape.

Package: `@kition/tessera-icons` and the Rust crate `tessera-icons` · [Search them on the site](https://tessera.kition.ai/icons/) · [Icons guide](guides/icons-guide.md)

```tsx
import { LayersIcon } from '@kition/tessera-icons/react'
import { Layers, drawIcon, toSvg } from '@kition/tessera-icons'

<LayersIcon size={16} />                                    // props match lucide-react's
drawIcon(ctx, Layers, 8, 8, { size: 16, color: '#5645d4' }) // canvas, also in workers
toSvg(Layers, { size: 16 })                                 // SVG markup
```

To find an icon for an action, look for the action in the "Also called" column: it lists the words people use for the icon (`ICON_SEARCH` in `@kition/tessera-icons/registry` holds them, with words in Chinese for search).

The React component of an icon is its name in PascalCase plus `Icon` (`layer-add` → `LayerAddIcon`); the path data is the PascalCase name alone (`LayerAdd`). Each icon has a page of its own at `/icons/<name>/`.

## Interface icons (500)

Actions every editor has: save, undo, align, share.

| Icon | React component | Category | Also called | Drawing |
| --- | --- | --- | --- | --- |
| `a-arrow-down` | `AArrowDownIcon` | Design | letter, font size, text, formatting, smaller | Lucide `a-arrow-down` |
| `a-arrow-up` | `AArrowUpIcon` | Design | letter, font size, text, formatting, larger, bigger | Lucide `a-arrow-up` |
| `a-large-small` | `ALargeSmallIcon` | Design | letter, font size, text, formatting | Lucide `a-large-small` |
| `accessibility` | `AccessibilityIcon` | General | disability, disabled, dda, wheelchair | Lucide `accessibility` |
| `activity` | `ActivityIcon` | Media and time | pulse, action, motion, movement, exercise, fitness, healthcare, heart rate monitor, vital signs, vitals, emergency room, er, intensive care, hospital, defibrillator, earthquake, seismic, magnitude, richter scale, aftershock, tremor, shockwave, audio, waveform, synthesizer, synthesiser, music | Lucide `activity` |
| `alarm-clock` | `AlarmClockIcon` | Devices | morning | Lucide `alarm-clock` |
| `align-center-horizontal` | `AlignCenterHorizontalIcon` | Layout | items, flex, justify | Lucide `align-center-horizontal` |
| `align-center-vertical` | `AlignCenterVerticalIcon` | Layout | items, flex, justify | Lucide `align-center-vertical` |
| `align-end-horizontal` | `AlignEndHorizontalIcon` | Layout | items, bottom, flex, justify | Lucide `align-end-horizontal` |
| `align-end-vertical` | `AlignEndVerticalIcon` | Layout | items, right, flex, justify | Lucide `align-end-vertical` |
| `align-horizontal-justify-center` | `AlignHorizontalJustifyCenterIcon` | Layout | items, flex | Lucide `align-horizontal-justify-center` |
| `align-start-horizontal` | `AlignStartHorizontalIcon` | Layout | top, items, flex, justify | Lucide `align-start-horizontal` |
| `align-start-vertical` | `AlignStartVerticalIcon` | Layout | left, items, flex, justify | Lucide `align-start-vertical` |
| `align-vertical-justify-center` | `AlignVerticalJustifyCenterIcon` | Layout | items, flex, distribute, between | Lucide `align-vertical-justify-center` |
| `align-vertical-justify-end` | `AlignVerticalJustifyEndIcon` | Layout | bottom, items, flex, distribute, between | Lucide `align-vertical-justify-end` |
| `align-vertical-justify-start` | `AlignVerticalJustifyStartIcon` | Layout | top, items, flex, distribute, between | Lucide `align-vertical-justify-start` |
| `aperture` | `ApertureIcon` | Media and time | camera, photo, pictures, shutter, exposure | Lucide `aperture` |
| `app-window` | `AppWindowIcon` | Files | application, menu bar, pane, executable | Lucide `app-window` |
| `app-window-mac` | `AppWindowMacIcon` | Files | application, menu bar, pane, preferences, macos, osx, executable | Lucide `app-window-mac` |
| `arrow-down` | `ArrowDownIcon` | Arrows | backwards, reverse, direction, south | Tessera |
| `arrow-down-a-z` | `ArrowDownAZIcon` | Arrows | filter, sort, ascending, descending, increasing, decreasing, rising, falling, alphabetical | Lucide `arrow-down-a-z` |
| `arrow-down-to-line` | `ArrowDownToLineIcon` | Files | behind, direction, south, download, save, git, version control, pull, collapse, fold, vertical | Lucide `arrow-down-to-line` |
| `arrow-down-wide-narrow` | `ArrowDownWideNarrowIcon` | Arrows | filter, sort, ascending, descending, increasing, decreasing, rising, falling | Lucide `arrow-down-wide-narrow` |
| `arrow-left` | `ArrowLeftIcon` | Arrows | previous, back, direction, west, <- | Lucide `arrow-left` |
| `arrow-left-from-line` | `ArrowLeftFromLineIcon` | Arrows | previous, back, direction, west, expand, fold, horizontal, <-\| | Lucide `arrow-left-from-line` |
| `arrow-left-right` | `ArrowLeftRightIcon` | Arrows | bidirectional, two-way, 2-way, swap, switch, transaction, reorder, move, <-, -> | Tessera |
| `arrow-left-to-line` | `ArrowLeftToLineIcon` | Arrows | previous, back, direction, west, collapse, fold, horizontal, \|<- | Lucide `arrow-left-to-line` |
| `arrow-right` | `ArrowRightIcon` | Arrows | forward, next, direction, east, -> | Lucide `arrow-right` |
| `arrow-right-from-line` | `ArrowRightFromLineIcon` | Arrows | next, forward, direction, east, export, expand, fold, horizontal, \|-> | Lucide `arrow-right-from-line` |
| `arrow-right-left` | `ArrowRightLeftIcon` | Arrows | bidirectional, two-way, 2-way, swap, switch, transaction, reorder, move, <-, -> | Lucide `arrow-right-left` |
| `arrow-right-to-line` | `ArrowRightToLineIcon` | Arrows | next, forward, direction, east, tab, keyboard, mac, indent, collapse, fold, horizontal, ->\| | Lucide `arrow-right-to-line` |
| `arrow-up` | `ArrowUpIcon` | Arrows | forward, direction, north | Tessera |
| `arrow-up-down` | `ArrowUpDownIcon` | Arrows | bidirectional, two-way, 2-way, swap, switch, network, mobile data, internet, sort, reorder, move | Lucide `arrow-up-down` |
| `arrow-up-right` | `ArrowUpRightIcon` | Arrows | direction, north-east, diagonal | Lucide `arrow-up-right` |
| `at-sign` | `AtSignIcon` | Text | mention, email, message, @ | Lucide `at-sign` |
| `audio-lines` | `AudioLinesIcon` | Media and time | graphic equaliser, sound, noise, listen, hearing, hertz, frequency, wavelength, vibrate, sine, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song | Lucide `audio-lines` |
| `audio-waveform` | `AudioWaveformIcon` | Media and time | sound, noise, listen, hearing, hertz, frequency, wavelength, vibrate, sine, synthesizer, synthesiser, levels, track, music, playback, radio, broadcast, airwaves, voice, vocals, singer, song | Lucide `audio-waveform` |
| `ban` | `BanIcon` | People and messages | cancel, no, stop, forbidden, prohibited, error, incorrect, mistake, wrong, failure, circle, slash, null, void | Lucide `ban` |
| `bandage` | `BandageIcon` | General | plaster, band-aid, first aid, medical, health, wound, injury, care, treatment, healing, protection, emergency, aid, safety, patch | Lucide `bandage` |
| `baseline` | `BaselineIcon` | Text | text, format, color | Lucide `baseline` |
| `bell` | `BellIcon` | People and messages | alarm, notification, sound, reminder | Lucide `bell` |
| `between-horizontal-end` | `BetweenHorizontalEndIcon` | Design | insert, add, left, slot, squeeze, space, vertical, grid, table, rows, cells, excel, spreadsheet, accountancy, data, enter, entry, entries, blocks, rectangles, chevron | Lucide `between-horizontal-end` |
| `between-horizontal-start` | `BetweenHorizontalStartIcon` | Design | insert, add, right, slot, squeeze, space, vertical, grid, table, rows, cells, excel, spreadsheet, accountancy, data, enter, entry, entries, blocks, rectangles, chevron | Lucide `between-horizontal-start` |
| `between-vertical-end` | `BetweenVerticalEndIcon` | Design | insert, add, top, slot, squeeze, space, grid, table, columns, cells, data, enter, entry, entries, blocks, rectangles, chevron | Lucide `between-vertical-end` |
| `between-vertical-start` | `BetweenVerticalStartIcon` | Design | insert, add, bottom, slot, squeeze, space, grid, table, columns, cells, data, enter, entry, entries, blocks, rectangles, chevron | Lucide `between-vertical-start` |
| `blend` | `BlendIcon` | Media and time | mode, overlay, multiply, screen, opacity, transparency, alpha, filters, lenses, mixed, shades, tints, hues, saturation, brightness, overlap, colors, colours, marriage, rings, couple, connection | Lucide `blend` |
| `blocks` | `BlocksIcon` | Shapes | addon, plugin, integration, extension, package, build, stack, toys, kids, children, learning, squares, corner | Lucide `blocks` |
| `bold` | `BoldIcon` | Text | text, strong, format | Lucide `bold` |
| `book-bookmark` | `BookBookmarkIcon` | Text | dictionary, reading, booklet, magazine, leaflet, pamphlet, tome, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, saved, later, future, reference, index, code, coding, version control, git, repository | Lucide `book-bookmark` |
| `book-open` | `BookOpenIcon` | Text | reading, pages, booklet, magazine, leaflet, pamphlet, library, writing, written, writer, author, story, script, screenplay, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, revealed, blank, plain | Lucide `book-open` |
| `book-open-text` | `BookOpenTextIcon` | Text | reading, pages, booklet, magazine, leaflet, pamphlet, library, writing, written, writer, author, story, script, fiction, novel, information, knowledge, education, high school, university, college, academy, student, study, learning, homework, research, documentation, revealed | Lucide `book-open-text` |
| `bookmark` | `BookmarkIcon` | People and messages | save, favorite, mark, label, attachment, file, stick, pin, read, clip, marker, tag | Lucide `bookmark` |
| `bot` | `BotIcon` | Code | robot, ai, chat, assistant | Lucide `bot` |
| `box` | `BoxIcon` | Shapes | cube, package, container, storage, geometry, 3d, isometric | Lucide `box` |
| `boxes` | `BoxesIcon` | Shapes | cubes, packages, parts, group, units, collection, cluster, geometry | Lucide `boxes` |
| `braces` | `BracesIcon` | Files | json, code, token, curly brackets, data, {, } | Lucide `braces` |
| `briefcase` | `BriefcaseIcon` | General | work, bag, baggage, folder | Lucide `briefcase` |
| `briefcase-business` | `BriefcaseBusinessIcon` | General | work, bag, baggage, folder, portfolio | Lucide `briefcase-business` |
| `bring-to-front` | `BringToFrontIcon` | Design | send, move, over, forward, overlap, layer, order | Lucide `bring-to-front` |
| `brush` | `BrushIcon` | Design | clean, sweep, refactor, remove, draw, paint, color, artist | Lucide `brush` |
| `brush-cleaning` | `BrushCleaningIcon` | Design | utensil, housekeeping, tool, sweeping, scrubbing, hygiene, maintenance, household, cleaner, chores, equipment, sanitation, bristles, handle, home care, sanitize, purify, wash, disinfect, sterilize, scrub, polish, decontaminate, wipe, spotless, remove, empty, erase, purge, eliminate | Lucide `brush-cleaning` |
| `cable` | `CableIcon` | Media and time | cord, wire, connector, connection, link, signal, console, computer, equipment, electricity, energy, electronics, recharging, charger, power, supply, disconnected, unplugged, plugs, interface, input, output, audio video, av, rca, scart, tv, television, optical | Lucide `cable` |
| `calendar` | `CalendarIcon` | Media and time | date, month, year, event, birthday, birthdate | Lucide `calendar` |
| `calendar-clock` | `CalendarClockIcon` | Media and time | date, day, month, year, event, hour | Lucide `calendar-clock` |
| `calendar-days` | `CalendarDaysIcon` | Media and time | date, month, year, event | Lucide `calendar-days` |
| `calendar-range` | `CalendarRangeIcon` | Media and time | date, day, month, year, event, period | Lucide `calendar-range` |
| `camera` | `CameraIcon` | Media and time | photography, lens, focus, capture, shot, visual, image, device, equipment, photo, webcam, video | Lucide `camera` |
| `captions` | `CaptionsIcon` | Media and time | closed captions, subtitles, subhead, transcription, transcribe, dialogue, accessibility | Lucide `captions` |
| `case-lower` | `CaseLowerIcon` | Text | text, letters, characters, font, typography | Lucide `case-lower` |
| `case-sensitive` | `CaseSensitiveIcon` | Text | text, letters, characters, font, typography | Lucide `case-sensitive` |
| `case-upper` | `CaseUpperIcon` | Text | text, letters, characters, font, typography | Lucide `case-upper` |
| `chart-area` | `ChartAreaIcon` | Data and charts | statistics, analytics, diagram, graph | Lucide `chart-area` |
| `chart-column` | `ChartColumnIcon` | Data and charts | statistics, analytics, diagram, graph | Lucide `chart-column` |
| `chart-column-stacked` | `ChartColumnStackedIcon` | Data and charts | statistics, analytics, diagram, graph, multivariate, categorical, comparison | Lucide `chart-column-stacked` |
| `chart-gantt` | `ChartGanttIcon` | Data and charts | diagram, graph, timeline, planning | Lucide `chart-gantt` |
| `chart-line` | `ChartLineIcon` | Data and charts | statistics, analytics, diagram, graph | Lucide `chart-line` |
| `chart-no-axes-column` | `ChartNoAxesColumnIcon` | Data and charts | statistics, analytics, diagram, graph | Lucide `chart-no-axes-column` |
| `chart-no-axes-combined` | `ChartNoAxesCombinedIcon` | Data and charts | statistics, analytics, diagram, graph, trending up | Lucide `chart-no-axes-combined` |
| `chart-pie` | `ChartPieIcon` | Data and charts | statistics, analytics, diagram, presentation | Lucide `chart-pie` |
| `chart-scatter` | `ChartScatterIcon` | Data and charts | statistics, analytics, diagram, graph | Lucide `chart-scatter` |
| `chart-spline` | `ChartSplineIcon` | Data and charts | statistics, analytics, diagram, graph, curve, continuous, smooth, polynomial, quadratic, function, interpolation | Lucide `chart-spline` |
| `check` | `CheckIcon` | General | done, todo, tick, complete, task, confirm, ok, accept, apply | Tessera |
| `chevron-down` | `ChevronDownIcon` | Arrows | backwards, reverse, slow, dropdown | Tessera |
| `chevron-first` | `ChevronFirstIcon` | Media and time | previous, music | Lucide `chevron-first` |
| `chevron-last` | `ChevronLastIcon` | Media and time | skip, next, music | Lucide `chevron-last` |
| `chevron-left` | `ChevronLeftIcon` | Arrows | back, previous, less than, fewer, menu, < | Lucide `chevron-left` |
| `chevron-right` | `ChevronRightIcon` | Arrows | forward, next, more than, greater, menu, code, coding, command line, terminal, prompt, shell, > | Lucide `chevron-right` |
| `chevron-up` | `ChevronUpIcon` | Arrows | caret, keyboard, mac, control, ctrl, superscript, exponential, power, ahead, fast, ^, dropdown | Lucide `chevron-up` |
| `chevrons-down-up` | `ChevronsDownUpIcon` | Arrows | collapse, fold, vertical | Lucide `chevrons-down-up` |
| `chevrons-left` | `ChevronsLeftIcon` | Arrows | turn, corner | Lucide `chevrons-left` |
| `chevrons-right` | `ChevronsRightIcon` | Arrows | turn, corner | Lucide `chevrons-right` |
| `chevrons-right-left` | `ChevronsRightLeftIcon` | Arrows | collapse, fold, horizontal | Lucide `chevrons-right-left` |
| `chevrons-up-down` | `ChevronsUpDownIcon` | Arrows | expand, unfold, vertical | Lucide `chevrons-up-down` |
| `circle` | `CircleIcon` | Shapes | off, zero, record, shape | Tessera |
| `circle-alert` | `CircleAlertIcon` | General | warning, danger, exclamation mark | Lucide `circle-alert` |
| `circle-check` | `CircleCheckIcon` | General | done, todo, tick, complete, task | Lucide `circle-check` |
| `circle-dashed` | `CircleDashedIcon` | Shapes | pending, dot, progress, issue, draft, code, coding, version control | Lucide `circle-dashed` |
| `circle-dot` | `CircleDotIcon` | Shapes | pending, progress, issue, code, coding, version control, choices, multiple choice, choose, album, music, songs, format, cd, dvd, vinyl, sleeve, cover, platinum, compilation, ep, recording, playback, spin, rotate, rpm, dj | Lucide `circle-dot` |
| `circle-question-mark` | `CircleQuestionMarkIcon` | Text | question mark | Lucide `circle-question-mark` |
| `circle-user-round` | `CircleUserRoundIcon` | People and messages | person, account, contact | Lucide `circle-user-round` |
| `circle-x` | `CircleXIcon` | Code | cancel, close, delete, remove, times, clear, error, incorrect, wrong, mistake, failure, linter, multiply, multiplication | Lucide `circle-x` |
| `clapperboard` | `ClapperboardIcon` | Media and time | movie, film, video, camera, cinema, cut, action, television, tv, show, entertainment | Lucide `clapperboard` |
| `clipboard` | `ClipboardIcon` | Text | copy, paste | Lucide `clipboard` |
| `clipboard-check` | `ClipboardCheckIcon` | Text | copied, pasted, done, todo, tick, complete, task | Lucide `clipboard-check` |
| `clipboard-list` | `ClipboardListIcon` | Text | copy, paste, tasks | Lucide `clipboard-list` |
| `clipboard-paste` | `ClipboardPasteIcon` | Arrows | copy, insert | Tessera |
| `clock` | `ClockIcon` | Media and time | time, watch, alarm | Lucide `clock` |
| `clock-3` | `Clock3Icon` | Media and time | time, watch, alarm | Lucide `clock-3` |
| `cloud` | `CloudIcon` | General | weather | Lucide `cloud` |
| `cloud-download` | `CloudDownloadIcon` | Files | import | Lucide `cloud-download` |
| `cloud-off` | `CloudOffIcon` | Devices | disconnect | Lucide `cloud-off` |
| `cloud-upload` | `CloudUploadIcon` | Files | file | Lucide `cloud-upload` |
| `cloudy` | `CloudyIcon` | General | weather, clouds | Lucide `cloudy` |
| `code` | `CodeIcon` | Text | source, programming, html, xml | Lucide `code` |
| `code-xml` | `CodeXmlIcon` | Text | source, programming, html | Lucide `code-xml` |
| `columns-2` | `Columns2Icon` | Design | lines, list, queue, preview, panel, parallel, series, split, vertical, horizontal, half, center, middle, even, sidebar, drawer, gutter, fold, reflow, typography, pagination, pages | Lucide `columns-2` |
| `columns-3` | `Columns3Icon` | Design | lines, list, queue, preview, parallel, series, split, vertical, horizontal, thirds, triple, center, middle, alignment, even, sidebars, drawers, gutters, fold, reflow, typography, pagination, pages | Lucide `columns-3` |
| `combine` | `CombineIcon` | Files | cubes, packages, parts, units, collection, cluster, gather, merge | Lucide `combine` |
| `command` | `CommandIcon` | Code | keyboard, key, mac, cmd, button | Lucide `command` |
| `command-generic` | `CommandGenericIcon` | General | action, run | Tessera |
| `compass` | `CompassIcon` | Arrows | direction, north, east, south, west, browser | Lucide `compass` |
| `component` | `ComponentIcon` | Design | design, element, group, module, part, symbol | Lucide `component` |
| `contact` | `ContactIcon` | People and messages | user, person, family, friend, acquaintance, listing, networking | Lucide `contact` |
| `contrast` | `ContrastIcon` | Media and time | display, accessibility | Lucide `contrast` |
| `cookie` | `CookieIcon` | People and messages | biscuit, snack, dessert, food, sweet, bakery, consent, privacy, legal, tracking, browser, website | Lucide `cookie` |
| `copy` | `CopyIcon` | Text | clone, duplicate, multiple | Tessera |
| `copy-check` | `CopyCheckIcon` | Text | clone, duplicate, done, multiple | Lucide `copy-check` |
| `copy-plus` | `CopyPlusIcon` | Text | clone, duplicate, add, multiple, expand, + | Lucide `copy-plus` |
| `corner-down-right` | `CornerDownRightIcon` | Arrows | arrow, indent, tab | Lucide `corner-down-right` |
| `corner-up-right` | `CornerUpRightIcon` | Arrows | arrow | Lucide `corner-up-right` |
| `cpu` | `CpuIcon` | Devices | processor, cores, technology, computer, chip, circuit, memory, ram, specs, gigahertz, ghz | Lucide `cpu` |
| `credit-card` | `CreditCardIcon` | People and messages | bank, purchase, payment, cc | Lucide `credit-card` |
| `crop` | `CropIcon` | Media and time | photo, image | Lucide `crop` |
| `crosshair` | `CrosshairIcon` | Media and time | aim, target | Lucide `crosshair` |
| `database` | `DatabaseIcon` | Code | storage, memory, container, tin, pot, bytes, servers | Lucide `database` |
| `decimals-arrow-left` | `DecimalsArrowLeftIcon` | Design | numerical, decimal, decrease, less, fewer, precision, rounding, digits, fraction, float, number | Lucide `decimals-arrow-left` |
| `decimals-arrow-right` | `DecimalsArrowRightIcon` | Design | numerical, decimal, increase, more, precision, rounding, digits, fraction, float, number | Lucide `decimals-arrow-right` |
| `delete` | `DeleteIcon` | Arrows | backspace, remove | Lucide `delete` |
| `diameter` | `DiameterIcon` | Shapes | shape, circle, geometry, trigonometry, width, height, size, calculate, measure | Lucide `diameter` |
| `diamond` | `DiamondIcon` | Shapes | square, rectangle, oblique, rhombus, shape, suit, playing, cards | Lucide `diamond` |
| `disc` | `DiscIcon` | Media and time | album, music, songs, format, cd, dvd, vinyl, sleeve, cover, platinum, compilation, ep, recording, playback, spin, rotate, rpm, dj | Lucide `disc` |
| `dollar-sign` | `DollarSignIcon` | Data and charts | currency, money, payment | Lucide `dollar-sign` |
| `download` | `DownloadIcon` | Files | import, export, save | Tessera |
| `droplet` | `DropletIcon` | General | water, weather, liquid, fluid, wet, moisture, damp, bead, globule | Lucide `droplet` |
| `droplets` | `DropletsIcon` | General | water, weather, liquid, fluid, wet, moisture, damp, bead, globule | Lucide `droplets` |
| `earth` | `EarthIcon` | Arrows | world, browser, language, translate, globe | Lucide `earth` |
| `ellipsis` | `EllipsisIcon` | Layout | et cetera, etc, loader, loading, progress, pending, throbber, menu, options, operator, code, coding, spread, rest, more, further, extra, overflow, dots, …, ... | Lucide `ellipsis` |
| `ellipsis-vertical` | `EllipsisVerticalIcon` | Layout | menu, options, spread, more, further, extra, overflow, dots, …, ... | Lucide `ellipsis-vertical` |
| `eraser` | `EraserIcon` | Text | pencil, drawing, undo, delete, clear, trash, remove | Tessera |
| `expand` | `ExpandIcon` | Arrows | scale, fullscreen, maximize, minimize, contract | Lucide `expand` |
| `external-link` | `ExternalLinkIcon` | Arrows | outbound, open, share | Lucide `external-link` |
| `eye` | `EyeIcon` | Media and time | view, watch, see, show, expose, reveal, display, visible, visibility, vision, preview, read | Tessera |
| `eye-off` | `EyeOffIcon` | Media and time | view, watch, see, hide, conceal, mask, hidden, visibility, vision | Tessera |
| `face-slightly-smiling` | `FaceSlightlySmilingIcon` | People and messages | smile, happy, happiness, good, positive, friendly, patronizing, passive aggressive, ironic, emoji, emotion | Lucide `face-slightly-smiling` |
| `fast-forward` | `FastForwardIcon` | Media and time | music | Lucide `fast-forward` |
| `feather` | `FeatherIcon` | Text | quill, plume, writing, author, literature, poetry, manuscript, bird, plumage, lightweight, soft | Lucide `feather` |
| `file` | `FileIcon` | Files | document, page, new | Lucide `file` |
| `file-archive` | `FileArchiveIcon` | Files | zip, package | Lucide `file-archive` |
| `file-check-corner` | `FileCheckCornerIcon` | Files | done, document, todo, tick, complete, task | Lucide `file-check-corner` |
| `file-clock` | `FileClockIcon` | Files | history, log | Lucide `file-clock` |
| `file-code` | `FileCodeIcon` | Files | script, document, gist, html, xml, property list, plist | Lucide `file-code` |
| `file-code-corner` | `FileCodeCornerIcon` | Files | script, document, html, xml, property list, plist | Lucide `file-code-corner` |
| `file-diff` | `FileDiffIcon` | Files | patch | Lucide `file-diff` |
| `file-digit` | `FileDigitIcon` | Files | number, document | Lucide `file-digit` |
| `file-exclamation-point` | `FileExclamationPointIcon` | Files | hidden, warning, alert, danger, protected, exclamation mark | Lucide `file-exclamation-point` |
| `file-image` | `FileImageIcon` | Files | graphics, photo, picture | Lucide `file-image` |
| `file-input` | `FileInputIcon` | Files | document | Lucide `file-input` |
| `file-output` | `FileOutputIcon` | Files | document | Lucide `file-output` |
| `file-pen-line` | `FilePenLineIcon` | Files | edit | Lucide `file-pen-line` |
| `file-plus` | `FilePlusIcon` | Files | add, create, new, document | Lucide `file-plus` |
| `file-plus-corner` | `FilePlusCornerIcon` | Files | add, create, new, document | Lucide `file-plus-corner` |
| `file-spreadsheet` | `FileSpreadsheetIcon` | Files | sheet, table | Lucide `file-spreadsheet` |
| `file-symlink` | `FileSymlinkIcon` | Files | symbolic, link | Lucide `file-symlink` |
| `file-text` | `FileTextIcon` | Files | data, txt, pdf, document | Lucide `file-text` |
| `file-type-corner` | `FileTypeCornerIcon` | Files | font, text, typography | Lucide `file-type-corner` |
| `file-up` | `FileUpIcon` | Files | upload, import, export | Lucide `file-up` |
| `file-video-camera` | `FileVideoCameraIcon` | Files | movie, film | Lucide `file-video-camera` |
| `files` | `FilesIcon` | Files | multiple, copy, documents | Lucide `files` |
| `film` | `FilmIcon` | Media and time | movie, video, reel, camera, cinema, entertainment | Lucide `film` |
| `flag` | `FlagIcon` | People and messages | report, marker, notification, warning, milestone, goal, notice, signal, attention, banner | Lucide `flag` |
| `flame` | `FlameIcon` | People and messages | heat, burn, light, glow, ignite, passion, ember, fire, lit, burning, spark, embers, smoke, firefighter, fireman, department, brigade, station, emergency | Lucide `flame` |
| `flask-conical` | `FlaskConicalIcon` | Data and charts | beaker, erlenmeyer, lab, chemistry, experiment, test | Lucide `flask-conical` |
| `flip-horizontal` | `FlipHorizontalIcon` | General | mirror, reflect | Tessera |
| `flower` | `FlowerIcon` | General | sustainability, nature, plant, spring | Lucide `flower` |
| `focus` | `FocusIcon` | Media and time | camera, lens, photo, dashed | Lucide `focus` |
| `fold-horizontal` | `FoldHorizontalIcon` | Arrows | arrow, collapse, vertical, dashed | Lucide `fold-horizontal` |
| `folder` | `FolderIcon` | Files | directory, open, browse | Lucide `folder` |
| `folder-check` | `FolderCheckIcon` | Files | done, directory, todo, tick, complete, task | Lucide `folder-check` |
| `folder-input` | `FolderInputIcon` | Files | directory, import, export | Lucide `folder-input` |
| `folder-lock` | `FolderLockIcon` | Files | directory, private, security, protected | Lucide `folder-lock` |
| `folder-open` | `FolderOpenIcon` | Files | directory, browse | Lucide `folder-open` |
| `folder-plus` | `FolderPlusIcon` | Files | directory, add, create, new | Lucide `folder-plus` |
| `folder-up` | `FolderUpIcon` | Files | directory, upload, import, export | Lucide `folder-up` |
| `frame` | `FrameIcon` | Media and time | logo, design, tool | Lucide `frame` |
| `fullscreen` | `FullscreenIcon` | Media and time | expand, zoom, preview, focus, camera, lens, image | Lucide `fullscreen` |
| `funnel` | `FunnelIcon` | Layout | filter, hopper | Lucide `funnel` |
| `gallery-horizontal-end` | `GalleryHorizontalEndIcon` | Files | carousel, pictures, images, scroll, swipe, album, portfolio, history, versions, backup, time machine | Lucide `gallery-horizontal-end` |
| `gauge` | `GaugeIcon` | Data and charts | dashboard, dial, meter, speed, pressure, measure, level | Lucide `gauge` |
| `gem` | `GemIcon` | Code | diamond, crystal, ruby, jewellery, price, special, present, gift, ring, wedding, proposal, marriage, rubygems | Lucide `gem` |
| `gift` | `GiftIcon` | People and messages | present, box, birthday, party | Lucide `gift` |
| `git-branch` | `GitBranchIcon` | Code | code, version control, vcs, repository | Lucide `git-branch` |
| `git-branch-plus` | `GitBranchPlusIcon` | Code | code, version control, vcs, repository, add, create, + | Lucide `git-branch-plus` |
| `git-compare` | `GitCompareIcon` | Code | code, version control, diff | Lucide `git-compare` |
| `glasses` | `GlassesIcon` | General | spectacles | Lucide `glasses` |
| `globe` | `GlobeIcon` | Arrows | world, browser, language, translate | Lucide `globe` |
| `graduation-cap` | `GraduationCapIcon` | General | school, university, learn, study, mortarboard, education, ceremony, academic, hat, diploma, bachelor's, master's, doctorate | Lucide `graduation-cap` |
| `grid-2x2` | `Grid2x2Icon` | Design | table, rows, columns, blocks, plot, land, geometry, measure, size, width, height, distance, surface area, square meter, acre, window, skylight | Lucide `grid-2x2` |
| `grid-3x2` | `Grid3x2Icon` | Design | table, rows, columns, blocks, plot, land, geometry, measure, size, width, height, distance, surface area, square meter, acre, window | Lucide `grid-3x2` |
| `grid-3x3` | `Grid3x3Icon` | Design | table, rows, columns | Lucide `grid-3x3` |
| `grip-horizontal` | `GripHorizontalIcon` | Layout | grab, dots, handle, move, drag | Lucide `grip-horizontal` |
| `grip-vertical` | `GripVerticalIcon` | Layout | grab, dots, handle, move, drag | Lucide `grip-vertical` |
| `group` | `GroupIcon` | Files | cubes, packages, parts, units, collection, cluster, gather, dashed, combine, collect, together | Tessera |
| `hand` | `HandIcon` | Tools | wave, move, mouse, grab | Lucide `hand` |
| `hard-drive` | `HardDriveIcon` | Code | computer, server, memory, data, ssd, disk, hard disk, storage, hardware, backup, media | Lucide `hard-drive` |
| `hash` | `HashIcon` | Text | hashtag, number, pound | Tessera |
| `heading` | `HeadingIcon` | Text | h1, html, markup, markdown | Lucide `heading` |
| `heart` | `HeartIcon` | Media and time | like, love, emotion, suit, playing, cards | Lucide `heart` |
| `hexagon` | `HexagonIcon` | Shapes | shape, node.js, logo | Lucide `hexagon` |
| `highlighter` | `HighlighterIcon` | Design | mark, text | Tessera |
| `hourglass` | `HourglassIcon` | Media and time | timer, time, sandglass | Lucide `hourglass` |
| `image` | `ImageIcon` | Files | picture, photo | Tessera |
| `image-down` | `ImageDownIcon` | Files | picture, photo, download, save, export | Lucide `image-down` |
| `image-plus` | `ImagePlusIcon` | Files | add, create, picture | Lucide `image-plus` |
| `image-up` | `ImageUpIcon` | Files | picture, photo, upload, import | Lucide `image-up` |
| `images` | `ImagesIcon` | Files | picture, photo, multiple, copy, gallery, album, collection, slideshow, showcase | Lucide `images` |
| `inbox` | `InboxIcon` | People and messages | email | Lucide `inbox` |
| `info` | `InfoIcon` | General | about, advice, clue, details, help, hint, indicator, information, knowledge, notice, status, support, tooltip | Lucide `info` |
| `italic` | `ItalicIcon` | Text | oblique, text, format | Lucide `italic` |
| `key-round` | `KeyRoundIcon` | People and messages | password, login, authentication, secure, unlock | Lucide `key-round` |
| `keyboard` | `KeyboardIcon` | Text | layout, spell, settings, mouse | Lucide `keyboard` |
| `lamp` | `LampIcon` | General | lighting, household, home, furniture | Lucide `lamp` |
| `languages` | `LanguagesIcon` | Text | translate, locale, i18n | Lucide `languages` |
| `laptop` | `LaptopIcon` | Devices | computer, screen, remote | Lucide `laptop` |
| `lasso` | `LassoIcon` | Design | select, cursor | Lucide `lasso` |
| `lasso-select` | `LassoSelectIcon` | Design | cursor | Lucide `lasso-select` |
| `layers` | `LayersIcon` | Design | stack, pile, pages, sheets, paperwork, copies, copy | Tessera |
| `layers-2` | `Layers2Icon` | Design | stack, pile, pages, sheets, paperwork, copies, copy, duplicate, double, shortcuts | Lucide `layers-2` |
| `layers-plus` | `LayersPlusIcon` | Design | stack, add, new, increase, create, positive, copy, upgrade | Lucide `layers-plus` |
| `layout-dashboard` | `LayoutDashboardIcon` | Design | masonry, brick | Lucide `layout-dashboard` |
| `layout-grid` | `LayoutGridIcon` | Design | app, home, start | Lucide `layout-grid` |
| `layout-panel-left` | `LayoutPanelLeftIcon` | Design | app, home, start, grid | Lucide `layout-panel-left` |
| `layout-template` | `LayoutTemplateIcon` | Layout | window, webpage, block, section, wireframe | Tessera |
| `library` | `LibraryIcon` | Media and time | books, reading, written, authors, stories, fiction, novels, information, knowledge, education, high school, university, college, academy, learning, study, research, collection, vinyl, records, albums, music, package | Lucide `library` |
| `life-buoy` | `LifeBuoyIcon` | General | preserver, life belt, lifesaver, help, rescue, ship, ring, raft, inflatable, wheel, donut | Lucide `life-buoy` |
| `ligature` | `LigatureIcon` | Text | text, font, typography, alternates, alternatives | Lucide `ligature` |
| `lightbulb` | `LightbulbIcon` | Media and time | idea, bright, lights | Lucide `lightbulb` |
| `link` | `LinkIcon` | Text | chain, url, hyperlink, web address | Tessera |
| `link-2` | `Link2Icon` | Text | chain, url | Lucide `link-2` |
| `list` | `ListIcon` | Text | options, bullets, items, unordered | Lucide `list` |
| `list-checks` | `ListChecksIcon` | Text | todo, done, check, tick, complete, tasks, items, pending | Lucide `list-checks` |
| `list-filter` | `ListFilterIcon` | Text | options, sort, narrow | Lucide `list-filter` |
| `list-indent-decrease` | `ListIndentDecreaseIcon` | Text | text, tab | Lucide `list-indent-decrease` |
| `list-indent-increase` | `ListIndentIncreaseIcon` | Text | text, tab | Lucide `list-indent-increase` |
| `list-ordered` | `ListOrderedIcon` | Text | number, order, queue | Lucide `list-ordered` |
| `list-plus` | `ListPlusIcon` | Media and time | playlist, add, song, track, new | Lucide `list-plus` |
| `list-restart` | `ListRestartIcon` | Media and time | reset, refresh, reload, playlist, replay | Lucide `list-restart` |
| `list-todo` | `ListTodoIcon` | Text | done, check, tick, complete, tasks, items, pending | Lucide `list-todo` |
| `list-tree` | `ListTreeIcon` | Files | browser | Lucide `list-tree` |
| `list-video` | `ListVideoIcon` | Media and time | playlist, playback | Lucide `list-video` |
| `loader-circle` | `LoaderCircleIcon` | Media and time | loading, wait, busy, progress, spinner, spinning, throbber | Lucide `loader-circle` |
| `lock` | `LockIcon` | General | security, password, secure, admin | Tessera |
| `lock-keyhole` | `LockKeyholeIcon` | General | security, password, secure, admin | Lucide `lock-keyhole` |
| `lock-open` | `LockOpenIcon` | General | security, unlock, editable | Tessera |
| `log-out` | `LogOutIcon` | Arrows | sign out, arrow, exit, auth | Lucide `log-out` |
| `lollipop` | `LollipopIcon` | General | lolly, candy, sugar, food, sweet, dessert, spiral | Lucide `lollipop` |
| `magnet` | `MagnetIcon` | Design | horseshoe, lock, science, snap | Lucide `magnet` |
| `mail` | `MailIcon` | Text | email, message, letter, unread | Lucide `mail` |
| `mail-warning` | `MailWarningIcon` | People and messages | email, message, letter, delivery error, exclamation mark | Lucide `mail-warning` |
| `map-pin` | `MapPinIcon` | Arrows | location, waypoint, marker, drop | Lucide `map-pin` |
| `maximize` | `MaximizeIcon` | Design | fullscreen, expand, dashed | Lucide `maximize` |
| `maximize-2` | `Maximize2Icon` | Design | fullscreen, arrows, expand | Lucide `maximize-2` |
| `megaphone` | `MegaphoneIcon` | Media and time | advertisement, announcement, attention, alert, loudspeaker, notification | Lucide `megaphone` |
| `menu` | `MenuIcon` | Layout | bars, navigation, hamburger, options | Lucide `menu` |
| `merge` | `MergeIcon` | Arrows | combine, join, unite | Lucide `merge` |
| `message-square` | `MessageSquareIcon` | People and messages | comment, chat, conversation, dialog, feedback, speech bubble | Tessera |
| `message-square-dashed` | `MessageSquareDashedIcon` | People and messages | comment, chat, conversation, dialog, feedback, speech bubble, draft | Lucide `message-square-dashed` |
| `message-square-plus` | `MessageSquarePlusIcon` | People and messages | comment, chat, conversation, dialog, feedback, speech bubble, add | Lucide `message-square-plus` |
| `message-square-text` | `MessageSquareTextIcon` | People and messages | comment, chat, conversation, dialog, feedback, speech bubble | Lucide `message-square-text` |
| `minimize-2` | `Minimize2Icon` | Design | exit fullscreen, arrows, close, shrink | Lucide `minimize-2` |
| `minus` | `MinusIcon` | Text | subtract, remove, decrease, decrement, reduce, negative, calculate, line, divider, separator, horizontal rule, hr, html, markup, markdown, ---, toolbar, operator, code, coding, minimum, downgrade | Tessera |
| `monitor` | `MonitorIcon` | Devices | tv, computer, desktop, screen, display, external display, screen sharing, virtual machine, vm | Lucide `monitor` |
| `monitor-cog` | `MonitorCogIcon` | Devices | tv, computer, screen, display, desktop, external display, virtual machine, vm, executable, settings, edit, gear, configuration, preferences, system, control panel, network, computing | Lucide `monitor-cog` |
| `monitor-play` | `MonitorPlayIcon` | Media and time | tv, computer, screen, display, desktop, external display, screen sharing, video, movie, film, running, start, boot, virtual machine, vm | Lucide `monitor-play` |
| `monitor-smartphone` | `MonitorSmartphoneIcon` | Devices | phone, cellphone, device, mobile, desktop, screen, display, external display, screen sharing, responsive, screens, sync, cast | Lucide `monitor-smartphone` |
| `moon` | `MoonIcon` | General | dark, night | Lucide `moon` |
| `mountain` | `MountainIcon` | General | climb, hike, rock | Lucide `mountain` |
| `mountain-snow` | `MountainSnowIcon` | General | alpine, climb | Lucide `mountain-snow` |
| `mouse-pointer` | `MousePointerIcon` | Arrows | click, select | Lucide `mouse-pointer` |
| `mouse-pointer-2` | `MousePointer2Icon` | Arrows | click, select | Tessera |
| `mouse-pointer-click` | `MousePointerClickIcon` | Arrows | select | Lucide `mouse-pointer-click` |
| `move` | `MoveIcon` | Arrows | arrows, drag, position, pan | Lucide `move` |
| `move-3d` | `Move3dIcon` | Design | arrows, axis, gizmo, coordinates, transform, translate | Lucide `move-3d` |
| `move-horizontal` | `MoveHorizontalIcon` | Arrows | double, arrow | Lucide `move-horizontal` |
| `move-right` | `MoveRightIcon` | Arrows | arrow, direction, trend flat, east | Lucide `move-right` |
| `move-up-right` | `MoveUpRightIcon` | Arrows | arrow, direction | Lucide `move-up-right` |
| `move-vertical` | `MoveVerticalIcon` | Arrows | double, arrow | Lucide `move-vertical` |
| `music` | `MusicIcon` | Files | note, quaver, eighth note | Lucide `music` |
| `navigation` | `NavigationIcon` | Arrows | location, travel | Lucide `navigation` |
| `network` | `NetworkIcon` | Code | tree | Lucide `network` |
| `notebook-pen` | `NotebookPenIcon` | Text | pencil, notepad, notes, noted, stationery, sketchbook, organizer, organiser, planner, diary, journal, writing, write, written, reading, high school, university, college, academy, student, study, research, homework, eraser, rubber | Lucide `notebook-pen` |
| `notebook-text` | `NotebookTextIcon` | Text | notepad, notes, pages, paper, stationery, sketchbook, organizer, organiser, planner, diary, journal, writing, write, written, reading, high school, university, college, academy, student, study, research, homework, lines, opened | Lucide `notebook-text` |
| `omega` | `OmegaIcon` | Text | greek, symbol, mathematics, education, physics, engineering, ohms, electrical resistance, angular frequency, dynamical systems, astronomy, constellations, philosophy | Lucide `omega` |
| `orbit` | `OrbitIcon` | Data and charts | planet, space, physics, satellites, moons | Lucide `orbit` |
| `package` | `PackageIcon` | Files | box, container, storage, sealed, delivery, undelivered, unopened, packed, archive, zip, module | Lucide `package` |
| `paint-bucket` | `PaintBucketIcon` | Design | fill, color, colour, flood | Tessera |
| `paintbrush` | `PaintbrushIcon` | Media and time | brush, design, color, colour, decoration, diy | Tessera |
| `palette` | `PaletteIcon` | Media and time | colors, colours, theme, scheme, paint, watercolor, watercolour, artist | Tessera |
| `panel-bottom` | `PanelBottomIcon` | Layout | drawer, dock | Lucide `panel-bottom` |
| `panel-left` | `PanelLeftIcon` | Layout | primary, drawer | Lucide `panel-left` |
| `panel-left-close` | `PanelLeftCloseIcon` | Arrows | primary, drawer, hide, chevron, < | Lucide `panel-left-close` |
| `panel-left-open` | `PanelLeftOpenIcon` | Arrows | primary, drawer, show, reveal, chevron, right, > | Lucide `panel-left-open` |
| `panel-right` | `PanelRightIcon` | Layout | sidebar, secondary, drawer | Lucide `panel-right` |
| `panel-top` | `PanelTopIcon` | Design | drawer, browser, webpage | Lucide `panel-top` |
| `panels-top-left` | `PanelsTopLeftIcon` | Design | menu bar, sidebar, primary, drawers, window, webpage, projects, overview | Lucide `panels-top-left` |
| `paperclip` | `PaperclipIcon` | Files | attachment, file | Lucide `paperclip` |
| `pause` | `PauseIcon` | Media and time | music, stop | Lucide `pause` |
| `pen` | `PenIcon` | Design | pencil, change, create, draw, writer, writing, biro, ink, marker, felt tip, stationery, artist | Lucide `pen` |
| `pen-line` | `PenLineIcon` | Design | pencil, change, create, draw, writer, writing, biro, ink, marker, felt tip, stationery, artist | Lucide `pen-line` |
| `pen-tool` | `PenToolIcon` | Design | vector, drawing, path | Lucide `pen-tool` |
| `pencil` | `PencilIcon` | Design | rubber, edit, create, draw, sketch, draft, writer, writing, stationery, artist, modify, rename | Tessera |
| `pencil-line` | `PencilLineIcon` | Design | change, create, draw, sketch, draft, writer, writing, biro, ink, marker, felt tip, stationery, artist | Lucide `pencil-line` |
| `pentagon` | `PentagonIcon` | Shapes | shape | Lucide `pentagon` |
| `percent` | `PercentIcon` | Code | percentage, modulo, modulus, remainder, %, sale, discount, offer, marketing | Lucide `percent` |
| `pilcrow` | `PilcrowIcon` | Text | paragraph, mark, paraph, blind, typography, type, text, prose, symbol | Lucide `pilcrow` |
| `pill` | `PillIcon` | General | medicine, medication, drug, prescription, tablet, pharmacy | Lucide `pill` |
| `pin` | `PinIcon` | Arrows | save, map, lock, fix | Lucide `pin` |
| `pin-off` | `PinOffIcon` | Arrows | unpin, map, unlock, unfix, unsave, remove | Lucide `pin-off` |
| `pipette` | `PipetteIcon` | Design | eye dropper, color picker, lab, chemistry | Lucide `pipette` |
| `play` | `PlayIcon` | Media and time | music, audio, video, start, run, preview, playback | Tessera |
| `plus` | `PlusIcon` | Text | add, new, increase, increment, positive, calculate, toolbar, crosshair, aim, target, scope, sight, reticule, maximum, upgrade, extra, +, create | Tessera |
| `pointer` | `PointerIcon` | Tools | mouse, cursor, select, click | Lucide `pointer` |
| `power` | `PowerIcon` | Devices | on, off, device, switch, toggle, binary, boolean, reboot, restart, button, keyboard, troubleshoot | Lucide `power` |
| `presentation` | `PresentationIcon` | Media and time | screen, whiteboard, marker pens, markers, blackboard, chalk, easel, school, learning, lesson, office, meeting, project, planning | Lucide `presentation` |
| `printer` | `PrinterIcon` | Devices | fax, office, device | Lucide `printer` |
| `puzzle` | `PuzzleIcon` | Code | component, module, part, piece | Lucide `puzzle` |
| `qr-code` | `QrCodeIcon` | Code | barcode, scan, link, url, information, digital | Lucide `qr-code` |
| `quote` | `QuoteIcon` | Text | quotation, blockquote, citation | Lucide `quote` |
| `radar` | `RadarIcon` | Arrows | scan, sonar, detect, find, locate | Lucide `radar` |
| `radius` | `RadiusIcon` | Shapes | shape, circle, geometry, trigonometry, radii, calculate, measure, size | Lucide `radius` |
| `rainbow` | `RainbowIcon` | General | colors, colours, spectrum, light, prism, arc, clear, sunshine | Lucide `rainbow` |
| `ratio` | `RatioIcon` | Media and time | screens, sizes, rotate, rotation, adjust, aspect ratio, proportions, 16:9, widescreen, 4:3, resolution, responsive, mobile, desktop, dimensions, monitor, orientation, portrait, landscape | Lucide `ratio` |
| `receipt` | `ReceiptIcon` | Data and charts | bill, voucher, slip, check, counterfoil, currency, dollar, usd, $ | Lucide `receipt` |
| `rectangle-horizontal` | `RectangleHorizontalIcon` | Shapes | aspect ratio, 16:9, shape | Lucide `rectangle-horizontal` |
| `rectangle-vertical` | `RectangleVerticalIcon` | Shapes | aspect ratio, 9:16, shape | Lucide `rectangle-vertical` |
| `redo-2` | `Redo2Icon` | Arrows | undo, rerun, history, forward, again | Lucide `redo-2` |
| `refresh-ccw` | `RefreshCcwIcon` | Arrows | arrows, rotate, reload, rerun, synchronise, synchronize, circular, cycle | Lucide `refresh-ccw` |
| `refresh-cw` | `RefreshCwIcon` | Arrows | rotate, reload, rerun, synchronise, synchronize, arrows, circular, cycle | Tessera |
| `remove-formatting` | `RemoveFormattingIcon` | Text | text, font, typography, format, x, delete, times, clear | Lucide `remove-formatting` |
| `repeat` | `RepeatIcon` | Media and time | loop, arrows | Lucide `repeat` |
| `replace` | `ReplaceIcon` | Text | search, substitute, swap, change | Lucide `replace` |
| `rocket` | `RocketIcon` | Code | release, boost, launch, space, version | Lucide `rocket` |
| `rotate-3d` | `Rotate3dIcon` | Design | gizmo, transform, orientation, orbit, axis | Lucide `rotate-3d` |
| `rotate-ccw` | `RotateCcwIcon` | Media and time | arrow, left, counter-clockwise, restart, reload, rerun, refresh, backup, undo, replay, redo, retry, rewind, reverse | Tessera |
| `rotate-ccw-clock` | `RotateCcwClockIcon` | Arrows | history, time, redo, undo, rewind, timeline, version, time machine, backup | Lucide `rotate-ccw-clock` |
| `rotate-cw` | `RotateCwIcon` | Media and time | arrow, right, clockwise, refresh, reload, rerun, redo | Tessera |
| `rows-2` | `Rows2Icon` | Design | lines, list, queue, preview, panel, paragraphs, parallel, series, split, vertical, horizontal, half, center, middle, even, drawer | Lucide `rows-2` |
| `rows-3` | `Rows3Icon` | Design | lines, list, queue, preview, paragraphs, parallel, series, split, vertical, horizontal, half, center, middle, even, drawers | Lucide `rows-3` |
| `ruler` | `RulerIcon` | Design | measurements, centimeters, cm, millimeters, mm, metre, foot, feet, inches, units, size, length, width, height, dimensions, depth, breadth, extent, stationery | Lucide `ruler` |
| `ruler-dimension-line` | `RulerDimensionLineIcon` | Design | measurements, centimeters, cm, millimeters, mm, metre, foot, feet, inches, units, size, length, width, height, dimensions, depth, breadth, extent, stationery | Lucide `ruler-dimension-line` |
| `save` | `SaveIcon` | Files | floppy disk, store, disk, write | Lucide `save` |
| `scale` | `ScaleIcon` | Arrows | balance, legal, license, right, rule, law, justice, weight, measure, compare, judge, fair, ethics, decision | Lucide `scale` |
| `scaling` | `ScalingIcon` | CAD | scale, resize, design | Tessera |
| `scan` | `ScanIcon` | People and messages | qr-code, barcode, checkout, augmented reality, ar, target, surveillance, camera, lens, focus, frame, select, box, boundary, bounds, area, square, dashed | Lucide `scan` |
| `scan-eye` | `ScanEyeIcon` | Media and time | preview, zoom, expand, fullscreen, gallery, image, camera, watch, surveillance, retina, focus, lens, biometric, identification, authentication, access, login | Lucide `scan-eye` |
| `scan-face` | `ScanFaceIcon` | People and messages | biometric, identification, authentication, 2fa, access, login, dashed | Lucide `scan-face` |
| `scan-search` | `ScanSearchIcon` | Media and time | preview, zoom, expand, fullscreen, gallery, image, focus, lens | Lucide `scan-search` |
| `scan-text` | `ScanTextIcon` | Text | recognition, read, translate, copy, lines | Lucide `scan-text` |
| `scissors` | `ScissorsIcon` | Design | cut, snip, chop, stationery, crafts | Tessera |
| `scroll-text` | `ScrollTextIcon` | Text | paper, log, scripture, document, notes, parchment, list, long, script, story, code, coding | Lucide `scroll-text` |
| `search` | `SearchIcon` | Text | find, scan, magnifier, magnifying glass, lens, locate, explore, discover, enlarge, zoom | Tessera |
| `search-check` | `SearchCheckIcon` | Text | find, scan, magnifier, magnifying glass, found, correct, complete, tick, lens, locate, explore, discover, enlarge, zoom | Lucide `search-check` |
| `send` | `SendIcon` | People and messages | email, message, mail, paper airplane, paper aeroplane, submit | Lucide `send` |
| `send-to-back` | `SendToBackIcon` | Design | bring, move, under, backwards, overlap, layer, order | Lucide `send-to-back` |
| `separator-horizontal` | `SeparatorHorizontalIcon` | Arrows | move, split | Lucide `separator-horizontal` |
| `settings` | `SettingsIcon` | People and messages | cog, edit, gear, preferences | Lucide `settings` |
| `settings-2` | `Settings2Icon` | People and messages | cog, edit, gear, preferences, slider | Lucide `settings-2` |
| `shapes` | `ShapesIcon` | Shapes | triangle, equilateral, square, circle, classification, different, collection, toy, blocks, learning | Lucide `shapes` |
| `share-2` | `Share2Icon` | People and messages | network, connections | Lucide `share-2` |
| `shell` | `ShellIcon` | Code | beach, sand, holiday, sea life, fossil, ammonite, biology, ocean, terminal, command line, session, bash, zsh, roll, wrap, chewing gum, bubble gum, sweet, sugar, hosepipe, carpet, string, spiral, spinner, hypnotise, hypnosis | Lucide `shell` |
| `shield-alert` | `ShieldAlertIcon` | Code | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, blocked, stopped, intercepted, interception, saved, thwarted, threat, prevention, unprevented, antivirus, vigilance, vigilant, detection, detected, scanned, found, exploit, vulnerability, vulnerable, weakness, infection, infected, compromised, data leak, audited, admin, verification, unverified, uncertified, warning, emergency, attention, urgent, alarm, crest, bravery, strength, tough, attacked, damaged, injured, hit, expired, disabled, inactive, error, exclamation mark, ! | Lucide `shield-alert` |
| `shield-ban` | `ShieldBanIcon` | Code | unshielded, cybersecurity, insecure, unsecured, safety, unsafe, protection, unprotected, guardian, unguarded, unarmored, unarmoured, defenseless, defenceless, undefended, defender, blocked, stopped, intercepted, interception, saved, thwarted, threat, prevention, unprevented, antivirus, vigilance, vigilant, detection, detected, scanned, found, exploit, vulnerability, vulnerable, weakness, infection, infected, compromised, data leak, audited, admin, verification, unverified, uncertified, cancel, error, crest, bravery, attacked, damaged, injured, hit, expired, eliminated, disabled, inactive, / | Lucide `shield-ban` |
| `shield-check` | `ShieldCheckIcon` | Code | cybersecurity, secured, safety, protection, protected, guardian, guarded, armored, armoured, defense, defence, defended, blocked, threat, prevention, prevented, antivirus, vigilance, vigilant, active, activated, enabled, detection, scanned, found, strength, strong, tough, invincible, invincibility, invulnerable, undamaged, audited, admin, verification, verified, certification, certified, tested, passed, qualified, cleared, cleaned, disinfected, uninfected, task, completed, todo, done, ticked, checked, crest, bravery | Lucide `shield-check` |
| `shrink` | `ShrinkIcon` | Arrows | scale, fullscreen | Lucide `shrink` |
| `sigma` | `SigmaIcon` | Text | sum, calculate, formula, math, enumeration, enumerate | Lucide `sigma` |
| `signature` | `SignatureIcon` | Text | text, format, input, contract, autograph, handwriting, sign, cursive, ink, scribble, authorize, personal, agreement, legal, document, identity, authentic, approval, verification, unique | Lucide `signature` |
| `skip-back` | `SkipBackIcon` | Media and time | arrow, previous, music | Lucide `skip-back` |
| `skip-forward` | `SkipForwardIcon` | Media and time | arrow, next, music | Lucide `skip-forward` |
| `slash` | `SlashIcon` | Code | divide, division, or, / | Lucide `slash` |
| `slice` | `SliceIcon` | Design | cutter, scalpel, knife | Lucide `slice` |
| `sliders-horizontal` | `SlidersHorizontalIcon` | People and messages | settings, filters, controls | Tessera |
| `sliders-vertical` | `SlidersVerticalIcon` | People and messages | settings, controls | Lucide `sliders-vertical` |
| `snowflake` | `SnowflakeIcon` | General | cold, weather, freeze, snow, winter | Lucide `snowflake` |
| `sparkle` | `SparkleIcon` | Shapes | star, effect, filter, night, magic, shiny, glitter, twinkle, celebration | Lucide `sparkle` |
| `sparkles` | `SparklesIcon` | Media and time | stars, effect, filter, night, magic | Tessera |
| `spell-check` | `SpellCheckIcon` | Text | spelling, error, mistake, oversight, typo, correction, code, linter, a | Lucide `spell-check` |
| `spline` | `SplineIcon` | CAD | path, pen, tool, shape, curve, draw, bezier, smooth | Tessera |
| `spline-pointer` | `SplinePointerIcon` | Design | path, tool, curve, node, click, target, vector | Lucide `spline-pointer` |
| `split` | `SplitIcon` | Arrows | break, disband, divide, separate, branch, disunite | Lucide `split` |
| `square` | `SquareIcon` | Media and time | stop, playback, music, audio, video, rectangle, aspect ratio, 1:1, shape | Tessera |
| `square-check` | `SquareCheckIcon` | General | done, todo, tick, complete, task | Lucide `square-check` |
| `square-check-big` | `SquareCheckBigIcon` | General | done, todo, tick, complete, task | Lucide `square-check-big` |
| `square-dashed` | `SquareDashedIcon` | Design | selection, rectangular, marquee, tool, box | Tessera |
| `square-dashed-mouse-pointer` | `SquareDashedMousePointerIcon` | Arrows | inspector, element, click, box, browser, selector, target, dom, node | Lucide `square-dashed-mouse-pointer` |
| `square-dot` | `SquareDotIcon` | Code | git, diff, modified, . | Lucide `square-dot` |
| `square-function` | `SquareFunctionIcon` | Code | programming, code, automation, math | Lucide `square-function` |
| `square-kanban` | `SquareKanbanIcon` | Data and charts | projects, manage, overview, board, tickets, issues, roadmap, plan, intentions, productivity, work, agile, code, coding, toolbar, button | Lucide `square-kanban` |
| `square-minus` | `SquareMinusIcon` | Text | subtract, remove, decrease, reduce, calculator, button, keyboard, line, divider, separator, horizontal rule, hr, html, markup, markdown, ---, toolbar, operator, code, coding, minimum, downgrade | Lucide `square-minus` |
| `square-mouse-pointer` | `SquareMousePointerIcon` | Arrows | inspector, element, click, box, browser, selector, target, dom, node | Lucide `square-mouse-pointer` |
| `square-plus` | `SquarePlusIcon` | Text | add, new, increase, increment, positive, calculate, calculator, button, keyboard, toolbar, maximum, upgrade, extra, operator, join, concatenate, code, coding, + | Lucide `square-plus` |
| `square-split-horizontal` | `SquareSplitHorizontalIcon` | Layout | divide | Lucide `square-split-horizontal` |
| `square-split-vertical` | `SquareSplitVerticalIcon` | Layout | divide | Lucide `square-split-vertical` |
| `square-square` | `SquareSquareIcon` | Layout | float, center, rectangle | Lucide `square-square` |
| `square-stack` | `SquareStackIcon` | Files | versions, clone, copy, duplicate, multiple, revisions, version control, backup, history | Lucide `square-stack` |
| `square-terminal` | `SquareTerminalIcon` | Code | code, command line, prompt, shell | Lucide `square-terminal` |
| `square-x` | `SquareXIcon` | Data and charts | cancel, close, delete, remove, times, clear, math, multiply, multiplication | Lucide `square-x` |
| `squares-exclude` | `SquaresExcludeIcon` | Design | square, pathfinder, path, invert, xor, shape, vector | Lucide `squares-exclude` |
| `squares-intersect` | `SquaresIntersectIcon` | Design | square, pathfinder, path, shape, include, vector | Lucide `squares-intersect` |
| `squares-subtract` | `SquaresSubtractIcon` | Design | square, pathfinder, path, minus, subtraction, shape, front, vector | Lucide `squares-subtract` |
| `squares-unite` | `SquaresUniteIcon` | Design | square, pathfinder, path, union, shape, merge, vector | Lucide `squares-unite` |
| `squircle` | `SquircleIcon` | Shapes | shape | Lucide `squircle` |
| `stamp` | `StampIcon` | Design | mark, print, clone, loyalty, library | Lucide `stamp` |
| `star` | `StarIcon` | Media and time | bookmark, favorite, like, review, rating | Tessera |
| `step-back` | `StepBackIcon` | Media and time | arrow, previous, music, left, reverse | Lucide `step-back` |
| `step-forward` | `StepForwardIcon` | Media and time | arrow, next, music, right, continue | Lucide `step-forward` |
| `sticker` | `StickerIcon` | People and messages | reaction, emotion, smile, happy, feedback | Lucide `sticker` |
| `sticky-note` | `StickyNoteIcon` | Text | post-it, comment, annotation, reaction, memo, reminder, todo, task, idea, brainstorm, document, page, paper, sheet, stationary, office | Lucide `sticky-note` |
| `stretch-horizontal` | `StretchHorizontalIcon` | Layout | items, flex, justify, distribute | Lucide `stretch-horizontal` |
| `strikethrough` | `StrikethroughIcon` | Text | cross out, delete, remove, format | Lucide `strikethrough` |
| `subscript` | `SubscriptIcon` | Text | text | Lucide `subscript` |
| `sun` | `SunIcon` | General | brightness, weather, light, summer | Lucide `sun` |
| `sun-dim` | `SunDimIcon` | General | brightness, low, brightness low | Lucide `sun-dim` |
| `sun-medium` | `SunMediumIcon` | General | brightness | Lucide `sun-medium` |
| `sun-moon` | `SunMoonIcon` | General | dark, light, brightness, theme, auto theme, system theme, appearance | Lucide `sun-moon` |
| `sun-snow` | `SunSnowIcon` | General | weather, air conditioning, temperature, hot, cold, seasons | Lucide `sun-snow` |
| `sunrise` | `SunriseIcon` | Arrows | weather, time, morning, day | Lucide `sunrise` |
| `superscript` | `SuperscriptIcon` | Text | text, exponent | Lucide `superscript` |
| `swatch-book` | `SwatchBookIcon` | Media and time | colors, colours, swatches, pantone, shades, tint, hue, saturation, brightness, theme, scheme, palette, samples, textile, carpet | Lucide `swatch-book` |
| `table` | `TableIcon` | Files | spreadsheet, grid | Lucide `table` |
| `table-2` | `Table2Icon` | Files | spreadsheet, grid | Lucide `table-2` |
| `table-cells-merge` | `TableCellsMergeIcon` | Files | spreadsheet, grid, row | Lucide `table-cells-merge` |
| `table-cells-split` | `TableCellsSplitIcon` | Files | spreadsheet, grid, row | Lucide `table-cells-split` |
| `table-properties` | `TablePropertiesIcon` | Files | property list, plist, spreadsheet, grid, dictionary, object, hash | Lucide `table-properties` |
| `tag` | `TagIcon` | People and messages | label, badge, ticket, mark | Lucide `tag` |
| `tags` | `TagsIcon` | People and messages | labels, badges, tickets, marks, copy, multiple | Lucide `tags` |
| `target` | `TargetIcon` | General | logo, bullseye, deadline, projects, overview, work, productivity | Lucide `target` |
| `terminal` | `TerminalIcon` | Code | code, command line, prompt, shell | Lucide `terminal` |
| `text-align-center` | `TextAlignCenterIcon` | Text | alignment, paragraph | Tessera |
| `text-align-end` | `TextAlignEndIcon` | Text | alignment, right, paragraph | Tessera |
| `text-align-justify` | `TextAlignJustifyIcon` | Text | alignment, justified, menu, list, paragraph | Tessera |
| `text-align-start` | `TextAlignStartIcon` | Text | alignment, left, list, paragraph | Tessera |
| `text-cursor` | `TextCursorIcon` | Text | select, caret, type, typing, write, writing, edit, insert, input, textarea, paragraph, align | Lucide `text-cursor` |
| `text-cursor-input` | `TextCursorInputIcon` | Text | select, paragraph, align | Tessera |
| `text-justify-center` | `TextJustifyCenterIcon` | Text | paragraph, align | Tessera |
| `text-justify-end` | `TextJustifyEndIcon` | Text | paragraph, align | Tessera |
| `text-justify-start` | `TextJustifyStartIcon` | Text | paragraph, align | Tessera |
| `text-wrap` | `TextWrapIcon` | Text | words, lines, break, paragraph, align | Lucide `text-wrap` |
| `thermometer` | `ThermometerIcon` | General | temperature, celsius, fahrenheit, weather | Lucide `thermometer` |
| `thumbs-up` | `ThumbsUpIcon` | People and messages | like, good, emotion | Lucide `thumbs-up` |
| `ticket` | `TicketIcon` | People and messages | entry, pass, voucher, event, concert, show, perforated, dashed | Lucide `ticket` |
| `timer` | `TimerIcon` | Media and time | time, stopwatch | Lucide `timer` |
| `toggle-left` | `ToggleLeftIcon` | Layout | on, off, switch, boolean | Lucide `toggle-left` |
| `tornado` | `TornadoIcon` | General | weather, wind, storm, hurricane | Lucide `tornado` |
| `trash` | `TrashIcon` | Files | empty, deletion, cleanup, junk, clear, garbage, delete, remove, bin, waste, recycle, discard, binoculars, rubbish | Tessera |
| `trending-up` | `TrendingUpIcon` | Data and charts | statistics | Lucide `trending-up` |
| `triangle` | `TriangleIcon` | Shapes | equilateral, delta, shape, pyramid, hierarchy | Lucide `triangle` |
| `triangle-alert` | `TriangleAlertIcon` | Shapes | warning, danger, exclamation mark, linter | Lucide `triangle-alert` |
| `triangles-centerline-dashed-horizontal` | `TrianglesCenterlineDashedHorizontalIcon` | Media and time | reflect, mirror, alignment | Lucide `triangles-centerline-dashed-horizontal` |
| `type` | `TypeIcon` | Text | text, font, typography | Tessera |
| `type-outline` | `TypeOutlineIcon` | Text | text, font, typography, silhouette, profile, contour, stroke, line | Lucide `type-outline` |
| `underline` | `UnderlineIcon` | Text | text, format | Lucide `underline` |
| `undo-2` | `Undo2Icon` | Arrows | redo, rerun, history, back, return, reverse, revert, direction, u-turn | Lucide `undo-2` |
| `unfold-horizontal` | `UnfoldHorizontalIcon` | Arrows | arrow, collapse, fold, vertical, dashed | Lucide `unfold-horizontal` |
| `unfold-vertical` | `UnfoldVerticalIcon` | Arrows | arrow, expand, dashed | Lucide `unfold-vertical` |
| `ungroup` | `UngroupIcon` | Files | cubes, packages, parts, units, collection, cluster, separate, split, break apart | Tessera |
| `unlink` | `UnlinkIcon` | Text | url, unchain | Lucide `unlink` |
| `upload` | `UploadIcon` | Files | file | Lucide `upload` |
| `user` | `UserIcon` | People and messages | person, account, contact | Lucide `user` |
| `user-minus` | `UserMinusIcon` | People and messages | delete, remove, unfollow, unsubscribe | Lucide `user-minus` |
| `user-plus` | `UserPlusIcon` | People and messages | new, add, create, follow, subscribe | Lucide `user-plus` |
| `user-round` | `UserRoundIcon` | People and messages | person, account, contact | Lucide `user-round` |
| `users` | `UsersIcon` | People and messages | group, people | Lucide `users` |
| `variable` | `VariableIcon` | Code | code, coding, programming, symbol, calculate, algebra, x, parentheses, parenthesis, brackets, parameter, (, ) | Lucide `variable` |
| `vector-polygon` | `VectorPolygonIcon` | Shapes | map, geometry, coordinates, shape, location, boundary, area, region, gis, geospatial, vertices, points, outline, drawing, design, math | Lucide `vector-polygon` |
| `vector-square` | `VectorSquareIcon` | Shapes | shape, geometry, art, width, height, size, calculate, measure, select, graphics, box | Lucide `vector-square` |
| `video` | `VideoIcon` | Media and time | camera, movie, film, recording, motion picture, camcorder, reel | Lucide `video` |
| `volume-2` | `Volume2Icon` | Media and time | music, sound, speaker | Lucide `volume-2` |
| `wallet-cards` | `WalletCardsIcon` | People and messages | banking, cash, debit, transport, money, finance, pocket, credit, purchase, payment, shopping, retail, consumer, cc | Lucide `wallet-cards` |
| `wand-sparkles` | `WandSparklesIcon` | Media and time | magic, wizard, magician | Tessera |
| `waves-horizontal` | `WavesHorizontalIcon` | Media and time | water, sea, sound, hertz, wavelength, vibrate, ocean, swimming, frequency | Lucide `waves-horizontal` |
| `waypoints` | `WaypointsIcon` | Arrows | indirection, vpn, virtual private network, proxy, connections, bounce, reroute, path, journey, planner, stops, stations, shared, spread, viral | Lucide `waypoints` |
| `webhook` | `WebhookIcon` | Code | push api, interface, callback | Lucide `webhook` |
| `whole-word` | `WholeWordIcon` | Text | text, selection, letters, characters, font, typography | Lucide `whole-word` |
| `wind` | `WindIcon` | General | weather, air, blow | Lucide `wind` |
| `workflow` | `WorkflowIcon` | Code | action, continuous integration, ci, automation, devops, network, node, connection | Lucide `workflow` |
| `wrench` | `WrenchIcon` | Tools | account, settings, spanner, diy, toolbox, build, construction | Lucide `wrench` |
| `x` | `XIcon` | Data and charts | cancel, close, cross, delete, ex, remove, times, clear, math, multiply, multiplication, dismiss | Tessera |
| `zap` | `ZapIcon` | Media and time | flash, camera, lightning, electricity, energy, power, quick | Lucide `zap` |
| `zap-off` | `ZapOffIcon` | Media and time | flash, camera, lightning, electricity, energy, power | Lucide `zap-off` |
| `zoom-in` | `ZoomInIcon` | Media and time | magnifying glass, plus | Lucide `zoom-in` |
| `zoom-out` | `ZoomOutIcon` | Media and time | magnifying glass, plus | Lucide `zoom-out` |

## Tool icons (98)

Professional tools. They carry accent areas filled with `--kit-icon-accent`; pass `accent={false}` for plain line.

| Icon | React component | Category | Also called | Drawing |
| --- | --- | --- | --- | --- |
| `animation-appear` | `AnimationAppearIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-fade` | `AnimationFadeIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-fade-out` | `AnimationFadeOutIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-float-in` | `AnimationFloatInIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-fly-in` | `AnimationFlyInIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-fly-out` | `AnimationFlyOutIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-grow-shrink` | `AnimationGrowShrinkIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-path` | `AnimationPathIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-pulse` | `AnimationPulseIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-spin` | `AnimationSpinIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-split` | `AnimationSplitIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-wipe` | `AnimationWipeIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `animation-zoom` | `AnimationZoomIcon` | Animation and transitions | effect, motion, entrance | Tessera |
| `arc` | `ArcIcon` | CAD | curve, segment, circle | Tessera |
| `array-path` | `ArrayPathIcon` | CAD | pattern, repeat, duplicate | Tessera |
| `array-polar` | `ArrayPolarIcon` | CAD | pattern, repeat, duplicate | Tessera |
| `array-rectangular` | `ArrayRectangularIcon` | CAD | pattern, repeat, duplicate | Tessera |
| `break-line` | `BreakLineIcon` | CAD | split, gap | Tessera |
| `center-line` | `CenterLineIcon` | CAD | axis, centre | Tessera |
| `center-mark` | `CenterMarkIcon` | CAD | centre, cross | Tessera |
| `chamfer` | `ChamferIcon` | CAD | bevel, corner, cut | Tessera |
| `circle-center-radius` | `CircleCenterRadiusIcon` | CAD | centre | Tessera |
| `clip-extract` | `ClipExtractIcon` | Media and time | timeline, edit, video | Tessera |
| `clip-insert` | `ClipInsertIcon` | Media and time | timeline, edit, video | Tessera |
| `clip-lift` | `ClipLiftIcon` | Media and time | timeline, edit, video | Tessera |
| `clip-overwrite` | `ClipOverwriteIcon` | Media and time | timeline, edit, video | Tessera |
| `constraint-coincident` | `ConstraintCoincidentIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-collinear` | `ConstraintCollinearIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-concentric` | `ConstraintConcentricIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-equal` | `ConstraintEqualIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-fix` | `ConstraintFixIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-horizontal` | `ConstraintHorizontalIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-parallel` | `ConstraintParallelIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-perpendicular` | `ConstraintPerpendicularIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-symmetric` | `ConstraintSymmetricIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-tangent` | `ConstraintTangentIcon` | CAD | geometric, sketch, relation | Tessera |
| `constraint-vertical` | `ConstraintVerticalIcon` | CAD | geometric, sketch, relation | Tessera |
| `construction-line` | `ConstructionLineIcon` | CAD | xline, guide, infinite line | Tessera |
| `dash-dashed` | `DashDashedIcon` | Design | line style, stroke, border | Tessera |
| `dash-dotted` | `DashDottedIcon` | Design | line style, stroke, border | Tessera |
| `dash-solid` | `DashSolidIcon` | Design | line style, stroke, border | Tessera |
| `dimension-aligned` | `DimensionAlignedIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-angular` | `DimensionAngularIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-arc-length` | `DimensionArcLengthIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-baseline` | `DimensionBaselineIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-continue` | `DimensionContinueIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-diameter` | `DimensionDiameterIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-linear` | `DimensionLinearIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-ordinate` | `DimensionOrdinateIcon` | CAD | measure, annotate, size | Tessera |
| `dimension-radius` | `DimensionRadiusIcon` | CAD | measure, annotate, size | Tessera |
| `donut` | `DonutIcon` | CAD | ring, annulus | Tessera |
| `ellipse` | `EllipseIcon` | CAD | oval, circle | Tessera |
| `explode` | `ExplodeIcon` | CAD | break apart, ungroup, separate | Tessera |
| `extend` | `ExtendIcon` | CAD | lengthen, reach, boundary | Tessera |
| `fillet` | `FilletIcon` | CAD | round corner, radius, blend | Tessera |
| `go-to-in` | `GoToInIcon` | Media and time | go to, jump, in point, out point, timeline | Tessera |
| `go-to-out` | `GoToOutIcon` | Media and time | go to, jump, in point, out point, timeline | Tessera |
| `hatch` | `HatchIcon` | CAD | fill pattern, shading, section | Tessera |
| `helix` | `HelixIcon` | CAD | spiral, coil | Tessera |
| `keyframe` | `KeyframeIcon` | Media and time | animation, timeline, key | Tessera |
| `keyframe-next` | `KeyframeNextIcon` | Media and time | animation, timeline, key | Tessera |
| `keyframe-on` | `KeyframeOnIcon` | Media and time | animation, timeline, key | Tessera |
| `keyframe-previous` | `KeyframePreviousIcon` | Media and time | animation, timeline, key | Tessera |
| `leader` | `LeaderIcon` | CAD | callout, annotation, note | Tessera |
| `lengthen` | `LengthenIcon` | CAD | extend, length | Tessera |
| `line-segment` | `LineSegmentIcon` | CAD | draw | Tessera |
| `linetype` | `LinetypeIcon` | General | line style, dash, pattern | Tessera |
| `lineweight` | `LineweightIcon` | General | stroke width, thickness | Tessera |
| `mark-in` | `MarkInIcon` | Media and time | in point, out point, timeline, range | Tessera |
| `mark-out` | `MarkOutIcon` | Media and time | in point, out point, timeline, range | Tessera |
| `multiline` | `MultilineIcon` | CAD | parallel lines, wall | Tessera |
| `offset` | `OffsetIcon` | CAD | parallel, copy, distance | Tessera |
| `ortho-mode` | `OrthoModeIcon` | CAD | orthogonal, right angle, snap | Tessera |
| `parallelogram` | `ParallelogramIcon` | CAD | shape, skew | Tessera |
| `polar-tracking` | `PolarTrackingIcon` | CAD | angle, snap | Tessera |
| `polyline` | `PolylineIcon` | CAD | line, path, segments | Tessera |
| `ray` | `RayIcon` | CAD | half line, construction | Tessera |
| `region` | `RegionIcon` | CAD | area, face, boundary | Tessera |
| `revision-cloud` | `RevisionCloudIcon` | CAD | markup, review | Tessera |
| `stretch` | `StretchIcon` | CAD | resize, deform, pull | Tessera |
| `transition-cover` | `TransitionCoverIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-curtains` | `TransitionCurtainsIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-cut` | `TransitionCutIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-drape` | `TransitionDrapeIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-fade` | `TransitionFadeIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-fall-over` | `TransitionFallOverIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-flash` | `TransitionFlashIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-morph` | `TransitionMorphIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-none` | `TransitionNoneIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-prestige` | `TransitionPrestigeIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-push` | `TransitionPushIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-random-bars` | `TransitionRandomBarsIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-reveal` | `TransitionRevealIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-shape` | `TransitionShapeIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-split` | `TransitionSplitIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-uncover` | `TransitionUncoverIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-wind` | `TransitionWindIcon` | Animation and transitions | slide, effect | Tessera |
| `transition-wipe` | `TransitionWipeIcon` | Animation and transitions | slide, effect | Tessera |

## Kit app icons (16)

Full-colour tiles, one per Kition kit, each with a small cut for 16 px (`<kit>-small.svg`). They are Kition trademarks.

`board`, `cad`, `cube`, `design`, `doc`, `effect`, `fig`, `film`, `html`, `note`, `pdf`, `photo`, `sheet`, `slide`, `table`, `vector`

```ts
import photo from '@kition/tessera-icons/kit/photo.svg'
```
