import { forwardRef, type SVGProps } from 'react'
import { gridStroke } from './index'
import { DEFAULT_STROKE, type IconData, type IconStyle } from './types'

/** Props of a Tessera icon component. They match lucide-react's, so components can switch without call-site changes. */
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'color' | 'strokeWidth'> & IconStyle & { size?: number | string; strokeWidth?: number | string }

export type TesseraIcon = ReturnType<typeof createIcon>

/** A React component that draws `icon`. */
export function createIcon(icon: IconData) {
  const Component = forwardRef<SVGSVGElement, IconProps>(function TesseraIcon(
    { size = 24, color = 'currentColor', strokeWidth = DEFAULT_STROKE, absoluteStrokeWidth = false, className, children, ...rest },
    ref,
  ) {
    const px = Number(size)
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={gridStroke({ size: Number.isFinite(px) ? px : 24, strokeWidth: Number(strokeWidth), absoluteStrokeWidth })}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={['tessera-icon', `tessera-icon-${icon.name}`, className].filter(Boolean).join(' ')}
        aria-hidden={rest['aria-label'] || rest['aria-labelledby'] ? undefined : true}
        {...rest}
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {icon.fills.map((d, i) => (
          <path key={`fill-${i}`} d={d} fill={color} />
        ))}
        {children}
      </svg>
    )
  })
  Component.displayName = `${icon.name}Icon`
  return Component
}
