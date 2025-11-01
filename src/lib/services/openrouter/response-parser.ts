/**
 * OpenRouter Response Parser
 * Handles parsing of OpenRouter API responses with multiple fallback strategies
 */

/**
 * Response parser for OpenRouter API responses
 * Implements Single Responsibility Principle - focused solely on parsing logic
 */
export class OpenRouterResponseParser {
  /**
   * Parse structured response from OpenRouter
   * Attempts to extract parsed JSON from response with multiple fallback strategies
   *
   * Strategy order:
   * 1. Use pre-parsed field if available (some models support this)
   * 2. Parse content as JSON string
   * 3. Return undefined if parsing fails
   *
   * @param response - Raw response from OpenRouter
   * @returns Parsed JSON if available, undefined otherwise
   */
  parse(response: unknown): unknown | undefined {
    if (!response || typeof response !== "object") {
      return undefined;
    }

    const message = this.extractMessage(response);
    if (!message) {
      return undefined;
    }

    // Strategy 1: Prefer parsed field if available (some models support this)
    if (message.parsed !== undefined) {
      return message.parsed;
    }

    // Strategy 2: Try to parse content as JSON
    if (typeof message.content === "string") {
      return this.tryParseJson(message.content);
    }

    return undefined;
  }

  /**
   * Extract message from OpenRouter response structure
   * @param response - Raw response object
   * @returns Message object or undefined
   */
  private extractMessage(response: unknown): { content?: string; parsed?: unknown } | undefined {
    const data = response as {
      choices?: {
        message?: {
          content?: string;
          parsed?: unknown;
        };
      }[];
    };

    return data.choices?.[0]?.message;
  }

  /**
   * Attempt to parse string as JSON
   * @param content - String content to parse
   * @returns Parsed JSON or undefined if parsing fails
   */
  private tryParseJson(content: string): unknown | undefined {
    try {
      return JSON.parse(content);
    } catch {
      // If parsing fails, return undefined
      return undefined;
    }
  }
}
