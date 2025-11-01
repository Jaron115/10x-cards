/**
 * OpenRouter Generation Strategy
 * Provides real AI-powered flashcard generation via OpenRouter.ai
 */

import { OpenRouterService } from "../../openrouter/openrouter.service";
import { FLASHCARD_GENERATION_SYSTEM_PROMPT } from "../../openrouter/prompts";
import type { GenerationStrategy, GenerationResult } from "../types";
import { AIServiceError as AIError } from "../types";
import { ResponseParser } from "../parsers/ResponseParser";
import { ObjectWithFlashcardsParser } from "../parsers/ObjectWithFlashcardsParser";
import { ArrayParser } from "../parsers/ArrayParser";
import { StringParser } from "../parsers/StringParser";
import { classifyAIError } from "../classifiers/AIErrorClassifier";

/**
 * OpenRouter generation strategy
 * Uses OpenRouter.ai API to generate flashcards with AI models
 */
export class OpenRouterGenerationStrategy implements GenerationStrategy {
  private readonly responseParser: ResponseParser;

  constructor(private readonly timeoutMs = 60000) {
    // Setup Chain of Responsibility for parsing AI responses
    // Order matters: try most common format first, then fallbacks
    this.responseParser = new ObjectWithFlashcardsParser();
    this.responseParser.setNext(new ArrayParser()).setNext(new StringParser());
  }

  /**
   * Generate flashcards using OpenRouter AI
   * @param sourceText - The text to generate flashcards from
   * @param apiKey - OpenRouter API key
   * @param model - AI model to use
   * @returns Promise that resolves to generation result
   * @throws AIServiceError if generation fails
   */
  async generateFlashcards(sourceText: string, apiKey: string, model: string): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const client = new OpenRouterService(apiKey, undefined, this.timeoutMs);

      // Enhanced system prompt with explicit JSON format instructions
      const enhancedSystemPrompt = `${FLASHCARD_GENERATION_SYSTEM_PROMPT}

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "flashcards": [
    {"front": "question text", "back": "answer text"},
    {"front": "question text", "back": "answer text"}
  ]
}

Generate between 5 and 8 flashcards. Do not include any text before or after the JSON.`;

      const { raw, parsed } = await client.chatComplete(
        [
          { role: "system", content: enhancedSystemPrompt },
          { role: "user", content: sourceText },
        ],
        {
          model,
          // Note: Some models via OpenRouter don't support response_format with json_schema
          // We'll rely on prompt engineering instead
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 2000,
        }
      );

      // Parse AI response using Chain of Responsibility
      const { flashcards } = this.parseAIResponse(parsed);
      const durationMs = Math.round(Date.now() - startTime);

      // Extract model from response if available
      const responseModel = (raw as { model?: string })?.model || model;

      return {
        flashcards_proposals: flashcards,
        model: responseModel,
        duration_ms: durationMs,
      };
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }

      if (error instanceof Error) {
        throw classifyAIError(error);
      }

      throw new AIError("Unknown error occurred", "UNKNOWN_ERROR", String(error));
    }
  }

  /**
   * Parse AI response and extract flashcard proposals
   * Uses Chain of Responsibility pattern to handle different response formats
   * @param parsed - Parsed response from OpenRouter client
   * @returns Parsed flashcards with proper structure
   * @throws AIServiceError if response format is invalid
   */
  private parseAIResponse(parsed: unknown): { flashcards: { front: string; back: string; source: "ai-full" }[] } {
    if (!parsed) {
      throw new AIError("No parsed content in AI response", "PARSE_ERROR", "Response was empty or invalid");
    }

    // Log parsed response for debugging
    // eslint-disable-next-line no-console
    console.log("Parsing AI response:", JSON.stringify(parsed).substring(0, 500));

    try {
      // Use Chain of Responsibility to parse response
      return this.responseParser.parse(parsed);
    } catch (error) {
      // Log full error for debugging
      // eslint-disable-next-line no-console
      console.error("AI Response parsing failed:", error);

      // Re-throw AIServiceError as-is, wrap others
      if (error instanceof AIError) {
        throw error;
      }

      throw new AIError(
        "Failed to parse AI response",
        "PARSE_ERROR",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
