# ColorWheel

A grading wheel with a lightness slider, as colour correction panels use.

Category: Color · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/color-wheel/)

```ts
import { ColorWheel } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Arrows | Move the puck by 0.01 of the radius; with Shift, by 0.1. |
| Home | Put the puck back at the centre. |

## Example: Shadows wheel

```tsx
import { useState } from 'react'
import { ColorWheel } from '@kition/tessera-ui'

export default function Demo() {
  const [shadows, setShadows] = useState<[number, number]>([0.2, -0.1])
  const [lightness, setLightness] = useState(0)
  return <ColorWheel label="Shadows" value={shadows} lightness={lightness} onChange={(value) => setShadows(value)} onLightness={(value) => setLightness(value)} />
}
```

## ColorWheel props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `readonly [number, number]` |  | The offset, `[x, y]`, y up, of length at most 1. |
| `lightness` (required) | `number` |  | -100 to 100. |
| `onChange` (required) | `(value: [number, number], phase: DragPhase) => void` |  |  |
| `onLightness` (required) | `(value: number, phase: DragPhase) => void` |  |  |
| `label` (required) | `string` |  | Shown above the wheel, and its accessible name. |
| `size` | `number` | `120` | The wheel's side in CSS pixels (120 by default, upstream's largest). The control is `size + 18` px wide: the lightness strip (16 px and a 2 px gap) sits outside the wheel, where upstream draws it inside the wheel's square. To fit upstream's row of three wheels (Film's Lumetri Color Wheels, Task 29), pass `size = min((available - 24) / 3, 120) - 18`. |
| `disabled` | `boolean` |  |  |
| `uiId` | `string` |  | The wheel's Kit UI id. |
| `lightnessUiId` | `string` |  | The lightness slider's Kit UI id. |
| `testId` | `string` |  |  |

## See also

- [ColorPicker](color-picker.md): Saturation and brightness square, hue strip, hex and RGB fields.
- [GradientSlider](gradient-slider.md): A slider drawn over its own gradient: temperature, tint, hue.
- [CurveEditor](curve-editor.md): Tone curves: drag points, double-click to add, with a histogram under them.
- [Histogram](histogram.md): A smoothed histogram of an image’s tones.
