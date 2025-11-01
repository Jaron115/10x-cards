/**
 * Generic API client with automatic error handling and toast notifications
 * Provides consistent interface for all API calls
 */

import { toast } from "sonner";
import { handleApiError, parseError, isNetworkError } from "./errorHandler";
import type { ApiCallConfig, ApiResult } from "./types";

/**
 * Generic API call wrapper
 * Handles fetch, error handling, toasts, and redirects
 *
 * @example
 * const result = await callApi<LoginRequest, LoginResponse>({
 *   endpoint: "/api/auth/login",
 *   method: "POST",
 *   body: { email, password },
 *   successMessage: "Zalogowano pomyślnie",
 *   redirectUrl: "/app/generator"
 * });
 */
export async function callApi<TRequest = unknown, TResponse = unknown>(
  config: ApiCallConfig<TRequest, TResponse>
): Promise<ApiResult<TResponse>> {
  const {
    endpoint,
    method,
    body,
    successMessage,
    loadingMessage,
    onSuccess,
    redirectUrl,
    redirectDelay = 500,
  } = config;

  try {
    // Show loading toast if provided
    if (loadingMessage) {
      toast.loading(loadingMessage);
    }

    // Make API call
    const response = await fetch(endpoint, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });

    // Handle error responses
    if (!response.ok) {
      await handleApiError(response, `operacji ${method} ${endpoint}`);
    }

    // Parse success response
    const data = await response.json();

    // Dismiss loading toast
    if (loadingMessage) {
      toast.dismiss();
    }

    // Show success toast
    if (successMessage) {
      toast.success(successMessage);
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(data);
    }

    // Redirect if needed
    if (redirectUrl && typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, redirectDelay);
    }

    return { success: true, data };
  } catch (error) {
    // Dismiss loading toast
    if (loadingMessage) {
      toast.dismiss();
    }

    // Handle network errors
    if (isNetworkError(error)) {
      const errorMsg = "Błąd sieci. Sprawdź połączenie i spróbuj ponownie.";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Parse and display error
    const parsedError = parseError(error, "Wystąpił nieoczekiwany błąd");

    // Show error toast (unless it's a validation error - those are shown inline)
    if (!parsedError.validationErrors) {
      toast.error(parsedError.message);
    }

    return {
      success: false,
      error: parsedError.message,
      validationErrors: parsedError.validationErrors,
    };
  }
}

/**
 * Simplified GET request
 */
export async function apiGet<TResponse = unknown>(endpoint: string): Promise<ApiResult<TResponse>> {
  return callApi<never, TResponse>({
    endpoint,
    method: "GET",
  });
}

/**
 * Simplified POST request
 */
export async function apiPost<TRequest = unknown, TResponse = unknown>(
  endpoint: string,
  body: TRequest,
  options?: Pick<ApiCallConfig<TRequest, TResponse>, "successMessage" | "redirectUrl">
): Promise<ApiResult<TResponse>> {
  return callApi<TRequest, TResponse>({
    endpoint,
    method: "POST",
    body,
    ...options,
  });
}

/**
 * Simplified PATCH request
 */
export async function apiPatch<TRequest = unknown, TResponse = unknown>(
  endpoint: string,
  body: TRequest,
  options?: Pick<ApiCallConfig<TRequest, TResponse>, "successMessage" | "redirectUrl">
): Promise<ApiResult<TResponse>> {
  return callApi<TRequest, TResponse>({
    endpoint,
    method: "PATCH",
    body,
    ...options,
  });
}

/**
 * Simplified DELETE request
 */
export async function apiDelete<TResponse = unknown>(
  endpoint: string,
  options?: Pick<ApiCallConfig<never, TResponse>, "successMessage">
): Promise<ApiResult<TResponse>> {
  return callApi<never, TResponse>({
    endpoint,
    method: "DELETE",
    ...options,
  });
}
