import type { Page, Route } from "@playwright/test";

/**
 * Mock data for flashcard generation
 */
export const MOCK_FLASHCARD_PROPOSALS = [
  {
    id: "mock-1",
    front: "Co to jest React?",
    back: "React to biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Meta (Facebook).",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
  {
    id: "mock-2",
    front: "Co to jest JSX?",
    back: "JSX to rozszerzenie składni JavaScript, które pozwala pisać kod podobny do HTML w plikach JavaScript.",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
  {
    id: "mock-3",
    front: "Co to są komponenty w React?",
    back: "Komponenty to niezależne, wielokrotnego użytku części kodu, które zwracają elementy React opisujące to, co powinno się pojawić na ekranie.",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
  {
    id: "mock-4",
    front: "Co to jest Virtual DOM?",
    back: "Virtual DOM to lekka kopia prawdziwego DOM, którą React używa do optymalizacji aktualizacji interfejsu użytkownika.",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
  {
    id: "mock-5",
    front: "Co to są hooki w React?",
    back: "Hooki to funkcje, które pozwalają używać stanu i innych funkcji React w komponentach funkcyjnych, np. useState, useEffect.",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
  {
    id: "mock-6",
    front: "Co to jest prop drilling?",
    back: "Prop drilling to proces przekazywania propsów przez wiele poziomów komponentów, aby dostać je do głęboko zagnieżdżonego komponentu.",
    source: "ai-generated" as const,
    status: "pending" as const,
  },
];

/**
 * Mock successful generation response
 */
export function createMockGenerationResponse(delay = 2000) {
  return {
    success: true,
    data: {
      generation_id: 999,
      model: "openai/gpt-4o-mini",
      duration_ms: delay,
      generated_count: MOCK_FLASHCARD_PROPOSALS.length,
      flashcards_proposals: MOCK_FLASHCARD_PROPOSALS,
    },
  };
}

/**
 * Mock error response
 */
export function createMockErrorResponse(code: string, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Setup API route mocking for generation endpoint
 */
export async function mockGenerationAPI(
  page: Page,
  options?: { delay?: number; shouldFail?: boolean; errorMessage?: string }
) {
  const delay = options?.delay ?? 2000;
  const shouldFail = options?.shouldFail ?? false;
  const errorMessage = options?.errorMessage ?? "Service unavailable";

  await page.route("**/api/generations", async (route: Route) => {
    if (route.request().method() === "POST") {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (shouldFail) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify(createMockErrorResponse("AI_SERVICE_ERROR", errorMessage)),
        });
      } else {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(createMockGenerationResponse(delay)),
        });
      }
    } else {
      // Let other methods pass through
      await route.continue();
    }
  });
}

/**
 * Setup API route mocking for flashcard save endpoint
 */
export async function mockFlashcardSaveAPI(page: Page, options?: { delay?: number; shouldFail?: boolean }) {
  const delay = options?.delay ?? 500;
  const shouldFail = options?.shouldFail ?? false;

  await page.route("**/api/flashcards", async (route: Route) => {
    if (route.request().method() === "POST") {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify(createMockErrorResponse("INTERNAL_ERROR", "Failed to save flashcards")),
        });
      } else {
        // Parse request body to get flashcard data
        const postData = route.request().postDataJSON();
        const flashcards = postData?.flashcards || [];

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              saved_count: flashcards.length,
              flashcards: flashcards.map((fc: any, index: number) => ({
                id: 1000 + index,
                ...fc,
                user_id: process.env.E2E_USERNAME_ID,
                created_at: new Date().toISOString(),
              })),
            },
          }),
        });
      }
    } else {
      // Let other methods pass through
      await route.continue();
    }
  });
}

/**
 * Setup all common API mocks
 */
export async function setupCommonMocks(page: Page) {
  await mockGenerationAPI(page);
  await mockFlashcardSaveAPI(page);
}
