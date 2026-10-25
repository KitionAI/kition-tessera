// Plain TypeScript (createElement, no JSX) with explicit `.ts` imports, so Node loads the icons as
// they are (type stripping): a kit's plain-Node tests can import modules that hold icons.
import { createElement, forwardRef, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { gridStroke } from './index.ts'
import { ACCENT_OPACITY, DEFAULT_STROKE, type IconData, type IconStyle } from './types.ts'

/** Props of a Tessera icon component. They match lucide-react's, so components can switch without call-site changes. */
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'color' | 'strokeWidth'> & Omit<IconStyle, 'size' | 'strokeWidth'> & { size?: number | string; strokeWidth?: number | string }

/** The skin's icon accent (KHP-0007 `--kit-icon-accent`), then its primary. */
const ACCENT = 'var(--kit-icon-accent, var(--kit-primary, currentColor))'

export type TesseraIcon = ReturnType<typeof createIcon>

/**
 * Any icon component a control can draw: Tessera's, or another set's with the same props (such
 * as lucide-react's), so code can move icon by icon. Use it for icon props and maps of icons.
 */
export type IconComponent = ComponentType<{
  size?: number | string
  strokeWidth?: number | string
  color?: string
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/** A React component that draws `icon`. */
export function createIcon(icon: IconData) {
  const Component = forwardRef<SVGSVGElement, IconProps>(function TesseraIcon(
    { size = 24, color = 'currentColor', strokeWidth = DEFAULT_STROKE, absoluteStrokeWidth = false, accent, className, children, ...rest },
    ref,
  ) {
    const px = Number(size)
    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: gridStroke({ size: Number.isFinite(px) ? px : 24, strokeWidth: Number(strokeWidth), absoluteStrokeWidth }),
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: ['tessera-icon', `tessera-icon-${icon.name}`, className].filter(Boolean).join(' '),
        'aria-hidden': rest['aria-label'] || rest['aria-labelledby'] ? undefined : true,
        ...rest,
      },
      accent === false ? null : icon.accents.map((d, i) => createElement('path', { key: `accent-${i}`, d, fill: accent ?? ACCENT, fillOpacity: ACCENT_OPACITY, stroke: 'none' })),
      icon.paths.map((d, i) => createElement('path', { key: i, d })),
      icon.fills.map((d, i) => createElement('path', { key: `fill-${i}`, d, fill: color })),
      children,
    )
  })
  Component.displayName = `${icon.name}Icon`
  return Component
}
