import { S } from '../strings'

/** The roles of the Android app's UserType enum, in the same order. */
export const USER_TYPES = [
  'LEARN_ASKER',
  'LEARN_GIVER',
  'OFFICE_VOLUNTEER',
  'FOOD_VOLUNTEER',
  'SUPERVISOR',
  'GROUP_COORDINATOR',
] as const

export type UserType = (typeof USER_TYPES)[number]

/** Roles a user can register as (the server refuses SUPERVISOR). */
export type RegistrableRole = Exclude<UserType, 'SUPERVISOR'>

/** Hebrew role name shown in the personal area (RoleHomeActivity.roleDisplayName). */
export function roleDisplayName(role: string): string {
  switch (role) {
    case 'LEARN_ASKER': return S.role_learn_asker
    case 'LEARN_GIVER': return S.role_learn_giver
    case 'OFFICE_VOLUNTEER': return S.role_office_volunteer
    case 'FOOD_VOLUNTEER': return S.role_food_volunteer
    case 'GROUP_COORDINATOR': return S.role_group_coordinator
    case 'SUPERVISOR': return S.role_supervisor
    default: return role
  }
}

/** Checkboxes of the send-notification screen, in the Android order and wording. */
export const SEND_ROLES: { key: UserType; label: string }[] = [
  { key: 'LEARN_ASKER', label: 'Learn askers (students)' },
  { key: 'LEARN_GIVER', label: 'Learn givers (teachers)' },
  { key: 'OFFICE_VOLUNTEER', label: 'Office volunteers' },
  { key: 'FOOD_VOLUNTEER', label: 'Food volunteers' },
  { key: 'GROUP_COORDINATOR', label: 'Group coordinators' },
  { key: 'SUPERVISOR', label: 'Supervisors' },
]
