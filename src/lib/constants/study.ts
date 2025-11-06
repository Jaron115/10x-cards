/**
 * Study session constants and configurations
 */

// ============================================================================
// Session Configuration
// ============================================================================

/**
 * Default study session configuration
 */
export const STUDY_SESSION_DEFAULTS = {
  LIMIT: 20,
  SHUFFLE: true,
} as const;

/**
 * Animation durations in milliseconds
 */
export const STUDY_ANIMATIONS = {
  CARD_FLIP_DURATION: 0.6,
  CARD_SLIDE_DURATION: 0.3,
  SPRING_STIFFNESS: 300,
  SPRING_DAMPING: 30,
} as const;

/**
 * LocalStorage keys for study session
 */
export const STUDY_STORAGE_KEYS = {
  SHORTCUT_HINT_SEEN: "hasSeenShortcutHint",
} as const;

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcut {
  key: string;
  description: string;
  icon: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: "Space", description: "Przewróć fiszkę", icon: "⎵" },
  { key: "1 lub ←", description: "Nie znam", icon: "←" },
  { key: "2 lub →", description: "Znam", icon: "→" },
  { key: "Escape", description: "Zakończ sesję", icon: "Esc" },
  { key: "?", description: "Pokaż/ukryj pomoc", icon: "?" },
];

/**
 * Keyboard key mappings
 */
export const KEY_MAPPINGS = {
  FLIP: [" "],
  KNOWN: ["2", "ArrowRight"],
  UNKNOWN: ["1", "ArrowLeft"],
  EXIT: ["Escape"],
  HELP: ["?"],
} as const;

/**
 * Toast messages configuration
 */
export const STUDY_MESSAGES = {
  SHORTCUT_HINT: "💡 Wskazówka: Użyj spacji aby przewrócić fiszkę, naciśnij ? aby zobaczyć wszystkie skróty",
  SHORTCUT_HINT_DURATION: 5000,
  SESSION_EXPIRED: "Sesja wygasła. Zaloguj się ponownie.",
  NO_FLASHCARDS: "Nie masz jeszcze żadnych fiszek.",
  LOAD_ERROR: "Nie udało się załadować sesji nauki.",
} as const;
