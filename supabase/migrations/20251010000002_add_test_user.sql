-- Migration: Add test user for development
-- Purpose: Insert a test user into auth.users for development purposes
-- Note: This is for DEVELOPMENT ONLY. Do not use in production.

-- ============================================================================
-- Insert test user
-- ============================================================================

-- Insert test user with specific UUID that matches DEFAULT_USER_ID in the app
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  'd0a3904e-ab79-4d01-837d-63036c4213b4'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@10xdevs.local',
  '$2a$10$rGvLZLs0z5xF5Vq5xF5xFOqG5xF5xF5xF5xF5xF5xF5xF5xF5xF5x', -- dummy bcrypt hash
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User"}'::jsonb,
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Test user created with:
-- - ID: d0a3904e-ab79-4d01-837d-63036c4213b4
-- - Email: test@10xdevs.local
-- - Name: Test User
--
-- ⚠️ WARNING: This is for DEVELOPMENT ONLY.
-- Remove this migration before deploying to production.

