const { body, validationResult, param, query } = require('express-validator');

// Bilingual validation message. `message` stays English; `message_he` is Hebrew.
const bi = (en, he) => ({ en, he });

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      message_he: 'חלק מהפרטים אינם תקינים',
      errors: errors.array().map(error => {
        const msg = error.msg;
        const isBi = msg && typeof msg === 'object';
        return {
          field: error.path,
          message: isBi ? msg.en : msg,
          message_he: isBi ? msg.he : undefined,
          value: error.value
        };
      })
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage(bi(
      'Please provide a valid email address',
      'יש להזין כתובת אימייל תקינה'
    )),

  body('password')
    .isLength({ min: 6 })
    .withMessage(bi(
      'Password must be at least 6 characters long',
      'הסיסמה חייבת להכיל לפחות 6 תווים'
    ))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(bi(
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית, אות גדולה אחת באנגלית וספרה אחת'
    )),

  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(bi(
      'Name is required and must be less than 100 characters',
      'יש להזין שם פרטי, עד 100 תווים'
    ))
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage(bi(
      'Name can only contain letters (English and Hebrew) and spaces',
      'השם הפרטי יכול להכיל רק אותיות (עברית או אנגלית) ורווחים'
    )),

  body('family_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(bi(
      'Family name is required and must be less than 100 characters',
      'יש להזין שם משפחה, עד 100 תווים'
    ))
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage(bi(
      'Family name can only contain letters (English and Hebrew) and spaces',
      'שם המשפחה יכול להכיל רק אותיות (עברית או אנגלית) ורווחים'
    )),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage(bi(
      'Please provide a valid mobile phone number, digits only (for example 0501234567)',
      'יש להזין מספר טלפון נייד תקין, ספרות בלבד (לדוגמה 0501234567)'
    )),

  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters'),

  query('sortBy')
    .optional()
    .isIn(['id', 'email', 'name', 'family_name', 'user_type', 'is_active', 'created_at', 'updated_at'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC'),

  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('Name can only contain letters (English and Hebrew) and spaces'),

  body('family_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Family name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('Family name can only contain letters (English and Hebrew) and spaces'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  handleValidationErrors
];

// Email validation for standalone use
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  handleValidationErrors
];

// Password validation for standalone use
const validatePassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateUserId,
  validatePagination,
  validateUserUpdate,
  validateEmail,
  validatePassword,
  handleValidationErrors
};
