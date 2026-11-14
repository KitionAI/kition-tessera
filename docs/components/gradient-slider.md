# GradientSlider

A slider drawn over its own gradient: temperature, tint, hue.

Category: Color · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/gradient-slider/)

```ts
import { GradientSlider } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Arrows | Change the value by a hundredth of the soft range (Right and Up raise it); with Shift, by ten of those. |
| Home, End | Go to the low or the high end of the soft range. |

## Example: White balance

```tsx
import { useState } from 'react'
import { GradientSlider, SLIDER_GRADIENTS } from '@kition/tessera-ui'

export default function Demo() {
  const [temperature, setTemperature] = useState(10)
  const [tint, setTint] = useState(-5)
  return (
    <div className="demo-stack" style={{ width: 300 }}>
      <GradientSlider label="Temperature" value={temperature} min={-100} max={100} stops={SLIDER_GRADIENTS.temperature} onChange={(value) => setTemperature(value)} />
      <GradientSlider label="Tint" value={tint} min={-100} max={100} stops={SLIDER_GRADIENTS.tint} onChange={(value) => setTint(value)} />
    </div>
  )
}
```

## GradientSlider props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `number` |  |  |
| `min` (required) | `number` |  |  |
| `max` (required) | `number` |  |  |
| `softMin` | `number` | `min` | The track's range (upstream's `soft_min`/`soft_max`); `min` and `max` by default. The hot text reaches `min`..`max`. |
| `softMax` | `number` | `max` |  |
| `decimals` | `number` | `0` | Decimals a value is rounded to (0 by default). |
| `default` | `number` |  | Restored by a double-click on the track; no double-click without it. |
| `stops` | `readonly string[]` |  | CSS gradient stops for the track (Temperature, Tint, Hue; see `SLIDER_GRADIENTS`); a plain track when absent. |
| `label` (required) | `string` |  |  |
| `onChange` (required) | `(value: number, phase: DragPhase) => void` |  |  |
| `disabled` | `boolean` |  |  |
| `uiId` | `string` |  |  |
| `testId` | `string` |  |  |

## See also

- [ColorPicker](color-picker.md): Saturation and brightness square, hue strip, hex and RGB fields.
- [ColorWheel](color-wheel.md): A grading wheel with a lightness slider, as colour correction panels use.
- [CurveEditor](curve-editor.md): Tone curves: drag points, double-click to add, with a histogram under them.
- [Histogram](histogram.md): A smoothed histogram of an image’s tones.
