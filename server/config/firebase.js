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
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        || (fs.existsSync(path.join(__dirname, 'firebase-service-account.json'))
            ? path.join(__dirname, 'firebase-service-account.json')
            : path.join(__dirname, 'tachlit-2efd4-firebase-adminsdk-fbsvc-83eead7686.json'));
      if (fs.existsSync(filePath)) {
        credential = admin.credential.cert(require(filePath));
        console.log(`🔥 Firebase Admin: using service account file at ${filePath}`);
      }
    }

    if (!credential) {
      initError = new Error(
        'No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var ' +
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
