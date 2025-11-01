/**
 * POST /api/flashcards/bulk
 * Handler for creating multiple flashcards at once (after AI generation)
 */

import { CreateHandler } from "../base/CrudHandlers";
import type { AuthenticatedContext } from "../types";
import type { CreateFlashcardsBulkResponseDTO } from "@/types";
import { FlashcardService } from "@/lib/services/flashcard/flashcard.service";
import { CreateFlashcardsBulkSchema } from "@/lib/validation/flashcard.schemas";
import type { z } from "zod";

type BulkCreateInput = z.infer<typeof CreateFlashcardsBulkSchema>;

export class BulkCreateFlashcardsHandler extends CreateHandler<BulkCreateInput, CreateFlashcardsBulkResponseDTO> {
  /**
   * Use CreateFlashcardsBulkSchema for body validation
   */
  protected getBodySchema(): z.ZodSchema<BulkCreateInput> {
    return CreateFlashcardsBulkSchema;
  }

  /**
   * Create flashcards in bulk
   * Automatically handles NotFoundError and ValidationError through base class error handling
   */
  protected async create(
    data: BulkCreateInput,
    context: AuthenticatedContext
  ): Promise<CreateFlashcardsBulkResponseDTO> {
    const flashcardService = new FlashcardService(context.supabase);
    const { generation_id, flashcards } = data;

    return await flashcardService.createFlashcardsBulk(context.user.id, generation_id, flashcards);
  }
}
