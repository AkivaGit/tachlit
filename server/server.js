const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { initializeDatabase, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const { initFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize database and start server
const startServer = async () => {
  console.log('='.repeat(50));
  console.log('Starting Tachlit Server...');
  console.log('='.repeat(50));

  try {
    console.log('Step 1: Testing database connection...');
    // Test database connection first
    await testConnection();
    console.log('✓ Database connection test passed');

    console.log('Step 2: Initializing database tables...');
    // Initialize database tables
    await initializeDatabase();
    console.log('✓ Database tables initialized successfully');

    console.log('Step 3: Initializing Firebase Admin (push notifications)...');
    initFirebase();

    console.log('Step 4: Starting HTTP server...');
    // Start server
    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 SERVER STARTED SUCCESSFULLY!');
      console.log('='.repeat(50));
      console.log(`📍 Server running on port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Admin panel: http://localhost:${PORT}/api/admin`);
      console.log('='.repeat(50));
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('='.repeat(50));
    console.error('❌ FAILED TO START SERVER');
    console.error('='.repeat(50));

    if (error.message && error.message.includes('DATABASE_URL')) {
      console.error('🔧 DATABASE CONFIGURATION ERROR:');
      console.error('   The DATABASE_URL environment variable is not set.');
      console.error('   Please ensure your PostgreSQL database is configured in Render.com');
      console.error('   and the DATABASE_URL environment variable is properly set.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔧 DATABASE CONNECTION ERROR:');
      console.error('   Cannot connect to PostgreSQL database.');
      console.error('   Please check:');
      console.error('   1. Database service is running');
      console.error('   2. DATABASE_URL is correct');
      console.error('   3. Network connectivity');
      console.error('   4. Database credentials are valid');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔧 DATABASE HOST ERROR:');
      console.error('   Database host not found.');
      console.error('   Please verify the database hostname in DATABASE_URL');
    } else {
      console.error('🔧 GENERAL ERROR:');
      console.error('   Error details:', error.message);
      console.error('   Stack trace:', error.stack);
    }

    console.error('='.repeat(50));
    console.error('For support, please check the Render.com logs and ensure:');
    console.error('1. PostgreSQL service is created and running');
    console.error('2. DATABASE_URL environment variable is set');
    console.error('3. Database and web service are in the same region');
    console.error('='.repeat(50));

    process.exit(1);
  }
};

startServer();

module.exports = app;
