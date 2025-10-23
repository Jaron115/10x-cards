import { GenerationForm } from "./GenerationForm";
import { FlashcardProposalList } from "./FlashcardProposalList";
import { useGenerator } from "./useGenerator";

/**
 * Main container for the AI Generator view
 * Manages state and coordinates interactions between child components
 */
export function GeneratorView() {
  const {
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
  } = useGenerator();

  const isLoading = status === "loading";
  const isSaving = status === "saving";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generator AI</h1>
          <p className="text-muted-foreground">Wklej tekst źródłowy, a AI wygeneruje dla Ciebie fiszki do nauki</p>
        </div>

        <GenerationForm
          sourceText={sourceText}
          onSourceTextChange={handleSourceTextChange}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          characterCount={characterCount}
          isTextValid={isTextValid}
        />

        {(proposals.length > 0 || isLoading) && (
          <FlashcardProposalList
            proposals={proposals}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpdateProposal={handleUpdateProposal}
            onSetProposalStatus={handleSetProposalStatus}
            onSave={handleSaveProposals}
            approvedCount={approvedCount}
          />
        )}
      </div>
    </div>
  );
}
