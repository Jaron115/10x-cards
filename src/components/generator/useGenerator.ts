import { useState, useMemo } from "react";
import { toast } from "sonner";
import type {
  FlashcardProposalViewModel,
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponseDTO,
  CreateFlashcardsBulkCommand,
  CreateFlashcardsBulkResponseDTO,
  ApiResponseDTO,
  ApiErrorDTO,
} from "@/types";

type GeneratorStatus = "idle" | "loading" | "saving" | "error";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

/**
 * Custom hook for managing the AI Generator view state and logic
 */
export function useGenerator() {
  const [sourceText, setSourceText] = useState("");
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [status, setStatus] = useState<GeneratorStatus>("idle");
  const [generationId, setGenerationId] = useState<number | null>(null);

  // Computed values
  const characterCount = sourceText.length;
  const isTextValid = characterCount >= MIN_CHARS && characterCount <= MAX_CHARS;
  const approvedCount = useMemo(() => proposals.filter((p) => p.status === "approved").length, [proposals]);

  /**
   * Handle source text changes
   */
  const handleSourceTextChange = (text: string) => {
    setSourceText(text);
  };

  /**
   * Generate flashcard proposals from source text
   */
  const handleGenerate = async () => {
    if (!isTextValid) {
      toast.error("Tekst musi zawierać od 1000 do 10000 znaków");
      return;
    }

    setStatus("loading");
    setProposals([]);
    setGenerationId(null);

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorDTO;
        throw new Error(errorData.error.message || "Błąd podczas generowania fiszek");
      }

      const data = (await response.json()) as ApiResponseDTO<GenerateFlashcardsResponseDTO>;

      // Map proposals to view models with unique IDs and default status
      const viewModels: FlashcardProposalViewModel[] = data.data.flashcards_proposals.map((proposal, index) => ({
        ...proposal,
        id: `${data.data.generation_id}-${index}`,
        status: "pending",
        source: "ai-full",
      }));

      setProposals(viewModels);
      setGenerationId(data.data.generation_id);
      setStatus("idle");

      toast.success(
        `Wygenerowano ${data.data.generated_count} ${data.data.generated_count === 1 ? "fiszkę" : "fiszek"}`
      );
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas generowania";
      toast.error(errorMessage);
    }
  };

  /**
   * Save approved proposals to the database
   */
  const handleSaveProposals = async () => {
    if (approvedCount === 0) {
      toast.error("Brak zatwierdzonych fiszek do zapisania");
      return;
    }

    if (!generationId) {
      toast.error("Brak ID generacji");
      return;
    }

    setStatus("saving");

    try {
      // Filter only approved proposals
      const approvedProposals = proposals.filter((p) => p.status === "approved");

      const command: CreateFlashcardsBulkCommand = {
        generation_id: generationId,
        flashcards: approvedProposals.map((p) => ({
          front: p.front,
          back: p.back,
          source: p.source,
        })),
      };

      const response = await fetch("/api/flashcards/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorDTO;
        throw new Error(errorData.error.message || "Błąd podczas zapisywania fiszek");
      }

      const data = (await response.json()) as ApiResponseDTO<CreateFlashcardsBulkResponseDTO>;

      setStatus("idle");
      toast.success(`Zapisano ${data.data.created_count} ${data.data.created_count === 1 ? "fiszkę" : "fiszek"}`);

      // Reset form after successful save
      setSourceText("");
      setProposals([]);
      setGenerationId(null);
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas zapisu";
      toast.error(errorMessage);
    }
  };

  /**
   * Update a proposal's content (after editing)
   */
  const handleUpdateProposal = (updatedProposal: FlashcardProposalViewModel) => {
    setProposals((prev) => prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p)));
  };

  /**
   * Update a proposal's status (approved/rejected)
   */
  const handleSetProposalStatus = (id: string, newStatus: FlashcardProposalViewModel["status"]) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
  };

  return {
    sourceText,
    proposals,
    status,
    characterCount,
    isTextValid,
    approvedCount,
    handleSourceTextChange,
    handleGenerate,
    handleUpdateProposal,
    handleSetProposalStatus,
    handleSaveProposals,
  };
}
