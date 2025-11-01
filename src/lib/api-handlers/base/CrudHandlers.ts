/**
 * CRUD Handler Base Classes
 *
 * Generic base classes for common CRUD operations.
 * Provides reusable patterns for:
 * - GET by ID
 * - LIST with pagination
 * - CREATE
 * - UPDATE
 * - DELETE
 *
 * @example
 * ```ts
 * // Get by ID
 * class GetFlashcardHandler extends GetByIdHandler<FlashcardDTO> {
 *   protected async fetchById(id: number, context: AuthenticatedContext): Promise<FlashcardDTO> {
 *     return await flashcardService.getFlashcardById(id, context.user.id);
 *   }
 * }
 *
 * // List with pagination
 * class ListFlashcardsHandler extends ListHandler<FlashcardDTO> {
 *   protected async fetchList(context: AuthenticatedContext): Promise<ListResponse<FlashcardDTO>> {
 *     const query = this.parseQuery(context.url);
 *     return await flashcardService.getFlashcards(context.user.id, query);
 *   }
 * }
 * ```
 */

import type { z } from "zod";
import { AuthenticatedHandler } from "./AuthenticatedHandler";
import { validateBody, validateParams, validateIntId } from "../middleware/validation";
import type { AuthenticatedContext } from "../types";
import type { APIContext } from "astro";

/**
 * Generic response type for list operations
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/**
 * Base handler for GET by ID operations
 * Handles ID validation and fetching single resource
 */
export abstract class GetByIdHandler<T> extends AuthenticatedHandler {
  /**
   * Override to provide ID schema (default: positive integer)
   */
  protected getIdSchema(): z.ZodSchema<number> | null {
    return null; // Use validateIntId by default
  }

  /**
   * Validate ID parameter
   */
  protected async validate(context: APIContext): Promise<Response | null> {
    const idParam = context.params.id;
    const schema = this.getIdSchema();

    let idResult;
    if (schema) {
      const parsed = parseInt(idParam || "", 10);
      idResult = validateParams(parsed, schema);
    } else {
      idResult = validateIntId(idParam);
    }

    if (!idResult.success) {
      return idResult.error;
    }

    // Store validated ID for use in execute
    this.validatedId = idResult.data;
    return null;
  }

  private validatedId?: number;

  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (this.validatedId === undefined) {
      throw new Error("ID not validated");
    }

    const resource = await this.fetchById(this.validatedId, context);
    return this.successResponse(resource);
  }

  /**
   * Fetch resource by ID - must be implemented by subclasses
   */
  protected abstract fetchById(id: number, context: AuthenticatedContext): Promise<T>;
}

/**
 * Base handler for LIST operations
 * Handles query parameter parsing and pagination
 */
export abstract class ListHandler<T> extends AuthenticatedHandler {
  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    const result = await this.fetchList(context);
    return this.successResponse(result);
  }

  /**
   * Fetch list of resources - must be implemented by subclasses
   */
  protected abstract fetchList(context: AuthenticatedContext): Promise<ListResponse<T> | T[]>;
}

/**
 * Base handler for CREATE operations
 * Handles body validation and resource creation
 */
export abstract class CreateHandler<TInput, TOutput> extends AuthenticatedHandler {
  /**
   * Get validation schema for request body - must be implemented
   */
  protected abstract getBodySchema(): z.ZodSchema<TInput>;

  private validatedData?: TInput;

  protected async validate(context: APIContext): Promise<Response | null> {
    const schema = this.getBodySchema();
    const bodyResult = await validateBody(context.request, schema);

    if (!bodyResult.success) {
      return bodyResult.error;
    }

    this.validatedData = bodyResult.data;
    return null;
  }

  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (!this.validatedData) {
      throw new Error("Request body not validated");
    }

    const created = await this.create(this.validatedData, context);
    return this.createdResponse(created);
  }

  /**
   * Create resource - must be implemented by subclasses
   */
  protected abstract create(data: TInput, context: AuthenticatedContext): Promise<TOutput>;
}

/**
 * Base handler for UPDATE operations
 * Handles ID validation, body validation, and resource update
 */
export abstract class UpdateHandler<TInput, TOutput> extends AuthenticatedHandler {
  /**
   * Get validation schema for request body - must be implemented
   */
  protected abstract getBodySchema(): z.ZodSchema<TInput>;

  /**
   * Override to provide ID schema (default: positive integer)
   */
  protected getIdSchema(): z.ZodSchema<number> | null {
    return null; // Use validateIntId by default
  }

  private validatedId?: number;
  private validatedData?: TInput;

  protected async validate(context: APIContext): Promise<Response | null> {
    // Validate ID
    const idParam = context.params.id;
    const idSchema = this.getIdSchema();

    let idResult;
    if (idSchema) {
      const parsed = parseInt(idParam || "", 10);
      idResult = validateParams(parsed, idSchema);
    } else {
      idResult = validateIntId(idParam);
    }

    if (!idResult.success) {
      return idResult.error;
    }

    this.validatedId = idResult.data;

    // Validate body
    const bodySchema = this.getBodySchema();
    const bodyResult = await validateBody(context.request, bodySchema);

    if (!bodyResult.success) {
      return bodyResult.error;
    }

    this.validatedData = bodyResult.data;
    return null;
  }

  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (this.validatedId === undefined || !this.validatedData) {
      throw new Error("ID or body not validated");
    }

    const updated = await this.update(this.validatedId, this.validatedData, context);
    return this.successResponse(updated);
  }

  /**
   * Update resource - must be implemented by subclasses
   */
  protected abstract update(id: number, data: TInput, context: AuthenticatedContext): Promise<TOutput>;
}

/**
 * Base handler for DELETE operations
 * Handles ID validation and resource deletion
 */
export abstract class DeleteHandler extends AuthenticatedHandler {
  /**
   * Override to provide ID schema (default: positive integer)
   */
  protected getIdSchema(): z.ZodSchema<number> | null {
    return null; // Use validateIntId by default
  }

  private validatedId?: number;

  protected async validate(context: APIContext): Promise<Response | null> {
    const idParam = context.params.id;
    const schema = this.getIdSchema();

    let idResult;
    if (schema) {
      const parsed = parseInt(idParam || "", 10);
      idResult = validateParams(parsed, schema);
    } else {
      idResult = validateIntId(idParam);
    }

    if (!idResult.success) {
      return idResult.error;
    }

    this.validatedId = idResult.data;
    return null;
  }

  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    if (this.validatedId === undefined) {
      throw new Error("ID not validated");
    }

    await this.delete(this.validatedId, context);
    return this.successResponse({
      success: true,
      message: "Resource deleted successfully",
    });
  }

  /**
   * Delete resource - must be implemented by subclasses
   */
  protected abstract delete(id: number, context: AuthenticatedContext): Promise<void>;
}
