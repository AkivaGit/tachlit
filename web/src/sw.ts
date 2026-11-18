/// <reference lib="webworker" />
/**
 * Service worker: keeps the app working offline (precached app files) and
 * shows push notifications. Built by vite-plugin-pwa (injectManifest).
 * Push display logic lives in push/swLogic.ts (unit-tested).
 */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { notificationFromPush, urlToOpen } from './push/swLogic'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
// Every address of the app (/, /main, /register/…) opens index.html, also offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

self.addEventListener('install', () => { void self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })

// A push from Firebase Cloud Messaging. iPhone requires that every push shows a notification.
self.addEventListener('push', (event) => {
  let raw: unknown = null
  try { raw = event.data?.json() } catch { raw = event.data?.text() ?? null }
  const { title, options } = notificationFromPush(raw as Parameters<typeof notificationFromPush>[0])
  event.waitUntil(self.registration.showNotification(title, options))
})

// Tapping the notification brings the app to the front, or opens it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (windows.length > 0) return windows[0].focus()
    return self.clients.openWindow(urlToOpen(self.registration.scope))
  })())
})
