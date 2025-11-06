/**
 * Study service for managing study session operations
 * Handles fetching flashcards for study sessions with filtering and shuffling
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, GetStudySessionQuery } from "@/types";
import type { ValidatedGetStudySessionQuery } from "@/lib/validation/study.schemas";

/**
 * Result returned by getFlashcardsForStudy method
 */
interface GetFlashcardsForStudyResult {
  flashcards: FlashcardDTO[];
  totalCount: number;
}

/**
 * Study service class
 * Provides methods for study session operations
 */
export class StudyService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get flashcards for study session
   * Fetches flashcards with optional filtering and shuffling
   *
   * @param userId - User ID who owns the flashcards
   * @param params - Query parameters (limit, source, shuffle)
   * @returns Promise that resolves to flashcards and total count
   * @throws Error if database operation fails
   */
  async getFlashcardsForStudy(
    userId: string,
    params: ValidatedGetStudySessionQuery
  ): Promise<GetFlashcardsForStudyResult> {
    const { limit = 20, source, shuffle = true } = params;

    // Build query with filtering
    let query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", {
        count: "exact",
      });

    // Apply source filter if provided
    if (source) {
      query = query.eq("source", source);
    }

    // Order by created_at descending and limit results
    query = query.order("created_at", { ascending: false }).limit(limit);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch flashcards for study:", error);
      throw new Error("Failed to fetch flashcards for study");
    }

    // Shuffle array if requested (client-side Fisher-Yates algorithm)
    const flashcards = shuffle && data ? this.shuffleArray([...data]) : data || [];

    return {
      flashcards: flashcards as FlashcardDTO[],
      totalCount: count || 0,
    };
  }

  /**
   * Get total count of user's flashcards
   * Used to determine if user has any flashcards at all
   *
   * @param userId - User ID
   * @returns Promise that resolves to total count
   */
  async getUserFlashcardsCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase.from("flashcards").select("*", { count: "exact", head: true });

    if (error) {
      console.error("Failed to get user flashcards count:", error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * Creates a new shuffled array without mutating the original
   *
   * @param array - Array to shuffle
   * @returns Shuffled copy of the array
   * @private
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
