import { useRef } from "react";
import { GenerationForm, type GenerationFormRef } from "./GenerationForm";
import { FlashcardProposalList } from "./FlashcardProposalList";
import { useGenerator } from "./useGenerator";

/**
 * Main container for the AI Generator view
 * Manages state and coordinates interactions between child components
 */
export function GeneratorView() {
  const formRef = useRef<GenerationFormRef>(null);

  const {
    proposals,
    status,
    approvedCount,
    handleSourceTextChange,
    handleGenerate,
    handleUpdateProposal,
    handleSetProposalStatus,
    handleSaveProposals,
  } = useGenerator();

  const isLoading = status === "loading";
  const isSaving = status === "saving";

  const handleSave = async () => {
    await handleSaveProposals();
    // Reset form after successful save
    formRef.current?.reset();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generator AI</h1>
          <p className="text-muted-foreground">Wklej tekst źródłowy, a AI wygeneruje dla Ciebie fiszki do nauki</p>
        </div>

        <GenerationForm
          ref={formRef}
          onSourceTextChange={handleSourceTextChange}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        {(proposals.length > 0 || isLoading) && (
          <FlashcardProposalList
            proposals={proposals}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpdateProposal={handleUpdateProposal}
            onSetProposalStatus={handleSetProposalStatus}
            onSave={handleSave}
            approvedCount={approvedCount}
          />
        )}
      </div>
    </div>
  );
}
