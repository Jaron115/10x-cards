/**
 * AI Error Classifier
 * Classifies generic errors into specific AIServiceError types
 */

import { AIServiceError as AIError } from "../types";

/**
 * Classify an error into appropriate AIServiceError
 * Analyzes error messages and types to determine the error category
 * @param error - Original error to classify
 * @returns Classified AIServiceError with appropriate code and details
 */
export function classifyAIError(error: Error): AIError {
  // Check for timeout errors
  if (isTimeoutError(error)) {
    return new AIError("AI service request timed out", "TIMEOUT_ERROR", error.message);
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return new AIError("Failed to connect to AI service", "NETWORK_ERROR", error.message);
  }

  // Check for OpenRouter API errors
  if (isOpenRouterError(error)) {
    return new AIError("AI service returned an error", "AI_SERVICE_ERROR", error.message);
  }

  // Unknown error - provide generic classification
  return new AIError("Failed to generate flashcards", "UNKNOWN_ERROR", error.message);
}

/**
 * Check if error is a timeout error
 * @param error - Error to check
 * @returns true if this is a timeout error
 */
function isTimeoutError(error: Error): boolean {
  return error.message.toLowerCase().includes("timed out") || error.message.toLowerCase().includes("timeout");
}

/**
 * Check if error is a network/fetch error
 * @param error - Error to check
 * @returns true if this is a network error
 */
function isNetworkError(error: Error): boolean {
  return (
    error.name === "TypeError" &&
    (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed to fetch"))
  );
}

/**
 * Check if error is an OpenRouter API error
 * @param error - Error to check
 * @returns true if this is an OpenRouter API error
 */
function isOpenRouterError(error: Error): boolean {
  return error.message.includes("OpenRouter API error") || error.message.includes("OpenRouter");
}
