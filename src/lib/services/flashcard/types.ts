/**
 * Types specific to Flashcard Service
 */

import type { FlashcardEntity } from "@/types";

/**
 * Query parameters for building Supabase queries
 */
export interface FlashcardQueryParams {
  userId: string;
  source?: "manual" | "ai-full" | "ai-edited";
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/**
 * Result of a flashcard query with metadata
 */
export interface FlashcardQueryResult {
  data: FlashcardEntity[];
  count: number | null;
}
