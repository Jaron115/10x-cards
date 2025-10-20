import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  ApiResponseDTO,
  ApiErrorDTO,
  ValidationErrorDetailDTO,
} from "@/types";

interface UseFlashcardFormParams {
  mode: "create" | "edit";
  flashcardId?: number;
  onSuccess?: () => void;
}

/**
 * Hook managing the state of the flashcard form
 * Handles both create and edit modes, validation, and save operations
 */
export function useFlashcardForm({ mode, flashcardId, onSuccess }: UseFlashcardFormParams) {
  // Form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    front?: string;
    back?: string;
  }>({});

  // Fetch flashcard data in edit mode
  useEffect(() => {
    if (mode === "edit" && flashcardId) {
      fetchFlashcard(flashcardId);
    }
  }, [mode, flashcardId]);

  const fetchFlashcard = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/flashcards/${id}`);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 404) {
          throw new Error("Nie znaleziono fiszki");
        }
        throw new Error("Błąd podczas pobierania fiszki");
      }

      const data: ApiResponseDTO<FlashcardDTO> = await response.json();
      setFront(data.data.front);
      setBack(data.data.back);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Błąd podczas pobierania fiszki";
      setError(errorMessage);
      toast.error(errorMessage);

      // Redirect to list on error
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/app/flashcards";
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Validate front field
  const validateFront = useCallback((value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Przód fiszki jest wymagany";
    }
    if (value.length > 200) {
      return "Przód fiszki może mieć maksymalnie 200 znaków";
    }
    return undefined;
  }, []);

  // Validate back field
  const validateBack = useCallback((value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Tył fiszki jest wymagany";
    }
    if (value.length > 500) {
      return "Tył fiszki może mieć maksymalnie 500 znaków";
    }
    return undefined;
  }, []);

  // Handler for front field change
  const handleFrontChange = useCallback(
    (value: string) => {
      setFront(value);
      // Real-time validation
      const error = validateFront(value);
      setValidationErrors((prev) => ({ ...prev, front: error }));
    },
    [validateFront]
  );

  // Handler for back field change
  const handleBackChange = useCallback(
    (value: string) => {
      setBack(value);
      // Real-time validation
      const error = validateBack(value);
      setValidationErrors((prev) => ({ ...prev, back: error }));
    },
    [validateBack]
  );

  // Check if form is valid
  const isValid = useMemo(() => {
    return !validateFront(front) && !validateBack(back);
  }, [front, back, validateFront, validateBack]);

  // Submit form
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      // Validate before submission
      const frontError = validateFront(front);
      const backError = validateBack(back);

      if (frontError || backError) {
        setValidationErrors({ front: frontError, back: backError });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (mode === "create") {
          // Create new flashcard
          const command: CreateFlashcardCommand = { front, back };
          const response = await fetch("/api/flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
          });

          if (!response.ok) {
            if (response.status === 401) {
              window.location.href = "/";
              throw new Error("Sesja wygasła. Zaloguj się ponownie.");
            }
            if (response.status === 400) {
              const errorData: ApiErrorDTO = await response.json();
              if (errorData.error.code === "VALIDATION_ERROR" && errorData.error.details) {
                const details = errorData.error.details as ValidationErrorDetailDTO[];
                const errors: Record<string, string> = {};
                details.forEach((detail) => {
                  errors[detail.field] = detail.message;
                });
                setValidationErrors(errors as { front?: string; back?: string });
                return;
              }
            }
            throw new Error("Błąd podczas tworzenia fiszki");
          }

          toast.success("Fiszka została utworzona");
        } else {
          // Update existing flashcard
          const command: UpdateFlashcardCommand = { front, back };
          const response = await fetch(`/api/flashcards/${flashcardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
          });

          if (!response.ok) {
            if (response.status === 401) {
              window.location.href = "/";
              throw new Error("Sesja wygasła. Zaloguj się ponownie.");
            }
            if (response.status === 404) {
              throw new Error("Nie znaleziono fiszki");
            }
            if (response.status === 400) {
              const errorData: ApiErrorDTO = await response.json();
              if (errorData.error.code === "VALIDATION_ERROR" && errorData.error.details) {
                const details = errorData.error.details as ValidationErrorDetailDTO[];
                const errors: Record<string, string> = {};
                details.forEach((detail) => {
                  errors[detail.field] = detail.message;
                });
                setValidationErrors(errors as { front?: string; back?: string });
                return;
              }
            }
            throw new Error("Błąd podczas aktualizacji fiszki");
          }

          toast.success("Fiszka została zaktualizowana");
        }

        // Redirect to flashcard list or call onSuccess callback
        if (onSuccess) {
          onSuccess();
        } else if (typeof window !== "undefined") {
          window.location.href = "/app/flashcards";
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
        setError(errorMessage);
        toast.error(mode === "create" ? "Nie udało się utworzyć fiszki" : "Nie udało się zaktualizować fiszki");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, front, back, flashcardId, validateFront, validateBack, onSuccess]
  );

  // Cancel - return to list
  const handleCancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/app/flashcards";
    }
  }, []);

  return {
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
  };
}
