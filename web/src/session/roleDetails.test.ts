import { describe, expect, it } from 'vitest'
import { clearRoleDetails, getRoleDetails, saveRoleDetails } from './roleDetails'

describe('role details (kept on the device, like the Android Room tables)', () => {
  it('saves, reads and clears the details of a user', () => {
    expect(getRoleDetails(5)).toBeNull()
    saveRoleDetails(5, 'LEARN_GIVER', { subjectsCanTeach: 'גמרא', maxStudents: 3 })
    expect(getRoleDetails(5)).toEqual({ role: 'LEARN_GIVER', details: { subjectsCanTeach: 'גמרא', maxStudents: 3 } })
    clearRoleDetails(5)
    expect(getRoleDetails(5)).toBeNull()
  })

  it('ignores damaged data', () => {
    localStorage.setItem('role_details_9', '{oops')
    expect(getRoleDetails(9)).toBeNull()
  })
})
