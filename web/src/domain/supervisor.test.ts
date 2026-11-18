import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import * as session from '../session/session'
import { S } from '../strings'
import * as sup from './supervisor'

vi.mock('../push/pushClient', () => ({ uploadTokenIfPossible: vi.fn(async () => {}), unregisterToken: vi.fn(async () => {}) }))
import { unregisterToken, uploadTokenIfPossible } from '../push/pushClient'

const A = 'http://api.test'

describe('supervisor (port of SupervisorActivity + TachlitRepository)', () => {
  beforeEach(() => { vi.mocked(uploadTokenIfPossible).mockClear(); vi.mocked(unregisterToken).mockClear() })

  it('logs in with the fixed supervisor email and saves the session', async () => {
    let sent: unknown
    server.use(http.post(`${A}/api/auth/login`, async ({ request }) => { sent = await request.json(); return HttpResponse.json({ success: true, token: 'jwt-s' }) }))
    expect(await sup.loginSupervisor(' pw ')).toEqual({ ok: true, token: 'jwt-s' })
    expect(sent).toEqual({ email: 'supervisor@tachlit.com', password: 'pw' })
    expect(session.getAuthToken()).toBe('jwt-s')
    expect(session.getRole()).toBe('SUPERVISOR')
    expect(session.getUserName()).toBe(S.supervisor_title)
    expect(session.getUserId()).toBe(-1)
    expect(uploadTokenIfPossible).toHaveBeenCalledWith('jwt-s')
  })

  it('returns the field error text on a wrong password', async () => {
    server.use(http.post(`${A}/api/auth/login`, () => HttpResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 })))
    expect(await sup.loginSupervisor('bad')).toEqual({ ok: false, message: 'Invalid password: Login failed: Invalid email or password' })
    expect(session.isLoggedIn()).toBe(false)
  })

  it('explains when the server cannot be reached', async () => {
    server.use(http.post(`${A}/api/auth/login`, () => HttpResponse.error()))
    expect(await sup.loginSupervisor('pw')).toEqual({ ok: false, message: `Invalid password: ${S.server_unreachable}` })
  })

  it('restores the saved token only for a supervisor session', () => {
    expect(sup.savedSupervisorToken()).toBeNull()
    session.saveSession({ userId: 3, name: 'x', role: 'LEARN_ASKER' }); session.setAuthToken('jwt-x')
    expect(sup.savedSupervisorToken()).toBeNull()
    session.saveSession({ userId: -1, name: 'מנהל', role: 'SUPERVISOR' })
    expect(sup.savedSupervisorToken()).toBe('jwt-x')
  })

  it('loads statistics; an expired token is reported as SessionExpiredError', async () => {
    server.use(http.get(`${A}/api/admin/stats`, ({ request }) => request.headers.get('authorization') === 'Bearer good'
      ? HttpResponse.json({ success: true, stats: { learnAskers: 2, learnGivers: 1, totalPairings: 0 } })
      : HttpResponse.json({ success: false, message: 'Token expired' }, { status: 401 })))
    expect(await sup.loadStatistics('good')).toMatchObject({ learnAskers: 2, learnGivers: 1 })
    await expect(sup.loadStatistics('old')).rejects.toBeInstanceOf(sup.SessionExpiredError)
  })

  it('loads all users, or an empty list when that fails (the Android app falls back to its empty local list)', async () => {
    server.use(http.get(`${A}/api/admin/users`, () => HttpResponse.json({ success: true, data: { users: [{ id: 1, name: 'a' }], pagination: {} } })))
    expect(await sup.loadAllUsers('t')).toEqual([{ id: 1, name: 'a' }])
    server.use(http.get(`${A}/api/admin/users`, () => HttpResponse.error()))
    expect(await sup.loadAllUsers('t')).toEqual([])
  })

  it('deletes a user', async () => {
    server.use(http.delete(`${A}/api/admin/users/7`, () => HttpResponse.json({ success: true, message: 'User deleted successfully' })))
    expect(await sup.deleteUser('t', 7)).toEqual({ ok: true })
    server.use(http.delete(`${A}/api/admin/users/8`, () => HttpResponse.json({ success: false, message: 'User not found' }, { status: 404 })))
    expect(await sup.deleteUser('t', 8)).toEqual({ ok: false, message: 'Failed to delete user: User not found' })
  })

  it('sends a push to roles', async () => {
    server.use(http.post(`${A}/api/notifications/send-to-role`, () => HttpResponse.json({ success: true, sent: 2, failed: 1 })))
    expect(await sup.sendPush('t', ['LEARN_ASKER'], 'a', 'b')).toEqual({ ok: true, sent: 2, failed: 1 })
    server.use(http.post(`${A}/api/notifications/send-to-role`, () => HttpResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })))
    expect(await sup.sendPush('t', ['LEARN_ASKER'], 'a', 'b')).toEqual({ ok: false, message: 'Failed to send push: Admin access required' })
  })

  it('supervisor logout keeps the account: only the device is cleared', () => {
    session.saveSession({ userId: -1, name: 'מנהל', role: 'SUPERVISOR' }); session.setAuthToken('jwt-s')
    sup.logoutSupervisor()
    expect(session.isLoggedIn()).toBe(false)
    expect(session.getAuthToken()).toBeNull()
    expect(unregisterToken).toHaveBeenCalledWith('jwt-s')
  })
})
