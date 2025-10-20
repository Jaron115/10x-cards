import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FlashcardFormProps {
  mode: "create" | "edit";
  front: string;
  back: string;
  validationErrors?: {
    front?: string;
    back?: string;
  };
  isLoading: boolean;
  isValid: boolean;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * FlashcardForm component
 * Form for creating/editing flashcards
 * Contains fields for front and back with character counters, real-time validation, and error messages
 */
export const FlashcardForm = ({
  mode,
  front,
  back,
  validationErrors = {},
  isLoading,
  isValid,
  onFrontChange,
  onBackChange,
  onSubmit,
  onCancel,
}: FlashcardFormProps) => {
  const frontCharCount = front.length;
  const backCharCount = back.length;
  const frontMaxLength = 200;
  const backMaxLength = 500;

  const handleFrontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFrontChange(event.target.value);
  };

  const handleBackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onBackChange(event.target.value);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Dodaj nową fiszkę" : "Edytuj fiszkę"}</CardTitle>
          <CardDescription>
            {mode === "create" ? "Stwórz własną fiszkę do nauki" : "Wprowadź zmiany w treści fiszki"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Front field */}
          <div className="space-y-2">
            <Label htmlFor="front">Przód fiszki</Label>
            <Input
              id="front"
              value={front}
              onChange={handleFrontChange}
              placeholder="Pytanie lub pojęcie"
              maxLength={frontMaxLength}
              aria-invalid={!!validationErrors.front}
              aria-describedby={validationErrors.front ? "front-error" : "front-counter"}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs">
              {validationErrors.front ? (
                <span id="front-error" className="text-destructive" role="alert">
                  {validationErrors.front}
                </span>
              ) : (
                <span className="text-muted-foreground">Max. {frontMaxLength} znaków</span>
              )}
              <span
                id="front-counter"
                className={frontCharCount > frontMaxLength ? "text-destructive" : "text-muted-foreground"}
                aria-live="polite"
              >
                {frontCharCount}/{frontMaxLength}
              </span>
            </div>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <Label htmlFor="back">Tył fiszki</Label>
            <Textarea
              id="back"
              value={back}
              onChange={handleBackChange}
              placeholder="Odpowiedź lub definicja"
              rows={4}
              maxLength={backMaxLength}
              aria-invalid={!!validationErrors.back}
              aria-describedby={validationErrors.back ? "back-error" : "back-counter"}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs">
              {validationErrors.back ? (
                <span id="back-error" className="text-destructive" role="alert">
                  {validationErrors.back}
                </span>
              ) : (
                <span className="text-muted-foreground">Max. {backMaxLength} znaków</span>
              )}
              <span
                id="back-counter"
                className={backCharCount > backMaxLength ? "text-destructive" : "text-muted-foreground"}
                aria-live="polite"
              >
                {backCharCount}/{backMaxLength}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isLoading || !isValid}>
            {isLoading ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
