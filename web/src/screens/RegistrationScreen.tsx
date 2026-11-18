import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { C } from '../colors'
import { formBySlug, requiredFields, type FieldDef, type FormDef } from '../domain/forms'
import { registerUser } from '../domain/registration'
import { findMissingFields, missingFieldsMessage } from '../domain/validation'
import { ROUTES } from '../routes'
import { S } from '../strings'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DropdownField, SpinnerField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'
import { useUi } from '../ui/UiProvider'

/** The five registration activities, rendered from their form definition. */
export function RegistrationScreen() {
  const { slug } = useParams()
  const form = formBySlug(slug)
  if (!form) return <Navigate to={ROUTES.main} replace />
  return <RegistrationForm key={form.role} form={form} />
}

function RegistrationForm({ form }: { form: FormDef }) {
  const navigate = useNavigate()
  const ui = useUi()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [bubbleField, setBubbleField] = useState<string | null>(null)
  const inputs = useRef<Record<string, HTMLElement | null>>({})

  const setValue = (id: string, value: string) => {
    setValues((v) => ({ ...v, [id]: value }))
    // Android clears a field's error as soon as the user types in it.
    setErrors((e) => (e.has(id) ? new Set([...e].filter((x) => x !== id)) : e))
  }

  const register = async () => {
    const missing = findMissingFields(requiredFields(form), values)
    if (missing.length > 0) {
      setErrors(new Set(missing.map((f) => f.id)))
      // Android focuses the first empty field right away: it scrolls into view
      // and its error bubble shows behind the popup.
      const first = missing[0].id
      setBubbleField(first)
      inputs.current[first]?.scrollIntoView?.({ block: 'nearest' })
      const focusFirst = () => { setBubbleField(null); inputs.current[first]?.focus() }
      ui.showDialog({
        title: S.missing_fields_title,
        message: missingFieldsMessage(missing),
        positive: { label: S.ok, onClick: focusFirst },
        onCancel: focusFirst,
      })
      return
    }
    ui.showLoading()
    const result = await registerUser(form, values)
    ui.hideLoading()
    if (result.ok) {
      ui.showToast(form.successToast)
      navigate(ROUTES.home, { replace: true, state: { role: form.role } })
    } else {
      ui.showDialog({ title: S.registration_failed_title, message: result.message, positive: { label: S.ok } })
    }
  }

  const buttons = (
    <div className={`reg__buttons ${form.buttonsInsideCard ? 'reg__buttons--inside' : ''}`}>
      <Button className="reg__button" color={C.text_secondary} bold fontSize={16} padding={16} onClick={() => navigate(-1)}>{S.cancel}</Button>
      <Button className="reg__button" color={form.accent} bold fontSize={16} padding={16} onClick={register}>{S.register}</Button>
    </div>
  )

  const renderField = (field: FieldDef) => {
    const error = errors.has(field.id) ? S.please_fill_all_fields : null
    const ref = (el: HTMLElement | null) => { inputs.current[field.id] = el }
    if (field.kind === 'spinner') {
      return (
        <div key={field.id}>
          <label className="reg__spinner-label" htmlFor={field.id}>{field.label}</label>
          <div style={{ marginBottom: field.marginBottom }}>
            <SpinnerField id={field.id} label={field.label} options={field.options!} value={values[field.id] ?? ''} onChange={(v) => setValue(field.id, v)} />
          </div>
        </div>
      )
    }
    if (field.kind === 'dropdown') {
      return (
        <div key={field.id} style={{ marginBottom: field.marginBottom }} ref={(el) => { inputs.current[field.id] = el?.querySelector('select') ?? null }}>
          <DropdownField id={field.id} label={field.label} options={field.options!} value={values[field.id] ?? ''} onChange={(v) => setValue(field.id, v)} accent={form.accent} error={error} />
        </div>
      )
    }
    return (
      <TextField
        key={field.id}
        id={field.id}
        label={field.label}
        kind={field.kind}
        minLines={field.minLines}
        value={values[field.id] ?? ''}
        onChange={(v) => setValue(field.id, v)}
        accent={form.accent}
        strokeColor={field.strokeColor ?? form.strokeColor}
        error={error}
        showBubble={bubbleField === field.id}
        autoComplete={field.autoComplete}
        inputRef={ref}
        style={{ marginBottom: field.marginBottom }}
      />
    )
  }

  return (
    <div className="screen reg">
      <Card className="reg__header" background={form.header.background} radius={16} elevation={8}>
        <h1 className="reg__title" style={{ color: form.header.titleColor }}>{form.header.title}</h1>
        <div className="reg__subtitle" style={{ color: form.header.subtitleColor }}>{form.header.subtitle}</div>
      </Card>
      <Card className="reg__form" background="var(--surface)" radius={16} elevation={4} data-testid="form-card">
        {form.sections.map((section) => (
          <section key={section.title + section.fields[0].id}>
            <h2 className="reg__section" style={{ color: form.accent, marginTop: section.marginTop ?? 0 }}>{section.title}</h2>
            {section.fields.map(renderField)}
          </section>
        ))}
        {form.buttonsInsideCard && buttons}
      </Card>
      {!form.buttonsInsideCard && buttons}
    </div>
  )
}
