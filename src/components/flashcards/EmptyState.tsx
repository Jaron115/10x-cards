import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateManual: () => void;
  onNavigateToGenerator: () => void;
}

/**
 * EmptyState component
 * Displayed when the user has no flashcards yet
 * Encourages creating first flashcard or using AI generator
 */
export const EmptyState = ({ onCreateManual, onNavigateToGenerator }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 px-4">
      <div className="mb-6">
        <svg
          className="w-24 h-24 mx-auto text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych fiszek</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Stwórz swoją pierwszą fiszkę ręcznie lub wygeneruj zestaw fiszek przy pomocy AI
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onCreateManual} size="lg" className="transition-transform hover:scale-105">
          Dodaj fiszkę
        </Button>
        <Button
          variant="outline"
          onClick={onNavigateToGenerator}
          size="lg"
          className="transition-transform hover:scale-105"
        >
          Użyj generatora AI
        </Button>
      </div>
    </div>
  );
};
