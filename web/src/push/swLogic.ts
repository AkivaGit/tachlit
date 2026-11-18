/**
 * What the service worker shows for a push (pure functions, unit-tested).
 * Port of TachlitFirebaseMessagingService.onMessageReceived: notification
 * title/body, else data.title/data.body, else the app name.
 */
type Payload = { notification?: { title?: string; body?: string }; data?: Record<string, string> } | null | undefined

const APP_NAME = 'תכלית'
const ICON = '/icons/icon-192.png'

export function notificationFromPush(raw: Payload | string): { title: string; options: NotificationOptions } {
  let payload: Payload = null
  if (typeof raw === 'string') {
    try { payload = JSON.parse(raw) as Payload } catch { payload = null }
  } else {
    payload = raw
  }
  const data = payload?.data ?? {}
  return {
    title: payload?.notification?.title || data.title || APP_NAME,
    options: {
      body: payload?.notification?.body || data.body || '',
      icon: ICON,
      badge: ICON,
      dir: 'auto',
      lang: 'he',
      data,
    },
  }
}

/** Tapping a notification opens the app at its start page, like Android opens the app. */
export function urlToOpen(scope: string): string {
  return scope
}
