/**
 * Parser for responses in format: { flashcards: [...] }
 * Handles the most common case where AI returns an object with a "flashcards" property
 */

import { ResponseParser, type ParsedFlashcards } from "./ResponseParser";

export class ObjectWithFlashcardsParser extends ResponseParser {
  protected tryParse(parsed: unknown): ParsedFlashcards | null {
    // Check if parsed is an object with "flashcards" property
    if (typeof parsed === "object" && parsed !== null && "flashcards" in parsed) {
      const flashcardsArray = (parsed as { flashcards: unknown }).flashcards;

      if (!flashcardsArray) {
        return null; // flashcards property exists but is null/undefined
      }

      return this.validateAndTransform(flashcardsArray);
    }

    return null; // Can't handle this format
  }
}
