import { NetworkError } from '../api/client'
import { logout } from '../api/endpoints'
import { describeServerError } from '../api/serverError'
import { unregisterToken } from '../push/pushClient'
import { clearRoleDetails } from '../session/roleDetails'
import * as session from '../session/session'
import { S } from '../strings'

export type LogoutResult = { ok: true } | { ok: false; message: string }

/**
 * Logging out deletes the registration (every role except supervisor).
 * Port of TachlitRepository.deleteRegistrationOnLogout + RoleHomeActivity.
 *
 * Succeeds when the record is gone (or was already gone), or when this device
 * has no server login to delete with. A 401 means the saved token is no longer
 * valid; the device cannot delete the record then, so logout continues.
 * Fails on network or server errors, so the user stays logged in and can retry.
 */
export async function deleteRegistrationOnLogout(): Promise<LogoutResult> {
  const token = session.getAuthToken()
  try {
    if (token) {
      const res = await logout(token)
      if (!res.ok && res.status !== 401) {
        return { ok: false, message: describeServerError(res.status, res.raw) }
      }
      void unregisterToken(token)
    }
  } catch (error) {
    if (error instanceof NetworkError) return { ok: false, message: S.server_unreachable }
    return { ok: false, message: S.registration_failed_unknown }
  }

  clearRoleDetails(session.getUserId())
  session.logout()
  return { ok: true }
}
