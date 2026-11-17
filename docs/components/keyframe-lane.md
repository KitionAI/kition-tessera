# KeyframeLane

Keyframes on a time lane: select, drag, and their interpolation shapes.

Category: Media and time · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/keyframe-lane/)

```ts
import { KeyframeLane } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Left, Right | Move the selected keyframes by one frame. |
| Escape | While dragging: put the keyframes back where they were. |

## Example: Three keyframes

```tsx
import { useState } from 'react'
import { KeyframeLane, type Keyframe } from '@kition/tessera-ui'

export default function Demo() {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { id: 'a', time: 1 },
    { id: 'b', time: 3.5, interpolation: 'bezier' },
    { id: 'c', time: 6, interpolation: 'hold' },
  ])
  return (
    <div style={{ width: 360 }}>
      <KeyframeLane
        keyframes={keyframes}
        start={0}
        end={8}
        onSelect={(ids) => setKeyframes((list) => list.map((key) => ({ ...key, selected: ids.includes(key.id) })))}
        onMove={(ids, delta) => setKeyframes((list) => list.map((key) => (ids.includes(key.id) ? { ...key, time: Math.max(0, key.time + delta) } : key)))}
      />
    </div>
  )
}
```

## KeyframeLane props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `keyframes` (required) | `readonly Keyframe[]` |  |  |
| `start` (required) | `number` |  | Visible range in seconds and the lane's width map times to x. |
| `end` (required) | `number` |  |  |
| `onSelect` (required) | `(ids: string[], add: boolean) => void` |  |  |
| `onMove` (required) | `(ids: string[], delta: number) => void` |  | Called once on release with the dragged ids and the time delta. |
| `snap` | `(time: number) => number` |  |  |
| `fps` | `number` | `30` | Frames per second: an arrow key moves the selected keyframes one frame (30 by default). |
| `onMenu` | `(id: string, at: ContextMenuPoint) => void` |  | A keyframe's menu was asked for at a screen point (upstream's interpolation menu). |
| `uiId` | `string` |  | The Kit UI id every keyframe carries (`control:effects.keyframe`). |
| `testId` | `string` |  |  |

## See also

- [Timecode and transport](timecode-transport.md): A timecode field you can type or scrub, and the transport buttons of a player.
- [LevelMeter](level-meter.md): Audio levels with peak hold, drawn on a canvas.
