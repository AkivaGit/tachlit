const express = require('express');
const DeviceToken = require('../models/DeviceToken');
const { sendToTokens, isEnabled } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All valid roles (must match schema.sql CHECK constraint)
const ALL_ROLES = [
  'LEARN_ASKER',
  'LEARN_GIVER',
  'OFFICE_VOLUNTEER',
  'FOOD_VOLUNTEER',
  'SUPERVISOR',
  'GROUP_COORDINATOR'
];

/**
 * POST /api/notifications/register-token
 * Body: { token: string, platform?: 'android'|'ios' }
 * Auth: Bearer JWT (any authenticated user).
 * Saves/refreshes the caller's FCM device token so the server can push to them.
 */
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ success: false, message: 'Missing or invalid FCM token' });
    }
    await DeviceToken.upsert({
      userId: req.user.id,
      userType: req.user.user_type,
      token,
      platform: platform || 'android'
    });
    return res.json({ success: true, message: 'Device token registered' });
  } catch (err) {
    console.error('register-token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register token' });
  }
});

/**
 * DELETE /api/notifications/token
 * Body: { token: string }
 * Removes a token (call on logout / permission revoked).
 */
router.delete('/token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }
    await DeviceToken.remove(token);
    return res.json({ success: true, message: 'Device token removed' });
  } catch (err) {
    console.error('delete token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete token' });
  }
});

/**
 * POST /api/notifications/send-to-role
 * Body: { roles: string[] | string, title: string, body: string, data?: object }
 * Auth: SUPERVISOR only.
 * Sends a push notification to every device whose user_type matches one of `roles`.
 */
router.post('/send-to-role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let { roles, title, body, data } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'title and body are required' });
    }
    if (typeof roles === 'string') roles = [roles];
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ success: false, message: 'roles must be a non-empty array' });
    }
    const invalid = roles.filter(r => !ALL_ROLES.includes(r));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid role(s): ${invalid.join(', ')}. Valid: ${ALL_ROLES.join(', ')}`
      });
    }

    const tokens = await DeviceToken.findTokensForRoles(roles);
    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No devices registered for the selected role(s).',
        sent: 0,
        failed: 0
      });
    }

    const result = await sendToTokens({
      tokens,
      title,
      body,
      data: { ...(data || {}), type: 'broadcast', roles: roles.join(',') }
    });

    if (result.invalidTokens.length > 0) {
      await DeviceToken.removeMany(result.invalidTokens);
    }

    return res.json({
      success: true,
      message: isEnabled() ? 'Notifications processed' : 'Firebase not configured on server',
      sent: result.successCount,
      failed: result.failureCount,
      cleanedInvalidTokens: result.invalidTokens.length
    });
  } catch (err) {
    console.error('send-to-role error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send notifications' });
  }
});

/**
 * Internal helper: notify all active SUPERVISORS about a newly-registered user.
 * Exported (not an HTTP route) so it can be called from routes/auth.js.
 */
const notifySupervisorsOnNewUser = async (newUser) => {
  try {
    // Only notify when the new user is NOT a supervisor themselves.
    if (!newUser || newUser.user_type === 'SUPERVISOR') return;

    const tokens = await DeviceToken.findTokensForRoles(['SUPERVISOR']);
    if (tokens.length === 0) return;

    const roleLabel = String(newUser.user_type || '').replace(/_/g, ' ').toLowerCase();
    const fullName = [newUser.name, newUser.family_name].filter(Boolean).join(' ');

    const result = await sendToTokens({
      tokens,
      title: 'New user registered',
      body: `${fullName || newUser.email} just registered as ${roleLabel}.`,
      data: {
        type: 'new_user',
        userId: newUser.id,
        userType: newUser.user_type,
        email: newUser.email || ''
      }
    });

    if (result.invalidTokens.length > 0) {
      await DeviceToken.removeMany(result.invalidTokens);
    }
    console.log(`📣 Notified supervisors about new user #${newUser.id} — sent ${result.successCount}, failed ${result.failureCount}`);
  } catch (err) {
    // Never fail user registration because notifications failed.
    console.error('notifySupervisorsOnNewUser error:', err.message);
  }
};

module.exports = router;
module.exports.notifySupervisorsOnNewUser = notifySupervisorsOnNewUser;
