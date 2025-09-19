-- Remove phone verification columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified_at;

-- Drop the index for phone verification queries
DROP INDEX IF EXISTS idx_users_phone_verified;
