/**
 * OpenRouter service for AI chat completions
 * Provides integration with OpenRouter.ai API for structured JSON responses
 */

import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResponse,
  OpenRouterErrorResponse,
} from "./openrouter.types";

/**
 * OpenRouter client for chat completions
 * Handles HTTP communication with OpenRouter.ai API
 */
export class OpenRouterClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  /**
   * Create a new OpenRouter client
   * @param apiKey - OpenRouter API key (required in production)
   * @param baseUrl - Base URL for OpenRouter API
   * @param timeoutMs - Request timeout in milliseconds
   */
  constructor(
    private readonly apiKey: string,
    baseUrl = "https://openrouter.ai/api/v1/chat/completions",
    timeoutMs = 60000
  ) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Send a chat completion request to OpenRouter
   * @param messages - Array of chat messages
   * @param options - Chat completion options
   * @returns Promise resolving to chat completion response
   * @throws Error if request fails or times out
   */
  async chatComplete(messages: ChatMessage[], options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
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
      const parsed = this.parseStructured(data);

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

  /**
   * Parse structured response from OpenRouter
   * Attempts to extract parsed JSON from response
   * @param response - Raw response from OpenRouter
   * @returns Parsed JSON if available, undefined otherwise
   */
  private parseStructured(response: unknown): unknown | undefined {
    if (!response || typeof response !== "object") {
      return undefined;
    }

    const data = response as {
      choices?: {
        message?: {
          content?: string;
          parsed?: unknown;
        };
      }[];
    };

    const message = data.choices?.[0]?.message;
    if (!message) {
      return undefined;
    }

    // Prefer parsed field if available (some models support this)
    if (message.parsed !== undefined) {
      return message.parsed;
    }

    // Fallback: try to parse content as JSON
    if (typeof message.content === "string") {
      try {
        return JSON.parse(message.content);
      } catch {
        // If parsing fails, return undefined
        return undefined;
      }
    }

    return undefined;
  }
}
