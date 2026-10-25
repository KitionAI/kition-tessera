import type { ComponentType, CSSProperties } from 'react'

/**
 * An icon a component draws: any component taking these props. Tessera Icons
 * (`@kition/tessera-icons/react`) fit, and so do lucide-react's, so a kit can pass either.
 */
export type IconComponent = ComponentType<{
  size?: number | string
  strokeWidth?: number | string
  color?: string
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
}>
