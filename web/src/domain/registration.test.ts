import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server'
import * as session from '../session/session'
import { getRoleDetails } from '../session/roleDetails'
import { S } from '../strings'
import { FORMS } from './forms'
import { registerUser } from './registration'

vi.mock('../push/pushClient', () => ({ uploadTokenIfPossible: vi.fn(async () => {}) }))
import { uploadTokenIfPossible } from '../push/pushClient'

const URL = 'http://api.test/api/auth/register'
const values = { name: ' דוד ', familyName: 'כהן', email: 'david@example.com ', password: 'Test1234', phone: '0501234567', city: 'ירושלים', subjectsToLearn: 'גמרא' }
const user = { id: 12, email: 'david@example.com', name: 'דוד', family_name: 'כהן', phone: '0501234567', city: 'ירושלים', userType: 'LEARN_ASKER', is_active: true, created_at: '', updated_at: '' }

describe('registerUser (port of TachlitRepository.registerUser + the role activities)', () => {
  beforeEach(() => vi.mocked(uploadTokenIfPossible).mockClear())

  it('sends trimmed values and the role, then saves the session, token and role details', async () => {
    let sent: unknown
    server.use(http.post(URL, async ({ request }) => {
      sent = await request.json()
      return HttpResponse.json({ success: true, message: 'ok', token: 'jwt-12', user }, { status: 201 })
    }))
    const result = await registerUser(FORMS.LEARN_ASKER, values)
    expect(sent).toEqual({ email: 'david@example.com', password: 'Test1234', name: 'דוד', family_name: 'כהן', phone: '0501234567', city: 'ירושלים', userType: 'LEARN_ASKER' })
    expect(result).toEqual({ ok: true, user })
    expect(session.getAuthToken()).toBe('jwt-12')
    expect(session.getRole()).toBe('LEARN_ASKER')
    expect(session.getUserName()).toBe('דוד')
    expect(session.getUserId()).toBe(12)
    expect(getRoleDetails(12)).toMatchObject({ role: 'LEARN_ASKER', details: { subjectsToLearn: 'גמרא', experienceLevel: 'Beginner' } })
    expect(uploadTokenIfPossible).toHaveBeenCalledWith('jwt-12')
  })

  it('returns the server\'s cause in Hebrew and English and saves nothing', async () => {
    server.use(http.post(URL, () => HttpResponse.json(
      { success: false, message: 'User with this email already exists', message_he: 'כבר קיים משתמש עם כתובת האימייל הזו' }, { status: 400 })))
    expect(await registerUser(FORMS.LEARN_ASKER, values)).toEqual({ ok: false, message: 'כבר קיים משתמש עם כתובת האימייל הזו\n\nUser with this email already exists' })
    expect(session.isLoggedIn()).toBe(false)
    expect(uploadTokenIfPossible).not.toHaveBeenCalled()
  })

  it('handles a 200 reply that says success: false', async () => {
    server.use(http.post(URL, () => HttpResponse.json({ success: false, message: 'Something odd' })))
    expect(await registerUser(FORMS.LEARN_ASKER, values)).toEqual({ ok: false, message: 'Something odd' })
  })

  it('says the server is unreachable instead of registering offline (difference D1)', async () => {
    server.use(http.post(URL, () => HttpResponse.error()))
    expect(await registerUser(FORMS.LEARN_ASKER, values)).toEqual({ ok: false, message: S.server_unreachable })
    expect(session.isLoggedIn()).toBe(false)
  })
})
