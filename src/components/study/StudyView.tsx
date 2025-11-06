import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudySession } from "./useStudySession";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { SessionSummary } from "./SessionSummary";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { navigateToFlashcards } from "@/lib/utils/navigation";
import { STUDY_SESSION_DEFAULTS, STUDY_ANIMATIONS } from "@/lib/constants/study";

/**
 * Main study session view component
 * Manages the complete study session flow from loading to completion
 */
export const StudyView = () => {
  // Memoize query params to prevent infinite loops
  const studySessionParams = useMemo(
    () => ({
      limit: STUDY_SESSION_DEFAULTS.LIMIT,
      shuffle: STUDY_SESSION_DEFAULTS.SHUFFLE,
    }),
    []
  );

  const { session, isLoading, error, flipCard, markAsKnown, markAsUnknown, restartSession, isSessionComplete } =
    useStudySession(studySessionParams);

  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Memoize keyboard shortcut callbacks
  const handleToggleShortcuts = useCallback(() => {
    setShowShortcutsHelp((prev) => !prev);
  }, []);

  const handleShowExitDialog = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    {
      onFlip: flipCard,
      onKnown: markAsKnown,
      onUnknown: markAsUnknown,
      onExit: handleShowExitDialog,
      onHelp: handleToggleShortcuts,
    },
    {
      enabled: !isLoading && !error && !isSessionComplete,
      isFlipped: session?.isFlipped || false,
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-2 w-full mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    );
  }

  // Error state - no flashcards or error loading
  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Sesja nauki</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">{error || "Nie udało się załadować sesji."}</p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <a href="/app/generator">Wygeneruj fiszki</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/app/flashcards">Dodaj ręcznie</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session complete - show summary
  if (isSessionComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Sesja nauki</h1>
        <SessionSummary
          sessionStats={session.sessionStats}
          onRestart={restartSession}
          onBackToFlashcards={navigateToFlashcards}
        />
      </div>
    );
  }

  // Active session - show current flashcard
  const currentFlashcard = session.flashcards[session.currentCardIndex];
  const progress = (session.currentCardIndex / session.flashcards.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sesja nauki</h1>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: STUDY_ANIMATIONS.CARD_SLIDE_DURATION }}
          className="flex items-center gap-4 text-sm text-muted-foreground"
        >
          <span>
            Fiszka {session.currentCardIndex + 1} z {session.flashcards.length}
          </span>
          <span>•</span>
          <span>
            Znam: {session.sessionStats.known} | Nie znam: {session.sessionStats.unknown}
          </span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="mb-6" />

      {/* Flashcard display with slide transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`flashcard-${session.currentCardIndex}`}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: STUDY_ANIMATIONS.SPRING_STIFFNESS,
            damping: STUDY_ANIMATIONS.SPRING_DAMPING,
          }}
        >
          <FlashcardDisplay
            front={currentFlashcard.front}
            back={currentFlashcard.back}
            isFlipped={session.isFlipped}
            onFlip={flipCard}
          />
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="mt-6 space-y-4">
        {!session.isFlipped ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={flipCard} size="lg" className="w-full" variant="outline">
              <Eye className="mr-2 h-5 w-5" />
              Pokaż odpowiedź
              <Badge variant="secondary" className="ml-2 font-mono text-xs">
                Space
              </Badge>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={markAsUnknown} size="lg" variant="destructive" className="w-full">
                <XCircle className="mr-2 h-5 w-5" />
                Nie znam
                <Badge variant="secondary" className="ml-2 font-mono text-xs">
                  1
                </Badge>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={markAsKnown} size="lg" className="w-full">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Znam
                <Badge variant="secondary" className="ml-2 font-mono text-xs">
                  2
                </Badge>
              </Button>
            </motion.div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          💡 Użyj klawiatury lub kliknij na fiszkę {"•"} Naciśnij{" "}
          <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd> aby zobaczyć skróty
        </p>
      </div>

      {/* Shortcuts Help Dialog */}
      <ShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zakończyć sesję?</AlertDialogTitle>
            <AlertDialogDescription>
              Twój postęp nie zostanie zapisany. Czy na pewno chcesz zakończyć?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={navigateToFlashcards}>Zakończ sesję</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
