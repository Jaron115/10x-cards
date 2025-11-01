import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTextarea } from "@/components/forms/FormTextarea";
import {
  generationFormSchema,
  type GenerationFormData,
  GENERATION_MIN_CHARS,
  GENERATION_MAX_CHARS,
} from "@/lib/schemas/generation-form.schemas";

interface GenerationFormProps {
  onSourceTextChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export interface GenerationFormRef {
  reset: () => void;
}

/**
 * Form for entering source text to generate flashcards
 * Uses react-hook-form with Zod validation and FormTextarea
 */
export const GenerationForm = forwardRef<GenerationFormRef, GenerationFormProps>(
  ({ onSourceTextChange, onGenerate, isLoading }, ref) => {
    const form = useForm<GenerationFormData>({
      resolver: zodResolver(generationFormSchema),
      mode: "onChange",
      defaultValues: {
        sourceText: "",
      },
    });

    const {
      formState: { isValid },
      watch,
    } = form;

    const currentText = watch("sourceText");
    const characterCount = currentText.length;

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        form.reset({ sourceText: "" });
      },
    }));

    // Sync form changes back to parent
    useEffect(() => {
      onSourceTextChange(currentText);
    }, [currentText, onSourceTextChange]);

    const handleSubmit = form.handleSubmit(() => {
      if (isValid && !isLoading) {
        onGenerate();
      }
    });

    const getCharacterCountColor = () => {
      if (characterCount < GENERATION_MIN_CHARS) return "text-muted-foreground";
      if (characterCount > GENERATION_MAX_CHARS) return "text-destructive";
      return "text-green-600 dark:text-green-400";
    };

    return (
      <FormProvider {...form}>
        <Card>
          <CardHeader>
            <CardTitle>Tekst źródłowy</CardTitle>
            <CardDescription>
              Wklej tekst (od {GENERATION_MIN_CHARS.toLocaleString()} do {GENERATION_MAX_CHARS.toLocaleString()}{" "}
              znaków), z którego AI wygeneruje fiszki
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormTextarea
                  name="sourceText"
                  label="Tekst źródłowy"
                  placeholder="Wklej tutaj tekst do nauki... np. notatki z wykładu, fragment książki, artykuł..."
                  disabled={isLoading}
                  rows={12}
                  minHeight="300px"
                  testId="generator-source-textarea"
                />
                <div className="flex justify-between items-center text-sm">
                  <span data-testid="generator-character-count" className={getCharacterCountColor()}>
                    {characterCount.toLocaleString()} / {GENERATION_MAX_CHARS.toLocaleString()} znaków
                  </span>
                  {characterCount < GENERATION_MIN_CHARS && characterCount > 0 && (
                    <span className="text-muted-foreground">
                      Minimum: {GENERATION_MIN_CHARS.toLocaleString()} znaków
                    </span>
                  )}
                  {characterCount > GENERATION_MAX_CHARS && (
                    <span className="text-destructive">
                      Przekroczono limit o {(characterCount - GENERATION_MAX_CHARS).toLocaleString()} znaków
                    </span>
                  )}
                </div>
              </div>

              <Button
                data-testid="generator-submit-button"
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generowanie...
                  </>
                ) : (
                  "Generuj fiszki"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FormProvider>
    );
  }
);

GenerationForm.displayName = "GenerationForm";
