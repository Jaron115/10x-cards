/**
 * Unit tests for useGenerator hook
 * ETAP 1 - KROK 1.1: Walidacja tekstu + computed values
 * ETAP 1 - KROK 1.2: Generowanie propozycji (API flow)
 * ETAP 1 - KROK 1.3: Zarządzanie propozycjami
 * ETAP 1 - KROK 1.4: Zapisywanie propozycji
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerator } from "@/components/generator/useGenerator";
import { toast } from "sonner";
import type {
  ApiResponseDTO,
  GenerateFlashcardsResponseDTO,
  CreateFlashcardsBulkResponseDTO,
  ApiErrorDTO,
} from "@/types";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useGenerator - Walidacja i Computed Values", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Walidacja długości tekstu źródłowego", () => {
    it("powinien oznaczyć tekst jako nieprawidłowy gdy < 1000 znaków", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const shortText = "a".repeat(999);

      // Act
      act(() => {
        result.current.handleSourceTextChange(shortText);
      });

      // Assert
      expect(result.current.characterCount).toBe(999);
      expect(result.current.isTextValid).toBe(false);
    });

    it("powinien oznaczyć tekst jako prawidłowy dla 1000 znaków (minimum)", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const minText = "a".repeat(1000);

      // Act
      act(() => {
        result.current.handleSourceTextChange(minText);
      });

      // Assert
      expect(result.current.characterCount).toBe(1000);
      expect(result.current.isTextValid).toBe(true);
    });

    it("powinien oznaczyć tekst jako prawidłowy dla 10000 znaków (maksimum)", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const maxText = "a".repeat(10000);

      // Act
      act(() => {
        result.current.handleSourceTextChange(maxText);
      });

      // Assert
      expect(result.current.characterCount).toBe(10000);
      expect(result.current.isTextValid).toBe(true);
    });

    it("powinien oznaczyć tekst jako nieprawidłowy gdy > 10000 znaków", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const tooLongText = "a".repeat(10001);

      // Act
      act(() => {
        result.current.handleSourceTextChange(tooLongText);
      });

      // Assert
      expect(result.current.characterCount).toBe(10001);
      expect(result.current.isTextValid).toBe(false);
    });

    it("powinien oznaczyć tekst jako prawidłowy w środku zakresu (5000 znaków)", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const midText = "a".repeat(5000);

      // Act
      act(() => {
        result.current.handleSourceTextChange(midText);
      });

      // Assert
      expect(result.current.characterCount).toBe(5000);
      expect(result.current.isTextValid).toBe(true);
    });
  });

  describe("Computed values - liczniki", () => {
    it("powinien poprawnie liczyć znaki w pustym tekście", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());

      // Assert
      expect(result.current.characterCount).toBe(0);
      expect(result.current.isTextValid).toBe(false);
    });

    it("powinien zwrócić approvedCount = 0 dla pustej listy propozycji", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());

      // Assert
      expect(result.current.approvedCount).toBe(0);
    });

    it("powinien aktualizować characterCount przy każdej zmianie tekstu", () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());

      // Act & Assert - pierwsza zmiana
      act(() => {
        result.current.handleSourceTextChange("abc");
      });
      expect(result.current.characterCount).toBe(3);

      // Act & Assert - druga zmiana
      act(() => {
        result.current.handleSourceTextChange("abcdef");
      });
      expect(result.current.characterCount).toBe(6);

      // Act & Assert - czyszczenie
      act(() => {
        result.current.handleSourceTextChange("");
      });
      expect(result.current.characterCount).toBe(0);
    });
  });

  describe("Stan początkowy", () => {
    it("powinien zainicjalizować hook z poprawnymi wartościami domyślnymi", () => {
      // Arrange & Act
      const { result } = renderHook(() => useGenerator());

      // Assert
      expect(result.current.sourceText).toBe("");
      expect(result.current.proposals).toEqual([]);
      expect(result.current.status).toBe("idle");
      expect(result.current.characterCount).toBe(0);
      expect(result.current.isTextValid).toBe(false);
      expect(result.current.approvedCount).toBe(0);
    });
  });
});

describe("useGenerator - Generowanie propozycji (API flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Sukces generowania", () => {
    it("powinien wywołać API i zmapować propozycje z unique IDs", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 123,
          model: "gpt-4",
          duration_ms: 2500,
          generated_count: 3,
          flashcards_proposals: [
            { front: "Pytanie 1", back: "Odpowiedź 1", source: "ai-full" },
            { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" },
            { front: "Pytanie 3", back: "Odpowiedź 3", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());
      const validText = "a".repeat(2000);

      act(() => {
        result.current.handleSourceTextChange(validText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert - API call
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/generations",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source_text: validText }),
        })
      );

      // Assert - Proposals mapping
      expect(result.current.proposals).toHaveLength(3);
      expect(result.current.proposals[0]).toMatchObject({
        front: "Pytanie 1",
        back: "Odpowiedź 1",
        status: "pending",
        source: "ai-full",
      });
      expect(result.current.proposals[0].id).toBe("123-0");
      expect(result.current.proposals[1].id).toBe("123-1");
      expect(result.current.proposals[2].id).toBe("123-2");

      // Assert - Status and toast
      expect(result.current.status).toBe("idle");
      expect(toast.success).toHaveBeenCalledWith("Wygenerowano 3 fiszek");
    });

    it("powinien ustawić status 'loading' podczas generowania i wrócić do 'idle'", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 456,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());
      const validText = "a".repeat(3000);

      act(() => {
        result.current.handleSourceTextChange(validText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert - Back to idle after completion
      expect(result.current.status).toBe("idle");
      expect(result.current.proposals).toHaveLength(1);
    });

    it("powinien wyczyścić poprzednie propozycje przed nową generacją", async () => {
      // Arrange - First generation
      const mockResponse1: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 1,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 2,
          flashcards_proposals: [
            { front: "Old 1", back: "Answer 1", source: "ai-full" },
            { front: "Old 2", back: "Answer 2", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse1,
      } as Response);

      const { result } = renderHook(() => useGenerator());
      const validText = "a".repeat(2000);

      act(() => {
        result.current.handleSourceTextChange(validText);
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.proposals).toHaveLength(2);

      // Arrange - Second generation
      const mockResponse2: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 2,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "New 1", back: "Answer 3", source: "ai-full" }],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2,
      } as Response);

      // Act - Second generation
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert - Old proposals cleared, only new ones present
      expect(result.current.proposals).toHaveLength(1);
      expect(result.current.proposals[0].front).toBe("New 1");
      expect(result.current.proposals[0].id).toBe("2-0");
    });
  });

  describe("Obsługa błędów API", () => {
    it("powinien obsłużyć błąd API (4xx) i wyświetlić komunikat", async () => {
      // Arrange
      const errorResponse: ApiErrorDTO = {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Przekroczono limit generacji. Spróbuj ponownie za chwilę.",
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => errorResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());
      const validText = "a".repeat(2000);

      act(() => {
        result.current.handleSourceTextChange(validText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert
      expect(result.current.status).toBe("error");
      expect(result.current.proposals).toHaveLength(0);
      expect(toast.error).toHaveBeenCalledWith("Przekroczono limit generacji. Spróbuj ponownie za chwilę.");
    });

    it("powinien obsłużyć błąd sieciowy", async () => {
      // Arrange
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useGenerator());
      const validText = "a".repeat(2000);

      act(() => {
        result.current.handleSourceTextChange(validText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert
      expect(result.current.status).toBe("error");
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  describe("Walidacja przed wywołaniem API", () => {
    it("nie powinien wywołać API gdy tekst jest nieprawidłowy (< 1000 znaków)", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const invalidText = "a".repeat(500);

      act(() => {
        result.current.handleSourceTextChange(invalidText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Tekst musi zawierać od 1000 do 10000 znaków");
    });

    it("nie powinien wywołać API gdy tekst jest nieprawidłowy (> 10000 znaków)", async () => {
      // Arrange
      const { result } = renderHook(() => useGenerator());
      const invalidText = "a".repeat(15000);

      act(() => {
        result.current.handleSourceTextChange(invalidText);
      });

      // Act
      await act(async () => {
        await result.current.handleGenerate();
      });

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Tekst musi zawierać od 1000 do 10000 znaków");
    });
  });
});

describe("useGenerator - Zarządzanie propozycjami", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Aktualizacja treści propozycji", () => {
    it("powinien zaktualizować konkretną propozycję bez zmiany innych", async () => {
      // Arrange - Generate proposals first
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 123,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 3,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
            { front: "Q3", back: "A3", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.proposals).toHaveLength(3);

      // Act - Update second proposal
      const updatedProposal = {
        ...result.current.proposals[1],
        front: "Edited Question 2",
        back: "Edited Answer 2",
        source: "ai-edited" as const,
      };

      act(() => {
        result.current.handleUpdateProposal(updatedProposal);
      });

      // Assert
      expect(result.current.proposals).toHaveLength(3);
      expect(result.current.proposals[0].front).toBe("Q1"); // Unchanged
      expect(result.current.proposals[1].front).toBe("Edited Question 2"); // Changed
      expect(result.current.proposals[1].back).toBe("Edited Answer 2");
      expect(result.current.proposals[1].source).toBe("ai-edited");
      expect(result.current.proposals[2].front).toBe("Q3"); // Unchanged
    });
  });

  describe("Zmiana statusów propozycji", () => {
    it("powinien zmienić status z 'pending' na 'approved'", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 456,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 2,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.proposals[0].status).toBe("pending");

      // Act
      act(() => {
        result.current.handleSetProposalStatus("456-0", "approved");
      });

      // Assert
      expect(result.current.proposals[0].status).toBe("approved");
      expect(result.current.proposals[1].status).toBe("pending"); // Other unchanged
    });

    it("powinien zmienić status z 'pending' na 'rejected'", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 789,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      // Act
      act(() => {
        result.current.handleSetProposalStatus("789-0", "rejected");
      });

      // Assert
      expect(result.current.proposals[0].status).toBe("rejected");
    });
  });

  describe("Liczenie zatwierdzonych propozycji", () => {
    it("powinien poprawnie liczyć zatwierdzone propozycje (approvedCount)", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 111,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 4,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
            { front: "Q3", back: "A3", source: "ai-full" },
            { front: "Q4", back: "A4", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.approvedCount).toBe(0); // Initially 0

      // Act - Approve first proposal
      act(() => {
        result.current.handleSetProposalStatus("111-0", "approved");
      });

      expect(result.current.approvedCount).toBe(1);

      // Act - Approve second and third
      act(() => {
        result.current.handleSetProposalStatus("111-1", "approved");
        result.current.handleSetProposalStatus("111-2", "approved");
      });

      expect(result.current.approvedCount).toBe(3);

      // Act - Reject one
      act(() => {
        result.current.handleSetProposalStatus("111-3", "rejected");
      });

      expect(result.current.approvedCount).toBe(3); // Still 3, rejected doesn't count

      // Act - Change approved back to pending
      act(() => {
        result.current.handleSetProposalStatus("111-0", "pending");
      });

      expect(result.current.approvedCount).toBe(2); // Now 2
    });

    it("approvedCount nie powinien liczyć odrzuconych ani pending propozycji", async () => {
      // Arrange
      const mockResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 222,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 3,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
            { front: "Q3", back: "A3", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      // Act - Set different statuses
      act(() => {
        result.current.handleSetProposalStatus("222-0", "approved");
        result.current.handleSetProposalStatus("222-1", "rejected");
        result.current.handleSetProposalStatus("222-2", "pending");
      });

      // Assert - Only approved counts
      expect(result.current.approvedCount).toBe(1);
      expect(result.current.proposals[0].status).toBe("approved");
      expect(result.current.proposals[1].status).toBe("rejected");
      expect(result.current.proposals[2].status).toBe("pending");
    });
  });
});

describe("useGenerator - Zapisywanie propozycji", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Sukces zapisywania", () => {
    it("powinien wysłać tylko zatwierdzone propozycje do API", async () => {
      // Arrange - Generate proposals
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 999,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 3,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
            { front: "Q3", back: "A3", source: "ai-full" },
          ],
        },
      };

      const mockSaveResponse: ApiResponseDTO<CreateFlashcardsBulkResponseDTO> = {
        success: true,
        data: {
          created_count: 2,
          flashcards: [
            {
              id: 1,
              generation_id: 999,
              front: "Q1",
              back: "A1",
              source: "ai-full",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            {
              id: 2,
              generation_id: 999,
              front: "Q3",
              back: "A3",
              source: "ai-full",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      // Approve only first and third
      act(() => {
        result.current.handleSetProposalStatus("999-0", "approved");
        result.current.handleSetProposalStatus("999-2", "approved");
      });

      expect(result.current.approvedCount).toBe(2);

      // Mock save API
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSaveResponse,
      } as Response);

      // Act - Save
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // Assert - API called with only approved
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/flashcards/bulk",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generation_id: 999,
            flashcards: [
              { front: "Q1", back: "A1", source: "ai-full" },
              { front: "Q3", back: "A3", source: "ai-full" },
            ],
          }),
        })
      );

      expect(toast.success).toHaveBeenLastCalledWith("Zapisano 2 fiszek");
    });

    it("powinien zresetować formularz po sukcesie zapisania", async () => {
      // Arrange - Generate and approve
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 888,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 2,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
          ],
        },
      };

      const mockSaveResponse: ApiResponseDTO<CreateFlashcardsBulkResponseDTO> = {
        success: true,
        data: {
          created_count: 2,
          flashcards: [],
        },
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerateResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      act(() => {
        result.current.handleSetProposalStatus("888-0", "approved");
        result.current.handleSetProposalStatus("888-1", "approved");
      });

      expect(result.current.sourceText).toBe("a".repeat(2000));
      expect(result.current.proposals).toHaveLength(2);

      // Act - Save
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // Assert - Form reset
      expect(result.current.sourceText).toBe("");
      expect(result.current.proposals).toEqual([]);
      expect(result.current.status).toBe("idle");
      expect(result.current.approvedCount).toBe(0);
    });
  });

  describe("Walidacja przed zapisem", () => {
    it("nie powinien zapisać gdy approvedCount = 0", async () => {
      // Arrange
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 777,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 2,
          flashcards_proposals: [
            { front: "Q1", back: "A1", source: "ai-full" },
            { front: "Q2", back: "A2", source: "ai-full" },
          ],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      // Don't approve any
      expect(result.current.approvedCount).toBe(0);

      // Act - Try to save
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // Assert - API not called
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only generate, not save
      expect(toast.error).toHaveBeenCalledWith("Brak zatwierdzonych fiszek do zapisania");
    });

    it("powinien ustawić status 'saving' podczas zapisywania", async () => {
      // Arrange
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 666,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
        },
      };

      const mockSaveResponse: ApiResponseDTO<CreateFlashcardsBulkResponseDTO> = {
        success: true,
        data: {
          created_count: 1,
          flashcards: [],
        },
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerateResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      act(() => {
        result.current.handleSetProposalStatus("666-0", "approved");
      });

      // Act & Assert
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // After saving, status should be idle
      expect(result.current.status).toBe("idle");
    });
  });

  describe("Obsługa błędów zapisywania", () => {
    it("powinien obsłużyć błąd API podczas zapisywania", async () => {
      // Arrange
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 555,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
        },
      };

      const errorResponse: ApiErrorDTO = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Nieprawidłowe dane fiszek",
        },
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerateResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorResponse,
        } as Response);

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      act(() => {
        result.current.handleSetProposalStatus("555-0", "approved");
      });

      // Act
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // Assert
      expect(result.current.status).toBe("error");
      expect(toast.error).toHaveBeenCalledWith("Nieprawidłowe dane fiszek");
      // Proposals should NOT be cleared on error
      expect(result.current.proposals).toHaveLength(1);
    });

    it("powinien obsłużyć błąd sieciowy podczas zapisywania", async () => {
      // Arrange
      const mockGenerateResponse: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
        success: true,
        data: {
          generation_id: 444,
          model: "gpt-4",
          duration_ms: 1000,
          generated_count: 1,
          flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
        },
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerateResponse,
        } as Response)
        .mockRejectedValueOnce(new Error("Connection timeout"));

      const { result } = renderHook(() => useGenerator());

      act(() => {
        result.current.handleSourceTextChange("a".repeat(2000));
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      act(() => {
        result.current.handleSetProposalStatus("444-0", "approved");
      });

      // Act
      await act(async () => {
        await result.current.handleSaveProposals();
      });

      // Assert
      expect(result.current.status).toBe("error");
      expect(toast.error).toHaveBeenCalledWith("Connection timeout");
      expect(result.current.proposals).toHaveLength(1);
    });
  });
});
