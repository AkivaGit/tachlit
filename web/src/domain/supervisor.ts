import { NetworkError } from '../api/client'
import * as api from '../api/endpoints'
import type { StatisticsData, UserData } from '../api/types'
import { unregisterToken, uploadTokenIfPossible } from '../push/pushClient'
import * as session from '../session/session'
import { fmt, K, S } from '../strings'

/** The staff account. The app asks only for the password, like Android. */
export const SUPERVISOR_EMAIL = 'supervisor@tachlit.com'

/** The server rejected the saved login token (expired, or the account is gone). */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

export type LoginResult = { ok: true; token: string } | { ok: false; message: string }

/** Port of SupervisorActivity.handleLogin + TachlitRepository.loginSupervisor. */
export async function loginSupervisor(password: string): Promise<LoginResult> {
  try {
    const res = await api.login(SUPERVISOR_EMAIL, password.trim())
    const token = res.data?.token
    if (res.ok && res.data?.success && token) {
      session.setAuthToken(token)
      session.saveSession({ userId: -1, name: S.supervisor_title, role: 'SUPERVISOR' })
      void uploadTokenIfPossible(token)
      return { ok: true, token }
    }
    const reason = res.data?.message ?? `HTTP ${res.status}`
    return { ok: false, message: fmt(K.invalid_password, `Login failed: ${reason}`) }
  } catch (error) {
    const reason = error instanceof NetworkError ? S.server_unreachable : String(error)
    return { ok: false, message: fmt(K.invalid_password, reason) }
  }
}

/** The token of a saved supervisor session (auto-login after reopening the app). */
export function savedSupervisorToken(): string | null {
  if (session.getRole() !== 'SUPERVISOR') return null
  const token = session.getAuthToken()
  return token && token.trim() !== '' ? token : null
}

export async function loadStatistics(token: string): Promise<StatisticsData> {
  const res = await api.getStatistics(token)
  if (res.ok && res.data?.success && res.data.stats) return res.data.stats
  if (res.status === 401) throw new SessionExpiredError()
  throw new Error(`Failed to fetch statistics: ${res.data?.message ?? `HTTP ${res.status}`}`)
}

/** All users; on any failure an empty list (the Android app falls back to its local copy). */
export async function loadAllUsers(token: string): Promise<UserData[]> {
  try {
    const res = await api.getAllUsers(token)
    return res.ok && res.data?.success && res.data.data ? res.data.data.users : []
  } catch {
    return []
  }
}

export async function deleteUser(token: string, id: number): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await api.deleteUser(token, id)
    if (res.ok && res.data?.success) return { ok: true }
    return { ok: false, message: `Failed to delete user: ${res.data?.message ?? `HTTP ${res.status}`}` }
  } catch (error) {
    return { ok: false, message: error instanceof NetworkError ? S.server_unreachable : String(error) }
  }
}

export async function sendPush(
  token: string, roles: string[], title: string, body: string,
): Promise<{ ok: true; sent: number; failed: number } | { ok: false; message: string }> {
  try {
    const res = await api.sendPushToRoles(token, roles, title, body)
    if (res.ok && res.data?.success) return { ok: true, sent: res.data.sent ?? 0, failed: res.data.failed ?? 0 }
    return { ok: false, message: `Failed to send push: ${res.data?.message ?? `HTTP ${res.status}`}` }
  } catch (error) {
    return { ok: false, message: error instanceof NetworkError ? S.server_unreachable : K.push_failed }
  }
}

/** Supervisors keep their account: only this device is logged out. */
export function logoutSupervisor(): void {
  const token = session.getAuthToken()
  if (token) void unregisterToken(token)
  session.logout()
}
