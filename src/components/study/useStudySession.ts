import { useReducer, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getStudySession } from "@/lib/api/studyClient";
import { navigateToHome } from "@/lib/utils/navigation";
import { getStorageBoolean, setStorageBoolean } from "@/lib/utils/storage";
import { STUDY_STORAGE_KEYS, STUDY_MESSAGES } from "@/lib/constants/study";
import type { StudySessionState, GetStudySessionQuery, FlashcardDTO } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface UseStudySessionReturn {
  session: StudySessionState | null;
  isLoading: boolean;
  error: string | null;
  flipCard: () => void;
  markAsKnown: () => void;
  markAsUnknown: () => void;
  restartSession: () => void;
  isSessionComplete: boolean;
}

interface StudySessionReducerState {
  session: StudySessionState | null;
  isLoading: boolean;
  error: string | null;
  hasSeenShortcutHint: boolean;
}

type StudySessionAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: FlashcardDTO[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "FLIP_CARD" }
  | { type: "MARK_CARD"; payload: { flashcard_id: number; known: boolean } }
  | { type: "SET_HINT_SEEN" };

// ============================================================================
// Reducer
// ============================================================================

const studySessionReducer = (state: StudySessionReducerState, action: StudySessionAction): StudySessionReducerState => {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        error: null,
        session: {
          flashcards: action.payload,
          currentCardIndex: 0,
          isFlipped: false,
          reviewResults: [],
          sessionStats: {
            total: action.payload.length,
            reviewed: 0,
            known: 0,
            unknown: 0,
          },
        },
      };

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        session: null,
      };

    case "FLIP_CARD":
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          isFlipped: !state.session.isFlipped,
        },
      };

    case "MARK_CARD": {
      if (!state.session) return state;

      const { flashcard_id, known } = action.payload;

      return {
        ...state,
        session: {
          ...state.session,
          currentCardIndex: state.session.currentCardIndex + 1,
          isFlipped: false,
          reviewResults: [...state.session.reviewResults, { flashcard_id, known }],
          sessionStats: {
            ...state.session.sessionStats,
            reviewed: state.session.sessionStats.reviewed + 1,
            known: known ? state.session.sessionStats.known + 1 : state.session.sessionStats.known,
            unknown: known ? state.session.sessionStats.unknown : state.session.sessionStats.unknown + 1,
          },
        },
      };
    }

    case "SET_HINT_SEEN":
      return {
        ...state,
        hasSeenShortcutHint: true,
      };

    default:
      return state;
  }
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook managing the state of a study session
 * Fetches flashcards from API and manages client-side session state using useReducer
 */
export const useStudySession = (queryParams: GetStudySessionQuery = {}): UseStudySessionReturn => {
  const [state, dispatch] = useReducer(studySessionReducer, {
    session: null,
    isLoading: true,
    error: null,
    hasSeenShortcutHint: getStorageBoolean(STUDY_STORAGE_KEYS.SHORTCUT_HINT_SEEN, false),
  });

  // Fetch study session from API
  const fetchSession = useCallback(async () => {
    dispatch({ type: "FETCH_START" });

    const result = await getStudySession(queryParams);

    if (!result.success) {
      // Handle 401 - session expired
      if (result.error?.includes("401") || result.error?.includes("unauthorized")) {
        navigateToHome();
        toast.error(STUDY_MESSAGES.SESSION_EXPIRED);
        return;
      }

      // Handle 404 - no flashcards
      if (result.error?.includes("404")) {
        dispatch({ type: "FETCH_ERROR", payload: STUDY_MESSAGES.NO_FLASHCARDS });
        return;
      }

      // Handle other errors
      const errorMessage = result.error || STUDY_MESSAGES.LOAD_ERROR;
      dispatch({ type: "FETCH_ERROR", payload: errorMessage });
      toast.error(errorMessage);
      return;
    }

    dispatch({ type: "FETCH_SUCCESS", payload: result.data?.data.flashcards || [] });
  }, [queryParams]);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Show keyboard shortcut hint on first use
  useEffect(() => {
    if (!state.hasSeenShortcutHint && state.session && !state.isLoading && !state.error) {
      toast.info(STUDY_MESSAGES.SHORTCUT_HINT, {
        duration: STUDY_MESSAGES.SHORTCUT_HINT_DURATION,
      });
      setStorageBoolean(STUDY_STORAGE_KEYS.SHORTCUT_HINT_SEEN, true);
      dispatch({ type: "SET_HINT_SEEN" });
    }
  }, [state.session, state.isLoading, state.error, state.hasSeenShortcutHint]);

  /**
   * Flip the current flashcard
   */
  const flipCard = useCallback(() => {
    dispatch({ type: "FLIP_CARD" });
  }, []);

  /**
   * Mark current flashcard as known and move to next
   */
  const markAsKnown = useCallback(() => {
    if (!state.session) return;
    const currentFlashcard = state.session.flashcards[state.session.currentCardIndex];
    dispatch({ type: "MARK_CARD", payload: { flashcard_id: currentFlashcard.id, known: true } });
  }, [state.session]);

  /**
   * Mark current flashcard as unknown and move to next
   */
  const markAsUnknown = useCallback(() => {
    if (!state.session) return;
    const currentFlashcard = state.session.flashcards[state.session.currentCardIndex];
    dispatch({ type: "MARK_CARD", payload: { flashcard_id: currentFlashcard.id, known: false } });
  }, [state.session]);

  /**
   * Restart the study session
   */
  const restartSession = useCallback(() => {
    fetchSession();
  }, [fetchSession]);

  // Check if session is complete (memoized derived state)
  const isSessionComplete = useMemo(
    () => state.session !== null && state.session.currentCardIndex >= state.session.flashcards.length,
    [state.session]
  );

  return {
    session: state.session,
    isLoading: state.isLoading,
    error: state.error,
    flipCard,
    markAsKnown,
    markAsUnknown,
    restartSession,
    isSessionComplete,
  };
};
