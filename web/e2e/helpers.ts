import type { Page } from '@playwright/test'

export const FAKE = 'http://localhost:4010'

/** Fresh sample data on the fake server and an empty device. */
export async function freshStart(page: Page) {
  await fetch(`${FAKE}/__reset`, { method: 'POST' })
  await page.goto('/main')
  await page.evaluate(() => localStorage.clear())
}

export async function fakeServerState(): Promise<{ users: { email: string; userType: string }[]; sentPushes: unknown[] }> {
  return (await fetch(`${FAKE}/__state`)).json()
}
