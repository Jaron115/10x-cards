import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  FlashcardDTO,
  GetFlashcardsQueryDTO,
  GetFlashcardsResponseDTO,
  ApiResponseDTO,
  PaginationDTO,
  FlashcardSource,
} from "@/types";

/**
 * Hook managing the state of the flashcard list view
 * Synchronizes query params with URL and fetches data from API
 */
export function useFlashcardList() {
  // Parse URL search params
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  // Parse query parameters from URL (with default values)
  const queryParams: GetFlashcardsQueryDTO = useMemo(
    () => ({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
      source: (searchParams.get("source") as FlashcardSource) || undefined,
      sort: (searchParams.get("sort") as "created_at" | "updated_at") || "created_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
    }),
    [searchParams]
  );

  // Flashcard list state
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [flashcardToDelete, setFlashcardToDelete] = useState<FlashcardDTO | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch flashcards from API
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = new URLSearchParams(
        Object.entries(queryParams)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString();

      const response = await fetch(`/api/flashcards?${queryString}`);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        throw new Error("Błąd podczas pobierania fiszek");
      }

      const data: ApiResponseDTO<GetFlashcardsResponseDTO> = await response.json();
      setFlashcards(data.data.flashcards);
      setPagination(data.data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      toast.error("Nie udało się pobrać fiszek");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  // Fetch data on mount and when query params change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Update query params in URL
  const updateQueryParams = useCallback(
    (updates: Partial<GetFlashcardsQueryDTO>) => {
      const newParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      setSearchParams(newParams);

      // Update browser URL without reload
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.pushState({}, "", newUrl);
      }
    },
    [searchParams]
  );

  // Handler for filter change
  const handleFilterChange = useCallback(
    (source: FlashcardSource | "all") => {
      updateQueryParams({
        source: source === "all" ? undefined : source,
        page: 1, // Reset to first page when filter changes
      });
    },
    [updateQueryParams]
  );

  // Handler for sort change
  const handleSortChange = useCallback(
    (field: "created_at" | "updated_at", order: "asc" | "desc") => {
      updateQueryParams({ sort: field, order });
    },
    [updateQueryParams]
  );

  // Handler for page change
  const handlePageChange = useCallback(
    (page: number) => {
      updateQueryParams({ page });
      // Scroll to top
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [updateQueryParams]
  );

  // Delete flashcard with optimistic UI
  const handleDeleteFlashcard = useCallback(async () => {
    if (!flashcardToDelete) return;

    const flashcardId = flashcardToDelete.id;
    const originalFlashcards = [...flashcards];

    // Optimistic update - remove from UI immediately
    setFlashcards((prev) => prev.filter((card) => card.id !== flashcardId));
    setIsDeleteDialogOpen(false);
    setFlashcardToDelete(null);

    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        throw new Error("Błąd podczas usuwania fiszki");
      }

      toast.success("Fiszka została usunięta");

      // Refresh data to update pagination
      fetchFlashcards();
    } catch {
      // Restore flashcard on error
      setFlashcards(originalFlashcards);
      toast.error("Nie udało się usunąć fiszki");
    }
  }, [flashcardToDelete, flashcards, fetchFlashcards]);

  // Handler for opening delete dialog
  const handleOpenDeleteDialog = useCallback((flashcard: FlashcardDTO) => {
    setFlashcardToDelete(flashcard);
    setIsDeleteDialogOpen(true);
  }, []);

  return {
    flashcards,
    pagination,
    queryParams,
    isLoading,
    error,
    flashcardToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleOpenDeleteDialog,
    handleDeleteFlashcard,
  };
}
