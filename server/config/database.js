const { Pool } = require('pg');

// Validate environment variables
const validateEnvironment = () => {
  console.log('Validating database environment variables...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    console.log('Available environment variables:');
    Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')).forEach(key => {
      console.log(`${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
    });
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Log connection string format (without credentials)
  const dbUrl = process.env.DATABASE_URL;
  const urlParts = dbUrl.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (urlParts) {
    console.log('Database connection details:');
    console.log('- Host:', urlParts[3]);
    console.log('- Port:', urlParts[4]);
    console.log('- Database:', urlParts[5]);
    console.log('- User:', urlParts[1]);
  } else {
    console.log('DATABASE_URL format appears to be non-standard');
  }
};

// Validate environment before creating pool
validateEnvironment();

// Database connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
};

console.log('Creating PostgreSQL connection pool with config:', {
  ...poolConfig,
  connectionString: '[HIDDEN]'
});

const pool = new Pool(poolConfig);

// Test database connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Testing database connection (attempt ${i + 1}/${retries})...`);
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      console.log('Database connection successful!');
      console.log('Current time:', result.rows[0].current_time);
      console.log('PostgreSQL version:', result.rows[0].postgres_version);
      client.release();
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

// Connection event handlers
pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL database');
});

pool.on('acquire', (client) => {
  console.log('Client acquired from pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  console.error('Client info:', client ? 'Client exists' : 'No client');
  // Don't exit immediately, let the application handle the error
});

pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    // Create users table with updated schema
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(20),
        city VARCHAR(100),
        user_type VARCHAR(30) DEFAULT 'LEARN_ASKER' CHECK (user_type IN ('LEARN_ASKER', 'LEARN_GIVER', 'OFFICE_VOLUNTEER', 'FOOD_VOLUNTEER', 'SUPERVISOR')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create LearnAsker table
    await query(`
      CREATE TABLE IF NOT EXISTS learn_askers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subjects TEXT NOT NULL,
        learning_goals TEXT,
        preferred_schedule TEXT,
        experience_level VARCHAR(20) DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced')),
        additional_notes TEXT DEFAULT '',
        assigned_teacher_id INTEGER,
        is_matched BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create LearnGiver table
    await query(`
      CREATE TABLE IF NOT EXISTS learn_givers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subjects_can_teach TEXT NOT NULL,
        teaching_experience TEXT,
        available_schedule TEXT,
        max_students INTEGER DEFAULT 3,
        teaching_style TEXT,
        additional_notes TEXT DEFAULT '',
        current_student_ids TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create OfficeVolunteer table
    await query(`
      CREATE TABLE IF NOT EXISTS office_volunteers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        skills TEXT,
        availability TEXT,
        experience TEXT,
        additional_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create FoodVolunteer table
    await query(`
      CREATE TABLE IF NOT EXISTS food_volunteers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        dietary_restrictions TEXT,
        cooking_experience TEXT,
        availability TEXT,
        transportation BOOLEAN DEFAULT false,
        additional_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Pairing table
    await query(`
      CREATE TABLE IF NOT EXISTS pairings (
        id SERIAL PRIMARY KEY,
        learn_asker_id INTEGER REFERENCES learn_askers(id) ON DELETE CASCADE,
        learn_giver_id INTEGER REFERENCES learn_givers(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger for updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_learn_askers_user_id ON learn_askers(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_learn_givers_user_id ON learn_givers(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_office_volunteers_user_id ON office_volunteers(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_food_volunteers_user_id ON food_volunteers(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_pairings_learn_asker_id ON pairings(learn_asker_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_pairings_learn_giver_id ON pairings(learn_giver_id)');

    // Insert default supervisor user (password: admin123)
    await query(`
      INSERT INTO users (email, password_hash, name, phone, city, user_type)
      VALUES (
        'supervisor@tachlit.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO7u',
        'System Administrator',
        '+972-50-1234567',
        'Jerusalem',
        'SUPERVISOR'
      ) ON CONFLICT (email) DO NOTHING
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  testConnection
};
