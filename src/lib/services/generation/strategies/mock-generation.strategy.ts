/**
 * Mock Generation Strategy
 * Provides mock flashcard generation for development and E2E testing
 */

import type { FlashcardProposalDTO } from "@/types";
import type { GenerationStrategy, GenerationResult } from "../types";

/**
 * Mock generation strategy for development and testing
 * Returns predefined flashcards without calling external AI service
 */
export class MockGenerationStrategy implements GenerationStrategy {
  /**
   * Generate mock flashcards
   * @param sourceText - The source text (used for back content snippet)
   * @param _apiKey - Not used in mock (preserved for interface compatibility)
   * @param model - Model name to include in result
   * @returns Promise that resolves to mock generation result
   */
  async generateFlashcards(sourceText: string, _apiKey: string, model: string): Promise<GenerationResult> {
    // Simulate API delay (2-3 seconds)
    const duration_ms = Math.round(2000 + Math.random() * 1000);
    await this.sleep(duration_ms);

    const flashcards_proposals: FlashcardProposalDTO[] = [
      {
        front: "What is the main topic covered in this text?",
        back: `The text discusses various concepts related to the subject matter (${sourceText.substring(0, 50)}...).`,
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
   * Sleep for specified milliseconds (to simulate API delay)
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
