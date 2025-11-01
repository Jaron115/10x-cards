/**
 * TypeScript interfaces and types for OpenRouter service
 */

/**
 * Retry configuration for OpenRouter service
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds (default: 1000) */
  initialBackoffMs?: number;
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
}

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterServiceConfig {
  /** OpenRouter API key (required) */
  apiKey: string;
  /** Base URL for OpenRouter API (optional, defaults to official endpoint) */
  baseUrl?: string;
  /** Request timeout in milliseconds (optional, defaults to 60000) */
  timeoutMs?: number;
  /** Retry configuration (optional, enables retry logic if provided) */
  retry?: RetryConfig;
}

/**
 * Chat message structure for OpenRouter API
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * JSON Schema configuration for structured responses
 */
export interface ResponseFormatJsonSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

/**
 * Response format type (can be extended in the future)
 */
export type ResponseFormat = ResponseFormatJsonSchema;

/**
 * Options for chat completion request
 */
export interface ChatCompletionOptions {
  model: string;
  response_format?: ResponseFormat;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  seed?: number;
  extraHeaders?: Record<string, string>;
}

/**
 * Chat completion response structure
 */
export interface ChatCompletionResponse {
  raw: unknown;
  parsed?: unknown;
}

/**
 * OpenRouter API error response
 */
export interface OpenRouterErrorResponse {
  error?: {
    message: string;
    code?: string;
  };
}
