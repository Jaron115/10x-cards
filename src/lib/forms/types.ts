/**
 * Generic form state
 */
export interface FormState<T = unknown> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

/**
 * Form submission result
 */
export interface FormSubmitResult {
  success: boolean;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Form field error type
 */
export type FormFieldError = string | undefined;

/**
 * Form errors record
 */
export type FormErrors<T extends Record<string, unknown>> = {
  [K in keyof T]?: string;
};
