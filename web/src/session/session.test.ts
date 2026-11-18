import { describe, expect, it } from 'vitest'
import * as session from './session'

describe('session (port of SessionManager.kt)', () => {
  it('is logged out by default', () => {
    expect(session.isLoggedIn()).toBe(false)
    expect(session.getRole()).toBeNull()
    expect(session.getUserName()).toBeNull()
    expect(session.getUserId()).toBe(-1)
    expect(session.getAuthToken()).toBeNull()
  })

  it('remembers the logged-in user under the Android key names', () => {
    session.saveSession({ userId: 42, name: 'דוד', role: 'LEARN_ASKER' })
    session.setAuthToken('jwt-1')
    expect(session.isLoggedIn()).toBe(true)
    expect(session.getRole()).toBe('LEARN_ASKER')
    expect(session.getUserName()).toBe('דוד')
    expect(session.getUserId()).toBe(42)
    expect(session.getAuthToken()).toBe('jwt-1')
    expect(localStorage.getItem('session_role')).toBe('LEARN_ASKER')
    expect(localStorage.getItem('auth_token')).toBe('jwt-1')
  })

  it('treats a blank role as logged out', () => {
    localStorage.setItem('session_role', '  ')
    expect(session.isLoggedIn()).toBe(false)
  })

  it('logout clears the identity and the login token but keeps the push token', () => {
    session.saveSession({ userId: 7, name: 'רחל', role: 'SUPERVISOR' })
    session.setAuthToken('jwt-2')
    session.setPushToken('fcm-1')
    session.logout()
    expect(session.isLoggedIn()).toBe(false)
    expect(session.getUserId()).toBe(-1)
    expect(session.getAuthToken()).toBeNull()
    expect(session.getPushToken()).toBe('fcm-1')
  })
})
