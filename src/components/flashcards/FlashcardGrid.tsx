import { Skeleton } from "@/components/ui/skeleton";
import { FlashcardCard } from "./FlashcardCard";
import { EmptyState } from "./EmptyState";
import type { FlashcardDTO } from "@/types";

interface FlashcardGridProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onEdit: (id: number) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
  onCreateManual: () => void;
  onNavigateToGenerator: () => void;
}

/**
 * FlashcardGrid component
 * Displays a grid of flashcard cards, skeleton loader, or empty state
 */
export const FlashcardGrid = ({
  flashcards,
  isLoading,
  onEdit,
  onDelete,
  onCreateManual,
  onNavigateToGenerator,
}: FlashcardGridProps) => {
  // Loading state - show skeleton loaders
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_item, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state - no flashcards
  if (flashcards.length === 0) {
    return <EmptyState onCreateManual={onCreateManual} onNavigateToGenerator={onNavigateToGenerator} />;
  }

  // Display flashcards in a grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((flashcard) => (
        <FlashcardCard key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
