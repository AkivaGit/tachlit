# Tachlit – Google Play store listing

Play Console: set the **default language to Hebrew (iw-IL)** and add **English (United States, en-US)**
as a translation. Each language has its own name, short description and full description.
Users see the one that matches their phone's language.

Graphics (same for both languages): `icon-512.png`, `feature-graphic-1024x500.png` in this folder.

---

## Hebrew (iw-IL) – default

### App name (max 30)
```
תכלית – שרשרת החסד והתורה
```

### Short description (max 80)
```
מבקשים חברותא, רוצים ללמד או להתנדב? הצטרפו לשרשרת החסד והתורה של תכלית
```

### Full description (max 4000)
```
תכלית – שרשרת החסד והתורה למען ישראל. לתת זה לקבל.

אפליקציית תכלית מחברת בין מי שמבקש ללמוד תורה, מי שרוצה ללמד ומי שרוצה לתת מזמנו למען הקהילה. ההרשמה לוקחת כמה דקות, והפרטים מגיעים ישירות לצוות העמותה, שיוצר איתכם קשר כדי להתאים לכם חברותא או התנדבות.

מה אפשר לעשות באפליקציה:
• אני רוצה ללמוד – הרשמה לבקשת חברותא ללימוד תורה.
• אני רוצה ללמד – הרשמה להתנדבות כמלמדים ושותפים ללימוד.
• התנדבות משרדית – עזרה בעבודת המשרד של העמותה.
• התנדבות באריזת חבילות מזון – הצטרפות לצוותי האריזה.
• רכזי קבוצות – הרשמה כרכזי קבוצה.
• תרומות – מעבר מהיר לתרומה לתכלית באתר העמותה או דרך J-Give.
• עדכונים – התראות מצוות העמותה ישירות לטלפון.
• אזור אישי – מסך אישי עם התפקיד שלכם, וממנו גם יוצאים מהאפליקציה.

פרטיות
להרשמה נדרשים שם, אימייל, טלפון ועיר. הפרטים משמשים את צוות העמותה בלבד, ואינם נמכרים ואינם משמשים לפרסום. יציאה מהאפליקציה מוחקת את ההרשמה ואת הפרטים שלכם משרתי העמותה.

האפליקציה חינמית ואין בה פרסומות.
```

---

## English (en-US) – translation

### App name (max 30)
```
Tachlit – Kindness & Torah
```

### Short description (max 80)
```
Find a chavruta, teach Torah or volunteer – join Tachlit's chain of kindness
```

### Full description (max 4000)
```
Tachlit – the chain of kindness and Torah for Israel. Giving is receiving.

The Tachlit app connects people who want to learn Torah, people who want to teach, and people who want to give their time to the community. Signing up takes a few minutes, and your details go straight to the Tachlit team, who will contact you to arrange a chavruta (learning partner) or a volunteering role.

What you can do in the app:
• I want to learn – sign up to request a chavruta for Torah study.
• I want to teach – volunteer as a teacher and learning partner.
• Office volunteering – help with the organization's office work.
• Food package volunteering – join the teams that pack food packages.
• Group coordinators – sign up as a group coordinator.
• Donations – donate to Tachlit on the organization's website or through J-Give.
• Updates – notifications from the Tachlit team, straight to your phone.
• Personal area – your own screen showing your role, where you can also log out.

Privacy
Signing up requires your name, email, phone number and city. Your details are used only by the Tachlit team and are never sold or used for advertising. Logging out of the app deletes your registration and your details from Tachlit's servers.

The app is free and has no ads. The app's interface is in Hebrew.
```

---

## Release notes – "What's new" (max 500 per language)
Paste as is; Play Console splits it by the language tags.
```
<iw-IL>
הגרסה הראשונה של תכלית: הרשמה ללימוד בחברותא, ללימוד ולהתנדבות, תרומות ועדכונים מצוות העמותה.
</iw-IL>
<en-US>
First release of Tachlit: sign up to learn, teach or volunteer, donate, and get updates from the Tachlit team.
</en-US>
```

---

## Answers for the Play Console declarations

**Facts from the code:**
- Login is **email + password**. There is **no Google sign-in**.
- Registration asks for: first name, family name, email, password, phone, city, and the chosen role.
  **No age.**
- The extra fields on each form (subjects, goals, schedule, experience, skills, transportation,
  group name, notes…) are saved **only on the phone** and never sent to the server, so they are
  not "collected" in Google's sense. If that changes, update Data safety and the privacy policy.
- The app sends a Firebase Cloud Messaging token (device ID for push) to the server.
- The build includes **Google Analytics for Firebase** (`firebase-analytics`), which collects app
  interactions and device IDs. Nothing in the code uses it, so it can be removed. If it stays, it
  must be declared (rows marked *Analytics* below).
- Registration needs no approval. Logging out deletes a non-staff user's registration from the
  server. Staff (supervisor) accounts are kept.

### Store settings
| Field | Answer |
|---|---|
| Category | Social (or Lifestyle) |
| Contact email | The amuta's email. It is shown publicly and must be answered. |
| Privacy policy URL | Public page with `privacy-policy.md`, e.g. `https://www.tachlit.org.il/privacy` |

### App content
| Declaration | Answer |
|---|---|
| Privacy policy | URL above |
| App access | Some functionality is restricted (text below) |
| Ads | No ads |
| Content rating | Answer "No" to all content questions; no user-to-user chat, no location sharing, no purchases |
| Target audience | 18 and over (keeps the app out of Google's Families rules) |
| News app | No |
| Government app | No |
| Financial features | None. Donations open an external website; no payments in the app |
| Health | No |
| Trader status (EU) | Usually "not a trader" for a free nonprofit app with nothing for sale; the amuta should confirm |

### App access – instructions for reviewers (paste in English)
```
No login is needed to start. On the main screen, tap any registration card
(for example "אני רוצה ללמוד" – I want to learn) and fill in the form with any email.
Rules: password must contain an upper-case letter, a lower-case letter and a digit
(e.g. Test1234); phone digits only (e.g. 0501234567); names letters only.
After registering you reach the personal area. Logging out there deletes the test account.

Staff area: tap the "מנהל" (Supervisor) card on the main screen and log in with:
Email: <supervisor email>
Password: <supervisor password>
```

### Data safety
- Does the app collect or share user data? **Yes**
- Is all data encrypted in transit? **Yes** (HTTPS)
- Can users request that their data be deleted? **Yes**: logging out deletes it; also by email
- Delete-account URL: the deletion section of the privacy policy page
- Shared with third parties? **No**. Hosting (Render) and Firebase are service providers, which
  Google does not count as sharing.

| Data type | Collected | Required | Purposes |
|---|---|---|---|
| Personal info → Name | Yes | Required | App functionality, Account management |
| Personal info → Email address | Yes | Required | App functionality, Account management |
| Personal info → Phone number | Yes | Required | App functionality, Account management |
| Personal info → Address (city only) | Yes | Required | App functionality |
| Personal info → User IDs (account ID) | Yes | Required | Account management |
| Device or other IDs (push token) | Yes | Required | App functionality, Developer communications |
| *Analytics:* App activity → App interactions | Yes | Required | Analytics |
| *Analytics:* Device or other IDs | Yes | Required | Analytics |

For the Analytics rows, Firebase's own list is the reference:
https://firebase.google.com/docs/android/play-data-disclosure

### Screenshots (at least 2, from a phone)
Suggested: main screen, a registration form, the personal area, the donations screen.
Don't show real users' details (avoid the supervisor's users list).
