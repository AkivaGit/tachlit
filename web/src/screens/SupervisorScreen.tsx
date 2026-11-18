import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { C } from '../colors'
import { VIEWS, type ViewType } from '../domain/management'
import { loadStatistics, loginSupervisor, logoutSupervisor, savedSupervisorToken, SessionExpiredError } from '../domain/supervisor'
import { isSupervisorUnlocked, resetSupervisorUnlock, unlockSupervisor } from '../domain/supervisorState'
import { ROUTES } from '../routes'
import { fmt, K, S } from '../strings'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TextField } from '../ui/TextField'
import { useUi } from '../ui/UiProvider'
import { Stats } from './Stats'

/** SupervisorActivity: staff login, statistics and the management buttons. */
export function SupervisorScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const ui = useUi()
  const autoLogin = (location.state as { autoLogin?: boolean } | null)?.autoLogin === true

  // Logged in already: coming back from a list, or opened from the splash with a saved session.
  const [token, setToken] = useState<string | null>(() =>
    (isSupervisorUnlocked() || autoLogin) ? savedSupervisorToken() : null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [stats, setStats] = useState({ learners: 0, teachers: 0, pairings: 0 })
  const [city, setCity] = useState('')

  const showLoginForm = useCallback((error: string | null) => {
    resetSupervisorUnlock()
    setToken(null)
    setPassword('')
    setPasswordError(error)
  }, [])

  // loadStatistics() whenever the management part is shown (Android: onResume).
  useEffect(() => {
    if (!token) return
    unlockSupervisor()
    let cancelled = false
    ui.showLoading()
    loadStatistics(token)
      .then((s) => { if (!cancelled) setStats({ learners: s.learnAskers, teachers: s.learnGivers, pairings: s.totalPairings }) })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof SessionExpiredError) {
          showLoginForm(S.supervisor_session_expired)
        } else {
          setStats({ learners: 0, teachers: 0, pairings: 0 })
          ui.showToast(fmt(K.failed_to_load_statistics, error instanceof Error ? error.message : String(error)))
        }
      })
      .finally(() => ui.hideLoading())
    return () => { cancelled = true }
  }, [token, ui, showLoginForm])

  const login = async () => {
    if (password.trim() === '') {
      setPasswordError(S.please_fill_all_fields)
      return
    }
    ui.showLoading()
    const result = await loginSupervisor(password)
    ui.hideLoading()
    if (result.ok) {
      ;(document.activeElement as HTMLElement | null)?.blur()
      setPasswordError(null)
      setToken(result.token)
      ui.showToast(K.login_successful)
    } else {
      setPasswordError(result.message)
      ui.showToast(K.login_failed)
    }
  }

  const confirmLogout = () => ui.showDialog({
    title: S.logout_confirm_title,
    message: S.logout_confirm_message,
    positive: {
      label: S.yes,
      onClick: () => {
        logoutSupervisor()
        resetSupervisorUnlock()
        navigate(ROUTES.main, { replace: true })
      },
    },
    negative: { label: S.no },
  })

  const open = (view: ViewType) => navigate(ROUTES.manage(view))
  const button = (label: string, color: string, onClick: () => void) => (
    <Button className="sup__button" block color={color} bold fontSize={16} padding={16} onClick={onClick}>{label}</Button>
  )

  return (
    <div className="screen sup">
      <Card className="sup__header" background={C.card_supervisor} radius={16} elevation={8}>
        <h1 className="sup__title">{S.supervisor_title}</h1>
        <div className="sup__subtitle">{S.supervisor_description}</div>
      </Card>

      {!token && (
        <Card className="sup__card" radius={16} elevation={4}>
          <h2 className="sup__card-title">{K.supervisor_login_title}</h2>
          <TextField
            id="supervisorPassword"
            label={S.supervisor_password}
            kind="password"
            passwordToggle
            value={password}
            onChange={(v) => { setPassword(v); setPasswordError(null) }}
            accent={C.secondary_color}
            strokeColor={C.secondary_color}
            error={passwordError}
            autoComplete="current-password"
            style={{ marginBottom: 16 }}
          />
          <Button block color={C.secondary_color} bold fontSize={16} padding={16} onClick={login}>{S.login}</Button>
        </Card>
      )}

      {token && (
        <div className="sup__management">
          <Card className="sup__stats" radius={16} elevation={4}>
            <h2 className="sup__card-title">{K.statistics}</h2>
            <Stats {...stats} />
          </Card>
          {button(S.all_users, C.main_color, () => open(VIEWS.ALL_USERS))}
          {button(S.unmatched_learners, C.secondary_color, () => open(VIEWS.UNMATCHED_LEARNERS))}
          {button(S.available_teachers, C.success_color, () => open(VIEWS.AVAILABLE_TEACHERS))}
          {button(S.suggested_matches, C.warning_color, () => open(VIEWS.SUGGESTED_MATCHES))}
          {button(S.supervisor_send_notification_button, C.main_color, () => navigate(ROUTES.send))}

          <Card className="sup__filter" radius={16} elevation={4}>
            <h2 className="sup__filter-title">{S.filter_by_city}</h2>
            <TextField id="cityFilter" label={S.city} value={city} onChange={setCity} accent={C.secondary_color} strokeColor={C.secondary_color} style={{ marginBottom: 16 }} />
            {/* Does nothing yet, like the Android app (TODO there). */}
            <Button block color={C.secondary_color} fontSize={14} padding={12} onClick={() => {}}>{K.apply_filter}</Button>
          </Card>

          <div className="sup__logout-row">
            <Button outlined onClick={confirmLogout}>{S.logout}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
