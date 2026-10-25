/**
 * @kition/tessera: Kition Tessera's components for professional editors. Base controls (buttons,
 * menus, dialogs, number fields), professional controls (ribbon, dock and floating panels, color
 * picker and wheel, curves, histogram, level meter, timecode, transport, keyframes), and the
 * workspace layout. Styled only through theme tokens (`@kition/tessera-tokens`); import
 * `@kition/tessera/styles.css` once.
 *
 * Components ask the editor around them for strings and element states through `StringsProvider`
 * and `ElementsProvider` (see `context.tsx`); without them they draw in English with every element
 * shown.
 */
export {
  createStrings,
  Element,
  ElementsContext,
  ElementsProvider,
  StringsContext,
  StringsProvider,
  TESSERA_CATALOGS,
  useElements,
  useStrings,
  type Catalog,
  type Elements,
  type ElementState,
  type ExtrasKind,
  type Strings,
} from './context'
export type { IconComponent } from './icon'
export * from './ui'
export {
  Card,
  CardContent,
  CardHeader,
  Disclosure,
  Field,
  PasswordInput,
  Select,
  TextInput,
  Textarea,
  type DisclosureProps,
  type FieldProps,
  type PasswordInputProps,
  type SelectProps,
  type TextInputProps,
  type TextareaProps,
} from './forms'
export { NumberField, type NumberFieldProps } from './NumberField'
export { BarSeparator, Checkbox, Choice, Hint, Segmented, type CheckboxProps, type ChoiceProps, type Segment, type SegmentedProps } from './BarControls'
export { DropPanel } from './DropPanel'
export { PreviewDialog, type PreviewDialogPreview, type PreviewDialogProps, type PreviewStatus } from './PreviewDialog'
/** The workspace frame tree's functions (`workspaceTree.closePanel`, `workspaceTree.validateTree`, …). */
export * as workspaceTree from './workspaceTree'
export type { WorkspaceNode, WorkspaceSize, WorkspaceSplit, WorkspaceTabs } from './workspaceTree'
export { WorkspaceLayout, type WorkspaceLayoutProps, type WorkspacePanel } from './WorkspaceLayout'
export { DockArea, dockHeights, type DockAreaHandle, type DockAreaProps, type DockGroup, type DockSizing, type DockTab } from './DockArea'
export { FloatingPanels, automaticFloatingPosition, clampFloatingRect, resizeFloatingRect, type FloatingEdge, type FloatingPanel, type FloatingPanelsProps, type FloatingRect, type FloatingSize } from './FloatingPanels'
export { EyeButton, PanelFooter, RenameField, Thumbnail, deviceScale, type EyeSweep, type ThumbnailImage } from './PanelParts'
export { useWorkspaces, workspaceSlug, WORKSPACE_ACTIONS, type SavedWorkspace, type WorkspacePrefs, type Workspaces, type WorkspacesOptions } from './useWorkspaces'
export { kitStoreKey, readKitStore, removeKitStore, storedBytes, useKitStore, writeKitStore, type KitStoreOptions, type KitStoreWrite } from './kitStore'
export { Histogram, rankScale, smoothHistogram, type HistogramProps } from './Histogram'
export { TimecodeField, formatTimecode, parseTimecode, type TimecodeFieldProps } from './TimecodeField'
export { TransportBar, type TransportButton } from './TransportBar'
export { LevelMeter, meterFraction, meterLayout, type LevelMeterHandle, type LevelMeterProps, type MeterBox, type MeterLayout } from './LevelMeter'
export { KeyframeLane, type Keyframe, type KeyframeLaneProps } from './KeyframeLane'
export { ColorPicker, hsvToRgb, parseHex, rgbToHex, rgbToHsv, type ColorPickerProps, type RGB } from './ColorPicker'
export { CurveEditor, RGB_IDENTITY, addCurvePoint, hitCurvePoint, moveCurvePoint, removeCurvePoint, sampleCurve, sortCurve, type CurveEditorProps, type CurveKind, type CurvePoint } from './CurveEditor'
export { ColorWheel, lightnessAt, wheelRadius, wheelValueAt, type ColorWheelProps } from './ColorWheel'
export { GradientSlider, SLIDER_GRADIENTS, sliderFraction, sliderValueAt, type GradientSliderProps } from './GradientSlider'
export { clamp, composing, useDragGesture, type DragPhase } from './colorGesture'
export { brandTokens, contrast, luminance, textOn, validBrand, type KitBrand } from './brand'
