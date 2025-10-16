import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FlashcardProposalViewModel } from "@/types";
import { cn } from "@/lib/utils";

interface FlashcardProposalCardProps {
  proposal: FlashcardProposalViewModel;
  onUpdateProposal: (updatedProposal: FlashcardProposalViewModel) => void;
  onSetProposalStatus: (id: string, status: FlashcardProposalViewModel["status"]) => void;
}

const MAX_FRONT_CHARS = 200;
const MAX_BACK_CHARS = 500;

/**
 * Card displaying a single flashcard proposal with inline editing
 */
export function FlashcardProposalCard({ proposal, onUpdateProposal, onSetProposalStatus }: FlashcardProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.back);

  const isRejected = proposal.status === "rejected";
  const isApproved = proposal.status === "approved";

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Validate before saving
    if (editedFront.length === 0 || editedFront.length > MAX_FRONT_CHARS) {
      return;
    }
    if (editedBack.length === 0 || editedBack.length > MAX_BACK_CHARS) {
      return;
    }

    const updatedProposal: FlashcardProposalViewModel = {
      ...proposal,
      front: editedFront,
      back: editedBack,
      source: "ai-edited",
      status: "approved", // Auto-approve when saving edits
    };

    onUpdateProposal(updatedProposal);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setIsEditing(false);
  };

  const handleApprove = () => {
    // Toggle: if already approved, set to pending; otherwise approve
    const newStatus = isApproved ? "pending" : "approved";
    onSetProposalStatus(proposal.id, newStatus);
  };

  const handleReject = () => {
    // Toggle: if already rejected, set to pending; otherwise reject
    const newStatus = isRejected ? "pending" : "rejected";
    onSetProposalStatus(proposal.id, newStatus);
  };

  const isFrontValid = editedFront.length > 0 && editedFront.length <= MAX_FRONT_CHARS;
  const isBackValid = editedBack.length > 0 && editedBack.length <= MAX_BACK_CHARS;
  const canSave = isFrontValid && isBackValid;

  return (
    <Card
      className={cn(
        "transition-all",
        isApproved && "border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20",
        isRejected && "opacity-50 grayscale"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            {proposal.source === "ai-edited" ? "Edytowane" : "Wygenerowane"}
          </div>
          <div className="flex gap-1">
            {!isEditing && (
              <Button
                variant={isApproved ? "default" : "outline"}
                size="icon"
                onClick={handleApprove}
                title={isApproved ? "Cofnij zatwierdzenie" : "Zatwierdź"}
                className={cn("size-8", isApproved && "bg-green-600 hover:bg-green-700")}
              >
                ✓
              </Button>
            )}
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={handleEdit} title="Edytuj" className="size-8">
                ✏️
              </Button>
            )}
            {isEditing && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveEdit}
                disabled={!canSave}
                title="Zapisz"
                className="size-8"
              >
                💾
              </Button>
            )}
            {isEditing && (
              <Button variant="outline" size="icon" onClick={handleCancelEdit} title="Anuluj" className="size-8">
                ✕
              </Button>
            )}
            {!isEditing && (
              <Button
                variant={isRejected ? "default" : "outline"}
                size="icon"
                onClick={handleReject}
                title={isRejected ? "Cofnij odrzucenie" : "Odrzuć"}
                className={cn("size-8", isRejected && "bg-destructive hover:bg-destructive/90")}
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Przód fiszki</div>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                className={cn("min-h-[80px] resize-y", !isFrontValid && "border-destructive")}
                maxLength={MAX_FRONT_CHARS}
              />
              <div className="text-xs text-muted-foreground">
                {editedFront.length} / {MAX_FRONT_CHARS} znaków
              </div>
            </div>
          ) : (
            <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">{proposal.front}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Tył fiszki</div>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                className={cn("min-h-[100px] resize-y", !isBackValid && "border-destructive")}
                maxLength={MAX_BACK_CHARS}
              />
              <div className="text-xs text-muted-foreground">
                {editedBack.length} / {MAX_BACK_CHARS} znaków
              </div>
            </div>
          ) : (
            <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">{proposal.back}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
