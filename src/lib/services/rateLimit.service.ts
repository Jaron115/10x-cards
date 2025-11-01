/**
 * Rate limiting service for generation endpoint
 * Implements daily rate limits to control AI API costs and prevent abuse
 */

import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  exceeded: boolean;
  retryAfter?: string; // ISO 8601 timestamp when user can retry
  currentCount?: number;
  limit?: number;
}

/**
 * Rate limit service class
 * Provides methods for checking and managing rate limits
 */
export class RateLimitService {
  private readonly DAILY_LIMIT = 10; // Maximum generations per user per day

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Check if user has exceeded their daily generation rate limit
   * @param user_id - User ID to check rate limit for
   * @returns Promise that resolves to rate limit check result
   * @throws Error if database query fails
   */
  async checkRateLimit(user_id: string): Promise<RateLimitResult> {
    // Calculate start of current day in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const today_iso = today.toISOString();

    // Query generations table to count today's generations
    const { count, error } = await this.supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .gte("generation_time", today_iso);

    if (error) {
      throw new Error(`Failed to check rate limit: ${error.message}`);
    }

    const current_count = count || 0;

    // Check if limit exceeded
    if (current_count >= this.DAILY_LIMIT) {
      // Calculate tomorrow at 00:00 UTC
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      return {
        exceeded: true,
        retryAfter: tomorrow.toISOString(),
        currentCount: current_count,
        limit: this.DAILY_LIMIT,
      };
    }

    return {
      exceeded: false,
      currentCount: current_count,
      limit: this.DAILY_LIMIT,
    };
  }

  /**
   * Get remaining generations for today for a user
   * @param user_id - User ID to check
   * @returns Promise that resolves to number of remaining generations
   */
  async getRemainingGenerations(user_id: string): Promise<number> {
    const result = await this.checkRateLimit(user_id);
    const remaining = this.DAILY_LIMIT - (result.currentCount || 0);
    return Math.max(0, remaining);
  }
}
