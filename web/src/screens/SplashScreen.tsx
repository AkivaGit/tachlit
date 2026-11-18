import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { asset, ROUTES } from '../routes'
import * as session from '../session/session'
import { S } from '../strings'

/** SplashActivity: the logo for 2 seconds, then the right screen for the session. */
export function SplashScreen() {
  const navigate = useNavigate()
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session.isLoggedIn()) navigate(ROUTES.main, { replace: true })
      else if (session.getRole() === 'SUPERVISOR') navigate(ROUTES.supervisor, { replace: true, state: { autoLogin: true } })
      else navigate(ROUTES.home, { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash">
      <img className="splash__logo" src={asset('images/tachlit_logo4.webp')} alt={S.app_logo} />
    </div>
  )
}
