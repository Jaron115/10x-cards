/**
 * Test fixtures for flashcard data
 */

export const mockFlashcards = [
  {
    id: "1",
    user_id: "1",
    front: "What is TypeScript?",
    back: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
    tags: ["programming", "typescript"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "1",
    front: "What is React?",
    back: "React is a JavaScript library for building user interfaces.",
    tags: ["programming", "react"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockFlashcardResponse = {
  flashcards: mockFlashcards,
  total: mockFlashcards.length,
  page: 1,
  per_page: 10,
};
