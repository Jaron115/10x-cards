/**
 * Generation service for AI-powered flashcard generation
 * Handles integration with Openrouter.ai API and database operations
 */

import { OPENROUTER_USE_MOCK, OPENROUTER_TIMEOUT_MS } from "astro:env/server";
import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { FlashcardProposalDTO, InsertGenerationData, InsertGenerationErrorLogData } from "../../types.ts";
import { calculateMD5 } from "../utils/hash.ts";
import { OpenRouterClient } from "./openrouter.service.ts";
import { FLASHCARD_GENERATION_SYSTEM_PROMPT, FlashcardProposalsSchema } from "./openrouter.types.ts";

/**
 * Result of AI generation
 */
export interface GenerationResult {
  flashcards_proposals: FlashcardProposalDTO[];
  model: string | null;
  duration_ms: number;
}

/**
 * AI service error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Generation service class
 * Provides methods for AI-powered flashcard generation and database operations
 */
export class GenerationService {
  private readonly USE_MOCK: boolean;
  private readonly TIMEOUT_MS: number;

  constructor(private readonly supabase: SupabaseClient) {
    // Read configuration from environment
    this.USE_MOCK = OPENROUTER_USE_MOCK === "true";
    this.TIMEOUT_MS = parseInt(OPENROUTER_TIMEOUT_MS, 10);
  }

  /**
   * Generate flashcard proposals from source text using AI
   * @param source_text - The text to generate flashcards from
   * @param api_key - Openrouter API key
   * @param model - AI model to use
   * @returns Promise that resolves to generation result
   * @throws AIServiceError if generation fails
   */
  async generateFlashcards(source_text: string, api_key: string, model: string): Promise<GenerationResult> {
    const start_time = Date.now();

    // Use mock data in development
    if (this.USE_MOCK) {
      return this.generateMockFlashcards(source_text, model);
    }

    try {
      const client = new OpenRouterClient(api_key, undefined, this.TIMEOUT_MS);

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
          { role: "user", content: source_text },
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

      const flashcards_proposals = this.parseAIResponse(parsed);
      const duration_ms = Math.round(Date.now() - start_time);

      // Extract model from response if available
      const response_model = (raw as { model?: string })?.model || model;

      return {
        flashcards_proposals,
        model: response_model,
        duration_ms,
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        // Check for timeout errors
        if (error.message.includes("timed out")) {
          throw new AIServiceError("AI service request timed out", "TIMEOUT_ERROR", error.message);
        }

        // Check for network errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new AIServiceError("Failed to connect to AI service", "NETWORK_ERROR", error.message);
        }

        // OpenRouter API errors
        if (error.message.includes("OpenRouter API error")) {
          throw new AIServiceError("AI service returned an error", "AI_SERVICE_ERROR", error.message);
        }

        throw new AIServiceError("Failed to generate flashcards", "UNKNOWN_ERROR", error.message);
      }

      throw new AIServiceError("Unknown error occurred", "UNKNOWN_ERROR", String(error));
    }
  }

  /**
   * Parse AI response and extract flashcard proposals
   * @param parsed - Parsed response from OpenRouter client
   * @returns Array of flashcard proposals
   * @throws AIServiceError if response format is invalid
   */
  private parseAIResponse(parsed: unknown): FlashcardProposalDTO[] {
    if (!parsed) {
      throw new AIServiceError("No parsed content in AI response", "PARSE_ERROR", "Response was empty or invalid");
    }

    try {
      // Extract flashcards array from the response
      let flashcardsArray: unknown;

      // Log parsed response for debugging
      // eslint-disable-next-line no-console
      console.log("Parsing AI response:", JSON.stringify(parsed).substring(0, 500));

      if (typeof parsed === "object" && parsed !== null && "flashcards" in parsed) {
        flashcardsArray = (parsed as { flashcards: unknown }).flashcards;
      } else if (Array.isArray(parsed)) {
        // Fallback: if response is already an array
        flashcardsArray = parsed;
      } else if (typeof parsed === "string") {
        // Try to parse string as JSON
        try {
          const jsonParsed = JSON.parse(parsed);
          if (typeof jsonParsed === "object" && jsonParsed !== null && "flashcards" in jsonParsed) {
            flashcardsArray = jsonParsed.flashcards;
          } else if (Array.isArray(jsonParsed)) {
            flashcardsArray = jsonParsed;
          } else {
            throw new Error("Parsed string does not contain valid structure");
          }
        } catch (parseError) {
          throw new Error(
            `Failed to parse string response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
        }
      } else {
        throw new Error(`Response does not contain flashcards array. Type: ${typeof parsed}`);
      }

      if (!flashcardsArray) {
        throw new Error("Flashcards array is null or undefined");
      }

      // Validate with Zod schema
      const validated = FlashcardProposalsSchema.parse(flashcardsArray);

      // Map to FlashcardProposalDTO
      return this.toFlashcardProposals(validated);
    } catch (error) {
      // Log full error for debugging
      // eslint-disable-next-line no-console
      console.error("AI Response parsing failed:", error);

      if (error instanceof Error) {
        throw new AIServiceError("Failed to validate AI response", "VALIDATION_ERROR", error.message);
      }
      throw new AIServiceError("Failed to parse AI response", "PARSE_ERROR", String(error));
    }
  }

  /**
   * Convert validated flashcards to FlashcardProposalDTO array
   * @param validated - Validated flashcard proposals
   * @returns Array of FlashcardProposalDTO
   */
  private toFlashcardProposals(validated: { front: string; back: string }[]): FlashcardProposalDTO[] {
    return validated.map((item) => ({
      front: item.front.trim(),
      back: item.back.trim(),
      source: "ai-full" as const,
    }));
  }

  /**
   * Generate mock flashcards for development/testing
   * @param source_text - The source text
   * @param model - Model name to include in result
   * @returns Mock generation result
   */
  private generateMockFlashcards(source_text: string, model: string): GenerationResult {
    // Simulate API delay
    const duration_ms = Math.round(2000 + Math.random() * 1000); // 2-3 seconds

    const flashcards_proposals: FlashcardProposalDTO[] = [
      {
        front: "What is the main topic covered in this text?",
        back: `The text discusses various concepts related to the subject matter (${source_text.substring(0, 50)}...).`,
        source: "ai-full",
      },
      {
        front: "What are the key points mentioned?",
        back: "The key points include fundamental concepts, practical applications, and important considerations for implementation.",
        source: "ai-full",
      },
      {
        front: "How can this information be applied?",
        back: "This information can be applied in real-world scenarios by following the guidelines and best practices outlined in the content.",
        source: "ai-full",
      },
      {
        front: "What is the significance of this topic?",
        back: "This topic is significant because it addresses fundamental aspects that are essential for understanding the broader context.",
        source: "ai-full",
      },
      {
        front: "What are the benefits of understanding this material?",
        back: "Understanding this material provides a solid foundation for further learning and enables practical application of the concepts.",
        source: "ai-full",
      },
    ];

    return {
      flashcards_proposals,
      model: `${model} (mock)`,
      duration_ms,
    };
  }

  /**
   * Save generation metadata to database
   * @param user_id - User ID who requested generation
   * @param source_text - Original source text
   * @param result - Generation result from AI
   * @returns Promise that resolves to generation ID
   * @throws Error if database operation fails
   */
  async saveGeneration(user_id: string, source_text: string, result: GenerationResult): Promise<number> {
    const source_text_hash = calculateMD5(source_text);

    const generation_data: InsertGenerationData = {
      user_id,
      duration_ms: result.duration_ms,
      model: result.model,
      generated_count: result.flashcards_proposals.length,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash,
      source_text_length: source_text.length,
    };

    const { data, error } = await this.supabase.from("generations").insert(generation_data).select("id").single();

    if (error) {
      throw new Error(`Failed to save generation: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error("No generation ID returned from database");
    }

    return data.id;
  }

  /**
   * Log AI service error to database
   * @param user_id - User ID who requested generation
   * @param source_text - Original source text
   * @param model - AI model that was attempted
   * @param error - The error that occurred
   * @returns Promise that resolves when error is logged (does not throw)
   */
  async logError(user_id: string, source_text: string, model: string | null, error: AIServiceError): Promise<void> {
    try {
      const source_text_hash = calculateMD5(source_text);

      const error_log: InsertGenerationErrorLogData = {
        user_id,
        model,
        source_text_hash,
        source_text_length: source_text.length,
        error_code: error.code,
        error_message: error.message,
      };

      const { error: db_error } = await this.supabase.from("generation_error_logs").insert(error_log);

      if (db_error) {
        // eslint-disable-next-line no-console
        console.error("Failed to log generation error:", db_error);
      }
    } catch (err) {
      // Don't throw - logging errors should not break the flow
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", err);
    }
  }
}
