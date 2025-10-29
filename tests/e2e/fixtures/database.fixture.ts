/* eslint-disable react-hooks/rules-of-hooks */
// Playwright fixtures use "use" parameter which triggers false positive from react-hooks eslint
import { test as base } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";

/**
 * Database cleanup fixture
 * Provides helper functions to clean up test data after tests
 */

export interface DatabaseFixtures {
  cleanupFlashcards: () => Promise<void>;
  cleanupGenerations: () => Promise<void>;
  cleanupAll: () => Promise<void>;
}

/**
 * Get Supabase admin client for test cleanup
 */
function getTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Delete all flashcards for test user
 */
export async function deleteTestUserFlashcards(userId: string) {
  const supabase = getTestSupabaseClient();

  const { error } = await supabase.from("flashcards").delete().eq("user_id", userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete test flashcards:", error);
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Cleaned up flashcards for user ${userId}`);
}

/**
 * Delete all generations for test user
 */
export async function deleteTestUserGenerations(userId: string) {
  const supabase = getTestSupabaseClient();

  const { error } = await supabase.from("generations").delete().eq("user_id", userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete test generations:", error);
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Cleaned up generations for user ${userId}`);
}

/**
 * Delete all test data for user
 */
export async function cleanupTestUserData(userId: string) {
  await deleteTestUserFlashcards(userId);
  await deleteTestUserGenerations(userId);
}

/**
 * Extended test with database cleanup fixtures
 */
export const test = base.extend<DatabaseFixtures>({
  // eslint-disable-next-line no-empty-pattern
  cleanupFlashcards: async ({}, use) => {
    const userId = process.env.E2E_USERNAME_ID;
    if (!userId) {
      throw new Error("E2E_USERNAME_ID is required for database cleanup");
    }

    const cleanup = async () => {
      await deleteTestUserFlashcards(userId);
    };

    await use(cleanup);

    // Teardown: cleanup after test
    try {
      await cleanup();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Cleanup failed during teardown:", error);
    }
  },

  // eslint-disable-next-line no-empty-pattern
  cleanupGenerations: async ({}, use) => {
    const userId = process.env.E2E_USERNAME_ID;
    if (!userId) {
      throw new Error("E2E_USERNAME_ID is required for database cleanup");
    }

    const cleanup = async () => {
      await deleteTestUserGenerations(userId);
    };

    await use(cleanup);

    // Teardown: cleanup after test
    try {
      await cleanup();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Cleanup failed during teardown:", error);
    }
  },

  // eslint-disable-next-line no-empty-pattern
  cleanupAll: async ({}, use) => {
    const userId = process.env.E2E_USERNAME_ID;
    if (!userId) {
      throw new Error("E2E_USERNAME_ID is required for database cleanup");
    }

    const cleanup = async () => {
      await cleanupTestUserData(userId);
    };

    await use(cleanup);

    // Teardown: cleanup after test
    try {
      await cleanup();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Cleanup failed during teardown:", error);
    }
  },
});

export { expect } from "@playwright/test";
