import { expect, test } from '@playwright/test'
import { fakeServerState, freshStart } from './helpers'

test('staff: login, statistics, lists, delete with long press, send a push, logout', async ({ page }) => {
  await freshStart(page)
  await page.goto('/supervisor')

  await page.getByLabel('סיסמת מנהל').fill('wrong')
  await page.getByRole('button', { name: 'התחבר' }).click()
  await expect(page.getByRole('status')).toHaveText('Login failed')

  await page.getByLabel('סיסמת מנהל').fill('Test1234')
  await page.getByRole('button', { name: 'התחבר' }).click()
  await expect(page.getByText('סטטיסטיקות')).toBeVisible()
  await expect(page.getByTestId('stat-learners')).toHaveText('2')

  await page.getByRole('button', { name: 'כל המשתמשים' }).click()
  await expect(page).toHaveURL(/\/supervisor\/manage\/all_users$/)
  await expect(page.getByText('רחל', { exact: true })).toBeVisible()
  await page.getByText('רחל', { exact: true }).click({ button: 'right' })
  await page.getByRole('dialog', { name: 'מחיקת משתמש' }).getByRole('button', { name: 'כן' }).click()
  await expect(page.getByRole('dialog', { name: 'הצלחה' })).toContainText('המשתמש נמחק בהצלחה')
  await page.getByRole('button', { name: 'אישור' }).click()
  await expect(page.getByText('רחל', { exact: true })).toHaveCount(0)
  expect((await fakeServerState()).users.some((u) => u.email === 'rachel@example.com')).toBe(false)

  // Back on the supervisor screen: still logged in
  await page.goBack()
  await expect(page.getByText('סטטיסטיקות')).toBeVisible()

  await page.getByRole('button', { name: 'Send push notification' }).click()
  await page.getByLabel('Notification title').fill('שלום')
  await page.getByLabel('Notification message').fill('הודעה לכולם')
  await page.getByLabel('Supervisors').check()
  await page.getByRole('button', { name: 'Send notification' }).click()
  await expect(page.getByRole('status')).toHaveText('Sent: 0, failed: 0')
  expect((await fakeServerState()).sentPushes).toEqual([{ roles: ['SUPERVISOR'], title: 'שלום', body: 'הודעה לכולם' }])

  await page.goBack()
  await page.getByRole('button', { name: 'התנתק' }).click()
  await page.getByRole('dialog', { name: 'התנתקות' }).getByRole('button', { name: 'כן' }).click()
  await expect(page).toHaveURL(/\/main$/)
})
