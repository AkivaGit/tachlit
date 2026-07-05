// Firebase Admin SDK initialization for FCM push notifications.
//
// Credentials are loaded (in priority order) from:
//   1) FIREBASE_SERVICE_ACCOUNT_JSON env var containing the full JSON string
//      (recommended on Render.com – paste the service account JSON into a secret env var).
//   2) A file path in FIREBASE_SERVICE_ACCOUNT_PATH env var.
//   3) The default file at ./config/firebase-service-account.json (for local dev).
//
// If credentials are not provided, push notifications are simply disabled and the
// server keeps running normally (all other endpoints still work).

const path = require('path');
const fs = require('fs');

let admin = null;
let initialized = false;
let initError = null;

const initFirebase = () => {
  if (initialized) return admin;
  try {
    // Lazy-require so the server doesn't crash if the package isn't installed yet.
    admin = require('firebase-admin');

    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = admin.credential.cert(parsed);
        console.log('🔥 Firebase Admin: using FIREBASE_SERVICE_ACCOUNT_JSON env var');
      } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', e.message);
      }
    }

    if (!credential) {
      // Try multiple file-based sources in order
      const candidatePaths = [];

      // 1) Explicit path via FIREBASE_SERVICE_ACCOUNT_PATH
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        candidatePaths.push(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      }

      // 2) Standard Google var: GOOGLE_APPLICATION_CREDENTIALS
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        candidatePaths.push(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      }

      // 3) Local default in this directory
      candidatePaths.push(path.join(__dirname, 'firebase-service-account.json'));

      // 4) The provided concrete filename you added to the repo
      candidatePaths.push(path.join(__dirname, 'tachlit-2efd4-firebase-adminsdk-fbsvc-83eead7686.json'));

      // 5) As a last resort, scan this folder for any *firebase*adminsdk*.json
      try {
        const files = fs.readdirSync(__dirname);
        const guessed = files.find(f => /firebase.*adminsdk.*\.json$/i.test(f));
        if (guessed) candidatePaths.push(path.join(__dirname, guessed));
      } catch (_) {
        // ignore
      }

      // Log environment for debugging (no secrets)
      console.log('ℹ️ Firebase init: __dirname =', __dirname);
      console.log('ℹ️ Firebase init: process.cwd() =', process.cwd());
      console.log('ℹ️ Firebase init: checking credential paths (in order):');
      candidatePaths.forEach((p, i) => console.log(`   [${i + 1}] ${p}`));

      // Pick the first existing file
      const filePath = candidatePaths.find(p => typeof p === 'string' && fs.existsSync(p));
      if (filePath) {
        try {
          credential = admin.credential.cert(require(filePath));
          console.log(`🔥 Firebase Admin: using service account file at ${filePath}`);
        } catch (e) {
          console.error('❌ Failed to load Firebase credential from file:', filePath, '-', e.message);
        }
      }
    }

    if (!credential) {
      initError = new Error(
        'No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var ' +
        'or set FIREBASE_SERVICE_ACCOUNT_PATH/GOOGLE_APPLICATION_CREDENTIALS to a file path, ' +
        'or place server/config/firebase-service-account.json. ' +
        'Push notifications are DISABLED until this is provided.'
      );
      console.warn('⚠️  ' + initError.message);
      admin = null;
      initialized = true;
      return null;
    }

    admin.initializeApp({ credential });
    console.log('✅ Firebase Admin SDK initialized successfully');
    initialized = true;
    return admin;
  } catch (err) {
    initError = err;
    console.error('❌ Failed to initialize Firebase Admin:', err.message);
    admin = null;
    initialized = true;
    return null;
  }
};

const isEnabled = () => {
  if (!initialized) initFirebase();
  return admin !== null;
};

/**
 * Send an FCM push to a list of device tokens.
 * Returns { successCount, failureCount, invalidTokens: string[] }.
 * Silently succeeds with zeros if Firebase isn't configured or tokens list is empty.
 */
const sendToTokens = async ({ tokens, title, body, data }) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }
  if (!isEnabled()) {
    console.warn('sendToTokens: Firebase disabled, skipping push for', tokens.length, 'tokens');
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }

  // Chunk to FCM's 500 tokens per multicast limit.
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  const invalidTokens = [];
  let successCount = 0;
  let failureCount = 0;

  for (const chunk of chunks) {
    const message = {
      tokens: chunk,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: { channelId: 'tachlit_default' }
      }
    };

    try {
      const resp = await admin.messaging().sendEachForMulticast(message);
      successCount += resp.successCount;
      failureCount += resp.failureCount;
      resp.responses.forEach((r, idx) => {
        if (!r.success && r.error) {
          const code = r.error.code || '';
          if (
            code.includes('registration-token-not-registered') ||
            code.includes('invalid-registration-token') ||
            code.includes('invalid-argument')
          ) {
            invalidTokens.push(chunk[idx]);
          }
        }
      });
    } catch (err) {
      console.error('FCM multicast error:', err.message);
      failureCount += chunk.length;
    }
  }

  return { successCount, failureCount, invalidTokens };
};

module.exports = {
  initFirebase,
  isEnabled,
  sendToTokens,
  getInitError: () => initError
};
