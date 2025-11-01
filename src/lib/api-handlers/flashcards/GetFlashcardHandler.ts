/**
 * GET /api/flashcards/:id
 * Handler for retrieving a single flashcard by ID
 */

import { GetByIdHandler } from "../base/CrudHandlers";
import type { AuthenticatedContext } from "../types";
import type { FlashcardDTO } from "@/types";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { FlashcardIdSchema } from "@/lib/validation/flashcard.schemas";
import type { z } from "zod";

export class GetFlashcardHandler extends GetByIdHandler<FlashcardDTO> {
  /**
   * Use FlashcardIdSchema for ID validation
   */
  protected getIdSchema(): z.ZodSchema<number> {
    return FlashcardIdSchema;
  }

  /**
   * Fetch flashcard by ID
   * Automatically handles NotFoundError through base class error handling
   */
  protected async fetchById(id: number, context: AuthenticatedContext): Promise<FlashcardDTO> {
    const flashcardService = new FlashcardService(context.supabase);
    return await flashcardService.getFlashcardById(id, context.user.id);
  }
}
