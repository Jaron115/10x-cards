import { FormProvider, type UseFormReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { FormTextarea } from "@/components/forms/FormTextarea";
import {
  FLASHCARD_FRONT_MAX_LENGTH,
  FLASHCARD_BACK_MAX_LENGTH,
  type FlashcardFormData,
} from "@/lib/schemas/flashcard-form.schemas";

interface FlashcardFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<FlashcardFormData>;
  isLoading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * FlashcardForm component
 * Form for creating/editing flashcards
 * Uses react-hook-form with FormField and FormTextarea for consistent UX
 */
export const FlashcardForm = ({ mode, form, isLoading, onSubmit, onCancel }: FlashcardFormProps) => {
  const {
    formState: { isValid, isSubmitted },
  } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "Dodaj nową fiszkę" : "Edytuj fiszkę"}</CardTitle>
            <CardDescription>
              {mode === "create" ? "Stwórz własną fiszkę do nauki" : "Wprowadź zmiany w treści fiszki"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              name="front"
              label="Przód fiszki"
              placeholder="Pytanie lub pojęcie"
              disabled={isLoading}
              maxLength={FLASHCARD_FRONT_MAX_LENGTH}
              showCharCount
            />

            <FormTextarea
              name="back"
              label="Tył fiszki"
              placeholder="Odpowiedź lub definicja"
              disabled={isLoading}
              rows={4}
              maxLength={FLASHCARD_BACK_MAX_LENGTH}
              showCharCount
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || (!isValid && isSubmitted)}>
              {isLoading ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};
