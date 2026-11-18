import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import * as session from '../session/session'
import { getRoleDetails, saveRoleDetails } from '../session/roleDetails'
import { S } from '../strings'
import { deleteRegistrationOnLogout } from './logout'

vi.mock('../push/pushClient', () => ({ unregisterToken: vi.fn(async () => {}) }))
import { unregisterToken } from '../push/pushClient'

const URL = 'http://api.test/api/auth/logout'

describe('deleteRegistrationOnLogout (port of RoleHomeActivity.doLogout)', () => {
  beforeEach(() => {
    vi.mocked(unregisterToken).mockClear()
    session.saveSession({ userId: 12, name: 'דוד', role: 'LEARN_ASKER' })
    session.setAuthToken('jwt-12')
    saveRoleDetails(12, 'LEARN_ASKER', { subjectsToLearn: 'גמרא' })
  })

  it('asks the server to delete the registration, then clears the device', async () => {
    let auth: string | null = null
    server.use(http.post(URL, ({ request }) => { auth = request.headers.get('authorization'); return HttpResponse.json({ success: true, deleted: true }) }))
    expect(await deleteRegistrationOnLogout()).toEqual({ ok: true })
    expect(auth).toBe('Bearer jwt-12')
    expect(session.isLoggedIn()).toBe(false)
    expect(session.getAuthToken()).toBeNull()
    expect(getRoleDetails(12)).toBeNull()
    expect(unregisterToken).toHaveBeenCalledWith('jwt-12')
  })

  it('still logs out when the server no longer accepts the token (401)', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })))
    expect(await deleteRegistrationOnLogout()).toEqual({ ok: true })
    expect(session.isLoggedIn()).toBe(false)
  })

  it('logs out without a server call when there is no login token', async () => {
    localStorage.removeItem('auth_token')
    expect(await deleteRegistrationOnLogout()).toEqual({ ok: true })
    expect(session.isLoggedIn()).toBe(false)
  })

  it('keeps the user logged in and explains when the server fails', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ success: false, message: 'DB down', message_he: 'תקלה' }, { status: 500 })))
    expect(await deleteRegistrationOnLogout()).toEqual({ ok: false, message: 'תקלה\n\nDB down' })
    expect(session.isLoggedIn()).toBe(true)
  })

  it('keeps the user logged in when the server cannot be reached', async () => {
    server.use(http.post(URL, () => HttpResponse.error()))
    expect(await deleteRegistrationOnLogout()).toEqual({ ok: false, message: S.server_unreachable })
    expect(session.isLoggedIn()).toBe(true)
  })
})
