# Tachlit PWA – Work Plan and Status

> **New session? Start here.** Read "Status" and "Next steps" first, then the
> part of the plan you are working on. Every change of state is written in the
> "Progress log" at the bottom. Keep this file up to date as you work.

---

## Status

| | |
|---|---|
| **Current phase** | Phase 11 – publishing (config ready, **waiting on the user**) |
| **Last updated** | 2026-11-18 |
| **Permanent tests** | 149 unit/component (`cd web && npm test`) + 6 end-to-end (`npm run test:e2e`), all passing; typecheck clean; production build OK |
| **App state** | All 12 screens done and matching the Android screenshots within ~1–2 dp; offline + installable; push code ready (off until Firebase config is added) |
| **Blocked on others** | Firebase web config + push key (turns push on), Hosting site + `firebase login` (publishing), phone tests – see §7 |

## Next steps

1. **User:** do the Firebase console steps in §7 and put the values in `web/.env`
   (or send them to Claude). Push turns on by itself once they are filled in.
2. **User:** create the Hosting site (name in `web/.firebaserc`, default
   `tachlit-chesed`), install the Firebase CLI, `firebase login`.
3. **Claude (or user):** `cd web && npm run deploy` → the app is live at
   `https://tachlit-chesed.web.app`.
4. **User:** phase 12 phone tests (§7). Claude fixes what comes up.
5. Later tasks L1–L4 (§6).

---

## 1. Purpose

Build a **Progressive Web App** (PWA) version of the Tachlit Android app, so the
app runs on **iPhone and Android** from a link, without the app stores.

- Same server, same database, same accounts: the PWA calls
  `https://tachlit.onrender.com` exactly like the Android app.
- **The UI must look the same as the Android app** (as seen on a Hebrew phone).
- The Android app stays as it is and keeps working.
- All web code lives in the separate folder `web/`.

## 2. Ground rules

- **TDD:** for every unit, write a failing test first, see it fail, then write
  the code that makes it pass, then tidy up.
- **Permanent tests** stay as the project's test suite (`npm test`,
  `npm run test:e2e`). **Temporary tests** help during the work only; they live
  in `web/tests-temp/` and are listed in section 8 with their status.
- Automated tests **never call the live server**. They use a fake server (MSW in
  unit tests, Playwright request routing in end-to-end tests).
- No secrets in `web/`. The Firebase web config and the web-push public key are
  public by design and may be committed.
- Update this file at every milestone (status, next steps, progress log).

## 3. Decisions

| Topic | Decision | Why |
|---|---|---|
| Framework | React 19 + TypeScript, built with Vite | Most common, easy to maintain |
| Routing | `react-router` with browser history | System back (Android) moves between screens like activities |
| Styling | Plain CSS with variables (`theme.css`) copying Material Components | Pixel control to match Android |
| Units | Android `dp` and `sp` = CSS `px` | 1 dp is 1 CSS pixel on phones |
| Fonts | Self-hosted Roboto + Noto Sans Hebrew (`@fontsource`) | Android's fonts, identical on iPhone |
| Direction | `<html lang="he" dir="rtl">` | Matches the app on a Hebrew phone |
| Unit/component tests | Vitest + Testing Library + jsdom + MSW | Fast, mock the server |
| End-to-end tests | Playwright with the installed Google Chrome, phone viewport 411×914 | Real browser, no download |
| PWA | `vite-plugin-pwa` (injectManifest) + own service worker `src/sw.ts` | Offline app shell + push in one worker |
| Push | Firebase Cloud Messaging for web (`firebase/messaging` `getToken`), server unchanged | Server already sends to FCM tokens; `platform: "web"` |
| Hosting | Firebase Hosting in project `tachlit-2efd4` (site name chosen by the user) | Free, HTTPS, one-command deploy |
| Session storage | `localStorage`, same keys as the Android prefs | Same behaviour as the app |

### Deliberate differences from the Android app

| # | Difference | Reason |
|---|---|---|
| D1 | If the server can't be reached, registration shows the "server unreachable" popup | The Android app silently "registers" offline on the phone only (a bug) |
| D2 | An app dialog "התראות / Notifications" on the main screen (once per session) before the browser's permission request | Android asks with a system dialog when the main screen opens; browsers allow the request only after a tap, iPhone only after install |
| D3 | iPhone "Add to Home Screen" guide | iPhone push works only for installed web apps |
| D4 | A back button on iPhone when installed | Installed iPhone web apps have no system back gesture/button |
| D5 | Dropdowns open the phone's own picker | Native and accessible; the closed field looks the same |
| D6 | Role details (subjects, schedule, …) are saved only on the device | Same as Android today; a server endpoint is a later task (phase L1) |
| D7 | On the 4 screens that are full-screen on Android (splash, main, donations, send), the status bar takes the screen's background colour | A web app can't hide the status bar per screen |
| D8 | The ❤️ on donations is an image of Android's emoji | So iPhone shows the same heart as Android |

## 4. Screens: Android → web

| Android | Web route | Web component |
|---|---|---|
| SplashActivity (logo, 2 s, routes by session) | `/` | `SplashScreen` |
| MainActivity (logo card, title, 7 cards) | `/main` | `MainScreen` |
| LearnAskerActivity | `/register/learn-asker` | `RegistrationScreen` (form def `LEARN_ASKER`) |
| LearnGiverActivity | `/register/learn-giver` | `RegistrationScreen` (`LEARN_GIVER`) |
| OfficeVolunteerActivity | `/register/office-volunteer` | `RegistrationScreen` (`OFFICE_VOLUNTEER`) |
| FoodVolunteerActivity | `/register/food-volunteer` | `RegistrationScreen` (`FOOD_VOLUNTEER`) |
| GroupCoordinatorActivity | `/register/group-coordinator` | `RegistrationScreen` (`GROUP_COORDINATOR`) |
| RoleHomeActivity | `/home` | `RoleHomeScreen` |
| DonationsActivity | `/donations` | `DonationsScreen` |
| SupervisorActivity | `/supervisor` | `SupervisorScreen` |
| SupervisorManagementActivity | `/supervisor/manage/:view` | `ManagementScreen` |
| SupervisorSendNotificationActivity | `/supervisor/send` | `SendNotificationScreen` |
| Loading overlay, AlertDialog, Toast | – | `UiProvider` + `LoadingOverlay`, `Dialog`, `Toast` |

## 5. Files and functions (`web/`)

```
web/
├── package.json             scripts: dev, dev:fake, fake-server, build, preview, test, test:watch,
│                            test:e2e, typecheck, deploy
├── vite.config.ts           React; vite-plugin-pwa (injectManifest → src/sw.ts, manifest); Vitest
│                            (jsdom, setup, VITE_API_BASE_URL=http://api.test so tests never hit production)
├── tsconfig.json / tsconfig.sw.json   app / service-worker type checking
├── playwright.config.ts     e2e: production build (`--mode e2e` → dist-e2e) + fake server, installed Chrome,
│                            411×866 phone viewport
├── index.html               lang=he dir=rtl, theme-color, apple-mobile-web-app tags, icons
├── .env                     PUBLIC settings: VITE_API_BASE_URL, VITE_FIREBASE_* (fill in for push)
├── .env.e2e                 e2e build talks to the fake server
├── firebase.json            Hosting: dist, SPA rewrite, no-cache for sw.js/index.html, long cache for assets
├── .firebaserc              project tachlit-2efd4, hosting target "app" → site "tachlit-chesed" (change if needed)
├── fake-server/server.mjs   Fake Tachlit server (sample data in memory). `npm run fake-server`.
│                            /__reset, /__state for tests. Supervisor password on it: Test1234.
├── reference/android/       Android emulator screenshots (ground truth for the UI), see §9
├── public/
│   ├── icons/               icon-192/512, maskable-512, apple-touch-icon (from play-store/icon-512.png)
│   └── images/              tachlit_logo1.webp (main card), tachlit_logo4.webp (splash)
├── e2e/                     PERMANENT end-to-end tests
│   ├── helpers.ts           freshStart(), fakeServerState()
│   ├── registration.spec.ts main → form → missing-fields popup → server error → register → home →
│   │                        reopen → logout deletes the user on the server
│   ├── supervisor.spec.ts   wrong/right password → stats → all users → long-press delete →
│   │                        back still logged in → send push → logout
│   └── app.spec.ts          splash, donations links, deep link, manifest + offline via service worker
└── src/
    ├── main.tsx             fonts, CSS, <App/>, service-worker registration (production only)
    ├── App.tsx              AppRoutes (all screens, VolunteerGuard), PwaChrome (status bar colour,
    │                        BackButton, InstallGuide), App (UiProvider + BrowserRouter)
    ├── routes.ts            ROUTES (addresses of the screens), asset()
    ├── config.ts            apiBaseUrl, firebaseConfig, vapidKey, isPushConfigured()
    ├── platform.ts          isIos(), isStandalone(), shouldShowInstallGuide(), dismissInstallGuide()
    ├── strings.ts           S = strings.xml (same names; test keeps them equal), K = texts hard-coded in Kotlin, fmt()
    ├── colors.ts            C = colors.xml (same names; test keeps them equal), THEME = Material theme colours
    ├── theme.css            fonts (@font-face), colours, Material look: card, ripple, button, text field,
    │                        spinner, checkbox, dialog, toast, loading overlay, back button, install guide
    ├── screens.css          per-screen layout (dp = px) copied from the Android layouts + calibration
    ├── sw.ts                service worker: precache + offline navigation, push → notification, click → open app
    ├── assets/              fonts/NotoSansHebrew-{Regular,Bold}.woff2 (Android 14's, OFL) + README, heart.png
    ├── api/
    │   ├── types.ts         request/response shapes (as ApiService.kt)
    │   ├── client.ts        request(method, path, {body, token, timeoutMs}) → ApiResponse; NetworkError
    │   ├── serverError.ts   describeServerError(status, rawBody) ← ServerError.kt
    │   └── endpoints.ts     register, login, logout, getAllUsers, deleteUser, getStatistics,
    │                        registerDeviceToken, deleteDeviceToken, sendPushToRoles
    ├── session/
    │   ├── session.ts       saveSession, getRole, getUserName, getUserId, isLoggedIn, get/setAuthToken,
    │   │                    get/setPushToken, logout   ← SessionManager.kt (same key names)
    │   └── roleDetails.ts   save/get/clearRoleDetails (device only, D6)
    ├── domain/
    │   ├── userTypes.ts     USER_TYPES, RegistrableRole, roleDisplayName(), SEND_ROLES
    │   ├── validation.ts    findMissingFields(), missingFieldsMessage() ← BaseActivity.checkRequiredFields
    │   ├── forms.ts         FORMS (5 registration forms as data), requiredFields(), formBySlug(), roleDetailsFrom()
    │   ├── registration.ts  registerUser(form, values)
    │   ├── logout.ts        deleteRegistrationOnLogout()
    │   ├── supervisor.ts    loginSupervisor(), savedSupervisorToken(), loadStatistics(), loadAllUsers(),
    │   │                    deleteUser(), sendPush(), logoutSupervisor(), SessionExpiredError
    │   ├── supervisorState.ts  in-memory "supervisor screen unlocked" flag (screens unmount on web)
    │   └── management.ts    VIEWS, groupUsersByType(), viewConfig(view, users)
    ├── push/
    │   ├── pushClient.ts    isPushSupported(), notificationPermission(), enableNotifications(),
    │   │                    uploadTokenIfPossible(), unregisterToken()   ← FcmTokenUploader.kt
    │   └── swLogic.ts       notificationFromPush(payload), urlToOpen()   ← onMessageReceived
    ├── ui/
    │   ├── UiProvider.tsx   useUi(): showDialog, showToast, showLoading, hideLoading
    │   ├── Dialog.tsx       AlertDialog (Android button order, DialogTitle shrink, per-line direction)
    │   ├── Toast.tsx, LoadingOverlay.tsx, Card.tsx, Button.tsx, Checkbox.tsx, icons.tsx
    │   ├── TextField.tsx    filled field: floating label, multi-line, error icon + bubble, password eye
    │   ├── SelectField.tsx  SpinnerField (experience level), DropdownField (group type)
    │   ├── useLongPress.ts  500 ms long press / right click
    │   ├── script.ts        isLatinOnly() (Latin text uses Roboto line metrics)
    │   ├── NotificationsPrompt.tsx  D2   ├── BackButton.tsx  D4   ├── InstallGuide.tsx  D3
    │   └── useStatusBarColor.ts     D7
    ├── screens/
    │   ├── SplashScreen, MainScreen, RegistrationScreen, RoleHomeScreen, DonationsScreen,
    │   ├── SupervisorScreen, ManagementScreen, SendNotificationScreen (.tsx)
    │   ├── items.tsx        UserItem, LearnerItem, TeacherItem (list rows; long press = delete)
    │   └── Stats.tsx        statistics row
    └── test/
        ├── setup.ts         jest-dom, MSW (onUnhandledFrame: 'error'), cleanup, clear localStorage
        ├── server.ts        MSW server (tests add handlers)
        └── renderApp.tsx    render all routes in memory at a path
```

## 6. Management plan (phases)

Legend: ☐ not started · ◐ in progress · ☑ done

| Phase | What | Who | State |
|---|---|---|---|
| 0 | This plan file | Claude | ☑ |
| 1 | Reference screenshots of every Android screen (Hebrew), into `web/reference/android/` | Claude | ☑ |
| 2 | Scaffold `web/`, test tooling, first red→green test | Claude | ☑ |
| 3 | Logic, TDD: serverError, validation, session, api, userTypes, forms, registration, logout, supervisor, management | Claude | ☑ |
| 4 | UI kit, TDD: Card, Button, TextField, SelectField, Checkbox, Dialog, Toast, LoadingOverlay, UiProvider | Claude | ☑ |
| 5 | Screens, TDD: Splash, Main, Registration ×5, RoleHome, Donations | Claude | ☑ |
| 6 | Staff screens, TDD: Supervisor, Management, SendNotification | Claude | ☑ |
| 7 | Visual match: web vs Android screenshots side by side, tune CSS (temporary tests) | Claude | ☑ |
| 8 | PWA: manifest, icons, service worker, install guide (D3), iPhone back button (D4) | Claude | ☑ |
| 9 | Push: pushClient, service-worker push, enable-notifications (D2) | Claude ☑ code; **needs Firebase config + push key** to switch on | ◐ |
| 10 | Permanent end-to-end suite (Playwright); remove temporary tests | Claude | ☑ |
| 11 | Hosting config and first publish | Claude ☑ config; **needs site + `firebase login`**, then `npm run deploy` | ◐ |
| 12 | Testing on real phones (iPhone 16.4+, Android) and fixes | **User**, then Claude | ☐ |
| L1 | Later: server endpoint for role details (fixes Android too) | Claude + user deploy | ☐ |
| L2 | Later: restrict server CORS to the PWA address (`FRONTEND_URL`) | User (Render setting) | ☐ |
| L3 | Later: custom domain, e.g. `app.tachlit.org.il` | Amuta's domain admin | ☐ |
| L4 | Later: privacy policy mentions the web version | User | ☐ |

## 7. Waiting on other people

| Item | Who | Needed for | Status |
|---|---|---|---|
| Firebase console → ⚙ Project settings → Your apps → **Add app → Web** (any nickname, no Hosting tick needed). Copy apiKey, authDomain, storageBucket, messagingSenderId, appId into `web/.env` (or send them to Claude) | User | Phase 9 | ☐ |
| Firebase console → ⚙ Project settings → **Cloud Messaging** → Web configuration → Web Push certificates → **Generate key pair**; put the key in `VITE_FIREBASE_VAPID_KEY` in `web/.env` | User | Phase 9 | ☐ |
| Firebase console → **Hosting** → Get started → **Add another site** `tachlit-chesed` (if taken: another name, and change it in `web/.firebaserc`) | User | Phase 11 | ☐ |
| `npm install -g firebase-tools`, then `firebase login` in Terminal (opens a browser) | User | Phase 11 | ☐ |
| Decide the address: `<site>.web.app` or `app.tachlit.org.il` | User | Phase 11 / L3 | ☐ |
| OK to create test users on the live server for one manual check (each sends a "new user" push to staff phones; deleted right after) | User | Phase 12 | ☐ not answered; automated tests use a fake server |
| Test on a real iPhone (iOS 16.4+): open link in Safari → Add to Home Screen → enable notifications → register → logout; staff login → send push | User | Phase 12 | ☐ |
| Test on a real Android phone (Chrome): install → same checks | User | Phase 12 | ☐ |
| DNS records for a custom domain (only if chosen) | Amuta's domain admin | L3 | ☐ |

## 8. Tests

### Permanent suite

| Command | What |
|---|---|
| `cd web && npm test` | Vitest: unit + component tests (`src/**/*.test.ts(x)`), fake server via MSW |
| `cd web && npm run test:e2e` | Playwright end-to-end flows (`e2e/`): production build + service worker, installed Chrome, fake server (6 tests) |
| `cd web && npm run typecheck` | TypeScript check |

### Temporary tests (`web/tests-temp/`, run with `npm run test:temp`)

| Test | Purpose | Status |
|---|---|---|
| `tests-temp/shoot.mjs` | Screenshots of web screens in Chrome at the emulator size (411×914 dp, DPR 2.625; viewport minus Android system bars) | removed after phase 7 |
| `tests-temp/compare.py` | Android reference vs web, side by side (crops Android status/navigation bars) | removed after phase 7 |
| `tests-temp/measure.py`, `dialogs.py`, `probe*.mjs` | Edge/height measurements in dp, Android vs web; computed sizes in Chrome | removed after phase 7 |
| `src/zz_unhandled.tmp.test.ts` | Proved MSW fails unmocked requests | removed right after |

To repeat the visual check later: render a screen with Playwright at viewport
411×866 (411×890 for full-screen screens), DPR 2.625, and compare with the
matching file in `web/reference/android/` after cropping its 63 px status bar
and 65 px navigation bar.

## 9. UI fidelity reference

- Device used for reference: emulator `sdk_gphone64_arm64`, Android 14,
  1080×2400 px at 420 dpi = **411×914 dp** (= CSS viewport 411×914, DPR 2.625).
- Status bar colour: `#3700B3` (`purple_700`).
- Colours (from `colors.xml`): main `#449799`, secondary `#B94B55`, background
  `#F5F5F5`, card `#FFF8F6`, surface `#FFFFFF`, text primary `#212121`,
  text secondary `#757575`, success `#4CAF50`, warning `#FF9800`, error `#F44336`,
  colorPrimary `#6200EE` (dialog buttons, default field accents),
  role cards: learn-asker `#E3F2FD`/`#0D47A1`/`#1565C0`, learn-giver
  `#E8F5E8`/`#1B5E20`/`#2E7D32`, supervisor `#FCE4EC`/`#880E4F`/`#C2185B`,
  office `#FFF8E1`/`#E65100`, food `#F3E5F5`/`#4A148C`, group `#E0F7FA`/`#006064`.
- Reference screenshots (`web/reference/android/`, 1080×2400 px, Hebrew):
  `01` splash · `02–03` main · `10–15` learn-asker form, missing-fields popup,
  field errors, filled form, toast · `20` learn-giver · `30` office · `40` food ·
  `50` group coordinator · `60` donations · `70–71` personal area + logout popup ·
  `80–86` supervisor login, wrong password, loading overlay, management, logout
  popup · `90–97` management lists and every dialog · `98–99` send notification.
  Screens with server data were captured against `web/fake-server` (the
  emulator has no internet), using a temporary debug build that was reverted.
- Observed details to copy: filled text fields (grey box, underline, floating
  label), red error icon in empty required fields + black error bubble under the
  first one, toast = white pill with app icon (Android 12+), buttons uppercase
  with letter spacing, dialogs: positive button far left in RTL, list sections
  in management are fixed 600 dp tall with their own scroll, city/level/capacity
  badges in list items are invisible (white on transparent) in the Android app.
- **Calibration results (phase 7, measured with `tests-temp/measure.py` / `dialogs.py`):**
  - Fonts: Hebrew uses **Android 14's own NotoSansHebrew Regular/Bold** (bundled in
    `src/assets/fonts`, OFL) – only 400 and 700 exist, so weight 500 falls back to
    Regular exactly like Android. Latin: `@fontsource/roboto` (same metrics as Android).
  - Line heights: Hebrew lines 1.3618 (font ascent+descent); Latin-only text 1.19 per
    line plus Android's `includeFontPadding` (0.13em top, 0.03em bottom) → classes
    `.latin` (whole text view) and `.latin-line` (one line inside a longer text).
  - Filled text field: 54.5 dp grey + 1.15 dp underline = 55.65 dp; extra lines of a
    multi-line field add 18.75 dp. Grey `rgba(0,0,0,.12)`, underline `.42`, label `.6`.
  - Spinner (experience level) is 24 dp tall (label 21.8 + 8 + 24 + 16).
  - Buttons: MaterialButton has a 6 dp inset above/below the visible background; a
    layout margin adds to it. Hebrew 16sp bold buttons with padding 16 = 53.7 dp.
  - Android margins never collapse: stacked buttons/inputs live in flex columns.
  - Dialog: 358 dp wide on a 411 dp screen, title padding-top 18 dp; a title that
    doesn't fit one line at 20 sp is shown at 18 sp on two lines (AppCompat
    DialogTitle); button bar padding 10 / 10.5 dp; scrim 60% black.
  - Donations heart = the exact Noto Color Emoji bitmap from Android (`src/assets/heart.png`,
    Apache 2.0) at 52.6 × 48.4 dp, opacity .54 (default TextView colour alpha).
  - URLs on the donation buttons break before `.`, `/`, `-` like Android (`<wbr>` +
    non-breaking hyphen).
  - Send screen (AppCompat EditText): underline 7 dp above the view bottom, hint 60%
    black, checkbox labels black, checkbox border 60% black.
  - Result: element positions match the Android screenshots within ~1–2 dp (dialogs,
    forms, buttons, cards, staff screens, send screen).

## 10. Commands

```bash
cd web
npm install            # once
npm run dev            # local dev server (calls the live API)
npm run fake-server    # fake server on :4010 (sample data)
npm run dev:fake       # dev server that talks to the fake server
npm test               # permanent unit/component tests
npm run test:e2e       # permanent end-to-end tests
npm run build          # production build into web/dist
npm run deploy         # build + firebase deploy (after phase 11 setup)
```

---

## Progress log

- **2026-11-18** – Studied the whole Android app (13 screens, 19 server calls,
  colours, strings, behaviour). Checked the live server accepts browser
  requests (CORS `*`, preflight OK) – no server change needed to start.
  Wrote this plan (phase 0 ☑).
- **2026-11-18** – Phase 1 ☑: 60+ reference screenshots of the Android app in
  Hebrew. Built `web/fake-server/server.mjs` to capture screens with sample data
  without touching production (Android source restored afterwards, git clean).
- **2026-11-18** – Phase 2 ☑: `web/` scaffold (Vite 8, React 19, TypeScript 7,
  Vitest 5, MSW 3, Playwright). Note: MSW 3 renamed `onUnhandledRequest` to
  `onUnhandledFrame` – setup.ts uses it so unmocked requests fail the test.
- **2026-11-18** – Phase 3 ☑ (TDD): strings (parity test with strings.xml),
  colors (parity test with colors.xml), serverError, api client + 9 endpoints,
  session, roleDetails, userTypes, validation, forms (5 form definitions),
  registration, logout, supervisor, management. 68 tests green.
- **2026-11-18** – Phases 4–6 ☑ (TDD): UI kit (Card, Button, TextField with
  floating label / error icon / error bubble / password toggle, Spinner and
  dropdown, Checkbox, Dialog with Android button order, Toast, LoadingOverlay,
  UiProvider, useLongPress); all 12 screens with routing (a registered
  volunteer is kept on the personal area like Android). 127 tests green.
  First visual comparison: main screen and forms already very close.
- **2026-11-18** – Phase 7 ☑: measured every screen against the Android shots
  and calibrated (details in §9): Android's own Hebrew font bundled, Android
  line-height rules (Hebrew 1.3618, Latin 1.19 + includeFontPadding), field /
  button / dialog / spinner sizes, AppCompat DialogTitle shrink, no margin
  collapsing (flex columns), exact Android heart emoji. Result within ~1–2 dp.
- **2026-11-18** – Phase 8 ☑: manifest, icons, service worker (precache +
  offline navigation), iPhone back button (D4), install guide (D3), status bar
  colour per screen (D7); logos as WebP (cache 1.5 MB → 0.75 MB).
- **2026-11-18** – Phase 9 code ☑: pushClient (FCM token via our service
  worker, platform "web"), notifications prompt (D2). Off until web/.env has
  the Firebase values. No server change needed.
- **2026-11-18** – Phase 10 ☑: 6 Playwright end-to-end tests (incl. offline),
  all passing; temporary tests removed. Phase 11 config ready (firebase.json,
  .firebaserc). Totals: 149 unit/component + 6 e2e, all green.
