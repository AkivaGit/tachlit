import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'

export type Elevation = 0 | 1 | 2 | 4 | 6 | 8

export function shadow(elevation: Elevation): string {
  return elevation === 0 ? 'none' : `var(--elev-${elevation})`
}

interface CardProps {
  children: ReactNode
  background?: string
  /** cardCornerRadius in dp */
  radius?: number
  /** cardElevation in dp */
  elevation?: Elevation
  /** Ripple colour on press (MaterialCardView app:rippleColor). */
  rippleColor?: string
  onClick?: () => void
  onLongPress?: () => void
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** CardView / MaterialCardView. Clickable cards behave like buttons. */
export function Card({ children, background = '#FFFFFF', radius = 12, elevation = 2, rippleColor, onClick, className = '', style, ...rest }: CardProps) {
  const clickable = Boolean(onClick)
  const onKeyDown = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }
  return (
    <div
      className={`card ${clickable ? 'card--clickable ripple' : ''} ${className}`}
      style={{
        background,
        borderRadius: radius,
        boxShadow: shadow(elevation),
        ...(rippleColor ? { ['--ripple-color' as string]: rippleColor } : {}),
        ...style,
      }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? onKeyDown : undefined}
      data-testid={rest['data-testid']}
    >
      {children}
    </div>
  )
}
