/**
 * Parser for string responses that contain JSON
 * Handles cases where AI returns a JSON string that needs to be parsed
 */

import { ResponseParser, type ParsedFlashcards } from "./ResponseParser";
import { AIServiceError as AIError } from "../types";

export class StringParser extends ResponseParser {
  protected tryParse(parsed: unknown): ParsedFlashcards | null {
    // Check if parsed is a string
    if (typeof parsed !== "string") {
      return null; // Can't handle non-string
    }

    try {
      const jsonParsed = JSON.parse(parsed);

      // After parsing, check if it's an object with flashcards property
      if (typeof jsonParsed === "object" && jsonParsed !== null && "flashcards" in jsonParsed) {
        const flashcardsArray = (jsonParsed as { flashcards: unknown }).flashcards;

        if (!flashcardsArray) {
          return null;
        }

        return this.validateAndTransform(flashcardsArray);
      }

      // Or if it's directly an array
      if (Array.isArray(jsonParsed)) {
        return this.validateAndTransform(jsonParsed);
      }

      // Parsed string doesn't contain valid structure
      throw new AIError(
        "Failed to parse string response",
        "PARSE_ERROR",
        "Parsed string does not contain valid flashcards structure"
      );
    } catch (error) {
      // JSON.parse failed or validation failed
      if (error instanceof AIError) {
        throw error;
      }

      throw new AIError(
        "Failed to parse string response",
        "PARSE_ERROR",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
