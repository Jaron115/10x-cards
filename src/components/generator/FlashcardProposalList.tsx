import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { FlashcardProposalCard } from "./FlashcardProposalCard";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardProposalListProps {
  proposals: FlashcardProposalViewModel[];
  isLoading: boolean;
  isSaving: boolean;
  onUpdateProposal: (updatedProposal: FlashcardProposalViewModel) => void;
  onSetProposalStatus: (id: string, status: FlashcardProposalViewModel["status"]) => void;
  onSave: () => void;
  approvedCount: number;
}

/**
 * Displays a list of flashcard proposals with actions
 */
export function FlashcardProposalList({
  proposals,
  isLoading,
  isSaving,
  onUpdateProposal,
  onSetProposalStatus,
  onSave,
  approvedCount,
}: FlashcardProposalListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Generowanie propozycji...</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Propozycje fiszek</h2>
          <p className="text-muted-foreground">
            Wygenerowano {proposals.length} {proposals.length === 1 ? "fiszkę" : "fiszek"}
            {approvedCount > 0 && ` • Zatwierdzono: ${approvedCount}`}
          </p>
        </div>

        {approvedCount > 0 && (
          <Button onClick={onSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Zapisywanie...
              </>
            ) : (
              <>Zapisz fiszki ({approvedCount})</>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {proposals.map((proposal) => (
          <FlashcardProposalCard
            key={proposal.id}
            proposal={proposal}
            onUpdateProposal={onUpdateProposal}
            onSetProposalStatus={onSetProposalStatus}
          />
        ))}
      </div>

      {approvedCount > 0 && (
        <div className="flex justify-center">
          <Button onClick={onSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Zapisywanie...
              </>
            ) : (
              <>Zapisz fiszki ({approvedCount})</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
