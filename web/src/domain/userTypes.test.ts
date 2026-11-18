import { describe, expect, it } from 'vitest'
import { roleDisplayName, SEND_ROLES, USER_TYPES } from './userTypes'

describe('userTypes', () => {
  it('has the six roles of the Android UserType enum, in order', () => {
    expect(USER_TYPES).toEqual(['LEARN_ASKER', 'LEARN_GIVER', 'OFFICE_VOLUNTEER', 'FOOD_VOLUNTEER', 'SUPERVISOR', 'GROUP_COORDINATOR'])
  })

  it('shows each role in Hebrew like RoleHomeActivity.roleDisplayName', () => {
    expect(roleDisplayName('LEARN_ASKER')).toBe('לומד')
    expect(roleDisplayName('LEARN_GIVER')).toBe('מורה / מלמד')
    expect(roleDisplayName('OFFICE_VOLUNTEER')).toBe('מתנדב משרדי')
    expect(roleDisplayName('FOOD_VOLUNTEER')).toBe('מתנדב חלוקת מזון')
    expect(roleDisplayName('GROUP_COORDINATOR')).toBe('רכז קבוצה')
    expect(roleDisplayName('SUPERVISOR')).toBe('מנהל')
    expect(roleDisplayName('SOMETHING_ELSE')).toBe('SOMETHING_ELSE')
  })

  it('lists the send-notification roles like SupervisorSendNotificationActivity', () => {
    expect(SEND_ROLES).toEqual([
      { key: 'LEARN_ASKER', label: 'Learn askers (students)' },
      { key: 'LEARN_GIVER', label: 'Learn givers (teachers)' },
      { key: 'OFFICE_VOLUNTEER', label: 'Office volunteers' },
      { key: 'FOOD_VOLUNTEER', label: 'Food volunteers' },
      { key: 'GROUP_COORDINATOR', label: 'Group coordinators' },
      { key: 'SUPERVISOR', label: 'Supervisors' },
    ])
  })
})
