import { useState } from 'react'
import type { Option } from '../domain/forms'
import { ArrowDropDown, ErrorIcon } from './icons'

interface SelectProps {
  id: string
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
}

/**
 * AppCompat Spinner: the selected item with a small arrow, no box. Shows the
 * first option until the user picks another (Android selects item 0).
 * The visible label is a separate text above it, so here it is for screen readers.
 */
export function SpinnerField({ id, label, options, value, onChange }: SelectProps) {
  return (
    <div className="spinner">
      <select id={id} aria-label={label} className="spinner__select" value={value || options[0]?.value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ArrowDropDown className="spinner__arrow" />
    </div>
  )
}

/**
 * Exposed dropdown menu (filled TextInputLayout + AutoCompleteTextView): looks
 * like a text field with an arrow; opens the phone's own picker (difference D5).
 */
export function DropdownField({ id, label, options, value, onChange, accent, error }: SelectProps & { accent?: string; error?: string | null }) {
  const [focused, setFocused] = useState(false)
  const floating = focused || value !== ''
  const className = ['tf', focused && 'tf--focused', floating && 'tf--floating', error && 'tf--error'].filter(Boolean).join(' ')
  return (
    <div className={className} style={accent ? { ['--tf-accent' as string]: accent } : undefined}>
      <div className="tf__box">
        <label className="tf__label" htmlFor={id}>{label}</label>
        <select
          id={id}
          className="tf__input tf__select"
          value={value}
          required
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <option value="" disabled hidden />
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ArrowDropDown className="tf__arrow" />
        {error && <div className="tf__end"><ErrorIcon className="tf__error-icon" data-testid="tf-error-icon" /></div>}
      </div>
      {error && focused && <div className="tf__bubble" role="alert">{error}</div>}
    </div>
  )
}
