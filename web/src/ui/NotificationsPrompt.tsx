import { useEffect } from 'react'
import { enableNotifications, isPushSupported, notificationPermission } from '../push/pushClient'
import { S } from '../strings'
import { useUi } from './UiProvider'

let askedThisSession = false

/** For tests: forget that the prompt was shown. */
export function resetNotificationsPrompt() {
  askedThisSession = false
}

/**
 * The Android app asks for notification permission when the main screen opens
 * (Android 13+ system dialog). Browsers only allow the request after a tap,
 * so the web app shows an app dialog first (difference D2), once per session.
 */
export function NotificationsPrompt() {
  const ui = useUi()
  useEffect(() => {
    if (askedThisSession || !isPushSupported() || notificationPermission() !== 'default') return
    askedThisSession = true
    ui.showDialog({
      title: 'התראות / Notifications',
      message: 'לאפשר לתכלית לשלוח לך התראות?\n\nAllow Tachlit to send you notifications?',
      positive: { label: S.ok, onClick: () => void enableNotifications() },
      negative: { label: S.no },
    })
  }, [ui])
  return null
}
