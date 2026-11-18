import { defineConfig } from '@playwright/test'

/**
 * Permanent end-to-end tests (e2e/). They run the production build (with the
 * service worker) against the fake server – never the live server – in the
 * installed Google Chrome, on a phone-sized screen like the reference device.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 411, height: 866 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    locale: 'he-IL',
  },
  webServer: [
    { command: 'PORT=4010 node fake-server/server.mjs', url: 'http://localhost:4010/health', reuseExistingServer: true },
    { command: 'vite build --mode e2e --outDir dist-e2e && vite preview --outDir dist-e2e --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: false, timeout: 120_000 },
  ],
})
