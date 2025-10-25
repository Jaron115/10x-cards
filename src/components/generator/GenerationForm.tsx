import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GenerationFormProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  characterCount: number;
  isTextValid: boolean;
}

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

/**
 * Form for entering source text to generate flashcards
 */
export function GenerationForm({
  sourceText,
  onSourceTextChange,
  onGenerate,
  isLoading,
  characterCount,
  isTextValid,
}: GenerationFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTextValid && !isLoading) {
      onGenerate();
    }
  };

  const getCharacterCountColor = () => {
    if (characterCount < MIN_CHARS) return "text-muted-foreground";
    if (characterCount > MAX_CHARS) return "text-destructive";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tekst źródłowy</CardTitle>
        <CardDescription>
          Wklej tekst (od {MIN_CHARS.toLocaleString()} do {MAX_CHARS.toLocaleString()} znaków), z którego AI wygeneruje
          fiszki
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              data-testid="generator-source-textarea"
              value={sourceText}
              onChange={(e) => onSourceTextChange(e.target.value)}
              placeholder="Wklej tutaj tekst do nauki... np. notatki z wykładu, fragment książki, artykuł..."
              className="min-h-[200px] resize-y"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-sm">
              <span data-testid="generator-character-count" className={getCharacterCountColor()}>
                {characterCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} znaków
              </span>
              {characterCount < MIN_CHARS && characterCount > 0 && (
                <span className="text-muted-foreground">Minimum: {MIN_CHARS.toLocaleString()} znaków</span>
              )}
              {characterCount > MAX_CHARS && (
                <span className="text-destructive">
                  Przekroczono limit o {(characterCount - MAX_CHARS).toLocaleString()} znaków
                </span>
              )}
            </div>
          </div>

          <Button
            data-testid="generator-submit-button"
            type="submit"
            disabled={!isTextValid || isLoading}
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
  );
}
