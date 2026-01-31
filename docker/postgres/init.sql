-- Skills Store Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100),
    name VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create oauth_providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    provider_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Create skill_categories table
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill_tags table
CREATE TABLE IF NOT EXISTS skill_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    github_url VARCHAR(500),
    category_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    price_type VARCHAR(20) DEFAULT 'free',
    price DECIMAL(10, 2) DEFAULT 0.00,
    downloads_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill_tag_relations table
CREATE TABLE IF NOT EXISTS skill_tag_relations (
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES skill_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, tag_id)
);

-- Create skill_translations table
CREATE TABLE IF NOT EXISTS skill_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    language VARCHAR(10),
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    price DECIMAL(10, 2),
    quantity INT DEFAULT 1
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_channel VARCHAR(50),
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create download_records table
CREATE TABLE IF NOT EXISTS download_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user and skill queries
CREATE INDEX IF NOT EXISTS idx_download_user_skill ON download_records(user_id, skill_id);

-- Create skill_analytics table
CREATE TABLE IF NOT EXISTS skill_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    date DATE,
    views_count INT DEFAULT 0,
    downloads_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    new_skills_count INT DEFAULT 0,
    updated_skills_count INT DEFAULT 0,
    error_message TEXT,
    status VARCHAR(50)
);

-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(255) UNIQUE NOT NULL,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (email, role, is_active) VALUES ('admin@skillhub.com', 'admin', true);

-- Insert default categories
INSERT INTO skill_categories (name, sort_order) VALUES
    ('Tools', 1),
    ('Development', 2),
    ('Data & AI', 3),
    ('Business', 4),
    ('DevOps', 5);

-- Insert default scheduled task
INSERT INTO scheduled_tasks (task_name, cron_expression, description) VALUES
    ('sync_github_skills', '0 2 * * *', 'Sync skills from GitHub API daily at 2 AM');
