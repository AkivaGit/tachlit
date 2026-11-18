import type { UserData } from '../api/types'
import { K } from '../strings'

/** The four lists the supervisor screen opens (SupervisorManagementActivity view types). */
export const VIEWS = {
  ALL_USERS: 'all_users',
  UNMATCHED_LEARNERS: 'unmatched_learners',
  AVAILABLE_TEACHERS: 'available_teachers',
  SUGGESTED_MATCHES: 'suggested_matches',
} as const

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS]

export interface UserGroups {
  learners: UserData[]
  teachers: UserData[]
  office: UserData[]
  food: UserData[]
  supervisors: UserData[]
  groupCoordinators: UserData[]
}

export function groupUsersByType(users: UserData[]): UserGroups {
  const of = (t: string) => users.filter((u) => u.userType === t)
  return {
    learners: of('LEARN_ASKER'),
    teachers: of('LEARN_GIVER'),
    office: of('OFFICE_VOLUNTEER'),
    food: of('FOOD_VOLUNTEER'),
    supervisors: of('SUPERVISOR'),
    groupCoordinators: of('GROUP_COORDINATOR'),
  }
}

/** A visible section: its title and its users. null = section hidden. */
export interface Section {
  title: string
  users: UserData[]
}

export interface ViewConfig {
  screenTitle: string
  learners: Section | null
  teachers: Section | null
  office: Section | null
  food: Section | null
  supervisors: Section | null
  groupCoordinators: Section | null
  /** The statistics card of this screen counts the lists shown. */
  counts: { learners: number; teachers: number; pairings: number }
}

/** What the management screen shows for each view (port of loadDataBasedOnViewType). */
export function viewConfig(view: ViewType, users: UserData[]): ViewConfig {
  const g = groupUsersByType(users)
  const section = (title: string, list: UserData[]): Section => ({ title, users: list })
  const ifAny = (title: string, list: UserData[]) => (list.length > 0 ? section(title, list) : null)
  const none = { office: null, food: null, supervisors: null, groupCoordinators: null }

  switch (view) {
    case VIEWS.ALL_USERS:
      return {
        screenTitle: K.view_all_users,
        learners: section(K.all_learners, g.learners),
        teachers: section(K.all_teachers, g.teachers),
        office: ifAny(K.section_office_volunteers, g.office),
        food: ifAny(K.section_food_volunteers, g.food),
        supervisors: ifAny(K.section_supervisors, g.supervisors),
        groupCoordinators: ifAny(K.section_group_coordinators, g.groupCoordinators),
        counts: { learners: g.learners.length, teachers: g.teachers.length, pairings: 0 },
      }
    case VIEWS.UNMATCHED_LEARNERS:
      return {
        screenTitle: K.view_unmatched_learners,
        learners: section(K.view_unmatched_learners, g.learners),
        teachers: null,
        ...none,
        counts: { learners: g.learners.length, teachers: 0, pairings: 0 },
      }
    case VIEWS.AVAILABLE_TEACHERS:
      return {
        screenTitle: K.view_available_teachers,
        learners: null,
        teachers: section(K.view_available_teachers, g.teachers),
        ...none,
        counts: { learners: 0, teachers: g.teachers.length, pairings: 0 },
      }
    case VIEWS.SUGGESTED_MATCHES:
      return {
        screenTitle: K.view_suggested_matches,
        learners: section(K.learners_to_match, g.learners),
        teachers: section(K.teachers_to_match, g.teachers),
        ...none,
        counts: { learners: g.learners.length, teachers: g.teachers.length, pairings: 0 },
      }
    default:
      return {
        screenTitle: K.view_other,
        learners: section(K.all_learners, g.learners),
        teachers: section(K.all_teachers, g.teachers),
        ...none,
        counts: { learners: g.learners.length, teachers: g.teachers.length, pairings: 0 },
      }
  }
}
