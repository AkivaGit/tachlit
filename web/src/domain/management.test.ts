import { describe, expect, it } from 'vitest'
import type { UserData } from '../api/types'
import { groupUsersByType, viewConfig, VIEWS } from './management'

const u = (id: number, userType: string) => ({ id, userType, name: `u${id}` }) as UserData
const users = [u(1, 'SUPERVISOR'), u(2, 'LEARN_ASKER'), u(3, 'LEARN_ASKER'), u(4, 'LEARN_GIVER'), u(5, 'OFFICE_VOLUNTEER'), u(6, 'FOOD_VOLUNTEER'), u(7, 'GROUP_COORDINATOR')]

describe('management screen logic (port of SupervisorManagementActivity.loadDataBasedOnViewType)', () => {
  it('groups users by role', () => {
    const g = groupUsersByType(users)
    expect(g.learners.map((x) => x.id)).toEqual([2, 3])
    expect(g.teachers.map((x) => x.id)).toEqual([4])
    expect(g.office.map((x) => x.id)).toEqual([5])
    expect(g.food.map((x) => x.id)).toEqual([6])
    expect(g.supervisors.map((x) => x.id)).toEqual([1])
    expect(g.groupCoordinators.map((x) => x.id)).toEqual([7])
  })

  it('all users: every non-empty section, counts from the lists', () => {
    const c = viewConfig(VIEWS.ALL_USERS, users)
    expect(c.screenTitle).toBe('כל המשתמשים')
    expect(c.learners).toMatchObject({ title: 'כל הלומדים' })
    expect(c.teachers).toMatchObject({ title: 'כל המורים' })
    expect(c.office?.users).toHaveLength(1)
    expect(c.supervisors?.users).toHaveLength(1)
    expect(c.counts).toEqual({ learners: 2, teachers: 1, pairings: 0 })
    expect(viewConfig(VIEWS.ALL_USERS, [u(2, 'LEARN_ASKER')]).office).toBeNull()
  })

  it('unmatched learners: learners only', () => {
    const c = viewConfig(VIEWS.UNMATCHED_LEARNERS, users)
    expect(c.screenTitle).toBe('לומדים שלא שובצו')
    expect(c.learners?.title).toBe('לומדים שלא שובצו')
    expect(c.teachers).toBeNull()
    expect([c.office, c.food, c.supervisors, c.groupCoordinators]).toEqual([null, null, null, null])
    expect(c.counts).toEqual({ learners: 2, teachers: 0, pairings: 0 })
  })

  it('available teachers: teachers only', () => {
    const c = viewConfig(VIEWS.AVAILABLE_TEACHERS, users)
    expect(c.screenTitle).toBe('מורים זמינים')
    expect(c.learners).toBeNull()
    expect(c.teachers?.title).toBe('מורים זמינים')
    expect(c.counts).toEqual({ learners: 0, teachers: 1, pairings: 0 })
  })

  it('suggested matches: learners and teachers to match', () => {
    const c = viewConfig(VIEWS.SUGGESTED_MATCHES, users)
    expect(c.screenTitle).toBe('הצעות התאמה')
    expect([c.learners?.title, c.teachers?.title]).toEqual(['לומדים לשיבוץ', 'מורים זמינים לשיבוץ'])
  })

  it('unknown view: the Android fallback', () => {
    const c = viewConfig('something' as never, users)
    expect(c.screenTitle).toBe('ניהול שיבוצים')
    expect([c.learners?.title, c.teachers?.title]).toEqual(['כל הלומדים', 'כל המורים'])
  })
})
