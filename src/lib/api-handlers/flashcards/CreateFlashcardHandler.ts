/**
 * POST /api/flashcards
 * Handler for creating a single manual flashcard
 */

import { CreateHandler } from "../base/CrudHandlers";
import type { AuthenticatedContext } from "../types";
import type { FlashcardDTO } from "@/types";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { CreateFlashcardSchema } from "@/lib/validation/flashcard.schemas";
import type { z } from "zod";

type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;

export class CreateFlashcardHandler extends CreateHandler<CreateFlashcardInput, FlashcardDTO> {
  /**
   * Use CreateFlashcardSchema for body validation
   */
  protected getBodySchema(): z.ZodSchema<CreateFlashcardInput> {
    return CreateFlashcardSchema;
  }

  /**
   * Create flashcard
   */
  protected async create(data: CreateFlashcardInput, context: AuthenticatedContext): Promise<FlashcardDTO> {
    const flashcardService = new FlashcardService(context.supabase);
    return await flashcardService.createFlashcard(context.user.id, data);
  }
}
