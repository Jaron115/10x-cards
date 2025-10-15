/**
 * Flashcard service for managing flashcard CRUD operations
 * Handles database interactions for flashcards with proper validation and error handling
 */

import type { SupabaseClient } from "../../db/supabase.client.ts";
import type {
  FlashcardDTO,
  FlashcardEntity,
  GetFlashcardsResponseDTO,
  InsertFlashcardData,
  UpdateFlashcardData,
  CreateFlashcardsBulkResponseDTO,
  PaginationDTO,
} from "../../types.ts";
import { NotFoundError, ValidationError } from "../errors.ts";
import type {
  ValidatedCreateFlashcardCommand,
  ValidatedUpdateFlashcardCommand,
  ValidatedFlashcardBulkItem,
  ValidatedGetFlashcardsQuery,
} from "../validation/flashcard.schemas.ts";

/**
 * Flashcard service class
 * Provides methods for flashcard CRUD operations and database interactions
 */
export class FlashcardService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get all flashcards for a user with pagination and filtering
   * @param user_id - User ID who owns the flashcards
   * @param query_params - Query parameters for pagination and filtering
   * @returns Promise that resolves to paginated flashcards response
   * @throws Error if database operation fails
   */
  async getFlashcards(user_id: string, query_params: ValidatedGetFlashcardsQuery): Promise<GetFlashcardsResponseDTO> {
    const { page, limit, source, sort, order } = query_params;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", user_id);

    // Apply source filter if provided
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    // Transform entities to DTOs (exclude user_id)
    const flashcards: FlashcardDTO[] = (data || []).map((entity) => this.entityToDTO(entity));

    // Calculate pagination metadata
    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total,
      total_pages,
    };

    return {
      flashcards,
      pagination,
    };
  }

  /**
   * Get a single flashcard by ID
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @returns Promise that resolves to flashcard DTO
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async getFlashcardById(id: number, user_id: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (error || !data) {
      throw new NotFoundError("Flashcard not found");
    }

    return this.entityToDTO(data);
  }

  /**
   * Create a single manual flashcard
   * @param user_id - User ID who creates the flashcard
   * @param command - Create flashcard command with front and back text
   * @returns Promise that resolves to created flashcard DTO
   * @throws Error if database operation fails
   */
  async createFlashcard(user_id: string, command: ValidatedCreateFlashcardCommand): Promise<FlashcardDTO> {
    const insert_data: InsertFlashcardData = {
      user_id,
      front: command.front,
      back: command.back,
      source: "manual",
      generation_id: null,
    };

    const { data, error } = await this.supabase.from("flashcards").insert(insert_data).select("*").single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("No flashcard data returned from database");
    }

    return this.entityToDTO(data);
  }

  /**
   * Create multiple flashcards at once (from AI generation)
   * @param user_id - User ID who creates the flashcards
   * @param generation_id - ID of the generation session
   * @param flashcards - Array of flashcard data to create
   * @returns Promise that resolves to bulk creation response
   * @throws NotFoundError if generation not found or doesn't belong to user
   * @throws ValidationError if validation fails (e.g., exceeds generated_count)
   * @throws Error if database operation fails
   */
  async createFlashcardsBulk(
    user_id: string,
    generation_id: number,
    flashcards: ValidatedFlashcardBulkItem[]
  ): Promise<CreateFlashcardsBulkResponseDTO> {
    // 1. Verify generation exists and belongs to user
    const { data: generation, error: generation_error } = await this.supabase
      .from("generations")
      .select("*")
      .eq("id", generation_id)
      .eq("user_id", user_id)
      .single();

    if (generation_error || !generation) {
      throw new NotFoundError("Generation not found");
    }

    // 2. Count new flashcards by source
    const new_ai_full_count = flashcards.filter((f) => f.source === "ai-full").length;
    const new_ai_edited_count = flashcards.filter((f) => f.source === "ai-edited").length;

    // 3. Calculate total accepted count after this operation
    const current_accepted = generation.accepted_unedited_count + generation.accepted_edited_count;
    const total_after_bulk = current_accepted + flashcards.length;

    // 4. Validate: total accepted cannot exceed generated_count
    if (total_after_bulk > generation.generated_count) {
      throw new ValidationError(
        `Cannot accept more flashcards than generated. Generated: ${generation.generated_count}, Already accepted: ${current_accepted}, Trying to add: ${flashcards.length}`,
        {
          generated_count: generation.generated_count,
          current_accepted_count: current_accepted,
          requested_count: flashcards.length,
          available_slots: generation.generated_count - current_accepted,
        }
      );
    }

    // 5. Prepare insert data
    const insert_data: InsertFlashcardData[] = flashcards.map((flashcard) => ({
      user_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      generation_id,
    }));

    // 6. Insert flashcards
    const { data: created_flashcards, error: insert_error } = await this.supabase
      .from("flashcards")
      .insert(insert_data)
      .select("*");

    if (insert_error) {
      throw new Error(`Failed to create flashcards: ${insert_error.message}`);
    }

    if (!created_flashcards || created_flashcards.length === 0) {
      throw new Error("No flashcards were created");
    }

    // 7. Update generation record with new accepted counts
    const updated_unedited_count = generation.accepted_unedited_count + new_ai_full_count;
    const updated_edited_count = generation.accepted_edited_count + new_ai_edited_count;

    const { error: update_error } = await this.supabase
      .from("generations")
      .update({
        accepted_unedited_count: updated_unedited_count,
        accepted_edited_count: updated_edited_count,
      })
      .eq("id", generation_id);

    if (update_error) {
      // This is a critical error - flashcards were created but generation wasn't updated
      console.error("Failed to update generation counts:", update_error);
      throw new Error(`Failed to update generation counts: ${update_error.message}`);
    }

    // 8. Transform entities to DTOs
    const flashcard_dtos = created_flashcards.map((entity) => this.entityToDTO(entity));

    return {
      created_count: created_flashcards.length,
      flashcards: flashcard_dtos,
    };
  }

  /**
   * Update an existing flashcard
   * Implements source transition logic:
   * - "ai-full" → "ai-edited" when content changes
   * - "manual" stays "manual"
   * - "ai-edited" stays "ai-edited"
   *
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @param command - Update command with optional front/back fields
   * @returns Promise that resolves to updated flashcard DTO
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async updateFlashcard(id: number, user_id: string, command: ValidatedUpdateFlashcardCommand): Promise<FlashcardDTO> {
    // 1. Get existing flashcard to verify ownership and current state
    const { data: existing, error: fetch_error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundError("Flashcard not found");
    }

    // 2. Prepare update data
    const update_data: UpdateFlashcardData = {};

    if (command.front !== undefined) {
      update_data.front = command.front;
    }

    if (command.back !== undefined) {
      update_data.back = command.back;
    }

    // 3. Apply source transition logic
    // If flashcard was ai-full and content changed, transition to ai-edited
    if (existing.source === "ai-full") {
      const content_changed =
        (command.front !== undefined && command.front !== existing.front) ||
        (command.back !== undefined && command.back !== existing.back);

      if (content_changed) {
        update_data.source = "ai-edited";
      }
    }
    // For "manual" and "ai-edited", source stays the same (no explicit assignment needed)

    // 4. Execute update
    const { data: updated, error: update_error } = await this.supabase
      .from("flashcards")
      .update(update_data)
      .eq("id", id)
      .eq("user_id", user_id)
      .select("*")
      .single();

    if (update_error || !updated) {
      throw new Error(`Failed to update flashcard: ${update_error?.message || "Unknown error"}`);
    }

    return this.entityToDTO(updated);
  }

  /**
   * Delete a flashcard
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @returns Promise that resolves when flashcard is deleted
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async deleteFlashcard(id: number, user_id: string): Promise<void> {
    // First, verify the flashcard exists and belongs to user
    const { data: existing } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (!existing) {
      throw new NotFoundError("Flashcard not found");
    }

    // Delete the flashcard
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id).eq("user_id", user_id);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }

  /**
   * Transform FlashcardEntity to FlashcardDTO
   * Removes user_id from the response for security
   * @param entity - Flashcard entity from database
   * @returns Flashcard DTO
   */
  private entityToDTO(entity: FlashcardEntity): FlashcardDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...dto } = entity;
    return dto;
  }
}
