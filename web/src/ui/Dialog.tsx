import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { isLatinOnly } from './script'

export interface DialogButton {
  label: string
  onClick?: () => void
}

export interface DialogOptions {
  title?: string
  message?: string
  /** AlertDialog.setItems: a list of choices. */
  items?: string[]
  onItem?: (index: number) => void
  positive?: DialogButton
  negative?: DialogButton
  neutral?: DialogButton
  /** Called when tapping outside or pressing back/Escape. */
  onCancel?: () => void
}

/**
 * Android AlertDialog. A button or an item runs its action and closes the
 * dialog, like Android. Buttons are in Android order: neutral, negative,
 * positive – so in right-to-left the positive button ends up far left.
 */
export function Dialog({ title, message, items, onItem, positive, negative, neutral, onCancel, onDismiss }: DialogOptions & { onDismiss: () => void }) {
  const titleId = useId()
  // AppCompat DialogTitle: a title that doesn't fit on one line at 20sp is
  // shown at 18sp (textAppearanceMedium) on up to two lines.
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleShrunk, setTitleShrunk] = useState(false)
  useLayoutEffect(() => {
    const el = titleRef.current
    if (el && !titleShrunk && el.scrollWidth > el.clientWidth + 1) setTitleShrunk(true)
  }, [title, titleShrunk])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onDismiss(); onCancel?.() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss, onCancel])

  const run = (action?: () => void) => () => {
    onDismiss()
    action?.()
  }
  const buttons = [neutral, negative, positive].filter((b): b is DialogButton => Boolean(b))

  return (
    <div className="dialog-scrim" data-testid="dialog-scrim" onClick={(e) => { if (e.target === e.currentTarget) { onDismiss(); onCancel?.() } }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
        {title && (
          <h2 ref={titleRef} className={`dialog__title ${titleShrunk ? 'dialog__title--shrunk' : ''} ${isLatinOnly(title) ? 'latin-line' : ''}`} id={titleId} dir="auto">
            {title}
          </h2>
        )}
        {message !== undefined && (
          <div className="dialog__message">
            {message.split('\n').map((line, i) => <p key={i} className={`dialog__line ${isLatinOnly(line) ? 'latin-line' : ''}`} dir="auto">{line}</p>)}
          </div>
        )}
        {items && (
          <div className="dialog__items">
            {items.map((item, i) => (
              <button key={i} type="button" className="dialog__item ripple" onClick={run(() => onItem?.(i))}>{item}</button>
            ))}
          </div>
        )}
        {buttons.length > 0 && (
          <div className="dialog__buttons">
            {buttons.map((b) => (
              <button key={b.label} type="button" className="dialog__button ripple" onClick={run(b.onClick)}>{b.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
