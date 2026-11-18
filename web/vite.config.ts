import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** The installable-app description (Web App Manifest). */
const manifest = {
  name: 'תכלית – שרשרת החסד והתורה',
  short_name: 'תכלית',
  description: 'שרשרת החסד והתורה למען ישראל',
  lang: 'he',
  dir: 'rtl' as const,
  start_url: '/',
  scope: '/',
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  theme_color: '#3700B3',
  background_color: '#FFFFFF',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
  ],
}

export default defineConfig({
  plugins: [
    react(),
    // Not during unit tests.
    ...(process.env.VITEST ? [] : [VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest,
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,ico}'] },
      devOptions: { enabled: false },
    })]),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Tests talk to a fake address only; MSW answers, nothing can reach production.
    env: { VITE_API_BASE_URL: 'http://api.test' },
  },
})
