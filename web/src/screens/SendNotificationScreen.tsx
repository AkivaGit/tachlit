import { useState } from 'react'
import { sendPush, savedSupervisorToken } from '../domain/supervisor'
import { SEND_ROLES } from '../domain/userTypes'
import { fmt, K, S } from '../strings'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { useUi } from '../ui/UiProvider'

/** SupervisorSendNotificationActivity: title, message, roles, send. */
export function SendNotificationScreen() {
  const ui = useUi()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [roles, setRoles] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  const toggle = (key: string, checked: boolean) =>
    setRoles((r) => { const next = new Set(r); if (checked) next.add(key); else next.delete(key); return next })

  const send = async () => {
    if (title.trim() === '' || body.trim() === '') return ui.showToast(S.send_notification_missing_fields)
    const selected = SEND_ROLES.map((r) => r.key).filter((k) => roles.has(k))
    if (selected.length === 0) return ui.showToast(S.send_notification_no_role)
    const token = savedSupervisorToken()
    if (!token) return ui.showToast('No supervisor token available', 'long')
    setSending(true)
    const result = await sendPush(token, selected, title.trim(), body.trim())
    setSending(false)
    ui.showToast(result.ok ? fmt(K.push_sent, result.sent, result.failed) : result.message, 'long')
  }

  return (
    <div className="send">
      <div className="send__title">{S.send_notification_title}</div>
      <input
        className="send__input"
        aria-label={S.send_notification_hint_title}
        placeholder={S.send_notification_hint_title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        dir="auto"
      />
      <textarea
        className="send__input send__input--multiline"
        aria-label={S.send_notification_hint_body}
        placeholder={S.send_notification_hint_body}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        dir="auto"
      />
      <div className="send__roles-title">{S.send_notification_select_roles}</div>
      <div className="send__roles">
        {SEND_ROLES.map((r) => <Checkbox key={r.key} label={r.label} checked={roles.has(r.key)} onChange={(c) => toggle(r.key, c)} />)}
      </div>
      <div className="send__button-wrap">
        <Button block disabled={sending} onClick={send}>{S.send_notification_send}</Button>
        {sending && (
          <svg className="loading__spinner send__progress" viewBox="0 0 64 64" aria-label="sending">
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" />
          </svg>
        )}
      </div>
    </div>
  )
}
