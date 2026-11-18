import { useLocation, useNavigate } from 'react-router'
import { isIos, isStandalone } from '../platform'

/** Screens that are the start of a flow: nothing to go back to (like Android). */
const ROOTS = new Set(['/', '/main', '/home'])

/**
 * Installed iPhone web apps have no back gesture or button, so screens like
 * donations would be a dead end. This small button appears only there
 * (difference D4). Android has its system back.
 */
export function BackButton() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (!isIos() || !isStandalone() || ROOTS.has(pathname)) return null
  return (
    <button type="button" className="back-button ripple" aria-label="חזרה" onClick={() => navigate(-1)}>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path fill="currentColor" d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4z" />
      </svg>
    </button>
  )
}
