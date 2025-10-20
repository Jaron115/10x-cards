import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { GetFlashcardsQueryDTO, PaginationDTO, FlashcardSource } from "@/types";
import { SOURCE_FILTER_OPTIONS, SORT_OPTIONS } from "@/types";

interface FlashcardListControlsProps {
  queryParams: GetFlashcardsQueryDTO;
  pagination: PaginationDTO | null;
  onFilterChange: (source: FlashcardSource | "all") => void;
  onSortChange: (field: "created_at" | "updated_at", order: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
}

/**
 * FlashcardListControls component
 * Contains filtering, sorting, and pagination controls
 * Synchronizes selected options with URL query params
 */
export const FlashcardListControls = ({
  queryParams,
  pagination,
  onFilterChange,
  onSortChange,
  onPageChange,
}: FlashcardListControlsProps) => {
  const currentSource = queryParams.source || "all";
  const currentSort = queryParams.sort || "created_at";
  const currentOrder = queryParams.order || "desc";
  const currentPage = queryParams.page || 1;

  const handleSourceChange = (value: string) => {
    onFilterChange(value as FlashcardSource | "all");
  };

  const handleSortFieldChange = (value: string) => {
    onSortChange(value as "created_at" | "updated_at", currentOrder);
  };

  const handleOrderChange = (value: string) => {
    onSortChange(currentSort, value as "asc" | "desc");
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    if (!pagination) return [];

    const { page, total_pages } = pagination;
    const pages: (number | "ellipsis")[] = [];

    if (total_pages <= 7) {
      // Show all pages if total is 7 or less
      for (let pageNumber = 1; pageNumber <= total_pages; pageNumber++) {
        pages.push(pageNumber);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis or pages around current page
      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);

      for (let pageNumber = start; pageNumber <= end; pageNumber++) {
        pages.push(pageNumber);
      }

      // Show ellipsis or last page
      if (page < total_pages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(total_pages);
    }

    return pages;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Source Filter */}
        <div className="w-full sm:w-auto">
          <Select value={currentSource} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Źródło" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Field */}
        <div className="w-full sm:w-auto">
          <Select value={currentSort} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sortuj według" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.field} value={option.field}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="w-full sm:w-auto">
          <Select value={currentOrder} onValueChange={handleOrderChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Kierunek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Malejąco</SelectItem>
              <SelectItem value="asc">Rosnąco</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={currentPage <= 1}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {generatePageNumbers().map((pageNum, index) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(pagination.total_pages, currentPage + 1))}
                  className={
                    currentPage >= pagination.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                  aria-disabled={currentPage >= pagination.total_pages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Info */}
      {pagination && (
        <p className="text-sm text-muted-foreground text-center">
          Wyświetlanie {(currentPage - 1) * pagination.limit + 1} -{" "}
          {Math.min(currentPage * pagination.limit, pagination.total)} z {pagination.total} fiszek
        </p>
      )}
    </div>
  );
};
