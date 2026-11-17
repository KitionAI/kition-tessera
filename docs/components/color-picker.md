# ColorPicker

Saturation and brightness square, hue strip, hex and RGB fields.

Category: Color · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/color-picker/)

```ts
import { ColorPicker } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Arrows (on the square) | Change saturation (Left, Right) and brightness (Up, Down); with Shift, in larger steps. |
| Up, Down (on the hue strip) | Raise or lower the hue; with Shift, in larger steps. |
| Enter, Escape (in the hex field) | Commit the typed colour, or put the old one back. |

## Example: Pick a colour

```tsx
import { useState } from 'react'
import { ColorPicker, rgbToHex, type RGB } from '@kition/tessera-ui'

export default function Demo() {
  const [rgb, setRgb] = useState<RGB>([86, 69, 212])
  return (
    <div className="demo-row" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 240 }}>
        <ColorPicker value={rgb} onChange={(value) => setRgb(value)} />
      </div>
      <div className="demo-swatch" style={{ background: rgbToHex(rgb) }}>{rgbToHex(rgb)}</div>
    </div>
  )
}
```

## ColorPicker props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `RGB` |  |  |
| `onChange` (required) | `(rgb: RGB, final: boolean) => void` |  | Called on every pointer move and arrow key (`final: false` mid-drag, one `final: true` on release or key). |
| `disabled` | `boolean` |  |  |
| `testId` | `string` | `'color-picker'` |  |
| `uiId` | `string` |  | A Kit UI id when the picker is a declared element. |

## See also

- [ColorWheel](color-wheel.md): A grading wheel with a lightness slider, as colour correction panels use.
- [GradientSlider](gradient-slider.md): A slider drawn over its own gradient: temperature, tint, hue.
- [CurveEditor](curve-editor.md): Tone curves: drag points, double-click to add, with a histogram under them.
- [Histogram](histogram.md): A smoothed histogram of an image’s tones.
