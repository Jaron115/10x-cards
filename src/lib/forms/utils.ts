/**
 * Utility functions for form handling
 */

import type { FieldErrors, Path, UseFormSetError } from "react-hook-form";

/**
 * Set API validation errors on react-hook-form fields
 * Maps server-side validation errors to form fields
 *
 * @example
 * const result = await apiCall();
 * if (result.validationErrors) {
 *   setApiErrors(result.validationErrors, setError);
 * }
 */
export function setApiErrors<T extends Record<string, unknown>>(
  validationErrors: Record<string, string>,
  setError: UseFormSetError<T>
): void {
  Object.entries(validationErrors).forEach(([field, message]) => {
    setError(field as Path<T>, {
      type: "server",
      message,
    });
  });
}

/**
 * Clear all form errors
 */
export function clearFormErrors<T extends Record<string, unknown>>(
  errors: FieldErrors<T>,
  clearErrors: (name?: keyof T | (keyof T)[]) => void
): void {
  const fieldNames = Object.keys(errors) as (keyof T)[];
  if (fieldNames.length > 0) {
    clearErrors(fieldNames);
  }
}

/**
 * Check if form has any errors
 */
export function hasFormErrors<T extends Record<string, unknown>>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get first error message from form errors
 */
export function getFirstError<T extends Record<string, unknown>>(errors: FieldErrors<T>): string | undefined {
  const firstKey = Object.keys(errors)[0] as keyof T;
  if (!firstKey) return undefined;
  return errors[firstKey]?.message as string | undefined;
}

/**
 * Format field name for display
 * Converts camelCase to readable format
 *
 * @example
 * formatFieldName("firstName") // "First Name"
 * formatFieldName("email") // "Email"
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Create error message with field name
 */
export function createFieldError(fieldName: string, message: string): string {
  const formattedName = formatFieldName(fieldName);
  return `${formattedName}: ${message}`;
}
