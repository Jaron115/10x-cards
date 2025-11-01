/**
 * DELETE /api/flashcards/:id
 * Handler for deleting a flashcard
 */

import { DeleteHandler } from "../base/CrudHandlers";
import type { AuthenticatedContext } from "../types";
import { FlashcardService } from "@/lib/services/flashcard/flashcard.service";
import { FlashcardIdSchema } from "@/lib/validation/flashcard.schemas";
import type { z } from "zod";

export class DeleteFlashcardHandler extends DeleteHandler {
  /**
   * Use FlashcardIdSchema for ID validation
   */
  protected getIdSchema(): z.ZodSchema<number> {
    return FlashcardIdSchema;
  }

  /**
   * Delete flashcard
   * Automatically handles NotFoundError through base class error handling
   */
  protected async delete(id: number, context: AuthenticatedContext): Promise<void> {
    const flashcardService = new FlashcardService(context.supabase);
    await flashcardService.deleteFlashcard(id, context.user.id);
  }
}
