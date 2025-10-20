import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FlashcardDTO } from "@/types";
import { FLASHCARD_SOURCE_LABELS } from "@/types";

interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: (id: number) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

/**
 * Format date to Polish locale
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Get badge variant based on source
 */
function getSourceBadgeVariant(source: FlashcardDTO["source"]) {
  switch (source) {
    case "manual":
      return "default";
    case "ai-full":
      return "secondary";
    case "ai-edited":
      return "outline";
    default:
      return "default";
  }
}

/**
 * FlashcardCard component
 * Displays a single flashcard in card format with front, back, source, dates, and action buttons
 */
export const FlashcardCard = ({ flashcard, onEdit, onDelete }: FlashcardCardProps) => {
  const handleEdit = () => {
    onEdit(flashcard.id);
  };

  const handleDelete = () => {
    onDelete(flashcard);
  };

  const isUpdated = flashcard.updated_at !== flashcard.created_at;

  return (
    <Card className="flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{flashcard.front}</CardTitle>
          <Badge variant={getSourceBadgeVariant(flashcard.source)} className="shrink-0">
            {FLASHCARD_SOURCE_LABELS[flashcard.source]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-4">{flashcard.back}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Utworzono: {formatDate(flashcard.created_at)}</div>
          {isUpdated && <div>Edytowano: {formatDate(flashcard.updated_at)}</div>}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            aria-label={`Edytuj fiszkę: ${flashcard.front}`}
            className="transition-colors"
          >
            Edytuj
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive transition-colors"
            aria-label={`Usuń fiszkę: ${flashcard.front}`}
          >
            Usuń
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
