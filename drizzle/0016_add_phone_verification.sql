-- Add phone verification status to users table
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for phone verification queries
CREATE INDEX idx_users_phone_verified ON users(phone_verified);

-- Add comment for documentation
COMMENT ON COLUMN users.phone_verified IS 'Indicates if the user has verified their phone number through SMS';
COMMENT ON COLUMN users.phone_verified_at IS 'Timestamp when the phone number was verified';
