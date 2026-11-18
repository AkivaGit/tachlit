/**
 * Role-specific registration details (subjects, schedule, skills, …).
 *
 * Like the Android app, which keeps them in its local Room tables, they are
 * saved only on this device and never sent to the server (difference D6 in
 * PWA_PLAN.md; a server endpoint is planned as phase L1).
 */
export interface StoredRoleDetails {
  role: string
  details: Record<string, string | number>
}

const key = (userId: number) => `role_details_${userId}`

export function saveRoleDetails(userId: number, role: string, details: Record<string, string | number>): void {
  localStorage.setItem(key(userId), JSON.stringify({ role, details }))
}

export function getRoleDetails(userId: number): StoredRoleDetails | null {
  const raw = localStorage.getItem(key(userId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredRoleDetails
  } catch {
    return null
  }
}

export function clearRoleDetails(userId: number): void {
  localStorage.removeItem(key(userId))
}
