# CurveEditor

Tone curves: drag points, double-click to add, with a histogram under them.

Category: Color · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/curve-editor/)

```ts
import { CurveEditor } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Arrows (on a point) | Move the point by 0.01 of the range; with Shift, by 0.1. |
| Delete, Backspace | Remove the point. |

## Example: An RGB curve

```tsx
import { useState } from 'react'
import { CurveEditor, RGB_IDENTITY, type CurvePoint } from '@kition/tessera-ui'

export default function Demo() {
  const [points, setPoints] = useState<CurvePoint[]>([RGB_IDENTITY[0], [0.3, 0.22], [0.7, 0.8], RGB_IDENTITY[1]])
  return (
    <div style={{ width: 240 }}>
      <CurveEditor kind="rgb" points={points} onChange={(next) => setPoints(next)} />
    </div>
  )
}
```

## CurveEditor props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `points` (required) | `readonly CurvePoint[]` |  |  |
| `kind` (required) | `CurveKind`: `'rgb'`, `'hue'` |  | 'rgb': a square with protected end points; 'hue': periodic in x, a hue strip below, 0.45 aspect. |
| `samples` | `readonly number[]` |  | The curve's samples to draw (0..1 over x), given by the caller; `sampleCurve`'s by default. |
| `color` | `string` |  | The line and points' CSS colour; the theme's text colour by default. |
| `onChange` (required) | `(points: CurvePoint[], phase: DragPhase) => void` |  |  |
| `label` | `string` |  | The plot's accessible name ("Curve" by default). |
| `disabled` | `boolean` |  |  |
| `uiId` | `string` |  |  |
| `testId` | `string` |  |  |

## See also

- [ColorPicker](color-picker.md): Saturation and brightness square, hue strip, hex and RGB fields.
- [ColorWheel](color-wheel.md): A grading wheel with a lightness slider, as colour correction panels use.
- [GradientSlider](gradient-slider.md): A slider drawn over its own gradient: temperature, tint, hue.
- [Histogram](histogram.md): A smoothed histogram of an image’s tones.
