import type { ReactNode } from 'react'

/**
 * The band at the top of an inner page: where you are, the page's title, what it is in a sentence,
 * and its actions. Its tint comes from the skin's primary colour, so it follows the skin.
 */
export function PageHero({ eyebrow, title, children, actions, tone = 'docs', aside }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode; tone?: 'docs' | 'components' | 'icons' | 'tokens'; aside?: ReactNode }) {
  return (
    <header className="page-hero" data-tone={tone}>
      <div className="page-hero-inner">
        <div className="page-hero-copy">
          <p className="page-hero-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {children ? <div className="page-hero-lede">{children}</div> : null}
        </div>
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
        {aside}
      </div>
    </header>
  )
}
