import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as session from '../session/session'
import { S } from '../strings'
import { renderApp } from '../test/renderApp'
import { server } from '../test/server'

vi.mock('../push/pushClient', () => ({ uploadTokenIfPossible: vi.fn(async () => {}), unregisterToken: vi.fn(async () => {}), isPushSupported: () => false, notificationPermission: () => 'default', enableNotifications: vi.fn() }))

const where = () => screen.getByTestId('location').textContent

describe('SplashScreen', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the logo for 2 seconds, then the main screen when logged out', () => {
    vi.useFakeTimers()
    renderApp('/')
    expect(screen.getByRole('img', { name: S.app_logo })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1900) })
    expect(where()).toBe('/')
    act(() => { vi.advanceTimersByTime(200) })
    expect(where()).toBe('/main')
  })

  it('opens the personal area for a registered user and the supervisor screen for staff', () => {
    vi.useFakeTimers()
    session.saveSession({ userId: 3, name: 'דוד', role: 'LEARN_GIVER' })
    const first = renderApp('/')
    act(() => { vi.advanceTimersByTime(2100) })
    expect(where()).toBe('/home')
    first.unmount()

    session.saveSession({ userId: -1, name: 'מנהל', role: 'SUPERVISOR' })
    renderApp('/')
    act(() => { vi.advanceTimersByTime(2100) })
    expect(where()).toBe('/supervisor')
  })
})

describe('MainScreen', () => {
  it('shows the logo card, the titles and seven cards', () => {
    renderApp('/main')
    expect(screen.getByRole('img', { name: S.app_logo })).toBeInTheDocument()
    expect(screen.getByText(S.app_name)).toBeInTheDocument()
    expect(screen.getByText(S.welcome_subtitle)).toBeInTheDocument()
    expect(screen.getByText(S.choose_your_role)).toBeInTheDocument()
    const cards = screen.getAllByRole('button')
    expect(cards.map((c) => c.textContent)).toEqual([
      S.learn_asker_title + S.learn_asker_description,
      S.learn_giver_title + S.learn_giver_description,
      S.office_volunteer_title + S.office_volunteer_description,
      S.food_volunteer_title + S.food_volunteer_description,
      S.group_coordinator_title + S.group_coordinator_description,
      S.donations_title + S.donations_description,
      S.supervisor_title + S.supervisor_description,
    ])
  })

  it.each([
    [0, '/register/learn-asker'],
    [1, '/register/learn-giver'],
    [2, '/register/office-volunteer'],
    [3, '/register/food-volunteer'],
    [4, '/register/group-coordinator'],
    [5, '/donations'],
    [6, '/supervisor'],
  ])('card %i opens %s', async (index, path) => {
    renderApp('/main')
    await userEvent.click(screen.getAllByRole('button')[index])
    expect(where()).toBe(path)
  })

  it('sends a logged-in volunteer back to the personal area', () => {
    session.saveSession({ userId: 3, name: 'דוד', role: 'LEARN_ASKER' })
    renderApp('/main')
    expect(where()).toBe('/home')
  })
})

describe('RegistrationScreen', () => {
  const user = { id: 21, email: 'd@e.co', name: 'דוד', family_name: 'כהן', phone: '0501234567', city: 'ירושלים', userType: 'LEARN_ASKER', is_active: true, created_at: '', updated_at: '' }

  it('renders the header, sections and fields of the form', () => {
    renderApp('/register/learn-asker')
    expect(screen.getByRole('heading', { name: S.learn_asker_title })).toBeInTheDocument()
    expect(screen.getByText(S.personal_information)).toBeInTheDocument()
    expect(screen.getByText(S.learning_information)).toBeInTheDocument()
    for (const label of [S.name, S.family_name, S.email, S.password, S.phone, S.city, S.subjects_to_learn, S.additional_notes]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText(S.experience_level)).toHaveValue('Beginner')
  })

  it('lists every empty required field in Hebrew and English, marks them and focuses the first', async () => {
    renderApp('/register/learn-giver')
    await userEvent.type(screen.getByLabelText(S.name), 'דוד')
    await userEvent.click(screen.getByRole('button', { name: S.register }))
    const dialog = screen.getByRole('dialog', { name: S.missing_fields_title })
    expect(dialog).toHaveTextContent('• שם משפחה')
    expect(dialog).toHaveTextContent('• Subjects I can teach')
    expect(dialog).not.toHaveTextContent('• שם פרטי')
    // Android focuses the first empty field at once, so its error bubble shows behind the popup.
    expect(screen.getByRole('alert')).toHaveTextContent(S.please_fill_all_fields)
    await userEvent.click(within(dialog).getByRole('button', { name: S.ok }))
    expect(screen.getAllByTestId('tf-error-icon')).toHaveLength(7)
    expect(screen.getByLabelText(S.family_name)).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent(S.please_fill_all_fields)
  })

  it('registers, shows the toast and opens the personal area', async () => {
    server.use(http.post('http://api.test/api/auth/register', () => HttpResponse.json({ success: true, token: 'jwt', user }, { status: 201 })))
    renderApp('/register/learn-asker')
    const fill = async (label: string, text: string) => userEvent.type(screen.getByLabelText(label), text)
    await fill(S.name, 'דוד'); await fill(S.family_name, 'כהן'); await fill(S.email, 'd@e.co')
    await fill(S.password, 'Test1234'); await fill(S.phone, '0501234567'); await fill(S.city, 'ירושלים')
    await userEvent.click(screen.getByRole('button', { name: S.register }))
    await waitFor(() => expect(where()).toBe('/home'))
    expect(screen.getByRole('status')).toHaveTextContent('Registration successful!')
    expect(screen.getByText('שלום דוד')).toBeInTheDocument()
  })

  it('shows the server\'s reason in the "registration failed" popup', async () => {
    server.use(http.post('http://api.test/api/auth/register', () => HttpResponse.json(
      { success: false, message: 'Validation failed', errors: [{ field: 'phone', message: 'Bad phone', message_he: 'טלפון לא תקין' }] }, { status: 400 })))
    renderApp('/register/office-volunteer')
    for (const [label, text] of [[S.name, 'א'], [S.family_name, 'ב'], [S.email, 'a@b.co'], [S.password, 'Test1234'], [S.phone, '12'], [S.city, 'ג'],
      ["כישורים (מחשב, שפות, וכו')", 'מחשב'], ['זמנים פנויים', 'ראשון']]) {
      await userEvent.type(screen.getByLabelText(label), text)
    }
    await userEvent.click(screen.getByRole('button', { name: S.register }))
    const dialog = await screen.findByRole('dialog', { name: S.registration_failed_title })
    expect(dialog).toHaveTextContent('טלפון לא תקין')
    expect(dialog).toHaveTextContent('Bad phone')
    expect(where()).toBe('/register/office-volunteer')
  })

  it('cancel goes back', async () => {
    renderApp('/main')
    await userEvent.click(screen.getAllByRole('button')[0])
    await userEvent.click(screen.getByRole('button', { name: S.cancel }))
    expect(where()).toBe('/main')
  })

  it('group coordinator has the group type dropdown and its buttons inside the form card', () => {
    renderApp('/register/group-coordinator')
    expect(screen.getByLabelText(S.group_type).tagName).toBe('SELECT')
    expect(screen.getByTestId('form-card')).toContainElement(screen.getByRole('button', { name: S.register }))
  })
})

describe('RoleHomeScreen', () => {
  it('greets the user with their role', () => {
    session.saveSession({ userId: 3, name: 'רחל', role: 'FOOD_VOLUNTEER' })
    renderApp('/home')
    expect(screen.getByText('שלום רחל')).toBeInTheDocument()
    expect(screen.getByText('התפקיד שלך: מתנדב חלוקת מזון')).toBeInTheDocument()
    expect(screen.getByText(S.role_home_activities_title)).toBeInTheDocument()
    expect(screen.getByText(S.role_home_activities_empty)).toBeInTheDocument()
  })

  it('without a session goes to the main screen', () => {
    renderApp('/home')
    expect(where()).toBe('/main')
  })

  it('logout asks first, deletes the registration and returns to the main screen', async () => {
    let called = false
    server.use(http.post('http://api.test/api/auth/logout', () => { called = true; return HttpResponse.json({ success: true, deleted: true }) }))
    session.saveSession({ userId: 3, name: 'רחל', role: 'FOOD_VOLUNTEER' }); session.setAuthToken('jwt')
    renderApp('/home')
    await userEvent.click(screen.getByRole('button', { name: S.logout }))
    const dialog = screen.getByRole('dialog', { name: S.logout_confirm_title })
    expect(dialog).toHaveTextContent('Logging out permanently deletes your registration.')
    await userEvent.click(within(dialog).getByRole('button', { name: S.yes }))
    await waitFor(() => expect(where()).toBe('/main'))
    expect(called).toBe(true)
    expect(session.isLoggedIn()).toBe(false)
  })

  it('logout failure shows why and stays', async () => {
    server.use(http.post('http://api.test/api/auth/logout', () => HttpResponse.error()))
    session.saveSession({ userId: 3, name: 'רחל', role: 'FOOD_VOLUNTEER' }); session.setAuthToken('jwt')
    renderApp('/home')
    await userEvent.click(screen.getByRole('button', { name: S.logout }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: S.yes }))
    const failed = await screen.findByRole('dialog', { name: S.logout_failed_title })
    expect(failed).toHaveTextContent('Could not reach the server.')
    expect(where()).toBe('/home')
  })
})

describe('text direction in fields', () => {
  it('empty fields are right-to-left; typed English text gets its own direction (left-aligned like Android)', async () => {
    renderApp('/register/learn-asker')
    const name = screen.getByLabelText(S.name)
    expect(name).toHaveAttribute('dir', 'rtl')
    await userEvent.type(name, 'David')
    expect(name).toHaveAttribute('dir', 'auto')
  })
})

describe('DonationsScreen', () => {
  it('has the two donation links that open outside the app', () => {
    renderApp('/donations')
    const site = screen.getByRole('link', { name: S.donations_url })
    const jgive = screen.getByRole('link', { name: S.jgive_url })
    expect(site).toHaveAttribute('href', S.donations_url)
    expect(jgive).toHaveAttribute('href', S.jgive_url)
    expect(site).toHaveAttribute('target', '_blank')
    expect(screen.getByText(S.donations_link_text)).toBeInTheDocument()
    expect(screen.getByText(S.jgive_link_text)).toBeInTheDocument()
  })

  it('lets the URLs break before . / - like Android', () => {
    renderApp('/donations')
    const site = screen.getByRole('link', { name: S.donations_url })
    expect(site.querySelectorAll('wbr').length).toBeGreaterThan(3)
  })
})
