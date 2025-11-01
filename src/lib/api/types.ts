/**
 * Result type for API operations
 */
export interface ApiResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Configuration for API calls
 */
export interface ApiCallConfig<TRequest = unknown, TResponse = unknown> {
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: TRequest;
  successMessage?: string;
  loadingMessage?: string;
  onSuccess?: (data: TResponse) => void;
  redirectUrl?: string;
  redirectDelay?: number;
}

/**
 * HTTP Error with status code
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public validationErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Parsed API error response
 */
export interface ParsedApiError {
  message: string;
  validationErrors?: Record<string, string>;
}
