/**
 * Result Pattern Implementation
 *
 * Provides functional error handling without throwing exceptions.
 * Inspired by Rust's Result type and functional programming patterns.
 *
 * @example
 * ```ts
 * // Creating results
 * const success = Result.success({ id: 1, name: "John" });
 * const failure = Result.failure(new Error("Not found"));
 *
 * // Using results
 * if (success.success) {
 *   console.log(success.data);
 * }
 *
 * // Mapping results
 * const mapped = Result.map(success, user => user.name);
 *
 * // From promises
 * const result = await Result.fromPromise(fetchUser(id));
 * ```
 */

import type { Result } from "../types";

/**
 * Result utility functions
 */
export const ResultUtils = {
  /**
   * Create a successful result
   */
  success<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  /**
   * Create a failed result
   */
  failure<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
  },

  /**
   * Check if result is successful
   */
  isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
  },

  /**
   * Check if result is a failure
   */
  isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false;
  },

  /**
   * Map the data of a successful result
   * If result is a failure, returns the failure unchanged
   */
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (result.success) {
      return { success: true, data: fn(result.data) };
    }
    return result;
  },

  /**
   * FlatMap (chain) operation for composing results
   * If result is a failure, returns the failure unchanged
   */
  flatMap<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> {
    if (result.success) {
      return fn(result.data);
    }
    return result;
  },

  /**
   * Map the error of a failed result
   * If result is successful, returns the success unchanged
   */
  mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (!result.success) {
      return { success: false, error: fn(result.error) };
    }
    return result;
  },

  /**
   * Convert a Promise to a Result
   * Catches any thrown errors and returns them as failures
   */
  async fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
    try {
      const data = await promise;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  /**
   * Execute a function and wrap result/error in Result type
   * Useful for wrapping synchronous code that might throw
   */
  tryCatch<T>(fn: () => T): Result<T, Error> {
    try {
      return { success: true, data: fn() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  /**
   * Execute an async function and wrap result/error in Result type
   */
  async tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  /**
   * Unwrap a result, throwing if it's a failure
   * Use with caution - prefer pattern matching with if/else
   */
  unwrap<T, E>(result: Result<T, E>): T {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  },

  /**
   * Unwrap a result or return a default value if it's a failure
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.success) {
      return result.data;
    }
    return defaultValue;
  },

  /**
   * Combine multiple results into a single result
   * If any result is a failure, returns the first failure
   * Otherwise returns an array of all successful values
   */
  all<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (!result.success) {
        return result;
      }
      values.push(result.data);
    }
    return { success: true, data: values };
  },
};

/**
 * Export as default for convenience
 */
export default ResultUtils;
