import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UiProvider } from './UiProvider'
import { NotificationsPrompt, resetNotificationsPrompt } from './NotificationsPrompt'

vi.mock('../push/pushClient', () => ({ isPushSupported: vi.fn(), notificationPermission: vi.fn(), enableNotifications: vi.fn(async () => 'granted') }))
import * as push from '../push/pushClient'

describe('NotificationsPrompt (Android asks for notification permission on the main screen; difference D2)', () => {
  it('asks once, in Hebrew and English, and enables on "allow"', async () => {
    resetNotificationsPrompt()
    vi.mocked(push.isPushSupported).mockReturnValue(true)
    vi.mocked(push.notificationPermission).mockReturnValue('default')
    const { unmount } = render(<UiProvider><NotificationsPrompt /></UiProvider>)
    const dialog = await screen.findByRole('dialog', { name: 'התראות / Notifications' })
    expect(dialog).toHaveTextContent('Allow Tachlit to send you notifications?')
    await userEvent.click(screen.getByRole('button', { name: 'אישור' }))
    expect(push.enableNotifications).toHaveBeenCalled()
    unmount()
    render(<UiProvider><NotificationsPrompt /></UiProvider>)
    expect(screen.queryByRole('dialog')).toBeNull()   // not again in this app session
  })

  it('stays away when push is unsupported or already decided', () => {
    resetNotificationsPrompt()
    vi.mocked(push.isPushSupported).mockReturnValue(false)
    const a = render(<UiProvider><NotificationsPrompt /></UiProvider>)
    expect(screen.queryByRole('dialog')).toBeNull(); a.unmount()
    vi.mocked(push.isPushSupported).mockReturnValue(true)
    vi.mocked(push.notificationPermission).mockReturnValue('granted')
    render(<UiProvider><NotificationsPrompt /></UiProvider>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
