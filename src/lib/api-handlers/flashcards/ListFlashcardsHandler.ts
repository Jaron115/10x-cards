/**
 * GET /api/flashcards
 * Handler for listing flashcards with pagination and filtering
 */

import { AuthenticatedHandler } from "../base/AuthenticatedHandler";
import type { AuthenticatedContext } from "../types";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { validateQuery } from "../middleware/validation";
import { GetFlashcardsQuerySchema } from "@/lib/validation/flashcard.schemas";
import type { APIContext } from "astro";
import type { z } from "zod";

export class ListFlashcardsHandler extends AuthenticatedHandler {
  private validatedQuery?: z.infer<typeof GetFlashcardsQuerySchema>;

  /**
   * Override validate to parse and validate query parameters
   */
  protected async validate(context: APIContext): Promise<Response | null> {
    const queryResult = validateQuery(context.url, GetFlashcardsQuerySchema);

    if (!queryResult.success) {
      return queryResult.error;
    }

    // Type assertion is safe here because Zod schema with .default() guarantees these fields exist
    this.validatedQuery = queryResult.data as z.infer<typeof GetFlashcardsQuerySchema>;
    return null;
  }

  /**
   * Fetch list of flashcards with pagination
   */
  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (!this.validatedQuery) {
      throw new Error("Query parameters not validated");
    }

    const flashcardService = new FlashcardService(context.supabase);
    const result = await flashcardService.getFlashcards(context.user.id, this.validatedQuery);

    return this.successResponse(result);
  }
}
