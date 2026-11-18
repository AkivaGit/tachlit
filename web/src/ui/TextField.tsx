import { useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from 'react'
import type { FieldKind } from '../domain/forms'
import { ErrorIcon, EyeIcon } from './icons'

interface TextFieldProps {
  id: string
  /** The Android hint, shown as the (floating) label. */
  label: string
  value: string
  onChange: (value: string) => void
  kind?: Exclude<FieldKind, 'spinner' | 'dropdown'>
  minLines?: number
  /** Focused label colour (app:hintTextColor). */
  accent?: string
  /** Focused underline colour (app:boxStrokeColor). */
  strokeColor?: string
  /** TextView.setError: red icon, and a bubble with this text while focused. */
  error?: string | null
  /** app:passwordToggleEnabled */
  passwordToggle?: boolean
  autoComplete?: string
  /** Show the error bubble even when not focused (Android focuses the first empty field). */
  showBubble?: boolean
  inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>
  onFocus?: () => void
  style?: CSSProperties
}

const INPUT_TYPES: Record<string, string> = { text: 'text', email: 'email', password: 'password', tel: 'tel', number: 'text' }

/** Filled Material text field (TextInputLayout FilledBox + TextInputEditText). */
export function TextField({
  id, label, value, onChange, kind = 'text', minLines = 1, accent, strokeColor, error, passwordToggle, autoComplete, showBubble, inputRef, onFocus, style,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const localRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const multiline = kind === 'multiline'

  // Multi-line fields grow with their text, like an Android EditText.
  useLayoutEffect(() => {
    const el = localRef.current
    if (multiline && el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [value, multiline])

  const setRefs = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    localRef.current = el
    if (typeof inputRef === 'function') inputRef(el)
    else if (inputRef) (inputRef as { current: unknown }).current = el
  }

  const floating = focused || value !== ''
  const className = ['tf', focused && 'tf--focused', floating && 'tf--floating', multiline && 'tf--multiline', error && 'tf--error'].filter(Boolean).join(' ')
  const common = {
    id,
    className: 'tf__input',
    // Empty: right-to-left like the Hebrew layout (cursor on the right). With
    // text: the text's own direction, so English is left-aligned like Android.
    dir: value === '' ? 'rtl' : 'auto',
    value,
    autoComplete,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    onFocus: () => { setFocused(true); onFocus?.() },
    onBlur: () => setFocused(false),
  }

  return (
    <div
      className={className}
      style={{ ...(accent ? { ['--tf-accent' as string]: accent } : {}), ...(strokeColor ? { ['--tf-stroke' as string]: strokeColor } : {}), ...style }}
    >
      <div className="tf__box" onClick={() => localRef.current?.focus()}>
        <label className="tf__label" htmlFor={id}>{label}</label>
        {multiline ? (
          <textarea {...common} ref={setRefs} rows={minLines} />
        ) : (
          <input
            {...common}
            ref={setRefs}
            type={kind === 'password' && showPassword ? 'text' : INPUT_TYPES[kind]}
            inputMode={kind === 'number' ? 'numeric' : undefined}
          />
        )}
        {(error || passwordToggle) && (
          <div className="tf__end">
            {passwordToggle && (
              <button
                type="button"
                className="tf__toggle"
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); setShowPassword((s) => !s) }}
              >
                <EyeIcon off={showPassword} />
              </button>
            )}
            {/* Android draws the error icon over the password eye. */}
            {error && <ErrorIcon className={`tf__error-icon ${passwordToggle ? 'tf__error-icon--over' : ''}`} data-testid="tf-error-icon" />}
          </div>
        )}
      </div>
      {error && (focused || showBubble) && <div className="tf__bubble" role="alert" dir="auto">{error}</div>}
    </div>
  )
}
