const express = require('express');
const jwt = require('jsonwebtoken');
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
        message: 'User with this email already exists',
        message_he: 'כבר קיים משתמש עם כתובת האימייל הזו'
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

    // Always send the cause back, in English (`message`) and Hebrew
    // (`message_he`), so the app can show it to the user.
    // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
    let status = 400;
    let message;
    let message_he;
    switch (error.code) {
      case '23505': // unique_violation
        message = 'User with this email already exists';
        message_he = 'כבר קיים משתמש עם כתובת האימייל הזו';
        break;
      case '23502': // not_null_violation
        message = `Missing required field: ${error.column || 'unknown'}`;
        message_he = `חסר שדה חובה: ${error.column || 'לא ידוע'}`;
        break;
      case '22001': // string_data_right_truncation
        message = 'One of the fields is too long';
        message_he = 'אחד השדות ארוך מדי';
        break;
      case '23514': { // check_violation
        const badType = error.constraint === 'users_user_type_check';
        const userType = req.body && req.body.userType;
        message = badType ? `Invalid user type: ${userType}` : 'One of the fields has an invalid value';
        message_he = badType ? `סוג משתמש לא תקין: ${userType}` : 'באחד השדות יש ערך לא תקין';
        break;
      }
      default:
        status = 500;
        message = `Internal server error during registration: ${error.message}`;
        message_he = `שגיאה בשרת בזמן ההרשמה: ${error.message}`;
    }

    res.status(status).json({
      success: false,
      message,
      message_he
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

/**
 * POST /api/auth/logout
 * Auth: Bearer JWT of the user who is logging out.
 *
 * Product rule: when any user EXCEPT a supervisor logs out, their registration
 * is permanently deleted. Deleting the users row also removes everything linked
 * to it (role details, device tokens, pairings) via ON DELETE CASCADE.
 * Supervisors keep their account.
 *
 * The token may be expired: users usually log out long after the token's
 * lifetime (JWT_EXPIRES_IN, default 24h), and its signature still proves who
 * they are. This is the only route that accepts expired tokens.
 */
router.post('/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      message_he: 'חסר אסימון התחברות'
    });
  }

  let decoded;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'tachlit-default-secret-key-change-in-production';
    decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      message_he: 'אסימון התחברות לא תקין'
    });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      // Already gone (deleted by a supervisor, or the database was reset).
      return res.json({
        success: true,
        deleted: false,
        message: 'Registration was already deleted',
        message_he: 'ההרשמה כבר נמחקה'
      });
    }

    if (user.user_type === 'SUPERVISOR') {
      return res.json({
        success: true,
        deleted: false,
        message: 'Supervisor logged out; account kept',
        message_he: 'המנהל התנתק; החשבון נשמר'
      });
    }

    await user.delete();
    console.log(`🗑️  User #${user.id} (${user.user_type}) logged out; registration deleted`);

    return res.json({
      success: true,
      deleted: true,
      message: 'Logged out and registration deleted',
      message_he: 'ההתנתקות בוצעה וההרשמה נמחקה'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: `Internal server error during logout: ${error.message}`,
      message_he: `שגיאה בשרת בזמן ההתנתקות: ${error.message}`
    });
  }
});

module.exports = router;
