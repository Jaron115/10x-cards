import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { flashcardFormSchema, type FlashcardFormData } from "@/lib/schemas/flashcard-form.schemas";
import { getFlashcard, createFlashcard, updateFlashcard } from "@/lib/api/flashcardClient";

interface UseFlashcardFormParams {
  mode: "create" | "edit";
  flashcardId?: number;
  onSuccess?: () => void;
}

/**
 * Hook managing the state of the flashcard form
 * Handles both create and edit modes, validation, and save operations
 * Uses react-hook-form with Zod validation
 */
export function useFlashcardForm({ mode, flashcardId, onSuccess }: UseFlashcardFormParams) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardFormSchema),
    mode: "onChange",
    defaultValues: {
      front: "",
      back: "",
    },
  });

  const fetchFlashcardData = useCallback(
    async (id: number) => {
      setIsLoading(true);

      const result = await getFlashcard(id);

      if (result.success && result.data) {
        form.reset({
          front: result.data.data.front,
          back: result.data.data.back,
        });
      } else if (result.error) {
        toast.error(result.error);
        // Redirect to flashcards list on error
        setTimeout(() => {
          window.location.assign("/app/flashcards");
        }, 2000);
      }

      setIsLoading(false);
    },
    [form]
  );

  // Fetch flashcard data in edit mode
  useEffect(() => {
    if (mode === "edit" && flashcardId) {
      fetchFlashcardData(flashcardId);
    }
  }, [mode, flashcardId, fetchFlashcardData]);

  // Submit form
  const handleSubmit = form.handleSubmit(async (data: FlashcardFormData) => {
    setIsLoading(true);

    const result = mode === "create" ? await createFlashcard(data) : await updateFlashcard(flashcardId ?? 0, data);

    setIsLoading(false);

    if (result.success) {
      // Redirect to flashcard list or call onSuccess callback
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to flashcards list
        setTimeout(() => {
          window.location.assign("/app/flashcards");
        }, 100);
      }
    } else if (result.validationErrors) {
      // Set server-side validation errors
      Object.entries(result.validationErrors).forEach(([field, message]) => {
        form.setError(field as keyof FlashcardFormData, {
          type: "server",
          message: message as string,
        });
      });
    }
  });

  // Cancel - return to list
  const handleCancel = () => {
    window.location.assign("/app/flashcards");
  };

  return {
    form,
    isLoading,
    handleSubmit,
    handleCancel,
  };
}
