import { deleteDeviceToken, registerDeviceToken } from '../api/endpoints'
import { firebaseConfig, isPushConfigured, vapidKey } from '../config'
import * as session from '../session/session'

/**
 * Push notifications in the browser (port of FcmTokenUploader.kt).
 *
 * The web app gets a Firebase Cloud Messaging token through our own service
 * worker (src/sw.ts) and uploads it with platform "web"; the server then
 * sends to it exactly like to Android phones. Nothing happens until the
 * Firebase web config and the push key are in web/.env (isPushConfigured).
 */

/** Push can work here: configured, and the browser has a service worker + Push API. */
export function isPushSupported(): boolean {
  return isPushConfigured()
    && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    && typeof window !== 'undefined' && typeof (window as { PushManager?: unknown }).PushManager === 'function'
    && typeof (window as { Notification?: unknown }).Notification === 'function'
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/** The FCM token for this browser, through our service worker. */
async function fetchFcmToken(): Promise<string | null> {
  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getMessaging, getToken } = await import('firebase/messaging')
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  const registration = await navigator.serviceWorker.ready
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration })
  return token || null
}

async function refreshAndUpload(authToken: string | null): Promise<void> {
  const token = await fetchFcmToken()
  if (!token) return
  session.setPushToken(token)
  if (authToken) await registerDeviceToken(authToken, token)
}

/**
 * Asks for permission (must run from a tap), then gets and uploads the token.
 * Android asks when the main screen opens; browsers allow it only after a tap.
 */
export async function enableNotifications(): Promise<NotificationPermission | 'unsupported' | 'error'> {
  if (!isPushSupported()) return 'unsupported'
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission
    await refreshAndUpload(session.getAuthToken())
    return 'granted'
  } catch {
    return 'error'
  }
}

/** After registration / supervisor login: upload this device's token if permission was given. */
export async function uploadTokenIfPossible(authToken: string): Promise<void> {
  if (!isPushSupported() || notificationPermission() !== 'granted') return
  try {
    await refreshAndUpload(authToken)
  } catch {
    // Best effort, like the Android app.
  }
}

/** Best effort: tells the server to stop sending pushes to this device. */
export async function unregisterToken(authToken: string): Promise<void> {
  const pushToken = session.getPushToken()
  if (!pushToken) return
  try {
    await deleteDeviceToken(authToken, pushToken)
  } catch {
    // ignore
  }
}
