/**
 * Validation Middleware
 *
 * Provides validation utilities for request data using Zod schemas.
 * Handles body, params, and query parameter validation.
 *
 * @example
 * ```ts
 * // Validate request body
 * const bodyResult = await validateBody(request, CreateUserSchema);
 * if (!bodyResult.success) {
 *   return bodyResult.error; // Returns 400 Response with validation errors
 * }
 * const { email, password } = bodyResult.data;
 *
 * // Validate URL params
 * const paramsResult = validateParams(params.id, UserIdSchema);
 * if (!paramsResult.success) {
 *   return paramsResult.error;
 * }
 * const userId = paramsResult.data;
 * ```
 */

import type { z } from "zod";
import type { Result } from "../types";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { ZodError } from "zod";

/**
 * Validate request body against a Zod schema
 * Parses JSON and validates against schema
 */
export async function validateBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<Result<T, Response>> {
  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      error: ApiResponseBuilder.validationError("Invalid JSON in request body"),
    };
  }

  // Validate against schema
  try {
    const data = schema.parse(body);
    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        error: ApiResponseBuilder.validationError("Validation failed", details),
      };
    }

    return {
      success: false,
      error: ApiResponseBuilder.validationError("Invalid request data"),
    };
  }
}

/**
 * Validate URL parameters against a Zod schema
 * Useful for validating route parameters like IDs
 */
export function validateParams<T>(data: unknown, schema: z.ZodSchema<T>): Result<T, Response> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        error: ApiResponseBuilder.validationError("Invalid parameter", details),
      };
    }

    return {
      success: false,
      error: ApiResponseBuilder.validationError("Invalid parameter"),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 * Handles parsing of query string parameters
 */
export function validateQuery<T>(url: URL, schema: z.ZodSchema<T>): Result<T, Response> {
  // Extract query parameters
  const queryParams: Record<string, unknown> = {};

  url.searchParams.forEach((value, key) => {
    // Try to parse as number if it looks like a number
    const numValue = Number(value);
    if (!isNaN(numValue) && value.trim() !== "") {
      queryParams[key] = numValue;
    } else {
      queryParams[key] = value;
    }
  });

  // Validate against schema
  try {
    const validated = schema.parse(queryParams);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        error: ApiResponseBuilder.validationError("Invalid query parameters", details),
      };
    }

    return {
      success: false,
      error: ApiResponseBuilder.validationError("Invalid query parameters"),
    };
  }
}

/**
 * Parse and validate an integer ID from a string parameter
 * Common use case for route parameters like /api/users/:id
 */
export function validateIntId(idParam: string | undefined, fieldName = "id"): Result<number, Response> {
  if (!idParam) {
    return {
      success: false,
      error: ApiResponseBuilder.validationError(`Missing ${fieldName} parameter`),
    };
  }

  const parsed = parseInt(idParam, 10);

  if (isNaN(parsed) || parsed <= 0) {
    return {
      success: false,
      error: ApiResponseBuilder.validationError(`Invalid ${fieldName} - must be a positive integer`),
    };
  }

  return {
    success: true,
    data: parsed,
  };
}
