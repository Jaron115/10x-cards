/**
 * Query Parser Service
 *
 * Utilities for parsing and validating URL query parameters.
 * Handles type conversion from string to appropriate types (numbers, enums, etc.)
 *
 * @example
 * ```ts
 * const query = QueryParser.parseFlashcardQuery(url);
 * // Returns validated query with proper types
 * ```
 */

import { GetFlashcardsQuerySchema, type ValidatedGetFlashcardsQuery } from "@/lib/validation/flashcard.schemas";

export const QueryParser = {
  /**
   * Parse and validate flashcard list query parameters
   * Converts string parameters to appropriate types and validates against schema
   */
  parseFlashcardQuery(url: URL): ValidatedGetFlashcardsQuery {
    const queryParams: Record<string, unknown> = {};

    // Extract and convert query parameters
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const sourceParam = url.searchParams.get("source");
    const sortParam = url.searchParams.get("sort");
    const orderParam = url.searchParams.get("order");

    // Convert string parameters to appropriate types
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum)) {
        queryParams.page = pageNum;
      }
    }

    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum)) {
        queryParams.limit = limitNum;
      }
    }

    if (sourceParam) {
      queryParams.source = sourceParam;
    }

    if (sortParam) {
      queryParams.sort = sortParam;
    }

    if (orderParam) {
      queryParams.order = orderParam;
    }

    // Validate and return
    // Will throw ZodError if validation fails
    return GetFlashcardsQuerySchema.parse(queryParams);
  },

  /**
   * Generic helper to parse integer parameter
   */
  parseIntParam(param: string | null): number | undefined {
    if (!param) return undefined;
    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? undefined : parsed;
  },

  /**
   * Generic helper to parse string parameter
   */
  parseStringParam(param: string | null): string | undefined {
    return param || undefined;
  },

  /**
   * Generic helper to parse boolean parameter
   */
  parseBooleanParam(param: string | null): boolean | undefined {
    if (!param) return undefined;
    return param.toLowerCase() === "true";
  },
} as const;

export default QueryParser;
