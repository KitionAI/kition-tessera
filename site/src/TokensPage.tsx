import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { BrushIcon, CheckIcon, ClipboardPasteIcon, CopyIcon, CropIcon, LayersIcon, MoveIcon, ScissorsIcon, TriangleAlertIcon, TypeIcon } from '@kition/tessera-icons/react'
import { SKINS, SKIN_IDS, TOKENS, type KhpTokenName, type SkinId, type SkinTheme } from '@kition/tessera-tokens'
import { Alert, Button, IconButton, NumberField, RibbonButton, RibbonGroup, RibbonStack, Segmented, Switch, Tag, contrast, textOn, toast } from '@kition/tessera-ui'
import { CodeBlock } from './shell/Code'
import { CopyForAI } from './shell/CopyForAI'
import { PageHero } from './shell/PageHero'
import { SKIN_NAMES, skinStyle } from './shell/skin'

const isColor = (value: string) => /^(#|rgb|hsl|color-mix)/.test(value)
const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

/** `#rrggbb` as `rgba(r, g, b, alpha)`, the way the skins write their soft primary. */
function soft(hex: string, alpha: number) {
  const value = parseInt(hex.slice(1), 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

type Custom = { base: SkinId; primary: string; control: number; card: number }

/** A skin made in the workshop: the base skin with another primary (and the text and tint that go with it) and other radii. */
function customTheme({ base, primary, control, card }: Custom): SkinTheme {
  const skin = SKINS[base]
  return {
    colorScheme: skin.colorScheme,
    tokens: { ...skin.tokens, '--kit-primary': primary, '--kit-primary-text': textOn(primary), '--kit-primary-soft': soft(primary, skin.colorScheme === 'dark' ? 0.16 : 0.1), '--kit-radius-control': `${control}px`, '--kit-radius-card': `${card}px` },
  }
}

/** The pairs a skin has to keep readable, with the ratio WCAG AA asks of each. */
const PAIRS: { label: string; text: KhpTokenName; on: KhpTokenName; need: number }[] = [
  { label: 'Text on the surface', text: '--kit-text', on: '--kit-surface', need: 4.5 },
  { label: 'Muted text on the surface', text: '--kit-text-muted', on: '--kit-surface', need: 4.5 },
  { label: 'Text on panels', text: '--kit-text', on: '--kit-surface-muted', need: 4.5 },
  { label: 'Text on the primary', text: '--kit-primary-text', on: '--kit-primary', need: 4.5 },
  { label: 'Primary as text or a focus ring', text: '--kit-primary', on: '--kit-surface', need: 3 },
  { label: 'Danger on the surface', text: '--kit-danger', on: '--kit-surface', need: 3 },
]

const STARTS: Record<SkinId, Custom> = {
  paper: { base: 'paper', primary: SKINS.paper.tokens['--kit-primary'], control: 8, card: 12 },
  graphite: { base: 'graphite', primary: SKINS.graphite.tokens['--kit-primary'], control: 8, card: 12 },
}
const SUGGESTED = ['#5645d4', '#0d74ce', '#18794e', '#ad5700', '#ce2c31', '#8145b5', '#0f766e', '#1f2937']

/**
 * Tokens and skins as a workshop: make a skin from a base, a primary colour and radii, watch an
 * editor built from Tessera components take it, check its contrast, and take it away as the
 * theme a host sends or as CSS variables. Under it, every token, to copy.
 */
export function TokensPage({ skin }: { skin: SkinId }) {
  const [custom, setCustom] = useState<Custom>(STARTS[skin])
  const [touched, setTouched] = useState(false)
  const [output, setOutput] = useState('theme')
  // Until the workshop is used, it shows the page's skin.
  useEffect(() => {
    if (!touched) setCustom(STARTS[skin])
  }, [skin, touched])
  const change = (next: Partial<Custom>) => {
    setTouched(true)
    setCustom((current) => ({ ...current, ...next }))
  }
  const theme = useMemo(() => customTheme(custom), [custom])
  const style = { ...skinStyle(custom.base), ...theme.tokens } as CSSProperties
  const checks = PAIRS.map((pair) => {
    const [a, b] = [theme.tokens[pair.text], theme.tokens[pair.on]]
    const ratio = isHex(a) && isHex(b) ? contrast(a, b) : null
    return { ...pair, ratio, pass: ratio === null || ratio >= pair.need }
  })
  const failing = checks.filter((check) => !check.pass).length
  const code =
    output === 'theme'
      ? JSON.stringify({ theme }, null, 2)
      : `:root {\n${Object.entries(theme.tokens)
          .map(([name, value]) => `  ${name}: ${value};`)
          .join('\n')}\n}`
  const apply = () => {
    const root = document.documentElement
    for (const [name, value] of Object.entries(theme.tokens)) root.style.setProperty(name, value)
    root.dataset.colorScheme = theme.colorScheme
    toast.success('This site now wears your skin. Pick Paper or Graphite above to put it back.')
  }
  const khp = TOKENS.filter((token) => token.khp)
  const own = TOKENS.filter((token) => !token.khp)
  const page = SKINS[skin]

  return (
    <>
      <PageHero tone="tokens" eyebrow="Tokens" title="Tokens and skins" actions={<CopyForAI markdown="tokens.md" subject="the design tokens and skins (@kition/tessera-tokens)" importLine="import '@kition/tessera-tokens/tokens.css'" />}>
        <p>
          A skin is one value for each of the {khp.length} theme tokens. They are the Kit Harness Protocol&apos;s: a host sends them in <code>ui/initialize</code> and <code>ui/theme</code>, and every kit that
          follows the protocol takes the skin. Make one below.
        </p>
      </PageHero>
      <div className="page tokens">
        <section className="workshop" aria-labelledby="workshop-title">
          <div className="workshop-controls">
            <h2 id="workshop-title">Skin workshop</h2>
            <div className="workshop-field">
              <span>Start from</span>
              <Segmented label="Base skin" value={custom.base} onChange={(base) => change({ ...STARTS[base], primary: touched ? custom.primary : STARTS[base].primary, control: custom.control, card: custom.card })} segments={SKIN_IDS.map((id) => ({ value: id, label: SKIN_NAMES[id] ?? id }))} />
            </div>
            <div className="workshop-field">
              <label htmlFor="workshop-primary">Primary colour</label>
              <div className="workshop-color">
                <input id="workshop-primary" type="color" value={custom.primary} onChange={(event) => change({ primary: event.target.value })} />
                <input type="text" aria-label="Primary colour as hex" value={custom.primary} spellCheck={false} onChange={(event) => isHex(event.target.value) && change({ primary: event.target.value.toLowerCase() })} />
              </div>
              <div className="workshop-suggested" role="group" aria-label="Suggested colours">
                {SUGGESTED.map((color) => (
                  <button key={color} type="button" style={{ background: color }} aria-label={color} title={color} aria-pressed={custom.primary === color} onClick={() => change({ primary: color })} />
                ))}
              </div>
            </div>
            <div className="workshop-field">
              <label htmlFor="workshop-control">Control radius {custom.control}px</label>
              <input id="workshop-control" type="range" min={0} max={14} value={custom.control} onChange={(event) => change({ control: Number(event.target.value) })} />
            </div>
            <div className="workshop-field">
              <label htmlFor="workshop-card">Card radius {custom.card}px</label>
              <input id="workshop-card" type="range" min={0} max={20} value={custom.card} onChange={(event) => change({ card: Number(event.target.value) })} />
            </div>
            <div className="workshop-actions">
              <Button variant="primary" size="md" onClick={apply}>
                Wear it on this site
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={!touched}
                onClick={() => {
                  setTouched(false)
                  setCustom(STARTS[skin])
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="workshop-preview" style={style}>
            <Preview />
          </div>
          <div className="workshop-checks">
            <h3>
              Contrast{' '}
              {failing ? (
                <Tag tone="danger">{failing} below AA</Tag>
              ) : (
                <Tag tone="success">AA</Tag>
              )}
            </h3>
            <ul>
              {checks.map((check) => (
                <li key={check.label} data-pass={check.pass}>
                  {check.pass ? <CheckIcon size={14} /> : <TriangleAlertIcon size={14} />}
                  <span>{check.label}</span>
                  <code>
                    {check.ratio === null ? '—' : check.ratio.toFixed(1)} <small>/ {check.need}</small>
                  </code>
                </li>
              ))}
            </ul>
          </div>
          <div className="workshop-output">
            <Segmented
              label="Output"
              value={output}
              onChange={setOutput}
              segments={[
                { value: 'theme', label: 'ui/theme' },
                { value: 'css', label: 'CSS variables' },
              ]}
            />
            <CodeBlock code={code} label={output === 'theme' ? 'What a host sends' : 'In your stylesheet'} />
          </div>
        </section>

        <h2>Theme tokens</h2>
        <p className="tokens-note">Sent by hosts. Values are those of the {SKIN_NAMES[skin] ?? skin} skin, the one this page wears; click a token to copy it.</p>
        <div className="token-cards">
          {khp.map((token) => {
            const value = page.tokens[token.name as KhpTokenName]
            return <TokenCard key={token.name} name={token.name} type={token.type} value={value} description={token.description} />
          })}
        </div>

        <h2>Component tokens</h2>
        <p className="tokens-note">Tessera&apos;s own: sizes of the editor chrome, and the colours of meters and charts in each colour scheme.</p>
        <div className="token-cards">
          {own.map((token) => (
            <TokenCard key={token.name} name={token.name} type={token.type} value={page.colorScheme === 'dark' && token.dark ? token.dark : token.value} description={token.description} />
          ))}
        </div>
      </div>
    </>
  )
}

/** A token: what it looks like, its name and value, and what it is for. A click copies `var(--name)`. */
function TokenCard({ name, type, value, description }: { name: string; type: string; value: string; description: string }) {
  return (
    <button
      type="button"
      className="token-card"
      title={`Copy var(${name})`}
      onClick={() => {
        void navigator.clipboard?.writeText(`var(${name})`)
        toast.success(`var(${name}) copied`)
      }}
    >
      <span className="token-card-art" data-type={type}>
        {type === 'color' && isColor(value) ? <span className="token-swatch" style={{ background: value }} /> : null}
        {type === 'dimension' && name.includes('radius') ? <span className="token-radius" style={{ borderRadius: value }} /> : null}
        {type === 'shadow' ? <span className="token-shadow" style={{ boxShadow: value }} /> : null}
        {type === 'fontFamily' ? <span style={{ fontFamily: value }}>Ag</span> : null}
        {(type === 'dimension' && !name.includes('radius')) || type === 'number' || type === 'fontWeight' ? <span className="token-number">{value}</span> : null}
      </span>
      <span className="token-card-text">
        <code>{name}</code>
        <span>{description}</span>
        <small>{value}</small>
      </span>
      <CopyIcon size={14} className="token-card-copy" />
    </button>
  )
}

/** A small editor made of Tessera components, to see a skin on. */
function Preview() {
  const [tool, setTool] = useState(2)
  const [opacity, setOpacity] = useState(80)
  const [snap, setSnap] = useState(true)
  const tools = [
    ['Move', MoveIcon],
    ['Crop', CropIcon],
    ['Brush', BrushIcon],
    ['Type', TypeIcon],
  ] as const
  return (
    <div className="skin-editor">
      <div className="skin-editor-ribbon">
        <RibbonGroup label="Clipboard">
          <RibbonButton icon={ClipboardPasteIcon} label="Paste" size="large" />
          <RibbonStack>
            <RibbonButton icon={ScissorsIcon} label="Cut" />
            <RibbonButton icon={CopyIcon} label="Copy" />
          </RibbonStack>
        </RibbonGroup>
        <RibbonGroup label="Arrange">
          <RibbonButton icon={LayersIcon} label="Layers" size="large" pressed />
        </RibbonGroup>
      </div>
      <div className="skin-editor-body">
        <div className="skin-editor-rail">
          {tools.map(([label, Icon], i) => (
            <IconButton key={label} icon={Icon} label={label} pressed={tool === i} onClick={() => setTool(i)} />
          ))}
        </div>
        <div className="skin-editor-canvas">
          <div className="skin-editor-card">
            <strong>Quarterly plan</strong>
            <span>Draft · edited 2 minutes ago</span>
            <div>
              <Tag tone="success">Published</Tag> <Tag tone="info">Shared</Tag>
            </div>
          </div>
        </div>
        <div className="skin-editor-panel">
          <NumberField label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={(value) => setOpacity(value)} />
          <label className="skin-editor-switch">
            <Switch checked={snap} onCheckedChange={setSnap} aria-label="Snap to grid" /> Snap to grid
          </label>
          <Alert tone="info" title="Autosaved" description="Your changes are kept as you work." />
          <div className="skin-editor-actions">
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
