const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, phone } = req.body;

    // Validate input
    const updateData = {};
    if (firstName !== undefined) {
      if (!firstName.trim() || firstName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'First name must be between 1 and 100 characters'
        });
      }
      updateData.first_name = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim() || lastName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Last name must be between 1 and 100 characters'
        });
      }
      updateData.last_name = lastName.trim();
    }

    if (phone !== undefined) {
      if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }
      updateData.phone = phone;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    // Update user
    await user.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/me/password', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password and update
    const newPasswordHash = await User.hashPassword(newPassword);
    
    const { query } = require('../config/database');
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete current user account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;

    // Require password confirmation for account deletion
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required to delete account'
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete user account
    await user.delete();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;