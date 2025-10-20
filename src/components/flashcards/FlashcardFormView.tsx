import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useFlashcardForm } from "./useFlashcardForm";
import { FlashcardForm } from "./FlashcardForm";

interface FlashcardFormViewProps {
  mode: "create" | "edit";
  flashcardId?: number;
}

/**
 * FlashcardFormView component
 * Main React component for create/edit flashcard views
 * Manages form state, validation, and save operations
 * Works in two modes: "create" (new flashcard) and "edit" (existing flashcard)
 */
export const FlashcardFormView = ({ mode, flashcardId }: FlashcardFormViewProps) => {
  const {
    front,
    back,
    isLoading,
    error,
    validationErrors,
    isValid,
    handleFrontChange,
    handleBackChange,
    handleSubmit,
    handleCancel,
  } = useFlashcardForm({ mode, flashcardId });

  // Show skeleton loader while fetching flashcard in edit mode
  if (mode === "edit" && isLoading && !front && !back) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Toaster />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Toaster />

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Wystąpił błąd</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Form */}
      <FlashcardForm
        mode={mode}
        front={front}
        back={back}
        validationErrors={validationErrors}
        isLoading={isLoading}
        isValid={isValid}
        onFrontChange={handleFrontChange}
        onBackChange={handleBackChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};
