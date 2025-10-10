/**
 * Generation service for AI-powered flashcard generation
 * Handles integration with Openrouter.ai API and database operations
 */

import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { FlashcardProposalDTO, InsertGenerationData, InsertGenerationErrorLogData } from "../../types.ts";
import { calculateMD5 } from "../utils/hash.ts";

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
  private readonly API_URL = "https://openrouter.ai/api/v1/chat/completions";
  private readonly TIMEOUT_MS = 60000; // 60 seconds
  private readonly USE_MOCK = true; // Set to false in production to use real AI API

  private readonly SYSTEM_PROMPT = `You are a flashcard generation expert. Generate 5-8 high-quality flashcards from the provided text.
Each flashcard should:
- Have a clear, concise question on the front
- Have a comprehensive answer on the back
- Cover important concepts from the text
- Be useful for learning and retention

Return ONLY valid JSON in this exact format (no additional text):
[{"front": "question text", "back": "answer text"}]`;

  constructor(private readonly supabase: SupabaseClient) {}

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
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: this.SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: source_text,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (!response.ok) {
        const error_text = await response.text();
        throw new AIServiceError("AI service returned an error", response.status.toString(), error_text);
      }

      const data = await response.json();
      const flashcards_proposals = this.parseAIResponse(data);
      const duration_ms = Math.round(Date.now() - start_time);

      return {
        flashcards_proposals,
        model: data.model || model,
        duration_ms,
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          throw new AIServiceError("AI service request timed out", "TIMEOUT_ERROR", error.message);
        }

        throw new AIServiceError("Failed to connect to AI service", "NETWORK_ERROR", error.message);
      }

      throw new AIServiceError("Unknown error occurred", "UNKNOWN_ERROR", String(error));
    }
  }

  /**
   * Parse AI response and extract flashcard proposals
   * @param response - Raw response from AI API
   * @returns Array of flashcard proposals
   * @throws AIServiceError if response format is invalid
   */
  private parseAIResponse(response: unknown): FlashcardProposalDTO[] {
    try {
      // Validate response structure
      if (!response || typeof response !== "object") {
        throw new Error("Invalid response format");
      }

      const data = response as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in AI response");
      }

      // Parse JSON content
      const parsed = JSON.parse(content) as { front: string; back: string }[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI response is not a valid array");
      }

      // Validate and map to FlashcardProposalDTO
      const proposals: FlashcardProposalDTO[] = parsed.map((item, index) => {
        if (!item.front || !item.back) {
          throw new Error(`Invalid flashcard at index ${index}`);
        }

        return {
          front: item.front.trim(),
          back: item.back.trim(),
          source: "ai-full",
        };
      });

      return proposals;
    } catch (error) {
      throw new AIServiceError(
        "Failed to parse AI response",
        "PARSE_ERROR",
        error instanceof Error ? error.message : String(error)
      );
    }
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
        console.error("Failed to log generation error:", db_error);
      }
    } catch (err) {
      // Don't throw - logging errors should not break the flow
      console.error("Failed to log generation error:", err);
    }
  }
}
