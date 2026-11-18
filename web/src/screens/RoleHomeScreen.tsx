import { Navigate, useLocation, useNavigate } from 'react-router'
import { deleteRegistrationOnLogout } from '../domain/logout'
import { roleDisplayName } from '../domain/userTypes'
import { ROUTES } from '../routes'
import * as session from '../session/session'
import { fmt, S } from '../strings'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useUi } from '../ui/UiProvider'

/** RoleHomeActivity: the personal area of a registered user. */
export function RoleHomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const ui = useUi()
  const role = (location.state as { role?: string } | null)?.role ?? session.getRole()
  if (!role) return <Navigate to={ROUTES.main} replace />

  const doLogout = async () => {
    ui.showLoading()
    const result = await deleteRegistrationOnLogout()
    ui.hideLoading()
    if (result.ok) navigate(ROUTES.main, { replace: true })
    else ui.showDialog({ title: S.logout_failed_title, message: result.message, positive: { label: S.ok } })
  }

  const confirmLogout = () => ui.showDialog({
    title: S.logout_confirm_title,
    message: S.logout_delete_confirm_message,
    positive: { label: S.yes, onClick: doLogout },
    negative: { label: S.no },
  })

  return (
    <div className="home">
      <div className="home__greeting">{fmt(S.role_home_greeting, session.getUserName() ?? '')}</div>
      <div className="home__subtitle">{S.role_home_subtitle}</div>
      <div className="home__role">{fmt(S.role_home_role_label, roleDisplayName(role))}</div>
      <Card className="home__card" radius={12} elevation={4}>
        <div className="home__card-title">{S.role_home_activities_title}</div>
        <div className="home__card-body">{S.role_home_activities_empty}</div>
      </Card>
      <div className="home__spacer" />
      <Button className="home__logout" onClick={confirmLogout}>{S.logout}</Button>
    </div>
  )
}
