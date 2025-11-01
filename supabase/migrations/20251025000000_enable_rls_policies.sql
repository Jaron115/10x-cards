-- Migration: Re-enable RLS for production
-- Purpose: Re-enable row-level security policies on flashcards, generations, and generation_error_logs tables
-- Affected tables: flashcards, generations, generation_error_logs
-- Note: This migration restores proper security policies for production use.

-- ============================================================================
-- 1. Enable RLS on all tables
-- ============================================================================

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Create RLS policies for flashcards table
-- ============================================================================

-- Policy: allow authenticated users to select their own flashcards
DROP POLICY IF EXISTS "flashcards_select_own" ON flashcards;
CREATE POLICY "flashcards_select_own"
  ON flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to insert their own flashcards
DROP POLICY IF EXISTS "flashcards_insert_own" ON flashcards;
CREATE POLICY "flashcards_insert_own"
  ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to update their own flashcards
DROP POLICY IF EXISTS "flashcards_update_own" ON flashcards;
CREATE POLICY "flashcards_update_own"
  ON flashcards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to delete their own flashcards
DROP POLICY IF EXISTS "flashcards_delete_own" ON flashcards;
CREATE POLICY "flashcards_delete_own"
  ON flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Create RLS policies for generations table
-- ============================================================================

-- Policy: allow authenticated users to select their own generation records
DROP POLICY IF EXISTS "generations_select_own" ON generations;
CREATE POLICY "generations_select_own"
  ON generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to insert their own generation records
DROP POLICY IF EXISTS "generations_insert_own" ON generations;
CREATE POLICY "generations_insert_own"
  ON generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to update their own generation records
DROP POLICY IF EXISTS "generations_update_own" ON generations;
CREATE POLICY "generations_update_own"
  ON generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to delete their own generation records
DROP POLICY IF EXISTS "generations_delete_own" ON generations;
CREATE POLICY "generations_delete_own"
  ON generations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Create RLS policies for generation_error_logs table
-- ============================================================================

-- Policy: allow authenticated users to select their own error logs
DROP POLICY IF EXISTS "generation_error_logs_select_own" ON generation_error_logs;
CREATE POLICY "generation_error_logs_select_own"
  ON generation_error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to insert their own error logs
-- Note: allows user_id to be null for errors that occur before user identification
DROP POLICY IF EXISTS "generation_error_logs_insert_own" ON generation_error_logs;
CREATE POLICY "generation_error_logs_insert_own"
  ON generation_error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: allow authenticated users to update their own error logs
DROP POLICY IF EXISTS "generation_error_logs_update_own" ON generation_error_logs;
CREATE POLICY "generation_error_logs_update_own"
  ON generation_error_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: allow authenticated users to delete their own error logs
DROP POLICY IF EXISTS "generation_error_logs_delete_own" ON generation_error_logs;
CREATE POLICY "generation_error_logs_delete_own"
  ON generation_error_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Migration complete
-- ============================================================================
-- RLS has been re-enabled on all tables with proper security policies:
-- - flashcards (4 policies: select, insert, update, delete)
-- - generations (4 policies: select, insert, update, delete)
-- - generation_error_logs (4 policies: select, insert, update, delete)
--
-- ✅ All policies ensure users can only access their own data
-- ✅ Database is now secured for production use

