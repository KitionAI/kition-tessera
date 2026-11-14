import { useEffect, useState, type ReactNode } from 'react'
import { CheckIcon, CopyIcon } from '@kition/tessera-icons/react'

/**
 * Code as the site shows it: coloured by a small tokenizer (comments, strings, keywords, numbers,
 * tags, component and type names, calls), enough for the TypeScript, JSX, JSON and shell lines the
 * docs hold, and drawn the same on the server and in the browser.
 */
const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|default|function|return|const|let|if|else|for|of|in|new|await|async|type|as|true|false|null|undefined|void|typeof)\b|\b(\d+(?:\.\d+)?)\b|(<\/?)([A-Za-z][\w.]*)|\b([A-Z][A-Za-z0-9]*)\b(?=\s*[,}.(])|([A-Za-z_$][\w$]*)(?=\()/g
const KINDS = ['comment', 'string', 'keyword', 'number', 'punct', 'tag', 'name', 'call'] as const

export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of code.matchAll(TOKEN)) {
    const at = match.index ?? 0
    if (at > last) out.push(code.slice(last, at))
    // A tag is two captures: its bracket, then its name.
    if (match[5] !== undefined) {
      out.push(match[5], <span key={key++} className="code-tag">{match[6]}</span>)
    } else {
      const group = [1, 2, 3, 4, 7, 8].find((index) => match[index] !== undefined) ?? 1
      out.push(<span key={key++} className={`code-${KINDS[group - 1]}`}>{match[0]}</span>)
    }
    last = at + match[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

/** A copy button that shows a check for a moment once it has copied. */
export function CopyButton({ text, label = 'Copy', className }: { text: string | (() => string); label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={className ?? 'code-copy'}
      aria-label={label}
      title={label}
      onClick={() => {
        void navigator.clipboard?.writeText(typeof text === 'function' ? text() : text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
    >
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}

const MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const
type Manager = (typeof MANAGERS)[number]
const MANAGER_KEY = 'tessera-package-manager'
/** `pnpm add a b` as another package manager writes it. */
const installWith = (manager: Manager, packages: string) => `${manager === 'npm' ? 'npm install' : `${manager} add`} ${packages}`

/** A block of code with its label (a file name or a language) and a copy button; an install command offers each package manager. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const install = /^pnpm add (\S.*)$/.exec(code)
  const [manager, setManager] = useState<Manager>('pnpm')
  // The package manager chosen before, read once the page has drawn.
  useEffect(() => {
    if (!install) return
    try {
      const saved = localStorage.getItem(MANAGER_KEY) as Manager | null
      if (saved && MANAGERS.includes(saved)) setManager(saved)
    } catch {
      // Storage may be blocked; pnpm stays.
    }
  }, [install !== null])
  if (install) {
    const command = installWith(manager, install[1])
    return (
      <div className="code-block">
        <div className="code-bar">
          <div className="code-managers" role="tablist" aria-label="Package manager">
            {MANAGERS.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={name === manager}
                onClick={() => {
                  setManager(name)
                  try {
                    localStorage.setItem(MANAGER_KEY, name)
                  } catch {
                    // Not remembered, still shown.
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <CopyButton text={command} />
        </div>
        <pre>
          <code>{highlight(command)}</code>
        </pre>
      </div>
    )
  }
  return (
    <div className="code-block">
      <div className="code-bar">
        <span>{label ?? (/^(pnpm|npm|yarn|bun|npx) /.test(code) ? 'Terminal' : /^\s*[{"]/.test(code) ? 'JSON' : 'TSX')}</span>
        <CopyButton text={code} />
      </div>
      <pre>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
