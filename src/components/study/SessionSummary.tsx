import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import type { StudySessionState } from "@/types";

interface SessionSummaryProps {
  sessionStats: StudySessionState["sessionStats"];
  onRestart: () => void;
  onBackToFlashcards: () => void;
}

/**
 * Calculate accuracy percentage
 * Handles edge cases: division by zero, NaN, Infinity
 */
const calculateAccuracy = (known: number, total: number): number => {
  if (total === 0 || !Number.isFinite(known) || !Number.isFinite(total)) {
    return 0;
  }

  const accuracy = (known / total) * 100;

  if (!Number.isFinite(accuracy)) {
    return 0;
  }

  return Math.round(accuracy);
};

/**
 * Session summary component showing study results
 * Displays statistics and actions after completing a study session
 * Optimized with React.memo and useMemo
 */
export const SessionSummary = memo<SessionSummaryProps>(({ sessionStats, onRestart, onBackToFlashcards }) => {
  const accuracy = useMemo(
    () => calculateAccuracy(sessionStats.known, sessionStats.total),
    [sessionStats.known, sessionStats.total]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Podsumowanie sesji
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{sessionStats.total}</p>
            <p className="text-sm text-muted-foreground">Razem</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-3xl font-bold">{sessionStats.known}</p>
            </div>
            <p className="text-sm text-muted-foreground">Znam</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-red-600">
              <XCircle className="h-5 w-5" />
              <p className="text-3xl font-bold">{sessionStats.unknown}</p>
            </div>
            <p className="text-sm text-muted-foreground">Nie znam</p>
          </div>
        </div>

        {/* Accuracy Display */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-4xl font-bold text-primary">{accuracy}%</p>
          <p className="text-sm text-muted-foreground">Skuteczność</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={onRestart} size="lg" className="w-full">
            Rozpocznij ponownie
          </Button>
          <Button onClick={onBackToFlashcards} variant="outline" size="lg" className="w-full">
            Wróć do fiszek
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SessionSummary.displayName = "SessionSummary";
