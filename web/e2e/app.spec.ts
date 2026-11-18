import { expect, test } from '@playwright/test'
import { freshStart } from './helpers'

test('splash shows the logo, then the main screen', async ({ page }) => {
  await freshStart(page)
  await page.goto('/')
  await expect(page.getByRole('img', { name: 'לוגו אפליקציית תכלית' })).toBeVisible()
  await expect(page).toHaveURL(/\/main$/, { timeout: 5000 })
})

test('donation links open the amuta site and J-Give', async ({ page }) => {
  await page.goto('/donations')
  await expect(page.getByRole('link', { name: 'https://www.tachlit.org.il/donations' })).toHaveAttribute('href', 'https://www.tachlit.org.il/donations')
  await expect(page.getByRole('link', { name: 'https://www.jgive.com/new/en/ils/charity-organizations/3074' })).toHaveAttribute('target', '_blank')
})

test('a deep link works directly (single-page app fallback)', async ({ page }) => {
  await freshStart(page)
  await page.goto('/register/group-coordinator')
  await expect(page.getByRole('heading', { name: 'רכזי קבוצות' })).toBeVisible()
})

test('installable: manifest, icons and a service worker that keeps the app working offline', async ({ page, context }) => {
  await page.goto('/main')
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await page.request.get(manifestHref!)).json()
  expect(manifest).toMatchObject({ short_name: 'תכלית', display: 'standalone', lang: 'he', dir: 'rtl', start_url: '/' })
  expect((await page.request.get('/icons/icon-512.png')).ok()).toBe(true)

  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()   // now controlled by the service worker
  await context.setOffline(true)
  await page.goto('/register/learn-giver')
  await expect(page.getByRole('heading', { name: 'אני רוצה ללמד' })).toBeVisible()
  await context.setOffline(false)
})
