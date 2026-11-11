# Tachlit – Production Setup Guide

Everything needed to get the Tachlit server running on Render.com again, from
scratch, plus how the Android app connects to it and how push notifications work.

> **This repository is public.** No secret values are written in this file.
> Real secret values live in **`setup.local.md`** next to this file. That file
> stays on the developer's computer only and is ignored by git. See
> [Where the secret values are](#where-the-secret-values-are).

---

## 1. How the pieces fit together

| Piece | What it is | Where |
|---|---|---|
| Android app | Package `org.tachlit.app`, Kotlin | `app/` |
| Server (API) | Node.js + Express, runs on Render as a **Web Service** | `server/` |
| Database | PostgreSQL, runs on Render as a **PostgreSQL** instance | Render dashboard |
| Push notifications | Firebase Cloud Messaging, Firebase project `tachlit-2efd4` | Firebase console |

- The app calls the server at `https://tachlit.onrender.com/`. The address is
  set in `BASE_URL` in `app/src/main/java/org/tachlit/app/network/NetworkModule.kt`.
- The server **refuses to start without a working database**. At startup it
  connects to Postgres, creates all tables, creates the default supervisor
  account, then starts Firebase, then starts listening. If the database step
  fails it logs `FAILED TO START SERVER` and exits, and Render keeps restarting it.
- If the server does not answer at all (requests hang, no response), the first
  thing to check is the database. See [Troubleshooting](#7-troubleshooting).

---

## 2. Create the database (Render PostgreSQL)

1. Render dashboard → **New** → **PostgreSQL**.
2. Pick the **same region** as the web service. The internal address only works
   inside one region.
3. Pick a plan.
   - The **free plan expires after 30 days** and is then deleted, together with
     all data. This is most likely what happened to the original database in 2026.
   - For real use, pick the cheapest paid plan, or use an external Postgres that
     does not expire (for example Neon or Supabase). The server only needs a
     standard `postgresql://` connection string.
4. After it is created, open the database → **Info** page → **Connections** →
   copy the **Internal Database URL**. This is the value for `DATABASE_URL`.

You do **not** need to create tables or run `server/schema.sql` by hand. The
server creates everything on startup (`initializeDatabase()` in
`server/config/database.js`).

---

## 3. Create / check the web service (Render Web Service)

Render dashboard → the **Web Service** (named `tachlit`, address
`https://tachlit.onrender.com`) → **Settings**.

| Setting | Value |
|---|---|
| Repository | `https://github.com/AkivaGit/tachlit` |
| Branch | `main` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` (runs `node server.js`) |
| Health Check Path | `/health` |
| Node version | Taken from `engines.node` in `server/package.json` (currently `>=22`). `firebase-admin` v14 requires Node 22 or newer. |

Every push to `main` triggers a new deploy (if auto-deploy is on).

---

## 4. Environment variables

Set these on the **web service**, not on the database:
web service → **Environment** (left sidebar) → **Environment Variables** →
**Add Environment Variable**. After changing them, save with
**Save, rebuild, and deploy**.

### Required

| Key | Value | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST/DBNAME` | Render database → Info → Connections → **Internal Database URL**. Changes whenever the database is recreated. |
| `NODE_ENV` | `production` | Type it in. Turns on SSL for the database connection (`server/config/database.js`). |
| `JWT_SECRET` | A long random string, for example 64 hex characters | Make one with `openssl rand -hex 32`. The current value is in `setup.local.md`. Changing it logs every user out. If it is missing, part of the login check fails and the rest falls back to a default secret that is public in this repo. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | The **entire contents** of the Firebase service account JSON file | Local copy: `server/config/firebase-service-account.json` (ignored by git). Copy it to the clipboard on a Mac with `pbcopy < server/config/firebase-service-account.json` and paste it as the value. Without it the server runs, but push notifications are disabled. |

To get a **new** Firebase service account key (if the local file is lost):
Firebase console → project `tachlit-2efd4` → ⚙ **Project settings** →
**Service accounts** → **Generate new private key**. Save it as
`server/config/firebase-service-account.json` and never commit it.

### Optional

| Key | Default if not set | Notes |
|---|---|---|
| `JWT_EXPIRES_IN` | `24h` | How long a login token stays valid. |
| `FRONTEND_URL` | `*` | CORS origin. Not needed for the Android app. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | not set | Alternative to the JSON variable: a file path to the key, for example a Render **Secret File** at `/etc/secrets/firebase-service-account.json`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | not set | Same as above, standard Google name. |

### Do not set

| Key | Why |
|---|---|
| `PORT` | Render sets it automatically. |

---

## 5. Deploy and verify

1. Save the environment variables with **Save, rebuild, and deploy**, or use
   **Manual Deploy** → **Deploy latest commit**.
2. Watch **Logs**. A good start prints, in order:
   - `Database connection successful!`
   - `Database tables initialized successfully`
   - `✅ Firebase Admin SDK initialized successfully`
   - `🚀 SERVER STARTED SUCCESSFULLY!`
3. Open `https://tachlit.onrender.com/health` in a browser. Expected:
   ```json
   {"success":true,"message":"Server is running","timestamp":"..."}
   ```
4. In the app, register a new user and log in as supervisor.

On the free web-service plan the server sleeps when idle. The first request
after a sleep can take about a minute.

---

## 6. Accounts and push notifications

### Default supervisor account

Created (or reset) automatically on every server start:

| Field | Value |
|---|---|
| Email | `supervisor@tachlit.com` |
| Password | `admin123` |

The app's Supervisor screen logs in with this account. The password is already
public in this repo's source code, so change it before real production use.

### When notifications are sent

The server sends push notifications in exactly two cases:

1. **New user registers** in any role except supervisor → every phone logged in
   as supervisor gets "New user registered" with the user's name and role.
2. **Supervisor sends one manually** → Supervisor screen → **Send push
   notification** button → pick roles, title and message → every phone
   registered in those roles gets it.

A phone is signed up for notifications only when someone **registers** on it
through a role screen, or **logs in as supervisor** on it. On Android 13+ the
user must also tap **Allow** when the app asks for notification permission.

### Logging out deletes the registration

- When any user **except a supervisor** logs out, the app calls
  `POST /api/auth/logout` and the server **permanently deletes** that user and
  everything linked to it (role details, device tokens, pairings). To come back
  they must register again.
- This works even after the login token expired (default 24h), because that
  route checks the token's signature but not its age.
- If the server can't be reached, the app shows a Hebrew + English popup and
  the user stays logged in, so no record is left behind. They can retry.
- Supervisors keep their account when they log out.
- A supervisor can delete any user by hand: Supervisor screen → **כל המשתמשים**
  (All users) → long-press the user → **כן**.

### After the database is recreated

- All users, pairings and registered phones are gone and cannot be recovered.
- Phones that registered against the old database must **log out and register
  again**. Their saved login points to a user that no longer exists.
- Supervisor phones fix themselves, because the app logs the supervisor in again
  every time it opens.

### Quick test with one phone

1. Supervisor screen → log in with `admin123`.
2. Tap **Send push notification**, tick only **Supervisors**, send.
3. The same phone should receive it.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Requests to the server hang, nothing answers | Server crashes at startup, usually the database | Logs → look for `FAILED TO START SERVER` and the lines under it. Check `DATABASE_URL` and that the database exists. |
| `DATABASE_URL environment variable is not set` | Variable missing | Add it on the web service (section 4). |
| `ENOTFOUND` or `ECONNREFUSED` | Wrong URL, database deleted, or different region | Recreate or check the database, copy the Internal Database URL again. |
| `The server does not support SSL connections` | SSL on, database does not accept it | Use the External Database URL, or remove `NODE_ENV`. |
| `Push notifications are DISABLED` | Firebase key missing | Add `FIREBASE_SERVICE_ACCOUNT_JSON`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON` | Paste was cut or changed | Copy the whole file again with `pbcopy` and paste. |
| Supervisor "Send" says `Sent: 0` | No phones registered for those roles | Register or log in on a phone first (section 6). |
| `npm audit` shows vulnerabilities in the build log | Outdated dependencies | `cd server && npm audit`, then `npm audit fix`. Commit `package.json` and `package-lock.json`. |

---

## 8. Running the server locally

Requires Node 22+ and a local PostgreSQL.

```bash
cd server
npm install
```

Create `server/.env` (ignored by git):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/tachlit_db
NODE_ENV=development
JWT_SECRET=any-local-secret
```

Put the Firebase key at `server/config/firebase-service-account.json` if you
want push locally. Then:

```bash
npm run dev     # or: npm start
curl http://localhost:3000/health
```

---

## 9. Android release build and signing (Play Store)

Debug and release builds run the **same code**: same app ID (`org.tachlit.app`),
same server, same Firebase project. The difference is the signing key.

| | Debug | Release |
|---|---|---|
| Signed with | Android's shared debug key (`~/.android/debug.keystore`) | The Tachlit upload key (below) |
| Debuggable | Yes | No |
| Accepted by Google Play | No | Yes |

### The upload key (keystore)

| Item | Value |
|---|---|
| Keystore file | `~/Documents/tachlit.jks` on the developer's Mac (`/Users/akivamidrag/Documents/tachlit.jks`) |
| Key alias | `tachkey` |
| Certificate owner | `CN=Tachlit` |
| Created | 2026-11-09, valid until 2051-11-03 |
| SHA-1 | `B0:2E:FE:BD:88:C0:9C:0C:BE:6A:25:CA:BC:7C:9D:0E:4B:1E:78:30` |
| SHA-256 | `F1:69:A9:FE:41:4F:15:45:B9:B4:00:5E:3E:70:39:AD:32:31:17:DE:77:AA:29:D2:D2:36:94:76:36:AF:70:21` |
| Passwords | **Not stored in this repo.** See `setup.local.md`. |

- The keystore is **outside the repository** and must never be committed.
  `*.jks` and `*.keystore` are in `.gitignore` as a safety net.
- **Back it up** (file + passwords), for example in a password manager.
  Without it no app update can be uploaded until Google approves an upload-key
  reset in Play Console.
- Check which key signed a bundle:
  ```bash
  keytool -printcert -jarfile app/release/app-release.aab
  ```
  The SHA-256 must match the table above.

### Making a release

1. Raise `versionCode` (and usually `versionName`) in `app/build.gradle.kts`.
   Google Play rejects a bundle whose `versionCode` is not higher than the last
   uploaded one.
2. Android Studio → **Build** → **Generate Signed App Bundle or APK** →
   **Android App Bundle** → keystore `~/Documents/tachlit.jks`, alias `tachkey`
   → build type **release**.
3. Output: `app/release/app-release.aab` (ignored by git). Upload it in Play Console.

Debug and release cannot be installed side by side on one phone, because they
share the app ID. Installing debug over a Play Store install fails with a
signature mismatch. Uninstall first, which also deletes the saved login.

---

## 10. Files that must never be committed

Already in `.gitignore`:

| File | Why |
|---|---|
| `server/config/firebase-service-account.json` | Firebase private key, full admin access to the Firebase project |
| `server/config/*-firebase-adminsdk-*.json` | Same, with Firebase's default download name |
| `server/.env` | Local secrets |
| `setup.local.md` | Real production secret values |
| `app/release/` | Signed release builds (APK/AAB) |
| `*.jks`, `*.keystore` | Android signing keys. The real one lives outside the repo at `~/Documents/tachlit.jks`. |

`app/google-services.json` **is** committed on purpose. It is the Android client
config and is meant to ship inside the app.

---

## Where the secret values are

For a person or an AI assistant picking this up later:

| Secret | Location |
|---|---|
| Real values of `JWT_SECRET`, `DATABASE_URL`, and notes | `setup.local.md` at the repo root, on the developer's Mac only |
| Firebase service account key | `server/config/firebase-service-account.json`, on the developer's Mac only |
| Android upload key (keystore) | `~/Documents/tachlit.jks`, on the developer's Mac only. Alias and passwords: `setup.local.md`. |
| Live values actually in use | Render dashboard → web service → Environment |

If `setup.local.md` is missing (new computer, fresh clone), the live values can
always be read back from the Render dashboard.
