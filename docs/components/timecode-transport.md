# Timecode and transport

A timecode field you can type or scrub, and the transport buttons of a player.

Category: Media and time · Package: `@kition/tessera-ui` · [Live examples](https://tessera.kition.ai/docs/timecode-transport/)

```ts
import { TimecodeField, TransportBar } from '@kition/tessera-ui'
```

## Keyboard

| Keys | What they do |
| --- | --- |
| Enter, F2 | Start typing a time into the timecode field. |
| Enter (while typing) | Commit the typed time. |
| Escape (while typing) | Stop typing and keep the time. |

## Example: A player

```tsx
import { useEffect, useState } from 'react'
import { TimecodeField, TransportBar } from '@kition/tessera-ui'
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  const [time, setTime] = useState(83.4)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => setTime((value) => value + 0.04), 40)
    return () => clearInterval(timer)
  }, [playing])
  return (
    <div className="demo-stack" style={{ width: 300 }}>
      <TimecodeField label="Playhead" value={time} fps={25} onChange={(seconds) => setTime(seconds)} accent />
      <TransportBar
        buttons={[
          { id: 'start', label: 'Go to start', icon: SkipBackIcon, onPress: () => setTime(0) },
          { id: 'play', label: playing ? 'Pause' : 'Play', icon: playing ? PauseIcon : PlayIcon, large: true, onPress: () => setPlaying(!playing) },
          { id: 'end', label: 'Go to end', icon: SkipForwardIcon, onPress: () => setTime(600) },
        ]}
      />
    </div>
  )
}
```

## TimecodeField props

A timecode readout: `value` (seconds) shown as timecode at `fps`. With `onChange` it scrubs
(one frame per 2 px, reported with `final: false`, then once with `final: true` on release) and
a click turns it into a text field (`parseTimecode`'s forms; Enter or blur commit with
`final: true`, Escape or text that is not a time reverts). Without `onChange` it only shows.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` (required) | `number` |  | Seconds. |
| `fps` (required) | `number` |  |  |
| `dropFrame` | `boolean` |  |  |
| `onChange` | `(seconds: number, final: boolean) => void` |  | Called while scrubbing (`final: false`) and once on release, Enter, or blur. |
| `accent` | `boolean` |  | Upstream's accent-coloured playhead timecode. |
| `label` (required) | `string` |  |  |
| `uiId` | `string` |  |  |
| `testId` | `string` |  |  |

## TransportBar props

The buttons in `buttons`' order, centred. A button's `testId` is `<testId>-<id>`; one whose
Kit UI id the configuration hides is left out, and one it disables is disabled.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `buttons` (required) | `readonly TransportButton[]` |  |  |
| `testId` | `string` |  |  |

## See also

- [LevelMeter](level-meter.md): Audio levels with peak hold, drawn on a canvas.
- [KeyframeLane](keyframe-lane.md): Keyframes on a time lane: select, drag, and their interpolation shapes.
