/**
 * Abstract base class for Response Parsers (Chain of Responsibility Pattern)
 * Each parser attempts to handle the response, or passes it to the next parser in the chain
 */

import { FlashcardProposalsSchema } from "../../openrouter/schemas";
import { AIServiceError as AIError } from "../types";

export interface ParsedFlashcards {
  flashcards: { front: string; back: string; source: "ai-full" }[];
}

/**
 * Abstract base parser implementing Chain of Responsibility
 */
export abstract class ResponseParser {
  private nextParser: ResponseParser | null = null;

  /**
   * Set the next parser in the chain
   * @param parser - Next parser to call if this one can't handle the response
   * @returns The next parser (for chaining)
   */
  setNext(parser: ResponseParser): ResponseParser {
    this.nextParser = parser;
    return parser;
  }

  /**
   * Try to parse the response
   * If this parser can't handle it, pass to the next parser in the chain
   * @param parsed - Raw parsed response from AI
   * @returns Parsed flashcards
   * @throws AIServiceError if no parser in the chain can handle the response
   */
  parse(parsed: unknown): ParsedFlashcards {
    const result = this.tryParse(parsed);

    if (result !== null) {
      return result;
    }

    if (this.nextParser) {
      return this.nextParser.parse(parsed);
    }

    // No parser could handle this response
    throw new AIError(
      "Failed to parse AI response",
      "PARSE_ERROR",
      `No parser could handle response of type: ${typeof parsed}`
    );
  }

  /**
   * Attempt to parse the response
   * @param parsed - Raw parsed response from AI
   * @returns Parsed flashcards if successful, null if this parser can't handle it
   */
  protected abstract tryParse(parsed: unknown): ParsedFlashcards | null;

  /**
   * Validate and transform flashcards array using Zod schema
   * @param flashcardsArray - Array to validate
   * @returns Validated flashcards with proper structure
   * @throws AIServiceError if validation fails
   */
  protected validateAndTransform(flashcardsArray: unknown): ParsedFlashcards {
    try {
      // Validate with Zod schema
      const validated = FlashcardProposalsSchema.parse(flashcardsArray);

      // Map to FlashcardProposalDTO
      return {
        flashcards: validated.map((item) => ({
          front: item.front.trim(),
          back: item.back.trim(),
          source: "ai-full" as const,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AIError("Failed to validate AI response", "VALIDATION_ERROR", error.message);
      }
      throw new AIError("Failed to validate AI response", "VALIDATION_ERROR", String(error));
    }
  }
}
