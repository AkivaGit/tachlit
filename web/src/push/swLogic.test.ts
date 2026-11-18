import { describe, expect, it } from 'vitest'
import { notificationFromPush, urlToOpen } from './swLogic'

describe('service worker push logic (like TachlitFirebaseMessagingService.onMessageReceived)', () => {
  it('uses the FCM notification title and body', () => {
    const payload = { notification: { title: 'New user registered', body: 'דוד כהן just registered as learn asker.' }, data: { type: 'new_user' } }
    expect(notificationFromPush(payload)).toEqual({
      title: 'New user registered',
      options: { body: 'דוד כהן just registered as learn asker.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', dir: 'auto', lang: 'he', data: { type: 'new_user' } },
    })
  })

  it('falls back to data.title / data.body, then to the app name', () => {
    expect(notificationFromPush({ data: { title: 'כותרת', body: 'תוכן' } }).title).toBe('כותרת')
    expect(notificationFromPush({ data: { title: 'כותרת', body: 'תוכן' } }).options.body).toBe('תוכן')
    expect(notificationFromPush({}).title).toBe('תכלית')
    expect(notificationFromPush(null).options.body).toBe('')
  })

  it('reads the FCM web payload wrapped in a "notification" + "data" envelope or as JSON text', () => {
    expect(notificationFromPush('{"notification":{"title":"A","body":"B"}}').title).toBe('A')
    expect(notificationFromPush('not json').title).toBe('תכלית')
  })

  it('opens the app at its start page when the notification is tapped (Android opens MainActivity/splash)', () => {
    expect(urlToOpen('https://app.example/')).toBe('https://app.example/')
  })
})
