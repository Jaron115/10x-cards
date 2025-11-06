import { useEffect, useCallback, useRef } from "react";
import { KEY_MAPPINGS } from "@/lib/constants/study";

interface KeyboardShortcutsCallbacks {
  onFlip: () => void;
  onKnown: () => void;
  onUnknown: () => void;
  onExit: () => void;
  onHelp: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  isFlipped: boolean;
}

/**
 * Check if the event target is an editable element
 */
const isEditableElement = (target: EventTarget | null): boolean => {
  if (!target) return false;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }

  return false;
};

/**
 * Hook managing keyboard shortcuts for study session
 * Uses configurable key mappings from constants
 */
export const useKeyboardShortcuts = (
  callbacks: KeyboardShortcutsCallbacks,
  options: UseKeyboardShortcutsOptions = { enabled: true, isFlipped: false }
) => {
  const { enabled = true, isFlipped } = options;

  // Use ref to avoid adding callbacks to dependencies
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in input/textarea/contentEditable
      if (isEditableElement(event.target)) {
        return;
      }

      const key = event.key;

      // Handle flip action (always available)
      if ((KEY_MAPPINGS.FLIP as readonly string[]).includes(key)) {
        event.preventDefault();
        callbacksRef.current.onFlip();
        return;
      }

      // Handle known/unknown actions (only when flipped)
      if (isFlipped) {
        if ((KEY_MAPPINGS.KNOWN as readonly string[]).includes(key)) {
          event.preventDefault();
          callbacksRef.current.onKnown();
          return;
        }

        if ((KEY_MAPPINGS.UNKNOWN as readonly string[]).includes(key)) {
          event.preventDefault();
          callbacksRef.current.onUnknown();
          return;
        }
      }

      // Handle exit action (always available)
      if ((KEY_MAPPINGS.EXIT as readonly string[]).includes(key)) {
        event.preventDefault();
        callbacksRef.current.onExit();
        return;
      }

      // Handle help action (always available)
      if ((KEY_MAPPINGS.HELP as readonly string[]).includes(key)) {
        event.preventDefault();
        callbacksRef.current.onHelp();
        return;
      }
    },
    [enabled, isFlipped]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
