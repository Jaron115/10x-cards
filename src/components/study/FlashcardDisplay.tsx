import { memo, useCallback, useId } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { STUDY_ANIMATIONS } from "@/lib/constants/study";

interface FlashcardDisplayProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

/**
 * Flashcard display component with 3D flip animation
 * Shows front or back of flashcard with click/keyboard interaction
 * Optimized with React.memo for performance
 */
export const FlashcardDisplay = memo<FlashcardDisplayProps>(({ front, back, isFlipped, onFlip }) => {
  const cardId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onFlip();
      }
    },
    [onFlip]
  );

  return (
    <div
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={isFlipped ? "Pokaż przód fiszki" : "Pokaż tył fiszki"}
      aria-describedby={`${cardId}-content`}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: STUDY_ANIMATIONS.CARD_FLIP_DURATION,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <motion.div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: "hidden" }}>
          <Card className="w-full h-full flex items-center justify-center p-8">
            <CardContent className="text-center p-0 w-full" id={`${cardId}-content`}>
              <p className="text-sm text-muted-foreground mb-2">Przód</p>
              <p className="text-xl font-medium break-words">{front}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className="absolute inset-0 backface-hidden bg-primary/5"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Card className="w-full h-full flex items-center justify-center p-8 bg-primary/5">
            <CardContent className="text-center p-0 w-full">
              <p className="text-sm text-muted-foreground mb-2">Tył</p>
              <p className="text-lg break-words">{back}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
});

FlashcardDisplay.displayName = "FlashcardDisplay";
