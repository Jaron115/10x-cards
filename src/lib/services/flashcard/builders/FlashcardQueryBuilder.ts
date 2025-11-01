/**
 * Flashcard Query Builder
 * Implements Fluent API Pattern for building Supabase queries
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardQueryParams, FlashcardQueryResult } from "../types";

/**
 * Query builder for flashcard queries with fluent API
 * Provides a chainable interface for building complex Supabase queries
 */
export class FlashcardQueryBuilder {
  private query: ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

  constructor(private readonly supabase: SupabaseClient) {
    // Initialize base query
    this.query = this.supabase.from("flashcards").select("*", { count: "exact" });
  }

  /**
   * Filter by user ID
   * @param userId - User ID to filter by
   * @returns This builder for chaining
   */
  forUser(userId: string): this {
    this.query = this.query.eq("user_id", userId);
    return this;
  }

  /**
   * Filter by source (optional)
   * @param source - Source type to filter by
   * @returns This builder for chaining
   */
  withSource(source?: "manual" | "ai-full" | "ai-edited"): this {
    if (source) {
      this.query = this.query.eq("source", source);
    }
    return this;
  }

  /**
   * Apply sorting
   * @param sort - Field to sort by
   * @param order - Sort order (asc/desc)
   * @returns This builder for chaining
   */
  orderBy(sort: "created_at" | "updated_at", order: "asc" | "desc"): this {
    this.query = this.query.order(sort, { ascending: order === "asc" });
    return this;
  }

  /**
   * Apply pagination
   * @param offset - Starting offset (0-based)
   * @param limit - Number of items per page
   * @returns This builder for chaining
   */
  paginate(offset: number, limit: number): this {
    this.query = this.query.range(offset, offset + limit - 1);
    return this;
  }

  /**
   * Build and execute query from params object
   * Convenience method to apply all params at once
   * @param params - Query parameters
   * @returns Promise that resolves to query result
   */
  async executeWithParams(params: FlashcardQueryParams): Promise<FlashcardQueryResult> {
    return this.forUser(params.userId)
      .withSource(params.source)
      .orderBy(params.sort, params.order)
      .paginate(params.offset, params.limit)
      .execute();
  }

  /**
   * Execute the built query
   * @returns Promise that resolves to query result with data and count
   * @throws Error if query fails
   */
  async execute(): Promise<FlashcardQueryResult> {
    const { data, error, count } = await this.query;

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return {
      data: data || [],
      count,
    };
  }
}
