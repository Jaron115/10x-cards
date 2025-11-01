/**
 * Pagination Calculator
 * Handles pagination calculations and metadata creation
 */

import type { PaginationDTO } from "@/types";

/**
 * Calculate pagination metadata
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePagination(page: number, limit: number, total: number): PaginationDTO {
  const total_pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    total_pages,
  };
}

/**
 * Calculate offset for pagination query
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @returns Offset for database query (0-based)
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
