import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import * as session from '../session/session'

const configured = vi.hoisted(() => ({ value: true }))
vi.mock('../config', async (orig) => ({ ...(await orig<typeof import('../config')>()), isPushConfigured: () => configured.value, vapidKey: 'VAPID' }))
const getToken = vi.hoisted(() => vi.fn(async () => 'fcm-web-token-1'))
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []), getApp: vi.fn() }))
vi.mock('firebase/messaging', () => ({ getMessaging: vi.fn(() => ({})), getToken, isSupported: vi.fn(async () => true) }))

import { enableNotifications, isPushSupported, notificationPermission, unregisterToken, uploadTokenIfPossible } from './pushClient'

function browser({ permission = 'default', request = 'granted', push = true }: { permission?: string; request?: string; push?: boolean } = {}) {
  const Notification = Object.assign(function () {}, { permission, requestPermission: vi.fn(async () => { (Notification as { permission: string }).permission = request; return request }) })
  vi.stubGlobal('Notification', Notification)
  if (push) vi.stubGlobal('PushManager', function () {})
  else vi.stubGlobal('PushManager', undefined)
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { ready: Promise.resolve({ scope: '/' }) } })
  return Notification
}

describe('pushClient (port of FcmTokenUploader + the permission request)', () => {
  beforeEach(() => { configured.value = true; getToken.mockClear() })
  afterEach(() => vi.unstubAllGlobals())

  it('is supported only with a service worker, PushManager, Notification and the Firebase config', () => {
    browser()
    expect(isPushSupported()).toBe(true)
    configured.value = false
    expect(isPushSupported()).toBe(false)
    configured.value = true
    browser({ push: false })
    expect(isPushSupported()).toBe(false)   // e.g. iPhone Safari before installing
  })

  it('enable: asks permission, gets the FCM token, keeps it and uploads it for a logged-in user', async () => {
    let uploaded: unknown
    server.use(http.post('http://api.test/api/notifications/register-token', async ({ request }) => { uploaded = await request.json(); return HttpResponse.json({ success: true }) }))
    const N = browser()
    session.setAuthToken('jwt')
    expect(await enableNotifications()).toBe('granted')
    expect(N.requestPermission).toHaveBeenCalled()
    expect(getToken).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ vapidKey: 'VAPID' }))
    expect(session.getPushToken()).toBe('fcm-web-token-1')
    expect(uploaded).toEqual({ token: 'fcm-web-token-1', platform: 'web' })
  })

  it('enable: reports a refusal and gets no token', async () => {
    browser({ request: 'denied' })
    expect(await enableNotifications()).toBe('denied')
    expect(getToken).not.toHaveBeenCalled()
    expect(notificationPermission()).toBe('denied')
  })

  it('upload after login: refreshes the token when permission was given before', async () => {
    let uploaded: unknown
    server.use(http.post('http://api.test/api/notifications/register-token', async ({ request }) => { uploaded = await request.json(); return HttpResponse.json({ success: true }) }))
    browser({ permission: 'granted' })
    await uploadTokenIfPossible('jwt')
    expect(uploaded).toEqual({ token: 'fcm-web-token-1', platform: 'web' })
  })

  it('upload does nothing without permission or config', async () => {
    browser({ permission: 'default' })
    await uploadTokenIfPossible('jwt')   // no handler: a request would fail the test
    configured.value = false
    browser({ permission: 'granted' })
    await uploadTokenIfPossible('jwt')
    expect(getToken).not.toHaveBeenCalled()
  })

  it('unregister tells the server to drop this device', async () => {
    let removed: unknown
    server.use(http.delete('http://api.test/api/notifications/token', async ({ request }) => { removed = await request.json(); return HttpResponse.json({ success: true }) }))
    session.setPushToken('fcm-web-token-1')
    await unregisterToken('jwt')
    expect(removed).toEqual({ token: 'fcm-web-token-1', platform: 'web' })
  })
})
