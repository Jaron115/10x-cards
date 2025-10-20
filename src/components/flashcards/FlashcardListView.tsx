import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useFlashcardList } from "./useFlashcardList";
import { FlashcardGrid } from "./FlashcardGrid";
import { FlashcardListControls } from "./FlashcardListControls";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

/**
 * FlashcardListView component
 * Main React component for flashcard list view
 * Manages the state of the entire view including list, pagination, filtering, and sorting
 * Coordinates all CRUD operations and synchronization with URL query params
 */
export const FlashcardListView = () => {
  const {
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
  } = useFlashcardList();

  const handleEdit = (id: number) => {
    if (typeof window !== "undefined") {
      window.location.href = `/app/flashcards/${id}/edit`;
    }
  };

  const handleCreateManual = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/app/flashcards/new";
    }
  };

  const handleNavigateToGenerator = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/app/generator";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje fiszki</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj swoimi fiszkami do nauki</p>
        </div>
        <Button onClick={handleCreateManual} size="lg">
          Dodaj fiszkę
        </Button>
      </div>

      {/* Error message */}
      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Wystąpił błąd</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Controls (filters, sorting, pagination) */}
      {!error && (pagination || isLoading) && (
        <FlashcardListControls
          queryParams={queryParams}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
        />
      )}

      {/* Flashcard Grid */}
      <FlashcardGrid
        flashcards={flashcards}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleOpenDeleteDialog}
        onCreateManual={handleCreateManual}
        onNavigateToGenerator={handleNavigateToGenerator}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        flashcard={flashcardToDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteFlashcard}
      />
    </div>
  );
};
