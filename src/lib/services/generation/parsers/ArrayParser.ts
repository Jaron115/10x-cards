/**
 * Parser for responses that are already arrays: [...]
 * Handles cases where AI directly returns an array of flashcards
 */

import { ResponseParser, type ParsedFlashcards } from "./ResponseParser";

export class ArrayParser extends ResponseParser {
  protected tryParse(parsed: unknown): ParsedFlashcards | null {
    // Check if parsed is already an array
    if (Array.isArray(parsed)) {
      return this.validateAndTransform(parsed);
    }

    return null; // Can't handle this format
  }
}
