# LevelMeter

Audio levels with peak hold, drawn on a canvas.

Category: Media and time · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/level-meter/)

```ts
import { LevelMeter } from '@kition/tessera-ui'
```

## Example: Stereo

```tsx
import { useEffect, useState } from 'react'
import { LevelMeter } from '@kition/tessera-ui'

export default function Demo() {
  const [peaks, setPeaks] = useState([-12, -9])
  useEffect(() => {
    const timer = setInterval(() => setPeaks([-6 - Math.random() * 30, -4 - Math.random() * 30]), 100)
    return () => clearInterval(timer)
  }, [])
  return (
    <div style={{ height: 180 }}>
      <LevelMeter peaks={peaks} labels={['L', 'R']} />
    </div>
  )
}
```

## LevelMeter props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `peaks` (required) | `readonly number[]` |  | Current peak per channel, linear 0..1+ (above 1 clips). |
| `floor` | `number` | `-60` | dB at the bottom of the scale (upstream meters: -60). |
| `holds` | `readonly number[]` |  | Peak hold per channel, linear. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |  |
| `labels` | `readonly string[]` |  | Channel captions under the bars ("S" "S" in upstream's solo buttons row, or "L" "R"). |
| `ref` | `Ref<LevelMeterHandle>` |  | Draws live levels without a React render. |
| `testId` | `string` |  |  |

## See also

- [Timecode and transport](timecode-transport.md): A timecode field you can type or scrub, and the transport buttons of a player.
- [KeyframeLane](keyframe-lane.md): Keyframes on a time lane: select, drag, and their interpolation shapes.
