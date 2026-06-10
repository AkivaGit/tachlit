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
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Insert default admin user (password: Admin123!)
-- Note: This is for development/testing purposes only
-- In production, create admin users through a secure process
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@tachlit.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO7u', -- Admin123!
    'System',
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample regular user (password: User123!)
-- Note: This is for development/testing purposes only
INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
VALUES (
    'user@tachlit.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- User123!
    'John',
    'Doe',
    '+1234567890',
    'user'
) ON CONFLICT (email) DO NOTHING;

-- Create additional indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(
    to_tsvector('english', first_name || ' ' || last_name)
);

-- Create partial indexes for active users
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(role) WHERE is_active = true;

-- Add comments to table and columns
COMMENT ON TABLE users IS 'User accounts for the Tachlit application';
COMMENT ON COLUMN users.id IS 'Primary key, auto-incrementing user ID';
COMMENT ON COLUMN users.email IS 'Unique email address for user login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.phone IS 'Optional phone number';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
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
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM users
ORDER BY created_at;