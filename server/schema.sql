-- Tachlit Backend Database Schema
-- PostgreSQL Database Schema for User Management System

-- Create database (run this manually if needed)
-- CREATE DATABASE tachlit_db;

-- Connect to the database
-- \c tachlit_db;

-- Create users table
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
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create LearnAsker table
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
);

-- Create LearnGiver table
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
);

-- Create OfficeVolunteer table
CREATE TABLE IF NOT EXISTS office_volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT,
    availability TEXT,
    experience TEXT,
    additional_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FoodVolunteer table
CREATE TABLE IF NOT EXISTS food_volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT,
    cooking_experience TEXT,
    availability TEXT,
    transportation BOOLEAN DEFAULT false,
    additional_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Pairing table
CREATE TABLE IF NOT EXISTS pairings (
    id SERIAL PRIMARY KEY,
    learn_asker_id INTEGER REFERENCES learn_askers(id) ON DELETE CASCADE,
    learn_giver_id INTEGER REFERENCES learn_givers(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_learn_askers_user_id ON learn_askers(user_id);
CREATE INDEX IF NOT EXISTS idx_learn_givers_user_id ON learn_givers(user_id);
CREATE INDEX IF NOT EXISTS idx_office_volunteers_user_id ON office_volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_food_volunteers_user_id ON food_volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_pairings_learn_asker_id ON pairings(learn_asker_id);
CREATE INDEX IF NOT EXISTS idx_pairings_learn_giver_id ON pairings(learn_giver_id);

-- Insert default supervisor user (password: admin123)
-- Note: This is for development/testing purposes only
-- In production, create admin users through a secure process
INSERT INTO users (email, password_hash, name, phone, city, user_type)
VALUES (
    'supervisor@tachlit.com',
    '$2b$12$BC1KHpjQ50bOSEKUU7FIu.lnZW7d0ujj/P6XVls5kGNyAyOpKoq1y', -- admin123
    'System Administrator',
    '+972-50-1234567',
    'Jerusalem',
    'SUPERVISOR'
) ON CONFLICT (email) DO NOTHING;

-- Create additional indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(
    to_tsvector('english', name)
);

-- Create partial indexes for active users
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active_user_type ON users(user_type) WHERE is_active = true;

-- Add comments to table and columns
COMMENT ON TABLE users IS 'User accounts for the Tachlit application';
COMMENT ON COLUMN users.id IS 'Primary key, auto-incrementing user ID';
COMMENT ON COLUMN users.email IS 'Unique email address for user login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.name IS 'User full name';
COMMENT ON COLUMN users.phone IS 'Optional phone number';
COMMENT ON COLUMN users.city IS 'User city';
COMMENT ON COLUMN users.user_type IS 'User type: LEARN_ASKER, LEARN_GIVER, OFFICE_VOLUNTEER, FOOD_VOLUNTEER, SUPERVISOR';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';

-- Display table information
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Display sample data
SELECT 
    id,
    email,
    name,
    phone,
    city,
    user_type,
    is_active,
    created_at
FROM users
ORDER BY created_at;
