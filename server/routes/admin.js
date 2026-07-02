const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserId, validatePagination, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users with pagination, sorting, and search
router.get('/users', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search: search.trim(),
      sortBy,
      sortOrder: sortOrder.toUpperCase()
    };

    const result = await User.findAll(options);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: result.users.map(user => user.getPublicData()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/users/:id', validateUserId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user by ID
router.put('/users/:id', validateUserId, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, city, userType, is_active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own user type or status
    if (user.id === req.user.id) {
      if (userType !== undefined && userType !== user.user_type) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own user type'
        });
      }
      if (is_active !== undefined && !is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable your own account'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (userType !== undefined) updateData.user_type = userType;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    await user.update(updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user by ID
router.delete('/users/:id', validateUserId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting their own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.delete();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Disable user by ID
router.patch('/users/:id/disable', validateUserId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from disabling their own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disable your own account'
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'User is already disabled'
      });
    }

    await user.disable();

    res.status(200).json({
      success: true,
      message: 'User disabled successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable user by ID
router.patch('/users/:id/enable', validateUserId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'User is already enabled'
      });
    }

    await user.enable();

    res.status(200).json({
      success: true,
      message: 'User enabled successfully',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Enable user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { query } = require('../config/database');

    // Get Tachlit-specific statistics
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const learnAskersResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'LEARN_ASKER\' AND is_active = true');
    const learnGiversResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'LEARN_GIVER\' AND is_active = true');
    const officeVolunteersResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'OFFICE_VOLUNTEER\' AND is_active = true');
    const foodVolunteersResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'FOOD_VOLUNTEER\' AND is_active = true');
    const supervisorsResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'SUPERVISOR\' AND is_active = true');
    const groupCoordinatorsResult = await query('SELECT COUNT(*) as count FROM users WHERE user_type = \'GROUP_COORDINATOR\' AND is_active = true');

    // Get unmatched learners (those without assigned teacher)
    const unmatchedLearnersResult = await query(
      'SELECT COUNT(*) as count FROM learn_askers WHERE assigned_teacher_id IS NULL OR is_matched = false'
    );

    // Get available teachers (those with capacity for more students)
    const availableTeachersResult = await query(`
      SELECT COUNT(*) as count FROM learn_givers lg
      JOIN users u ON lg.user_id = u.id
      WHERE u.is_active = true
      AND (
        SELECT COALESCE(ARRAY_LENGTH(string_to_array(NULLIF(lg.current_student_ids, ''), ','), 1), 0)
      ) < lg.max_students
    `);

    // Get total pairings
    const totalPairingsResult = await query('SELECT COUNT(*) as count FROM pairings WHERE status = \'active\'');

    // Get recent registrations (last 7 days)
    const recentRegistrationsResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\' AND is_active = true'
    );

    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      learnAskers: parseInt(learnAskersResult.rows[0].count),
      learnGivers: parseInt(learnGiversResult.rows[0].count),
      officeVolunteers: parseInt(officeVolunteersResult.rows[0].count),
      foodVolunteers: parseInt(foodVolunteersResult.rows[0].count),
      supervisors: parseInt(supervisorsResult.rows[0].count),
      groupCoordinators: parseInt(groupCoordinatorsResult.rows[0].count),
      unmatchedLearners: parseInt(unmatchedLearnersResult.rows[0].count),
      availableTeachers: parseInt(availableTeachersResult.rows[0].count),
      totalPairings: parseInt(totalPairingsResult.rows[0].count),
      recentRegistrations: parseInt(recentRegistrationsResult.rows[0].count)
    };

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
