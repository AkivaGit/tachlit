import { expect, test } from '@playwright/test'
import { fakeServerState, freshStart } from './helpers'

test('a volunteer registers, sees the personal area, and logging out deletes the registration', async ({ page }) => {
  await freshStart(page)
  await page.goto('/main')
  await page.getByRole('button', { name: /אני רוצה ללמוד/ }).click()
  await expect(page).toHaveURL(/\/register\/learn-asker$/)

  // Empty form: Hebrew + English list of missing fields
  await page.getByRole('button', { name: 'הירשם' }).click()
  const missing = page.getByRole('dialog', { name: 'חסרים שדות חובה / Missing required fields' })
  await expect(missing).toContainText('Please fill in the following fields:')
  await missing.getByRole('button', { name: 'אישור' }).click()
  await expect(page.getByLabel('שם', { exact: true })).toBeFocused()

  // A server-side rule (password) comes back in the popup
  await page.getByLabel('שם', { exact: true }).fill('דוד')
  await page.getByLabel('שם משפחה').fill('כהן')
  await page.getByLabel('אימייל').fill('e2e@example.com')
  await page.getByLabel('סיסמה').fill('weak')
  await page.getByLabel('טלפון').fill('0501234567')
  await page.getByLabel('עיר').fill('ירושלים')
  await page.getByRole('button', { name: 'הירשם' }).click()
  await expect(page.getByRole('dialog', { name: 'ההרשמה נכשלה / Registration failed' })).toContainText('Password must contain')
  await page.getByRole('button', { name: 'אישור' }).click()

  await page.getByLabel('סיסמה').fill('Test1234')
  await page.getByRole('button', { name: 'הירשם' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('status')).toHaveText('Registration successful!')
  await expect(page.getByText('שלום דוד')).toBeVisible()
  await expect(page.getByText('התפקיד שלך: לומד')).toBeVisible()
  expect((await fakeServerState()).users.some((u) => u.email === 'e2e@example.com')).toBe(true)

  // Reopening the app goes straight to the personal area
  await page.goto('/')
  await expect(page).toHaveURL(/\/home$/, { timeout: 5000 })

  await page.getByRole('button', { name: 'התנתק' }).click()
  await page.getByRole('dialog', { name: 'התנתקות' }).getByRole('button', { name: 'כן' }).click()
  await expect(page).toHaveURL(/\/main$/)
  expect((await fakeServerState()).users.some((u) => u.email === 'e2e@example.com')).toBe(false)
})
