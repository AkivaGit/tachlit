import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetSupervisorUnlock } from '../domain/supervisorState'
import * as session from '../session/session'
import { K, S } from '../strings'
import { renderApp } from '../test/renderApp'
import { server } from '../test/server'

vi.mock('../push/pushClient', () => ({ uploadTokenIfPossible: vi.fn(async () => {}), unregisterToken: vi.fn(async () => {}), isPushSupported: () => false, notificationPermission: () => 'default', enableNotifications: vi.fn() }))

const A = 'http://api.test'
const where = () => screen.getByTestId('location').textContent
const u = (id: number, name: string, userType: string, extra: Record<string, string> = {}) => ({
  id, name, family_name: 'משפחה', email: `${id}@ex.com`, phone: `05000000${id}`, city: 'ירושלים', userType, is_active: true, created_at: '', updated_at: '', ...extra,
})
const USERS = [u(1, 'System', 'SUPERVISOR'), u(2, 'דוד', 'LEARN_ASKER'), u(3, 'יעקב', 'LEARN_ASKER'), u(4, 'שרה', 'LEARN_GIVER'),
  u(5, 'משה', 'OFFICE_VOLUNTEER'), u(6, 'רחל', 'FOOD_VOLUNTEER'), u(7, 'יוסף', 'GROUP_COORDINATOR')]

function fakeServer() {
  let users = [...USERS]
  server.use(
    http.post(`${A}/api/auth/login`, async ({ request }) => {
      const b = await request.json() as { password: string }
      return b.password === 'Right1'
        ? HttpResponse.json({ success: true, token: 'jwt-s' })
        : HttpResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 })
    }),
    http.get(`${A}/api/admin/stats`, ({ request }) => request.headers.get('authorization') === 'Bearer jwt-s'
      ? HttpResponse.json({ success: true, stats: { learnAskers: 2, learnGivers: 1, totalPairings: 0 } })
      : HttpResponse.json({ success: false, message: 'Token expired' }, { status: 401 })),
    http.get(`${A}/api/admin/users`, () => HttpResponse.json({ success: true, data: { users, pagination: {} } })),
    http.delete(`${A}/api/admin/users/:id`, ({ params }) => {
      users = users.filter((x) => x.id !== Number(params.id))
      return HttpResponse.json({ success: true, message: 'User deleted successfully' })
    }),
  )
}

function loggedInSupervisor(token = 'jwt-s') {
  session.saveSession({ userId: -1, name: S.supervisor_title, role: 'SUPERVISOR' })
  session.setAuthToken(token)
}

describe('SupervisorScreen', () => {
  beforeEach(() => { resetSupervisorUnlock(); fakeServer() })

  it('shows the header and the login card, not the management part', () => {
    renderApp('/supervisor')
    expect(screen.getByText(S.supervisor_title)).toBeInTheDocument()
    expect(screen.getByText(K.supervisor_login_title)).toBeInTheDocument()
    expect(screen.getByLabelText(S.supervisor_password)).toHaveAttribute('type', 'password')
    expect(screen.queryByText(K.statistics)).toBeNull()
  })

  it('empty password: marks the field', async () => {
    renderApp('/supervisor')
    await userEvent.click(screen.getByRole('button', { name: S.login }))
    expect(screen.getByTestId('tf-error-icon')).toBeInTheDocument()
  })

  it('wrong password: error on the field and a "Login failed" toast', async () => {
    renderApp('/supervisor')
    await userEvent.type(screen.getByLabelText(S.supervisor_password), 'nope')
    await userEvent.click(screen.getByRole('button', { name: S.login }))
    expect(await screen.findByRole('status')).toHaveTextContent('Login failed')
    screen.getByLabelText(S.supervisor_password).focus()
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid password: Login failed: Invalid email or password')
  })

  it('right password: statistics, the five buttons, toast', async () => {
    renderApp('/supervisor')
    await userEvent.type(screen.getByLabelText(S.supervisor_password), 'Right1')
    await userEvent.click(screen.getByRole('button', { name: S.login }))
    expect(await screen.findByText(K.statistics)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('stat-learners')).toHaveTextContent('2'))
    expect(screen.getByTestId('stat-teachers')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-pairings')).toHaveTextContent('0')
    for (const label of [S.all_users, S.unmatched_learners, S.available_teachers, S.suggested_matches, S.supervisor_send_notification_button]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByText(K.supervisor_login_title)).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Login successful')
    expect(session.getRole()).toBe('SUPERVISOR')
  })

  it('opened from the splash with a saved session, logs straight in', async () => {
    loggedInSupervisor()
    renderApp('/supervisor', { autoLogin: true })
    expect(await screen.findByText(K.statistics)).toBeInTheDocument()
  })

  it('an expired saved login shows the password form again', async () => {
    loggedInSupervisor('old-token')
    renderApp('/supervisor', { autoLogin: true })
    expect(await screen.findByText(K.supervisor_login_title)).toBeInTheDocument()
    screen.getByLabelText(S.supervisor_password).focus()
    expect(await screen.findByRole('alert')).toHaveTextContent(S.supervisor_session_expired)
  })

  it('opens the four lists and the send screen', async () => {
    loggedInSupervisor()
    renderApp('/supervisor', { autoLogin: true })
    await userEvent.click(await screen.findByRole('button', { name: S.available_teachers }))
    expect(where()).toBe('/supervisor/manage/available_teachers')
  })

  it('logout asks, keeps the account and returns to the main screen', async () => {
    loggedInSupervisor()
    renderApp('/supervisor', { autoLogin: true })
    await userEvent.click(await screen.findByRole('button', { name: S.logout }))
    const dialog = screen.getByRole('dialog', { name: S.logout_confirm_title })
    expect(dialog).toHaveTextContent(S.logout_confirm_message)
    await userEvent.click(within(dialog).getByRole('button', { name: S.yes }))
    expect(where()).toBe('/main')
    expect(session.isLoggedIn()).toBe(false)
  })
})

describe('ManagementScreen', () => {
  beforeEach(() => { resetSupervisorUnlock(); fakeServer(); loggedInSupervisor() })

  it('all users: sections per role with the Android titles and item texts', async () => {
    renderApp('/supervisor/manage/all_users')
    expect(await screen.findByText('דוד')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(K.view_all_users)
    for (const title of [K.all_learners, K.all_teachers, K.section_office_volunteers, K.section_food_volunteers, K.section_supervisors, K.section_group_coordinators]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getByText('אימייל: 5@ex.com')).toBeInTheDocument()
    expect(screen.getByText('טלפון: 050000005')).toBeInTheDocument()
    expect(screen.getAllByText('מקצועות:')).toHaveLength(3)
    expect(screen.getByTestId('stat-learners')).toHaveTextContent('2')
  })

  it('unmatched learners: only the learners section', async () => {
    renderApp('/supervisor/manage/unmatched_learners')
    expect(await screen.findByText('דוד')).toBeInTheDocument()
    expect(screen.queryByText('שרה')).toBeNull()
    expect(screen.queryByRole('heading', { name: K.section_office_volunteers })).toBeNull()
  })

  it('tapping a user shows the details; a learner offers matches (none)', async () => {
    renderApp('/supervisor/manage/all_users')
    await userEvent.click(await screen.findByText('משה'))
    const details = screen.getByRole('dialog', { name: K.user_details_title })
    expect(details).toHaveTextContent('שם: משה משפחה')
    expect(details).toHaveTextContent('אימייל: 5@ex.com')
    await userEvent.click(within(details).getByRole('button', { name: K.close }))

    await userEvent.click(screen.getByText('דוד'))
    const learner = screen.getByRole('dialog', { name: K.learner_details_title })
    expect(learner).toHaveTextContent('רמה: Beginner')
    await userEvent.click(within(learner).getByRole('button', { name: K.suggest_matches_button }))
    expect(screen.getByRole('dialog', { name: K.no_matches_title })).toHaveTextContent('לא נמצאו מורים מתאימים עבור דוד')
  })

  it('suggest-matches and city-filter buttons show the Android demo dialogs', async () => {
    renderApp('/supervisor/manage/all_users')
    await screen.findByText('דוד')
    await userEvent.click(screen.getByRole('button', { name: K.suggest_matches_button }))
    expect(screen.getByRole('dialog', { name: K.suggest_matches_title })).toHaveTextContent(K.suggest_matches_message)
    await userEvent.click(screen.getByRole('button', { name: S.ok }))
    await userEvent.click(screen.getByRole('button', { name: K.filter_by_city_button }))
    await userEvent.click(within(screen.getByRole('dialog', { name: K.filter_title })).getByRole('button', { name: 'חיפה' }))
    expect(screen.getByRole('dialog', { name: K.filter_result_title })).toHaveTextContent('מציג משתמשים מחיפה')
  })

  it('long press deletes a user after confirming, then reloads', async () => {
    renderApp('/supervisor/manage/all_users')
    const item = (await screen.findByText('רחל')).closest('[role="button"]')!
    fireEvent.contextMenu(item)
    const confirm = screen.getByRole('dialog', { name: K.delete_user_title })
    expect(confirm).toHaveTextContent('שם: רחל משפחה')
    await userEvent.click(within(confirm).getByRole('button', { name: S.yes }))
    expect(await screen.findByRole('dialog', { name: K.success_title })).toHaveTextContent(K.user_deleted)
    await waitFor(() => expect(screen.queryByText('רחל')).toBeNull())
  })
})

describe('SendNotificationScreen', () => {
  beforeEach(() => { resetSupervisorUnlock(); loggedInSupervisor() })

  it('needs a title, a message and a role', async () => {
    renderApp('/supervisor/send')
    await userEvent.click(screen.getByRole('button', { name: S.send_notification_send }))
    expect(screen.getByRole('status')).toHaveTextContent(S.send_notification_missing_fields)
    await userEvent.type(screen.getByLabelText(S.send_notification_hint_title), 'כותרת')
    await userEvent.type(screen.getByLabelText(S.send_notification_hint_body), 'תוכן')
    await userEvent.click(screen.getByRole('button', { name: S.send_notification_send }))
    expect(screen.getByRole('status')).toHaveTextContent(S.send_notification_no_role)
  })

  it('sends to the chosen roles and reports the result', async () => {
    let sent: unknown
    server.use(http.post(`${A}/api/notifications/send-to-role`, async ({ request }) => {
      sent = await request.json(); return HttpResponse.json({ success: true, sent: 4, failed: 1 })
    }))
    renderApp('/supervisor/send')
    expect(screen.getAllByRole('checkbox')).toHaveLength(6)
    await userEvent.type(screen.getByLabelText(S.send_notification_hint_title), 'כותרת')
    await userEvent.type(screen.getByLabelText(S.send_notification_hint_body), 'תוכן')
    await userEvent.click(screen.getByLabelText('Food volunteers'))
    await userEvent.click(screen.getByLabelText('Supervisors'))
    await userEvent.click(screen.getByRole('button', { name: S.send_notification_send }))
    expect(await screen.findByText('Sent: 4, failed: 1')).toBeInTheDocument()
    expect(sent).toEqual({ roles: ['FOOD_VOLUNTEER', 'SUPERVISOR'], title: 'כותרת', body: 'תוכן' })
  })
})
