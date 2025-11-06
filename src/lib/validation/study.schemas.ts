/**
 * Zod validation schemas for study session endpoints
 * Used to validate incoming requests to study API routes
 */

import { z } from "zod";

/**
 * Schema for query parameters in GET /api/study/session
 * Validates query parameters with proper defaults and constraints
 *
 * Note: validateQuery middleware converts numeric strings to numbers automatically,
 * but boolean query params remain strings and need preprocessing
 */
export const GetStudySessionQuerySchema = z.object({
  limit: z.number().int().positive().min(1).max(50).default(20),
  source: z.enum(["manual", "ai-full", "ai-edited"]).optional(),
  shuffle: z
    .preprocess((val) => {
      // Handle string values from query params
      if (typeof val === "string") {
        return val.toLowerCase() !== "false";
      }
      // Handle boolean values (for consistency)
      if (typeof val === "boolean") {
        return val;
      }
      // Default to true if undefined
      return true;
    }, z.boolean())
    .default(true),
});

/**
 * Type exports for validated data
 */
export type ValidatedGetStudySessionQuery = z.infer<typeof GetStudySessionQuerySchema>;
