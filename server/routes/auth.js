const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { notifySupervisorsOnNewUser } = require('./notifications');

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, name, family_name, phone, city, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      family_name,
      phone,
      city,
      userType: userType // Use the provided userType without defaulting
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Fire-and-forget push notification to supervisors about the new user.
    // Wrapped in a Promise.resolve so any error can never propagate to the response.
    Promise.resolve()
      .then(() => notifySupervisorsOnNewUser({
        id: user.id,
        email: user.email,
        name: user.name,
        family_name: user.family_name,
        user_type: user.user_type
      }))
      .catch(err => console.error('notifySupervisorsOnNewUser failed:', err.message));

    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle database constraint errors
    if (error.code === '23505') { // PostgreSQL unique constraint error
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return success response with token and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Verify token endpoint (optional - for frontend to check if token is still valid)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: user.getPublicData()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;
