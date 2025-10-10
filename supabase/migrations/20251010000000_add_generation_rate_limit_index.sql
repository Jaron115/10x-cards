-- Migration: Add index for rate limiting on generations table
-- This index optimizes the daily rate limit check query
-- Query: SELECT COUNT(*) FROM generations WHERE user_id = ? AND generation_time >= ?

-- Create composite index on user_id and generation_time
-- This index will be used by the rate limit service to quickly count
-- a user's generations for the current day
CREATE INDEX IF NOT EXISTS idx_generations_user_time 
  ON generations(user_id, generation_time DESC);

-- Comment for documentation
COMMENT ON INDEX idx_generations_user_time IS 
  'Composite index to optimize rate limit checks by user and generation time. Used in checkRateLimit service.';

