# Histogram

A smoothed histogram of an image’s tones.

Category: Color · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/histogram/)

```ts
import { Histogram } from '@kition/tessera-ui'
```

## Example: Luminance

```tsx
import { Histogram } from '@kition/tessera-ui'

const bins = Array.from({ length: 256 }, (_, i) => Math.exp(-((i - 110) ** 2) / 1800) * 900 + Math.exp(-((i - 200) ** 2) / 600) * 500 + 40)

export default function Demo() {
  return (
    <div style={{ width: 300 }}>
      <Histogram bins={bins} />
    </div>
  )
}
```

## Histogram props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `bins` (required) | `ArrayLike<number>` |  | Bin counts (256 for an 8-bit channel), left (shadows) to right (highlights). |
| `color` | `string` |  | A CSS color for the bars; the element's own (inherited) color by default. |
| `height` | `number` | `100` |  |
| `smooth` | `boolean` | `false` | Draws the bins through upstream's five-bin display kernel (`smoothHistogram`), as its Camera Raw histogram does. |
| `scale` | `'interior' \| 'rank'` | `'interior'` | What the bars are scaled to: `interior`, the interior bins' maximum (the default, see `scaleFor`), or `rank`, upstream's Histogram panel and tone editors (`tone.rs` `draw_histogram`): the 251st-smallest of 256 bins, so a handful of spikes (pure white, pure black) are clipped instead of flattening the rest. Either with 10% headroom. |
| `testId` | `string` | `'histogram'` |  |

## See also

- [ColorPicker](color-picker.md): Saturation and brightness square, hue strip, hex and RGB fields.
- [ColorWheel](color-wheel.md): A grading wheel with a lightness slider, as colour correction panels use.
- [GradientSlider](gradient-slider.md): A slider drawn over its own gradient: temperature, tint, hue.
- [CurveEditor](curve-editor.md): Tone curves: drag points, double-click to add, with a histogram under them.
