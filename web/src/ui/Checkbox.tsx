import { useId } from 'react'

/** MaterialCheckBox with its text (the send-notification role list). */
export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId()
  return (
    <label className="checkbox ripple" htmlFor={id}>
      <input id={id} type="checkbox" className="checkbox__input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox__label">{label}</span>
    </label>
  )
}
