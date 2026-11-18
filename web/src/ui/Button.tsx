import type { CSSProperties, ReactNode } from 'react'
import { isLatinOnly } from './script'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  /** android:backgroundTint */
  color?: string
  textColor?: string
  /** Widget.MaterialComponents.Button.OutlinedButton */
  outlined?: boolean
  /** android:textStyle="bold" */
  bold?: boolean
  /** android:textSize in sp */
  fontSize?: number
  /** android:padding in dp (all sides) */
  padding?: number
  /** app:cornerRadius in dp */
  radius?: number
  /** match_parent width */
  block?: boolean
  icon?: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
  className?: string
}

/** MaterialButton (what `<Button>` becomes in a Material Components theme). */
export function Button({
  children, onClick, color, textColor, outlined, bold, fontSize, padding, radius, block, icon, disabled, type = 'button', style, className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn ripple ${outlined ? 'btn--outlined' : ''} ${bold ? 'btn--bold' : ''} ${block ? 'btn--block' : ''} ${className}`}
      style={{
        ...(color && !outlined ? { backgroundColor: color } : {}),
        ...(textColor ? { color: textColor } : {}),
        ...(fontSize ? { fontSize } : {}),
        ...(padding !== undefined ? { padding } : {}),
        ...(radius !== undefined ? { borderRadius: radius } : {}),
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className={typeof children === 'string' && isLatinOnly(children) ? 'latin' : undefined}>{children}</span>
    </button>
  )
}
