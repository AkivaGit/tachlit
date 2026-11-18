/**
 * The logged-in session on this device. Port of the Android SessionManager,
 * using the same key names as the Android SharedPreferences.
 *
 * A session is active when a role is stored. The role decides which screen
 * opens at start: the supervisor screen or the personal area.
 */
const KEY_ROLE = 'session_role'
const KEY_USER_ID = 'session_user_id'
const KEY_USER_NAME = 'session_user_name'
const KEY_AUTH_TOKEN = 'auth_token'
const KEY_PUSH_TOKEN = 'pending_fcm_token'

export interface SessionInfo {
  userId: number
  name: string
  role: string
}

export function saveSession({ userId, name, role }: SessionInfo): void {
  localStorage.setItem(KEY_ROLE, role)
  localStorage.setItem(KEY_USER_ID, String(userId))
  localStorage.setItem(KEY_USER_NAME, name)
}

export function getRole(): string | null {
  return localStorage.getItem(KEY_ROLE)
}

export function getUserName(): string | null {
  return localStorage.getItem(KEY_USER_NAME)
}

export function getUserId(): number {
  const raw = localStorage.getItem(KEY_USER_ID)
  const id = raw === null ? NaN : Number(raw)
  return Number.isFinite(id) ? id : -1
}

export function isLoggedIn(): boolean {
  return (getRole() ?? '').trim() !== ''
}

/** The server login token (JWT) saved at registration / supervisor login. */
export function getAuthToken(): string | null {
  return localStorage.getItem(KEY_AUTH_TOKEN)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(KEY_AUTH_TOKEN, token)
}

/** This device's push (FCM) token, kept across logins like on Android. */
export function getPushToken(): string | null {
  return localStorage.getItem(KEY_PUSH_TOKEN)
}

export function setPushToken(token: string): void {
  localStorage.setItem(KEY_PUSH_TOKEN, token)
}

/** Clears the identity and the login token on this device. */
export function logout(): void {
  for (const key of [KEY_ROLE, KEY_USER_ID, KEY_USER_NAME, KEY_AUTH_TOKEN]) {
    localStorage.removeItem(key)
  }
}
