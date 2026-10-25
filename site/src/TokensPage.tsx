import { SKINS, SKIN_IDS, TOKENS, type SkinId } from '@kition/tessera-tokens'

const isColor = (value: string) => /^(#|rgb|hsl|color-mix)/.test(value)

export function TokensPage({ skin }: { skin: SkinId }) {
  const theme = SKINS[skin]
  const khp = TOKENS.filter((token) => token.khp)
  const own = TOKENS.filter((token) => !token.khp)
  return (
    <div className="page">
      <section className="page-intro">
        <h1>Tokens & skins</h1>
        <p>
          The {khp.length} theme tokens are the Kit Harness Protocol&apos;s (Kit UI protocol, section 4): a host sends them in <code>ui/initialize</code> and{' '}
          <code>ui/theme</code>, and every kit that follows the protocol takes the skin. Switch the skin at the top right: this whole page, and every component, changes
          with it.
        </p>
      </section>

      <h2>Skins</h2>
      <div className="skin-grid">
        {SKIN_IDS.map((id) => (
          <SkinCard key={id} id={id} active={id === skin} />
        ))}
      </div>

      <h2>Theme tokens (sent by hosts)</h2>
      <TokenTable rows={khp.map((token) => ({ ...token, current: theme.tokens[token.name as keyof typeof theme.tokens] }))} />

      <h2>Component tokens (Tessera&apos;s own)</h2>
      <TokenTable rows={own.map((token) => ({ ...token, current: theme.colorScheme === 'dark' && token.dark ? token.dark : token.value }))} />
    </div>
  )
}

function SkinCard({ id, active }: { id: SkinId; active: boolean }) {
  const tokens = SKINS[id].tokens
  const style = Object.fromEntries(Object.entries(tokens)) as React.CSSProperties
  return (
    <div className="skin-card" data-active={active || undefined} style={style}>
      <div className="skin-preview" style={{ background: 'var(--kit-surface)', color: 'var(--kit-text)', borderColor: 'var(--kit-border)' }}>
        <div className="skin-bar" style={{ background: 'var(--kit-surface-muted)', borderColor: 'var(--kit-border)' }}>
          <span className="skin-dot" />
          <span className="skin-dot" />
          <span className="skin-dot" />
        </div>
        <div className="skin-body" style={{ background: 'var(--kit-canvas)' }}>
          <div className="skin-page" style={{ background: 'var(--kit-surface)', boxShadow: 'var(--kit-shadow-card)', borderRadius: 'var(--kit-radius-card)' }}>
            <strong>{id[0].toUpperCase() + id.slice(1)}</strong>
            <span style={{ color: 'var(--kit-text-muted)' }}>{SKINS[id].colorScheme}</span>
            <button type="button" style={{ background: 'var(--kit-primary)', color: 'var(--kit-primary-text)', borderRadius: 'var(--kit-radius-control)' }}>
              Primary
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TokenTable({ rows }: { rows: { name: string; type: string; description: string; current: string }[] }) {
  return (
    <table className="token-table">
      <thead>
        <tr>
          <th>Token</th>
          <th>Value</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>
              <span className="token-value">
                {row.type === 'color' && isColor(row.current) ? <span className="swatch" style={{ background: row.current }} /> : null}
                {row.type === 'dimension' && row.name.includes('radius') ? <span className="radius" style={{ borderRadius: row.current }} /> : null}
                {row.type === 'shadow' ? <span className="shadow" style={{ boxShadow: row.current }} /> : null}
                <code>{row.current.length > 70 ? `${row.current.slice(0, 70)}…` : row.current}</code>
              </span>
            </td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
