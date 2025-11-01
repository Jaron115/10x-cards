/**
 * PATCH /api/flashcards/:id
 * Handler for updating an existing flashcard
 */

import { UpdateHandler } from "../base/CrudHandlers";
import type { AuthenticatedContext } from "../types";
import type { FlashcardDTO } from "@/types";
import { FlashcardService } from "@/lib/services/flashcard/flashcard.service";
import { FlashcardIdSchema, UpdateFlashcardSchema } from "@/lib/validation/flashcard.schemas";
import type { z } from "zod";

type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;

export class UpdateFlashcardHandler extends UpdateHandler<UpdateFlashcardInput, FlashcardDTO> {
  /**
   * Use FlashcardIdSchema for ID validation
   */
  protected getIdSchema(): z.ZodSchema<number> {
    return FlashcardIdSchema;
  }

  /**
   * Use UpdateFlashcardSchema for body validation
   */
  protected getBodySchema(): z.ZodSchema<UpdateFlashcardInput> {
    return UpdateFlashcardSchema;
  }

  /**
   * Update flashcard
   * Automatically handles NotFoundError through base class error handling
   */
  protected async update(id: number, data: UpdateFlashcardInput, context: AuthenticatedContext): Promise<FlashcardDTO> {
    const flashcardService = new FlashcardService(context.supabase);
    return await flashcardService.updateFlashcard(id, context.user.id, data);
  }
}
