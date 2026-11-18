import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import type { UserData } from '../api/types'
import { C } from '../colors'
import { VIEWS, viewConfig, type Section, type ViewType } from '../domain/management'
import { deleteUser, loadAllUsers, savedSupervisorToken } from '../domain/supervisor'
import { fmt, K, S } from '../strings'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useUi } from '../ui/UiProvider'
import { LearnerItem, TeacherItem, UserItem } from './items'
import { Stats } from './Stats'

type ItemKind = 'learner' | 'teacher' | 'user'

/** SupervisorManagementActivity: the lists of users, with details and delete. */
export function ManagementScreen() {
  const { view = VIEWS.ALL_USERS } = useParams()
  const ui = useUi()
  const token = savedSupervisorToken()
  const [users, setUsers] = useState<UserData[] | null>(null)

  const load = useCallback(async () => {
    ui.showLoading()
    const list = token ? await loadAllUsers(token) : []
    ui.hideLoading()
    setUsers(list)
  }, [token, ui])

  useEffect(() => { void load() }, [load])

  const config = viewConfig(view as ViewType, users ?? [])

  // ---- dialogs (texts and buttons exactly as in the Android activity) ----
  const ok = { label: S.ok }
  const close = { label: K.close }

  const showUserDetails = (user: UserData) => ui.showDialog({
    title: K.user_details_title,
    message: `שם: ${user.name} ${user.family_name ?? ''}\nאימייל: ${user.email}\nעיר: ${user.city ?? ''}\nטלפון: ${user.phone ?? ''}`,
    negative: close,
  })

  const showLearnerDetails = (user: UserData) => ui.showDialog({
    title: K.learner_details_title,
    message: `שם: ${user.name}\nעיר: ${user.city ?? ''}\nטלפון: ${user.phone ?? ''}\nמקצועות: \nמטרות: \nזמנים: \nרמה: Beginner\nהערות: `,
    positive: {
      label: K.suggest_matches_button,
      onClick: () => ui.showDialog({ title: K.no_matches_title, message: fmt(K.no_matches_message, user.name), positive: ok }),
    },
    negative: close,
  })

  const showTeacherDetails = (user: UserData) => ui.showDialog({
    title: K.teacher_details_title,
    message: `שם: ${user.name}\nעיר: ${user.city ?? ''}\nטלפון: ${user.phone ?? ''}\nמקצועות: \nניסיון: \nזמנים פנויים: \nמקסימום תלמידים: 3\nסגנון הוראה: `,
    positive: {
      label: K.show_students,
      onClick: () => ui.showDialog({ title: K.teacher_students_title, message: K.teacher_students_message, positive: ok }),
    },
    negative: close,
  })

  const doDelete = async (user: UserData) => {
    ui.showLoading()
    const result = token ? await deleteUser(token, user.id) : { ok: false as const, message: 'No supervisor token available' }
    ui.hideLoading()
    if (result.ok) {
      ui.showDialog({ title: K.success_title, message: K.user_deleted, positive: ok })
      void load()
    } else {
      ui.showDialog({ title: K.error_title, message: fmt(K.delete_failed, result.message), positive: ok })
    }
  }

  const confirmDelete = (user: UserData) => ui.showDialog({
    title: K.delete_user_title,
    message: fmt(K.delete_user_message, user.name, user.family_name ?? '', user.email),
    positive: { label: S.yes, onClick: () => void doDelete(user) },
    negative: { label: S.cancel },
  })

  const suggestMatches = () => ui.showDialog({ title: K.suggest_matches_title, message: K.suggest_matches_message, positive: ok })

  const filterByCity = () => ui.showDialog({
    title: K.filter_title,
    items: [...K.filter_cities],
    onItem: (i) => ui.showDialog({ title: K.filter_result_title, message: fmt(K.filter_result_message, K.filter_cities[i]), positive: ok }),
    negative: { label: S.cancel },
  })

  // ---- sections ----
  const section = (key: string, s: Section | null, defaultTitle: string, background: string, titleColor: string, kind: ItemKind, last = false) => {
    // Before the users arrive, every section is shown with its layout title (like Android).
    const shown = users === null ? { title: defaultTitle, users: [] } : s
    if (!shown) return null
    return (
      <Card key={key} className={`mgmt__section ${last ? 'mgmt__section--last' : ''}`} background={background} radius={12} elevation={4}>
        <h2 className="mgmt__section-title" style={{ color: titleColor }}>{shown.title}</h2>
        <div className="mgmt__list">
          {shown.users.map((user) => {
            const onClick = kind === 'learner' ? () => showLearnerDetails(user) : kind === 'teacher' ? () => showTeacherDetails(user) : () => showUserDetails(user)
            const props = { key: user.id, user, onClick, onLongPress: () => confirmDelete(user) }
            return kind === 'learner' ? <LearnerItem {...props} /> : kind === 'teacher' ? <TeacherItem {...props} /> : <UserItem {...props} />
          })}
        </div>
      </Card>
    )
  }

  return (
    <div className="screen mgmt">
      <h1 className="mgmt__title">{users === null ? K.view_all_users : config.screenTitle}</h1>
      <Card className="mgmt__stats" radius={12} elevation={4}>
        <h2 className="mgmt__stats-title">{K.statistics}</h2>
        <Stats {...(users === null ? { learners: 0, teachers: 0, pairings: 0 } : config.counts)} />
      </Card>
      <div className="mgmt__buttons">
        <Button className="mgmt__button" color={C.warning_color} fontSize={14} onClick={suggestMatches}>{K.suggest_matches_button}</Button>
        <Button className="mgmt__button" color={C.secondary_color} fontSize={14} onClick={filterByCity}>{K.filter_by_city_button}</Button>
      </div>
      {section('learners', config.learners, K.view_unmatched_learners, C.card_learn_asker, C.text_on_light_blue, 'learner')}
      {section('teachers', config.teachers, K.view_available_teachers, C.card_learn_giver, C.text_on_light_green, 'teacher')}
      {section('office', config.office, K.section_office_volunteers, C.card_office_volunteer, C.text_on_light_amber, 'user')}
      {section('food', config.food, K.section_food_volunteers, C.card_food_volunteer, C.text_on_light_purple, 'user')}
      {section('supervisors', config.supervisors, K.section_supervisors, C.card_supervisor, C.text_on_light_pink, 'user')}
      {section('groups', config.groupCoordinators, K.section_group_coordinators, C.card_group_coordinator, C.text_on_light_cyan, 'user', true)}
    </div>
  )
}
