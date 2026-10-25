import { Button, OverflowStrip } from '@kition/tessera'

const TOOLS = ['Brush', 'Eraser', 'Clone', 'Heal', 'Dodge', 'Burn', 'Sponge', 'Smudge', 'Blur', 'Sharpen', 'Gradient', 'Fill', 'Text', 'Shape', 'Crop', 'Slice']

export default function Demo() {
  return (
    <div style={{ width: 'min(100%, 420px)', border: '1px solid var(--kit-border)', borderRadius: 8, background: 'var(--kit-surface)' }}>
      <OverflowStrip className="" panelClassName="demo-strip" labels={{ start: 'Scroll left', end: 'Scroll right' }} testId="tools">
        {TOOLS.map((tool) => (
          <Button key={tool}>{tool}</Button>
        ))}
      </OverflowStrip>
    </div>
  )
}
