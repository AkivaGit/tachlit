const { query } = require('../config/database');

/**
 * DeviceToken model - stores FCM registration tokens for push notifications.
 *
 * A single user can have multiple tokens (multiple devices). A single token
 * can, over reinstalls, be associated with different users, so we upsert
 * on the token itself.
 */
class DeviceToken {
  /**
   * Upsert a device token for the given user.
   */
  static async upsert({ userId, userType, token, platform = 'android' }) {
    if (!token || token.length < 10) {
      throw new Error('Invalid FCM token');
    }
    const result = await query(
      `INSERT INTO device_tokens (user_id, user_type, token, platform, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (token) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         user_type = EXCLUDED.user_type,
         platform = EXCLUDED.platform,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, userType, token, platform]
    );
    return result.rows[0];
  }

  /**
   * Delete a token (called on logout or when FCM reports it as invalid).
   */
  static async remove(token) {
    await query('DELETE FROM device_tokens WHERE token = $1', [token]);
  }

  static async removeMany(tokens) {
    if (!tokens || tokens.length === 0) return;
    await query('DELETE FROM device_tokens WHERE token = ANY($1::text[])', [tokens]);
  }

  /**
   * Get all tokens for users whose user_type is one of the provided roles.
   * Only includes tokens whose user is still active.
   */
  static async findTokensForRoles(roles) {
    if (!roles || roles.length === 0) return [];
    const result = await query(
      `SELECT dt.token
         FROM device_tokens dt
         JOIN users u ON u.id = dt.user_id
        WHERE dt.user_type = ANY($1::text[])
          AND u.is_active = true`,
      [roles]
    );
    return result.rows.map(r => r.token);
  }

  static async findTokensForUser(userId) {
    const result = await query(
      'SELECT token FROM device_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(r => r.token);
  }
}

module.exports = DeviceToken;
