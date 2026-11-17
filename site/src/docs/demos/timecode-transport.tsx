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
