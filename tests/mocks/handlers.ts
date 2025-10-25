import { http, HttpResponse } from "msw";

// Define API mock handlers
export const handlers = [
  // Example: Mock authentication endpoint
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      user: {
        id: "1",
        email: "test@example.com",
      },
      token: "mock-token",
    });
  }),

  // Example: Mock flashcards endpoint
  http.get("/api/flashcards", () => {
    return HttpResponse.json({
      flashcards: [],
      total: 0,
    });
  }),

  // Add more handlers as needed
];
