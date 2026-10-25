import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Button,
  Checkbox,
  ColorGrid,
  ColorPicker,
  ColorWheel,
  CurveEditor,
  Dialog,
  GradientSlider,
  Histogram,
  IconButton,
  KeyframeLane,
  LevelMeter,
  MenuButton,
  MenuItem,
  MenuSeparator,
  NumberField,
  RGB_IDENTITY,
  RibbonButton,
  RibbonGroup,
  RibbonStack,
  SLIDER_GRADIENTS,
  Segmented,
  StatusBar,
  StatusSpacer,
  TimecodeField,
  TransportBar,
  ZoomControl,
  toast,
  Toaster,
  type CurvePoint,
  type Keyframe,
  type LevelMeterHandle,
  type RGB,
} from '@kition/tessera'
import {
  TextAlignCenterIcon,
  TextAlignStartIcon,
  TextAlignEndIcon,
  BoldIcon,
  ClipboardPasteIcon,
  CopyIcon,
  ItalicIcon,
  LayersIcon,
  PlayIcon,
  ScissorsIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareIcon,
  UnderlineIcon,
} from '@kition/tessera-icons/react'

export function ComponentsPage() {
  return (
    <div className="page">
      <section className="page-intro">
        <h1>Components</h1>
        <p>
          The real <code>@kition/tessera</code> components, interactive. They draw only through the theme tokens, so the skin switch at the top right restyles every one.
          Kits get them through <code>@kition/kit-ui</code> under the same names.
        </p>
      </section>
      <Toaster />
      <BaseControls />
      <Ribbon />
      <ColorControls />
      <MediaControls />
    </div>
  )
}

function Demo({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="demo">
      <header>
        <h3>{title}</h3>
        {note ? <p>{note}</p> : null}
      </header>
      <div className="demo-body">{children}</div>
    </section>
  )
}

function BaseControls() {
  const [bold, setBold] = useState(true)
  const [snap, setSnap] = useState(true)
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left')
  const [opacity, setOpacity] = useState(80)
  const [zoom, setZoom] = useState(1)
  const [dialog, setDialog] = useState(false)
  return (
    <>
      <h2>Base controls</h2>
      <div className="demo-grid">
        <Demo title="Button, IconButton">
          <div className="row">
            <Button variant="primary" onClick={() => toast('success', 'Saved', 'The primary action uses --kit-primary.')}>
              Save
            </Button>
            <Button onClick={() => setDialog(true)}>Open dialog</Button>
            <Button variant="ghost">Ghost</Button>
            <IconButton icon={BoldIcon} label="Bold" pressed={bold} onClick={() => setBold(!bold)} />
            <IconButton icon={ItalicIcon} label="Italic" />
            <IconButton icon={UnderlineIcon} label="Underline" disabled />
          </div>
        </Demo>
        <Demo title="Segmented, Checkbox">
          <div className="row">
            <Segmented
              label="Alignment"
              value={align}
              onChange={setAlign}
              segments={[
                { value: 'left', icon: TextAlignStartIcon, label: 'Left' },
                { value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
                { value: 'right', icon: TextAlignEndIcon, label: 'Right' },
              ]}
            />
            <Checkbox label="Snap to grid" checked={snap} onChange={setSnap} />
          </div>
        </Demo>
        <Demo title="NumberField" note="Drag the label, type, or use the arrow keys.">
          <NumberField label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={(value) => setOpacity(value)} />
        </Demo>
        <Demo title="MenuButton">
          <MenuButton trigger={({ toggle }) => <Button onClick={toggle}>Edit ▾</Button>}>
            <MenuItem icon={ScissorsIcon} label="Cut" shortcut="⌘X" onSelect={() => toast('info', 'Cut')} />
            <MenuItem icon={CopyIcon} label="Copy" shortcut="⌘C" onSelect={() => toast('info', 'Copy')} />
            <MenuItem icon={ClipboardPasteIcon} label="Paste" shortcut="⌘V" onSelect={() => toast('info', 'Paste')} />
            <MenuSeparator />
            <MenuItem label="Snap to grid" checked={snap} onSelect={() => setSnap(!snap)} />
          </MenuButton>
        </Demo>
        <Demo title="StatusBar, ZoomControl">
          <div className="status-demo">
            <StatusBar>
              <span>Page 1 of 3</span>
              <StatusSpacer />
              <ZoomControl zoom={zoom} onZoom={setZoom} onFit={() => setZoom(1)} labels={{ out: 'Zoom out', in: 'Zoom in', fit: 'Fit' }} />
            </StatusBar>
          </div>
        </Demo>
      </div>
      {dialog ? (
        <Dialog
          title="Image size"
          onClose={() => setDialog(false)}
          actions={
            <>
              <Button onClick={() => setDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setDialog(false)}>
                OK
              </Button>
            </>
          }
        >
          <NumberField label="Width" value={1920} min={1} max={10000} unit="px" onChange={() => undefined} />
        </Dialog>
      ) : null}
    </>
  )
}

function Ribbon() {
  const [bold, setBold] = useState(false)
  const [color, setColor] = useState('#5645d4')
  return (
    <>
      <h2>Ribbon</h2>
      <Demo title="RibbonGroup, RibbonButton, ColorGrid" note="The Office-style ribbon kits build their Home tabs from.">
        <div className="ribbon-demo">
          <RibbonGroup label="Clipboard">
            <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
            <RibbonStack>
              <RibbonButton icon={ScissorsIcon} label="Cut" />
              <RibbonButton icon={CopyIcon} label="Copy" />
            </RibbonStack>
          </RibbonGroup>
          <RibbonGroup label="Font">
            <RibbonStack>
              <RibbonButton icon={BoldIcon} label="Bold" size="icon" pressed={bold} onClick={() => setBold(!bold)} />
              <RibbonButton icon={ItalicIcon} label="Italic" size="icon" />
              <RibbonButton icon={UnderlineIcon} label="Underline" size="icon" />
            </RibbonStack>
          </RibbonGroup>
          <RibbonGroup label="Fill">
            <MenuButton trigger={({ toggle }) => <RibbonButton icon={SquareIcon} label="Fill" swatch={color} onClick={toggle} />}>
              <ColorGrid onPick={setColor} />
            </MenuButton>
          </RibbonGroup>
          <RibbonGroup label="Arrange">
            <RibbonButton icon={LayersIcon} label="Layers" size="large" />
          </RibbonGroup>
        </div>
      </Demo>
    </>
  )
}

function ColorControls() {
  const [rgb, setRgb] = useState<RGB>([86, 69, 212])
  const [wheel, setWheel] = useState<[number, number]>([0.2, -0.1])
  const [lightness, setLightness] = useState(0)
  const [temperature, setTemperature] = useState(10)
  const [curve, setCurve] = useState<CurvePoint[]>([...RGB_IDENTITY.slice(0, 1), [0.3, 0.22], [0.7, 0.8], ...RGB_IDENTITY.slice(1)])
  const bins = useRef(Array.from({ length: 256 }, (_, i) => Math.exp(-((i - 110) ** 2) / 1800) * 900 + Math.exp(-((i - 200) ** 2) / 600) * 500 + 40)).current
  return (
    <>
      <h2>Color controls</h2>
      <div className="demo-grid">
        <Demo title="ColorPicker">
          <ColorPicker value={rgb} onChange={(value) => setRgb(value)} />
        </Demo>
        <Demo title="ColorWheel" note="Lumetri-style color wheel with a lightness slider.">
          <ColorWheel label="Shadows" value={wheel} lightness={lightness} onChange={(value) => setWheel(value)} onLightness={(value) => setLightness(value)} />
        </Demo>
        <Demo title="CurveEditor" note="Drag points; double-click to add.">
          <div style={{ width: 240 }}>
            <CurveEditor kind="rgb" points={curve} samples={bins} onChange={(points) => setCurve(points)} />
          </div>
        </Demo>
        <Demo title="Histogram, GradientSlider">
          <div style={{ width: 260, display: 'grid', gap: 12 }}>
            <Histogram bins={bins} />
            <GradientSlider label="Temperature" value={temperature} min={-100} max={100} stops={SLIDER_GRADIENTS.temperature} onChange={(value) => setTemperature(value)} />
          </div>
        </Demo>
      </div>
    </>
  )
}

function MediaControls() {
  const [time, setTime] = useState(83.4)
  const [playing, setPlaying] = useState(false)
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { id: 'a', time: 1 },
    { id: 'b', time: 3.5, interpolation: 'bezier' },
    { id: 'c', time: 6, interpolation: 'hold' },
  ])
  const meter = useRef<LevelMeterHandle>(null)
  const [peaks, setPeaks] = useState([-12, -9])
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setPeaks([-6 - Math.random() * 30, -4 - Math.random() * 30])
      setTime((value) => value + 0.1)
    }, 100)
    return () => clearInterval(timer)
  }, [playing])
  return (
    <>
      <h2>Media controls</h2>
      <div className="demo-grid">
        <Demo title="TransportBar, TimecodeField" note="Press play: the meter and timecode move.">
          <div style={{ display: 'grid', gap: 12 }}>
            <TimecodeField label="Playhead" value={time} fps={30} onChange={(seconds) => setTime(seconds)} accent />
            <TransportBar
              buttons={[
                { id: 'start', label: 'Go to start', icon: SkipBackIcon, onPress: () => setTime(0) },
                { id: 'play', label: playing ? 'Pause' : 'Play', icon: PlayIcon, large: true, pressed: playing, onPress: () => setPlaying(!playing) },
                { id: 'end', label: 'Go to end', icon: SkipForwardIcon, onPress: () => setTime(600) },
              ]}
            />
          </div>
        </Demo>
        <Demo title="LevelMeter">
          <div style={{ height: 160 }}>
            <LevelMeter ref={meter} peaks={peaks} labels={['L', 'R']} />
          </div>
        </Demo>
        <Demo title="KeyframeLane" note="Click to select, drag to move.">
          <div style={{ width: 320 }}>
            <KeyframeLane
              keyframes={keyframes}
              start={0}
              end={8}
              onSelect={(ids) => setKeyframes((list) => list.map((key) => ({ ...key, selected: ids.includes(key.id) })))}
              onMove={(ids, delta) => setKeyframes((list) => list.map((key) => (ids.includes(key.id) ? { ...key, time: Math.max(0, key.time + delta) } : key)))}
            />
          </div>
        </Demo>
      </div>
    </>
  )
}
