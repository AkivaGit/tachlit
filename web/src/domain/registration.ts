import { NetworkError } from '../api/client'
import { register } from '../api/endpoints'
import { describeServerError } from '../api/serverError'
import type { UserData } from '../api/types'
import { uploadTokenIfPossible } from '../push/pushClient'
import { saveRoleDetails } from '../session/roleDetails'
import * as session from '../session/session'
import { S } from '../strings'
import { roleDetailsFrom, type FormDef } from './forms'

export type RegistrationResult =
  | { ok: true; user: UserData }
  | { ok: false; message: string }

/**
 * Registers the user on the server (port of TachlitRepository.registerUser and
 * the registration activities). On success: saves the login token and the
 * session, keeps the role details on the device, and uploads the push token.
 * On failure: returns the cause to show in the "registration failed" popup.
 */
export async function registerUser(form: FormDef, values: Record<string, string | undefined>): Promise<RegistrationResult> {
  const v = (id: string) => (values[id] ?? '').trim()
  try {
    const res = await register({
      email: v('email'),
      password: v('password'),
      name: v('name'),
      family_name: v('familyName'),
      phone: v('phone'),
      city: v('city'),
      userType: form.role,
    })

    const body = res.data
    if (res.ok && body?.success && body.user) {
      const user = body.user
      if (body.token) session.setAuthToken(body.token)
      session.saveSession({ userId: user.id, name: user.name, role: user.userType })
      saveRoleDetails(user.id, form.role, roleDetailsFrom(form, values))
      if (body.token) void uploadTokenIfPossible(body.token)
      return { ok: true, user }
    }

    const message = res.ok
      ? body?.message?.trim() || `Server error (HTTP ${res.status})`
      : describeServerError(res.status, res.raw)
    return { ok: false, message }
  } catch (error) {
    // The Android app "registers" offline on the phone here; the web app
    // tells the user instead (difference D1).
    if (error instanceof NetworkError) return { ok: false, message: S.server_unreachable }
    return { ok: false, message: S.registration_failed_unknown }
  }
}
