/**
 * App configuration. Values come from Vite environment variables (web/.env);
 * all of them are public by design (no secrets in the web app).
 */
const env = import.meta.env

/** The Tachlit server. Same server as the Android app. */
export const apiBaseUrl: string = (env.VITE_API_BASE_URL || 'https://tachlit.onrender.com').replace(/\/+$/, '')

/** Firebase web app config (Firebase console → Project settings → Your apps → Web). */
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
}

/** Public web-push key (Cloud Messaging → Web Push certificates). */
export const vapidKey: string = env.VITE_FIREBASE_VAPID_KEY ?? ''

/** Push works only after the Firebase web config and the push key are filled in. */
export function isPushConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.messagingSenderId && vapidKey)
}
