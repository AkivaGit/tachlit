# Push Notifications (FCM) — Setup Guide

> For the full server setup (Render, database, all environment variables),
> see [`setup.md`](setup.md).

This document explains what was added and the remaining **manual steps** you
need to complete outside the codebase to make push notifications work.

## What was implemented

### Server (Node.js on Render + Postgres)
- `server/config/firebase.js` – initializes the Firebase Admin SDK from either
  a `FIREBASE_SERVICE_ACCOUNT_JSON` env var (recommended for Render) or a JSON
  file at `server/config/firebase-service-account.json`. If credentials are
  missing, the server keeps working — push is just disabled.
- `server/models/DeviceToken.js` – stores FCM device tokens per user.
- New Postgres table `device_tokens` (created automatically by
  `initializeDatabase()` in `server/config/database.js` and also present in
  `server/schema.sql`).
- `server/routes/notifications.js` – three endpoints:
  - `POST /api/notifications/register-token`  (any authenticated user)
  - `DELETE /api/notifications/token`         (any authenticated user)
  - `POST /api/notifications/send-to-role`    (SUPERVISOR-only)
- `server/routes/auth.js` – after a new user is created, the server
  fire-and-forget sends a push to every SUPERVISOR device with title
  `"New user registered"` and the new user's name/role.
- `server/package.json` – added dependency `firebase-admin`.

### Android app
- Firebase BOM 33.5.1 + `firebase-messaging-ktx` added to
  `app/build.gradle.kts`; `google-services` plugin declared in the root
  `build.gradle.kts` and `gradle/libs.versions.toml`.
- `AndroidManifest.xml` – added `POST_NOTIFICATIONS` permission, the
  `TachlitFirebaseMessagingService`, and a default notification channel meta.
- `app/src/main/java/org/tachlit/app/notifications/`:
  - `TachlitFirebaseMessagingService.kt` – receives FCM messages, displays
    system notifications, listens for token rotations.
  - `FcmTokenUploader.kt` – fetches the current FCM token and uploads it to
    the server whenever a user logs in / registers.
- `TachlitRepository.registerUser` now uploads the FCM token after
  registration and also exposes `sendPushToRoles(...)` for the supervisor.
- `SupervisorActivity` – on successful login, the FCM token is uploaded, and
  the management section with a **"Send push notification"** button is shown.
  It opens `SupervisorSendNotificationActivity` (title + message + role
  checkboxes + Send).
- `MainActivity` – requests the runtime `POST_NOTIFICATIONS` permission on
  Android 13+.

## What YOU still need to do

### 1. Create a Firebase project
1. Go to <https://console.firebase.google.com/> → **Add project**.
2. Add an **Android app** with the exact package name **`org.tachlit.app`**
   (matches `applicationId` in `app/build.gradle.kts`).
3. (Optional) skip the SHA-1 step – not needed for FCM.
4. Download **`google-services.json`** and place it at:
   ```
   app/google-services.json
   ```
   Without this file the Android build will fail. This file is per-project;
   do NOT commit real prod credentials to a public repo.

### 2. Generate a service-account JSON for the server
1. Firebase console → ⚙ → **Project settings** → **Service accounts** tab.
2. Click **Generate new private key** → download the JSON.
3. Two ways to give it to the server (pick one):
   - **Render (recommended):** open your Render web-service dashboard →
     Environment → add a secret env var named
     `FIREBASE_SERVICE_ACCOUNT_JSON` whose value is the **entire JSON**
     contents (paste the file as-is, keep the newlines).
   - **Local development:** save the file as
     `server/config/firebase-service-account.json`. **Never commit it.**
     Add to `.gitignore`: `server/config/firebase-service-account.json`.

### 3. Deploy
- Server: on Render, redeploy (or push). It will `npm install firebase-admin`
  and initialize Firebase on startup. Logs should show
  `✅ Firebase Admin SDK initialized successfully`.
- App: rebuild the app in Android Studio after `google-services.json` is
  in place.

### 4. Verify

**Sanity — server started with Firebase:**
```
GET https://tachlit.onrender.com/health
```
and check Render logs for `Firebase Admin SDK initialized successfully`.

**Get a device token registered:**
1. Install the app on a physical Android device (emulator without Google
   Play Services can be flaky for FCM).
2. Grant the notification permission when prompted.
3. Log in as supervisor (Supervisor screen → password `admin123` by default).
4. In the app logs (`adb logcat -s FcmTokenUploader:*`), you should see
   `FCM token registered on server`.

**Test 1 – push to supervisors on new-user registration:**
- Keep the supervisor device logged in.
- On a **second device** (or emulator), open the app, pick any non-supervisor
  role (e.g. Learn Asker) and register a new user.
- Within a few seconds the supervisor device should receive a system
  notification "New user registered — <name> just registered as learn asker".

**Test 2 – supervisor broadcast to a role:**
- On the supervisor device, tap the **"Send push notification"** button
  (in the supervisor screen after login).
- Enter a title and a message, tick e.g. "Learn givers (teachers)", tap Send.
- Every teacher device that has opened the app and granted notifications
  will receive the message.

### Testing without additional devices (curl)
Once you have any authenticated JWT (register through the app or Postman):
```
# Register a fake token for that user
curl -X POST https://tachlit.onrender.com/api/notifications/register-token \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"token":"<real-fcm-token-from-the-app>","platform":"android"}'

# Send a broadcast (SUPERVISOR JWT required)
curl -X POST https://tachlit.onrender.com/api/notifications/send-to-role \
  -H "Authorization: Bearer <SUPERVISOR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"roles":["LEARN_GIVER"],"title":"Hello","body":"World"}'
```
Grab a real FCM token from the app logs (search for
`FCM token registered on server` — the token is logged one line above by
`FirebaseMessaging`).

## Notes / limitations
- The server never fails a registration because of a push error — pushes are
  fire-and-forget.
- Invalid / unregistered FCM tokens returned by Firebase are cleaned up
  automatically from `device_tokens`.
- Multiple devices per user are supported (one row per device token).
- The current supervisor login uses a hard-coded password; consider replacing
  with a real per-user auth flow before shipping.
