import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import * as api from './endpoints'

/** Records what the endpoint sent and answers with `reply`. */
function capture(method: 'get' | 'post' | 'delete', path: string, reply: unknown = { success: true }) {
  const seen: { url?: string; auth?: string | null; body?: unknown } = {}
  server.use(http[method](`http://api.test${path}`, async ({ request }) => {
    seen.url = request.url
    seen.auth = request.headers.get('authorization')
    const text = await request.text()
    seen.body = text ? JSON.parse(text) : undefined
    return HttpResponse.json(reply as Record<string, unknown>)
  }))
  return seen
}

describe('endpoints (same calls as the Android ApiService)', () => {
  it('register: POST /api/auth/register with the Android field names', async () => {
    const seen = capture('post', '/api/auth/register', { success: true, token: 't', user: { id: 1 } })
    const req = { email: 'a@b.co', password: 'Test1234', name: 'דוד', family_name: 'כהן', phone: '0501234567', city: 'ירושלים', userType: 'LEARN_ASKER' }
    const res = await api.register(req)
    expect(seen.body).toEqual(req)
    expect(seen.auth).toBeNull()
    expect(res.data?.token).toBe('t')
  })

  it('login: POST /api/auth/login', async () => {
    const seen = capture('post', '/api/auth/login', { success: true, token: 't' })
    await api.login('supervisor@tachlit.com', 'pw')
    expect(seen.body).toEqual({ email: 'supervisor@tachlit.com', password: 'pw' })
  })

  it('logout: POST /api/auth/logout with the login token', async () => {
    const seen = capture('post', '/api/auth/logout', { success: true, deleted: true })
    await api.logout('jwt')
    expect(seen.auth).toBe('Bearer jwt')
  })

  it('getAllUsers: GET /api/admin/users?page=1&pageSize=100', async () => {
    const seen = capture('get', '/api/admin/users', { success: true, data: { users: [], pagination: {} } })
    await api.getAllUsers('jwt')
    expect(new URL(seen.url!).search).toBe('?page=1&pageSize=100')
    expect(seen.auth).toBe('Bearer jwt')
  })

  it('deleteUser: DELETE /api/admin/users/{id}', async () => {
    const seen = capture('delete', '/api/admin/users/42')
    await api.deleteUser('jwt', 42)
    expect(seen.auth).toBe('Bearer jwt')
  })

  it('getStatistics: GET /api/admin/stats', async () => {
    const seen = capture('get', '/api/admin/stats', { success: true, stats: { learnAskers: 2 } })
    const res = await api.getStatistics('jwt')
    expect(seen.auth).toBe('Bearer jwt')
    expect(res.data?.stats?.learnAskers).toBe(2)
  })

  it('registerDeviceToken: POST /api/notifications/register-token with platform "web"', async () => {
    const seen = capture('post', '/api/notifications/register-token')
    await api.registerDeviceToken('jwt', 'fcm-token-123')
    expect(seen.body).toEqual({ token: 'fcm-token-123', platform: 'web' })
    expect(seen.auth).toBe('Bearer jwt')
  })

  it('deleteDeviceToken: DELETE /api/notifications/token with a body', async () => {
    const seen = capture('delete', '/api/notifications/token')
    await api.deleteDeviceToken('jwt', 'fcm-token-123')
    expect(seen.body).toEqual({ token: 'fcm-token-123', platform: 'web' })
  })

  it('sendPushToRoles: POST /api/notifications/send-to-role', async () => {
    const seen = capture('post', '/api/notifications/send-to-role', { success: true, sent: 3, failed: 1 })
    const res = await api.sendPushToRoles('jwt', ['LEARN_ASKER'], 'כותרת', 'תוכן')
    expect(seen.body).toEqual({ roles: ['LEARN_ASKER'], title: 'כותרת', body: 'תוכן' })
    expect(res.data).toMatchObject({ sent: 3, failed: 1 })
  })
})
