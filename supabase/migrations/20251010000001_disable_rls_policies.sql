-- Migration: Disable RLS for development
-- Purpose: Drop all row-level security policies and disable RLS on flashcards, generations, and generation_error_logs tables
-- Affected tables: flashcards, generations, generation_error_logs
-- Note: This is for DEVELOPMENT ONLY. Before production, RLS should be re-enabled with proper policies.

-- ============================================================================
-- 1. Drop RLS policies for flashcards table
-- ============================================================================

DROP POLICY IF EXISTS "flashcards_select_own" ON flashcards;
DROP POLICY IF EXISTS "flashcards_insert_own" ON flashcards;
DROP POLICY IF EXISTS "flashcards_update_own" ON flashcards;
DROP POLICY IF EXISTS "flashcards_delete_own" ON flashcards;

-- ============================================================================
-- 2. Drop RLS policies for generations table
-- ============================================================================

DROP POLICY IF EXISTS "generations_select_own" ON generations;
DROP POLICY IF EXISTS "generations_insert_own" ON generations;
DROP POLICY IF EXISTS "generations_update_own" ON generations;
DROP POLICY IF EXISTS "generations_delete_own" ON generations;

-- ============================================================================
-- 3. Drop RLS policies for generation_error_logs table
-- ============================================================================

DROP POLICY IF EXISTS "generation_error_logs_select_own" ON generation_error_logs;
DROP POLICY IF EXISTS "generation_error_logs_insert_own" ON generation_error_logs;
DROP POLICY IF EXISTS "generation_error_logs_update_own" ON generation_error_logs;
DROP POLICY IF EXISTS "generation_error_logs_delete_own" ON generation_error_logs;

-- ============================================================================
-- 4. Disable RLS entirely for development
-- ============================================================================

ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- All RLS policies have been dropped and RLS disabled on:
-- - flashcards (4 policies removed, RLS disabled)
-- - generations (4 policies removed, RLS disabled)
-- - generation_error_logs (4 policies removed, RLS disabled)
--
-- ⚠️ WARNING: This configuration is for DEVELOPMENT ONLY.
-- Before deploying to production, create a new migration that:
-- 1. Re-enables RLS on all tables
-- 2. Creates appropriate security policies
-- 3. Implements proper authentication checks

