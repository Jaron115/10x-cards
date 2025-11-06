/**
 * Navigation utilities
 * Provides testable navigation functions
 */

/**
 * Navigate to a URL (client-side only)
 *
 * @param url - Target URL
 * @param delay - Optional delay in milliseconds before navigation
 */
export const navigateTo = (url: string, delay = 0): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (delay > 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  } else {
    window.location.href = url;
  }
};

/**
 * Navigate to flashcards page
 */
export const navigateToFlashcards = (): void => {
  navigateTo("/app/flashcards");
};

/**
 * Navigate to generator page
 */
export const navigateToGenerator = (): void => {
  navigateTo("/app/generator");
};

/**
 * Navigate to home page
 */
export const navigateToHome = (): void => {
  navigateTo("/");
};

/**
 * Reload current page
 */
export const reloadPage = (): void => {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
};
