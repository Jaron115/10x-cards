/**
 * GET /api/study/session
 * Handler for retrieving flashcards for study session
 */

import { AuthenticatedHandler } from "../base/AuthenticatedHandler";
import type { AuthenticatedContext } from "../types";
import { StudyService } from "@/lib/services/study/study.service";
import { validateQuery } from "../middleware/validation";
import { GetStudySessionQuerySchema } from "@/lib/validation/study.schemas";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import type { APIContext } from "astro";
import type { z } from "zod";
import type { GetStudySessionResponse } from "@/types";

export class GetStudySessionHandler extends AuthenticatedHandler {
  private validatedQuery?: z.infer<typeof GetStudySessionQuerySchema>;

  /**
   * Override validate to parse and validate query parameters
   */
  protected async validate(context: APIContext): Promise<Response | null> {
    const queryResult = validateQuery(context.url, GetStudySessionQuerySchema);

    if (!queryResult.success) {
      return queryResult.error;
    }

    // Type assertion is safe here because Zod schema with .default() guarantees these fields exist
    this.validatedQuery = queryResult.data as z.infer<typeof GetStudySessionQuerySchema>;
    return null;
  }

  /**
   * Fetch flashcards for study session with filtering and shuffling
   */
  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (!this.validatedQuery) {
      throw new Error("Query parameters not validated");
    }

    try {
      const studyService = new StudyService(context.supabase);

      // Fetch flashcards for study
      const { flashcards, totalCount } = await studyService.getFlashcardsForStudy(context.user.id, this.validatedQuery);

      // Check if user has any flashcards at all
      if (flashcards.length === 0) {
        const userTotalCount = await studyService.getUserFlashcardsCount(context.user.id);

        // No flashcards at all
        if (userTotalCount === 0) {
          return ApiResponseBuilder.notFound(
            "Brak fiszek do nauki. Najpierw utwórz fiszki w generatorze lub dodaj ręcznie."
          );
        }

        // Has flashcards but none match the filters
        return ApiResponseBuilder.notFound("Żadna fiszka nie pasuje do wybranych filtrów.");
      }

      // Generate unique session ID
      const sessionId = crypto.randomUUID();

      // Build response
      const response: GetStudySessionResponse = {
        session_id: sessionId,
        flashcards,
        total_count: flashcards.length,
        user_total_flashcards: totalCount,
      };

      return ApiResponseBuilder.success(response);
    } catch (error) {
      console.error("Study session error:", error);
      return ApiResponseBuilder.internalError("Nie udało się załadować sesji nauki. Spróbuj ponownie później.");
    }
  }
}
