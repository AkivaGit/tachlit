import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackButton } from './BackButton'
import { InstallGuide } from './InstallGuide'
import { statusBarColorFor } from './useStatusBarColor'

vi.mock('../platform', async (orig) => ({ ...(await orig<typeof import('../platform')>()), isIos: vi.fn(), isStandalone: vi.fn(), shouldShowInstallGuide: vi.fn() }))
import * as platform from '../platform'

function Where() { return <div data-testid="where">{useLocation().pathname}</div> }

describe('status bar colour per screen', () => {
  it('blends into the screens that are full-screen on Android, purple elsewhere', () => {
    expect(statusBarColorFor('/')).toBe('#FFFFFF')
    expect(statusBarColorFor('/main')).toBe('#F5F5F5')
    expect(statusBarColorFor('/donations')).toBe('#F5F5F5')
    expect(statusBarColorFor('/supervisor/send')).toBe('#FFFFFF')
    expect(statusBarColorFor('/register/learn-asker')).toBe('#3700B3')
    expect(statusBarColorFor('/home')).toBe('#3700B3')
  })
})

describe('BackButton (iPhone installed app only, difference D4)', () => {
  afterEach(() => vi.mocked(platform.isIos).mockReset())

  const renderAt = (path: string) => render(
    <MemoryRouter initialEntries={['/main', path]} initialIndex={1}>
      <Routes><Route path="*" element={<><BackButton /><Where /></>} /></Routes>
    </MemoryRouter>,
  )

  it('appears on inner screens of the installed iPhone app and goes back', async () => {
    vi.mocked(platform.isIos).mockReturnValue(true); vi.mocked(platform.isStandalone).mockReturnValue(true)
    renderAt('/donations')
    await userEvent.click(screen.getByRole('button', { name: 'חזרה' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/main')
  })

  it('is hidden on Android (system back exists), in Safari, and on root screens', () => {
    vi.mocked(platform.isIos).mockReturnValue(false); vi.mocked(platform.isStandalone).mockReturnValue(true)
    const a = renderAt('/donations'); expect(screen.queryByRole('button', { name: 'חזרה' })).toBeNull(); a.unmount()
    vi.mocked(platform.isIos).mockReturnValue(true); vi.mocked(platform.isStandalone).mockReturnValue(false)
    const b = renderAt('/donations'); expect(screen.queryByRole('button', { name: 'חזרה' })).toBeNull(); b.unmount()
    vi.mocked(platform.isStandalone).mockReturnValue(true)
    renderAt('/home'); expect(screen.queryByRole('button', { name: 'חזרה' })).toBeNull()
  })
})

describe('InstallGuide (iPhone Safari, difference D3)', () => {
  it('explains Add to Home Screen in Hebrew and English and can be closed', async () => {
    vi.mocked(platform.shouldShowInstallGuide).mockReturnValue(true)
    render(<InstallGuide />)
    const guide = screen.getByRole('dialog', { name: 'התקנת תכלית באייפון' })
    expect(guide).toHaveTextContent('הוספה למסך הבית')
    expect(guide).toHaveTextContent('Add to Home Screen')
    await userEvent.click(screen.getByRole('button', { name: 'הבנתי' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem('install_guide_dismissed')).toBe('1')
  })

  it('is not shown elsewhere', () => {
    vi.mocked(platform.shouldShowInstallGuide).mockReturnValue(false)
    render(<InstallGuide />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
