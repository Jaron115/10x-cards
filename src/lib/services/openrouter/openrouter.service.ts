/**
 * OpenRouter client for AI chat completions
 * Handles HTTP communication with OpenRouter.ai API
 */

import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResponse,
  OpenRouterErrorResponse,
  OpenRouterServiceConfig,
  RetryConfig,
} from "./types";
import { OpenRouterResponseParser } from "./response-parser";

/**
 * OpenRouter service for chat completions
 * Handles HTTP communication with OpenRouter.ai API
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retryConfig?: RetryConfig;
  private readonly responseParser: OpenRouterResponseParser;

  /**
   * Create a new OpenRouter service
   *
   * Supports two constructor signatures for backward compatibility:
   * 1. New: `new OpenRouterService({ apiKey, baseUrl?, timeoutMs? })`
   * 2. Legacy: `new OpenRouterService(apiKey, baseUrl?, timeoutMs?)`
   */
  constructor(configOrApiKey: OpenRouterServiceConfig | string, baseUrl?: string, timeoutMs?: number) {
    // Handle both new config object and legacy positional parameters
    const config = this.normalizeConfig(configOrApiKey, baseUrl, timeoutMs);

    // Validate configuration
    this.validateConfig(config);

    // Set properties
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://openrouter.ai/api/v1/chat/completions";
    this.timeoutMs = config.timeoutMs ?? 60000;
    this.retryConfig = config.retry;
    this.responseParser = new OpenRouterResponseParser();
  }

  /**
   * Normalize constructor parameters to config object
   * Supports both new and legacy constructor signatures
   */
  private normalizeConfig(
    configOrApiKey: OpenRouterServiceConfig | string,
    baseUrl?: string,
    timeoutMs?: number
  ): OpenRouterServiceConfig {
    if (typeof configOrApiKey === "string") {
      // Legacy constructor: (apiKey, baseUrl?, timeoutMs?)
      return {
        apiKey: configOrApiKey,
        baseUrl,
        timeoutMs,
      };
    }

    // New constructor: (config)
    return configOrApiKey;
  }

  /**
   * Validate service configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: OpenRouterServiceConfig): void {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new Error("OpenRouter API key is required");
    }

    if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
      throw new Error("Timeout must be greater than 0");
    }

    if (config.baseUrl !== undefined && config.baseUrl.trim() === "") {
      throw new Error("Base URL cannot be empty string");
    }
  }

  /**
   * Send a chat completion request to OpenRouter
   * @param messages - Array of chat messages
   * @param options - Chat completion options
   * @returns Promise resolving to chat completion response
   * @throws Error if request fails or times out
   */
  async chatComplete(messages: ChatMessage[], options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    // Use retry logic if configured, otherwise make single request
    if (this.retryConfig) {
      return this.chatCompleteWithRetry(messages, options);
    }

    return this.executeChatComplete(messages, options);
  }

  /**
   * Execute chat completion with retry logic and exponential backoff
   * @param messages - Array of chat messages
   * @param options - Chat completion options
   * @returns Promise resolving to chat completion response
   * @throws Error if all retries fail
   */
  private async chatCompleteWithRetry(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const maxRetries = this.retryConfig?.maxRetries ?? 3;
    const initialBackoff = this.retryConfig?.initialBackoffMs ?? 1000;
    const multiplier = this.retryConfig?.backoffMultiplier ?? 2;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeChatComplete(messages, options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retriable
        if (!this.isRetriableError(error)) {
          throw error;
        }

        // Calculate backoff delay with exponential backoff
        const backoffMs = initialBackoff * Math.pow(multiplier, attempt);

        // eslint-disable-next-line no-console
        console.warn(
          `OpenRouter request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms...`,
          error
        );

        // Wait before retrying
        await this.sleep(backoffMs);
      }
    }

    throw lastError ?? new Error("Request failed after all retries");
  }

  /**
   * Execute single chat completion request (no retry)
   * @param messages - Array of chat messages
   * @param options - Chat completion options
   * @returns Promise resolving to chat completion response
   * @throws Error if request fails or times out
   */
  private async executeChatComplete(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    try {
      const headers = this.buildHeaders(options.extraHeaders);
      const payload = this.buildPayload(messages, options);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      await this.assertOk(response);

      const data = await response.json();
      const parsed = this.responseParser.parse(data);

      return {
        raw: data,
        parsed,
      };
    } catch (error) {
      // Re-throw with better error context
      if (error instanceof Error) {
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          throw new Error(`OpenRouter request timed out after ${this.timeoutMs}ms`);
        }
      }
      throw error;
    }
  }

  /**
   * Check if error is retriable
   * Retries on: network errors, 429 (rate limit), 500+ (server errors)
   * Does not retry on: 4xx client errors (except 429), timeouts
   */
  private isRetriableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    // Don't retry timeouts - they already took too long
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return false;
    }

    // Retry network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return true;
    }

    // Retry on rate limit (429) and server errors (500+)
    // Extract status code from error message if available
    const statusMatch = error.message.match(/\b(429|5\d{2})\b/);
    if (statusMatch) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build HTTP headers for OpenRouter request
   * @param extraHeaders - Additional headers to include
   * @returns Headers object
   */
  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    };
  }

  /**
   * Build request payload for OpenRouter API
   * @param messages - Chat messages
   * @param options - Chat completion options
   * @returns Request payload object
   */
  private buildPayload(messages: ChatMessage[], options: ChatCompletionOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      model: options.model,
      messages,
    };

    // Add optional parameters
    if (options.response_format) {
      payload.response_format = options.response_format;
    }
    if (options.temperature !== undefined) {
      payload.temperature = options.temperature;
    }
    if (options.top_p !== undefined) {
      payload.top_p = options.top_p;
    }
    if (options.max_tokens !== undefined) {
      payload.max_tokens = options.max_tokens;
    }
    if (options.seed !== undefined) {
      payload.seed = options.seed;
    }

    return payload;
  }

  /**
   * Assert that response is OK (2xx status code)
   * @param response - Fetch response
   * @throws Error if response is not OK
   */
  private async assertOk(response: Response): Promise<void> {
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
      let errorDetails: unknown;

      try {
        if (contentType?.includes("application/json")) {
          const errorData = (await response.json()) as OpenRouterErrorResponse;
          errorDetails = errorData;
          if (errorData.error?.message) {
            errorMessage = `OpenRouter API error: ${errorData.error.message}`;
            if (errorData.error.code) {
              errorMessage += ` (code: ${errorData.error.code})`;
            }
          }
        } else {
          const errorText = await response.text();
          errorDetails = errorText;
          if (errorText) {
            errorMessage = `OpenRouter API error: ${errorText}`;
          }
        }
      } catch {
        // If parsing fails, use the default error message
      }

      // Log detailed error for debugging
      // eslint-disable-next-line no-console
      console.error("OpenRouter API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
      });

      throw new Error(errorMessage);
    }
  }
}
