# Unit Test Implementation - Plan dla pozostałych etapów

## 📋 Overview

Ten dokument opisuje plan implementacji testów jednostkowych dla pozostałych komponentów funkcjonalności Generator AI w aplikacji 10x-cards.

**Status:** 📝 Planowanie  
**Priorytet:** Średni/Niski (logika biznesowa już pokryta)  
**Szacowany czas:** 2-3 godziny

---

## 🎯 Strategia testowania

### Podział priorytetów

```
┌─────────────────────────────────────────────────────────────┐
│  PRIORYTET TESTOWANIA                                       │
├─────────────────────────────────────────────────────────────┤
│  ✅ KRYTYCZNY   - Logika biznesowa (DONE)                   │
│  🟡 WYSOKI      - Edycja + walidacja UI                     │
│  🟢 ŚREDNI      - Prezentacja i formatowanie                │
│  🔵 NISKI       - Integration tests (nice to have)          │
└─────────────────────────────────────────────────────────────┘
```

### Filozofia testowania UI

**Testujemy:**

- ✅ Logikę w komponentach (walidacja, warunkowe renderowanie)
- ✅ Interakcje użytkownika (clicks, input changes)
- ✅ Efekty uboczne (callbacks, API calls)

**NIE testujemy:**

- ❌ Stylów i układu (lepsze dla visual regression tests)
- ❌ Bibliotek third-party (shadcn/ui)
- ❌ Prostych prezenterów bez logiki

---

## 🎯 ETAP 2: FlashcardProposalCard.tsx

**Plik do utworzenia:** `tests/unit/components/generator/FlashcardProposalCard.test.tsx`  
**Szacowana liczba testów:** 10-12 testów  
**Priorytet:** 🟡 Wysoki  
**Czas realizacji:** ~45-60 minut

### Dlaczego wysoki priorytet?

- Zawiera logikę edycji inline
- Walidacja formularza (limity znaków)
- Zarządzanie stanem lokalnym (tryb edycji)
- Złożone interakcje użytkownika

### Komponent overview

```typescript
interface FlashcardProposalCardProps {
  proposal: FlashcardProposalViewModel;
  onUpdateProposal: (updatedProposal: FlashcardProposalViewModel) => void;
  onSetProposalStatus: (id: string, status: "pending" | "approved" | "rejected") => void;
}
```

**Stan lokalny:**

- `isEditing: boolean`
- `editedFront: string`
- `editedBack: string`

**Walidacja:**

- MAX_FRONT_CHARS = 200
- MAX_BACK_CHARS = 500

---

### KROK 2.1: Renderowanie i stan początkowy (3 testy)

#### Test 1: Renderowanie podstawowe

```typescript
it("powinien renderować front i back w trybie read-only", () => {
  // Arrange
  const mockProposal = {
    id: "123-0",
    front: "Pytanie testowe",
    back: "Odpowiedź testowa",
    status: "pending",
    source: "ai-full",
  };

  // Act
  render(<FlashcardProposalCard proposal={mockProposal} onUpdateProposal={vi.fn()} onSetProposalStatus={vi.fn()} />);

  // Assert
  expect(screen.getByText("Pytanie testowe")).toBeInTheDocument();
  expect(screen.getByText("Odpowiedź testowa")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); // Nie ma textarea
});
```

**Sprawdza:**

- Wyświetlanie `proposal.front` i `proposal.back`
- Brak textarea w trybie read-only
- Struktura HTML

#### Test 2: Badge dla źródła

```typescript
it('powinien pokazać badge "Wygenerowane" dla source=ai-full', () => {
  const mockProposal = { ...baseProposal, source: "ai-full" };
  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  expect(screen.getByText("Wygenerowane")).toBeInTheDocument();
});

it('powinien pokazać badge "Edytowane" dla source=ai-edited', () => {
  const mockProposal = { ...baseProposal, source: "ai-edited" };
  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  expect(screen.getByText("Edytowane")).toBeInTheDocument();
});
```

**Sprawdza:**

- Warunki renderowania badge
- Tekst w badge

#### Test 3: Style dla statusów

```typescript
it("powinien zastosować zielone style dla approved", () => {
  const mockProposal = { ...baseProposal, status: "approved" };
  const { container } = render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  const card = container.querySelector(".border-green-500");
  expect(card).toBeInTheDocument();
});

it("powinien zastosować opacity i grayscale dla rejected", () => {
  const mockProposal = { ...baseProposal, status: "rejected" };
  const { container } = render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  const card = container.querySelector(".opacity-50");
  expect(card).toBeInTheDocument();
});
```

**Sprawdza:**

- Conditional className dla approved
- Conditional className dla rejected
- Użycie `cn()` utility

---

### KROK 2.2: Tryb edycji (4 testy)

#### Test 1: Włączenie trybu edycji

```typescript
it("powinien przełączyć się w tryb edycji po kliknięciu przycisku ✏️", async () => {
  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  const editButton = screen.getByTitle("Edytuj");
  await userEvent.click(editButton);

  // Assert - textarea są widoczne
  const textareas = screen.getAllByRole("textbox");
  expect(textareas).toHaveLength(2); // Front + Back

  // Assert - przyciski edycji widoczne
  expect(screen.getByTitle("Zapisz")).toBeInTheDocument();
  expect(screen.getByTitle("Anuluj")).toBeInTheDocument();

  // Assert - przyciski approve/reject ukryte
  expect(screen.queryByTitle("Zatwierdź")).not.toBeInTheDocument();
});
```

**Sprawdza:**

- Toggle `isEditing` state
- Conditional rendering textarea
- Zmiana przycisków

#### Test 2: Liczniki znaków

```typescript
it("powinien pokazać liczniki znaków w trybie edycji", async () => {
  const mockProposal = {
    ...baseProposal,
    front: "Test", // 4 znaki
    back: "Answer test", // 11 znaków
  };

  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  await userEvent.click(screen.getByTitle("Edytuj"));

  expect(screen.getByText("4 / 200 znaków")).toBeInTheDocument();
  expect(screen.getByText("11 / 500 znaków")).toBeInTheDocument();
});
```

**Sprawdza:**

- Wyświetlanie licznika
- Format: "X / MAX znaków"

#### Test 3: Walidacja długości

```typescript
it("powinien wyświetlić czerwony border gdy front > 200 znaków", async () => {
  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  await userEvent.click(screen.getByTitle("Edytuj"));

  const frontTextarea = screen.getAllByRole("textbox")[0];
  await userEvent.clear(frontTextarea);
  await userEvent.type(frontTextarea, "a".repeat(201));

  expect(frontTextarea).toHaveClass("border-destructive");
});

it("powinien zablokować przycisk Zapisz gdy walidacja nie przechodzi", async () => {
  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  await userEvent.click(screen.getByTitle("Edytuj"));

  const frontTextarea = screen.getAllByRole("textbox")[0];
  await userEvent.clear(frontTextarea); // Pusty front (invalid)

  expect(screen.getByTitle("Zapisz")).toBeDisabled();
});
```

**Sprawdza:**

- Walidacja min (> 0) i max (≤ 200/500)
- `isFrontValid` i `isBackValid`
- `canSave` computed value
- Disabled state przycisku

#### Test 4: Anulowanie edycji

```typescript
it("powinien przywrócić oryginalne wartości po anulowaniu", async () => {
  const mockProposal = {
    ...baseProposal,
    front: "Original front",
    back: "Original back",
  };

  render(<FlashcardProposalCard {...props} proposal={mockProposal} />);

  // Enter edit mode
  await userEvent.click(screen.getByTitle("Edytuj"));

  // Change values
  const frontTextarea = screen.getAllByRole("textbox")[0];
  await userEvent.clear(frontTextarea);
  await userEvent.type(frontTextarea, "Changed front");

  // Cancel
  await userEvent.click(screen.getByTitle("Anuluj"));

  // Assert - original values restored
  expect(screen.getByText("Original front")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); // Exit edit mode
});
```

**Sprawdza:**

- `handleCancelEdit()`
- Reset `editedFront` i `editedBack`
- Wyjście z trybu edycji

---

### KROK 2.3: Zatwierdzanie i odrzucanie (3 testy)

#### Test 1: Approve toggle

```typescript
it("powinien zmienić status z pending na approved po kliknięciu ✓", async () => {
  const mockSetStatus = vi.fn();

  render(<FlashcardProposalCard {...props} onSetProposalStatus={mockSetStatus} />);

  const approveButton = screen.getByTitle("Zatwierdź");
  await userEvent.click(approveButton);

  expect(mockSetStatus).toHaveBeenCalledWith("123-0", "approved");
});

it("powinien zmienić status z approved na pending po ponownym kliknięciu ✓", async () => {
  const mockProposal = { ...baseProposal, status: "approved" };
  const mockSetStatus = vi.fn();

  render(<FlashcardProposalCard {...props} proposal={mockProposal} onSetProposalStatus={mockSetStatus} />);

  const approveButton = screen.getByTitle("Cofnij zatwierdzenie");
  await userEvent.click(approveButton);

  expect(mockSetStatus).toHaveBeenCalledWith("123-0", "pending");
});
```

**Sprawdza:**

- `handleApprove()` logic
- Toggle behavior: `isApproved ? "pending" : "approved"`
- Zmiana tytułu przycisku

#### Test 2: Reject toggle

```typescript
it("powinien zmienić status z pending na rejected po kliknięciu 🗑️", async () => {
  const mockSetStatus = vi.fn();

  render(<FlashcardProposalCard {...props} onSetProposalStatus={mockSetStatus} />);

  const rejectButton = screen.getByTitle("Odrzuć");
  await userEvent.click(rejectButton);

  expect(mockSetStatus).toHaveBeenCalledWith("123-0", "rejected");
});
```

**Sprawdza:**

- `handleReject()` logic
- Toggle behavior: `isRejected ? "pending" : "rejected"`

#### Test 3: Przyciski w trybie edycji

```typescript
it("nie powinien pokazać przycisków approve/reject w trybie edycji", async () => {
  render(<FlashcardProposalCard {...props} />);

  await userEvent.click(screen.getByTitle("Edytuj"));

  expect(screen.queryByTitle("Zatwierdź")).not.toBeInTheDocument();
  expect(screen.queryByTitle("Odrzuć")).not.toBeInTheDocument();
});
```

**Sprawdza:**

- Conditional rendering: `!isEditing && <ApproveButton />`

---

### KROK 2.4: Zapisywanie edycji (2 testy)

#### Test 1: Sukces zapisu

```typescript
it("powinien wywołać onUpdateProposal z zaktualizowanymi danymi", async () => {
  const mockUpdate = vi.fn();

  render(<FlashcardProposalCard {...props} onUpdateProposal={mockUpdate} />);

  // Enter edit mode
  await userEvent.click(screen.getByTitle("Edytuj"));

  // Edit
  const frontTextarea = screen.getAllByRole("textbox")[0];
  await userEvent.clear(frontTextarea);
  await userEvent.type(frontTextarea, "New front");

  const backTextarea = screen.getAllByRole("textbox")[1];
  await userEvent.clear(backTextarea);
  await userEvent.type(backTextarea, "New back");

  // Save
  await userEvent.click(screen.getByTitle("Zapisz"));

  // Assert
  expect(mockUpdate).toHaveBeenCalledWith({
    id: "123-0",
    front: "New front",
    back: "New back",
    source: "ai-edited",
    status: "approved", // Auto-approve!
  });
});
```

**Sprawdza:**

- `handleSaveEdit()` logic
- Aktualizacja `front` i `back`
- Zmiana `source` → "ai-edited"
- Auto-approve: `status: "approved"`
- Wyjście z trybu edycji

#### Test 2: Wyjście z trybu edycji

```typescript
it("powinien wyjść z trybu edycji po zapisaniu", async () => {
  render(<FlashcardProposalCard {...props} />);

  await userEvent.click(screen.getByTitle("Edytuj"));
  expect(screen.getAllByRole("textbox")).toHaveLength(2);

  await userEvent.click(screen.getByTitle("Zapisz"));

  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
```

**Sprawdza:**

- `setIsEditing(false)` po zapisie

---

### Setup i mocki dla ETAPU 2

```typescript
// FlashcardProposalCard.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardProposalCard } from "@/components/generator/FlashcardProposalCard";
import type { FlashcardProposalViewModel } from "@/types";

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...args: any[]) => args.filter(Boolean).join(" ")),
}));

describe("FlashcardProposalCard", () => {
  const baseProposal: FlashcardProposalViewModel = {
    id: "123-0",
    front: "Test question",
    back: "Test answer",
    status: "pending",
    source: "ai-full",
  };

  const defaultProps = {
    proposal: baseProposal,
    onUpdateProposal: vi.fn(),
    onSetProposalStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Testy tutaj...
});
```

---

## 🎯 ETAP 3: GenerationForm.tsx

**Plik do utworzenia:** `tests/unit/components/generator/GenerationForm.test.tsx`  
**Szacowana liczba testów:** 8-10 testów  
**Priorytet:** 🟡 Wysoki  
**Czas realizacji:** ~30-45 minut

### Dlaczego wysoki priorytet?

- Walidacja UI (kolorowanie licznika)
- Komunikaty walidacyjne dla użytkownika
- Conditional rendering
- Event handling

### Komponent overview

```typescript
interface GenerationFormProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  characterCount: number;
  isTextValid: boolean;
}

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;
```

**Funkcje do przetestowania:**

- `getCharacterCountColor()` - logika kolorowania
- `handleSubmit()` - walidacja przed submit
- Conditional rendering komunikatów

---

### KROK 3.1: Renderowanie elementów (2 testy)

#### Test 1: Podstawowe elementy

```typescript
it("powinien renderować wszystkie kluczowe elementy formularza", () => {
  render(<GenerationForm {...defaultProps} />);

  expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeInTheDocument();
  expect(screen.getByText(/Generuj fiszki/i)).toBeInTheDocument();
  expect(screen.getByText(/10,000 znaków/i)).toBeInTheDocument();
});
```

#### Test 2: Struktura HTML

```typescript
it("powinien mieć prawidłową strukturę Card", () => {
  const { container } = render(<GenerationForm {...defaultProps} />);

  expect(container.querySelector("form")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Generuj/i })).toBeInTheDocument();
});
```

---

### KROK 3.2: Kolorowanie licznika (3 testy)

#### Test 1: Szary dla < MIN_CHARS

```typescript
it("powinien pokazać szary kolor licznika gdy < 1000 znaków", () => {
  render(<GenerationForm {...defaultProps} characterCount={500} isTextValid={false} />);

  const counter = screen.getByText(/500/);
  expect(counter).toHaveClass("text-muted-foreground");
});
```

#### Test 2: Zielony dla zakresu prawidłowego

```typescript
it("powinien pokazać zielony kolor licznika gdy 1000-10000 znaków", () => {
  render(<GenerationForm {...defaultProps} characterCount={5000} isTextValid={true} />);

  const counter = screen.getByText(/5,000/);
  expect(counter).toHaveClass("text-green-600");
});
```

#### Test 3: Czerwony dla > MAX_CHARS

```typescript
it("powinien pokazać czerwony kolor licznika gdy > 10000 znaków", () => {
  render(<GenerationForm {...defaultProps} characterCount={15000} isTextValid={false} />);

  const counter = screen.getByText(/15,000/);
  expect(counter).toHaveClass("text-destructive");
});
```

**Sprawdza:**

- `getCharacterCountColor()` logic
- Conditional className

---

### KROK 3.3: Komunikaty walidacyjne (3 testy)

#### Test 1: Komunikat minimum

```typescript
it('powinien pokazać "Minimum: 1,000 znaków" gdy 0 < chars < 1000', () => {
  render(<GenerationForm {...defaultProps} characterCount={500} />);

  expect(screen.getByText(/Minimum: 1,000 znaków/i)).toBeInTheDocument();
});

it("nie powinien pokazać komunikatu minimum gdy characterCount = 0", () => {
  render(<GenerationForm {...defaultProps} characterCount={0} />);

  expect(screen.queryByText(/Minimum:/i)).not.toBeInTheDocument();
});
```

#### Test 2: Komunikat przekroczenia

```typescript
it("powinien pokazać komunikat przekroczenia gdy > 10000 znaków", () => {
  render(<GenerationForm {...defaultProps} characterCount={10500} />);

  expect(screen.getByText(/Przekroczono limit o 500 znaków/i)).toBeInTheDocument();
});
```

#### Test 3: Brak komunikatu w prawidłowym zakresie

```typescript
it("nie powinien pokazać żadnego komunikatu gdy tekst prawidłowy", () => {
  render(<GenerationForm {...defaultProps} characterCount={5000} isTextValid={true} />);

  expect(screen.queryByText(/Minimum:/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Przekroczono/i)).not.toBeInTheDocument();
});
```

**Sprawdza:**

- Conditional rendering komunikatów
- Obliczenia: `characterCount - MAX_CHARS`

---

### KROK 3.4: Stan formularza i interakcje (2 testy)

#### Test 1: Disabled states

```typescript
it("powinien zablokować przycisk gdy !isTextValid", () => {
  render(<GenerationForm {...defaultProps} isTextValid={false} />);

  expect(screen.getByRole("button", { name: /Generuj/i })).toBeDisabled();
});

it("powinien zablokować przycisk i textarea podczas ładowania", () => {
  render(<GenerationForm {...defaultProps} isLoading={true} />);

  expect(screen.getByRole("button", { name: /Generowanie/i })).toBeDisabled();
  expect(screen.getByRole("textbox")).toBeDisabled();
});
```

#### Test 2: Event handling

```typescript
it("powinien wywołać onSourceTextChange przy zmianie tekstu", async () => {
  const mockOnChange = vi.fn();

  render(<GenerationForm {...defaultProps} onSourceTextChange={mockOnChange} />);

  const textarea = screen.getByRole("textbox");
  await userEvent.type(textarea, "Test text");

  expect(mockOnChange).toHaveBeenCalled();
});

it("powinien wywołać onGenerate przy submit gdy isTextValid=true", async () => {
  const mockOnGenerate = vi.fn();

  render(<GenerationForm {...defaultProps} isTextValid={true} onGenerate={mockOnGenerate} />);

  const button = screen.getByRole("button", { name: /Generuj/i });
  await userEvent.click(button);

  expect(mockOnGenerate).toHaveBeenCalled();
});

it("nie powinien wywołać onGenerate gdy isTextValid=false", async () => {
  const mockOnGenerate = vi.fn();

  render(<GenerationForm {...defaultProps} isTextValid={false} onGenerate={mockOnGenerate} />);

  // Button is disabled, but test the form submit too
  const form = screen.getByRole("textbox").closest("form")!;
  await userEvent.click(form); // Try to submit

  expect(mockOnGenerate).not.toHaveBeenCalled();
});
```

**Sprawdza:**

- `handleSubmit()` logic
- `e.preventDefault()`
- Event callbacks

---

### Setup dla ETAPU 3

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "@/components/generator/GenerationForm";

describe("GenerationForm", () => {
  const defaultProps = {
    sourceText: "",
    onSourceTextChange: vi.fn(),
    onGenerate: vi.fn(),
    isLoading: false,
    characterCount: 0,
    isTextValid: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Testy tutaj...
});
```

---

## 🎯 ETAP 4: FlashcardProposalList.tsx

**Plik do utworzenia:** `tests/unit/components/generator/FlashcardProposalList.test.tsx`  
**Szacowana liczba testów:** 6-8 testów  
**Priorytet:** 🟢 Średni  
**Czas realizacji:** ~30-40 minut

### Dlaczego średni priorytet?

- Głównie prezentacyjny komponent
- Prosta logika warunkowa
- Formatowanie tekstu (pluralizacja)

### Komponent overview

```typescript
interface FlashcardProposalListProps {
  proposals: FlashcardProposalViewModel[];
  isLoading: boolean;
  isSaving: boolean;
  onUpdateProposal: (updatedProposal: FlashcardProposalViewModel) => void;
  onSetProposalStatus: (id: string, status: FlashcardProposalViewModel["status"]) => void;
  onSave: () => void;
  approvedCount: number;
}
```

---

### KROK 4.1: Renderowanie warunkowe (3 testy)

#### Test 1: Loading state

```typescript
it("powinien pokazać 6 skeletonów podczas ładowania", () => {
  render(<FlashcardProposalList {...defaultProps} isLoading={true} proposals={[]} />);

  expect(screen.getByText("Generowanie propozycji...")).toBeInTheDocument();

  const skeletons = document.querySelectorAll(".animate-pulse");
  expect(skeletons.length).toBeGreaterThanOrEqual(6);
});
```

#### Test 2: Empty state

```typescript
it("nie powinien renderować nic gdy proposals=[] i !isLoading", () => {
  const { container } = render(<FlashcardProposalList {...defaultProps} proposals={[]} isLoading={false} />);

  expect(container.textContent).toBe("");
});
```

#### Test 3: Lista propozycji

```typescript
it("powinien renderować listę gdy proposals.length > 0", () => {
  const mockProposals = [
    { id: "1-0", front: "Q1", back: "A1", status: "pending", source: "ai-full" },
    { id: "1-1", front: "Q2", back: "A2", status: "pending", source: "ai-full" },
  ];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} />);

  expect(screen.getByText("Propozycje fiszek")).toBeInTheDocument();
  expect(screen.getByText(/Wygenerowano 2/)).toBeInTheDocument();
});
```

---

### KROK 4.2: Wyświetlanie informacji (3 testy)

#### Test 1: Pluralizacja

```typescript
it('powinien użyć "fiszkę" dla liczby pojedynczej', () => {
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "pending", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} />);

  expect(screen.getByText(/Wygenerowano 1 fiszkę/)).toBeInTheDocument();
});

it('powinien użyć "fiszek" dla liczby mnogiej', () => {
  const mockProposals = [
    { id: "1-0", front: "Q1", back: "A1", status: "pending", source: "ai-full" },
    { id: "1-1", front: "Q2", back: "A2", status: "pending", source: "ai-full" },
  ];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} />);

  expect(screen.getByText(/Wygenerowano 2 fiszek/)).toBeInTheDocument();
});
```

#### Test 2: Licznik zatwierdzonych

```typescript
it("powinien pokazać licznik zatwierdzonych gdy approvedCount > 0", () => {
  const mockProposals = [
    { id: "1-0", front: "Q1", back: "A1", status: "approved", source: "ai-full" },
    { id: "1-1", front: "Q2", back: "A2", status: "pending", source: "ai-full" },
  ];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={1} />);

  expect(screen.getByText(/Zatwierdzono: 1/)).toBeInTheDocument();
});

it("nie powinien pokazać licznika gdy approvedCount = 0", () => {
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "pending", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={0} />);

  expect(screen.queryByText(/Zatwierdzono:/)).not.toBeInTheDocument();
});
```

---

### KROK 4.3: Przyciski zapisywania (2 testy)

#### Test 1: Ukrywanie przycisków

```typescript
it("nie powinien pokazać przycisków Zapisz gdy approvedCount = 0", () => {
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "pending", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={0} />);

  expect(screen.queryByRole("button", { name: /Zapisz/i })).not.toBeInTheDocument();
});
```

#### Test 2: Pokazywanie przycisków

```typescript
it("powinien pokazać 2 przyciski Zapisz gdy approvedCount > 0", () => {
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "approved", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={1} />);

  const saveButtons = screen.getAllByRole("button", { name: /Zapisz fiszki \(1\)/i });
  expect(saveButtons).toHaveLength(2); // Góra + dół
});

it("powinien pokazać Zapisywanie... podczas isSaving", () => {
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "approved", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={1} isSaving={true} />);

  expect(screen.getAllByText(/Zapisywanie.../i)).toHaveLength(2);
});

it("powinien wywołać onSave po kliknięciu przycisku", async () => {
  const mockOnSave = vi.fn();
  const mockProposals = [{ id: "1-0", front: "Q1", back: "A1", status: "approved", source: "ai-full" }];

  render(<FlashcardProposalList {...defaultProps} proposals={mockProposals} approvedCount={1} onSave={mockOnSave} />);

  const saveButton = screen.getAllByRole("button", { name: /Zapisz/i })[0];
  await userEvent.click(saveButton);

  expect(mockOnSave).toHaveBeenCalledTimes(1);
});
```

---

### Setup dla ETAPU 4

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardProposalList } from "@/components/generator/FlashcardProposalList";

// Mock child component
vi.mock("@/components/generator/FlashcardProposalCard", () => ({
  FlashcardProposalCard: ({ proposal }: any) => <div data-testid={`proposal-${proposal.id}`}>{proposal.front}</div>,
}));

describe("FlashcardProposalList", () => {
  const defaultProps = {
    proposals: [],
    isLoading: false,
    isSaving: false,
    onUpdateProposal: vi.fn(),
    onSetProposalStatus: vi.fn(),
    onSave: vi.fn(),
    approvedCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Testy tutaj...
});
```

---

## 🎯 ETAP 5: Integration Tests (Opcjonalny)

**Plik do utworzenia:** `tests/unit/components/generator/Generator.integration.test.tsx`  
**Szacowana liczba testów:** 2-3 testy  
**Priorytet:** 🔵 Niski (nice to have)  
**Czas realizacji:** ~30-45 minut

### Dlaczego niski priorytet?

- Pełny flow lepiej testować w E2E
- Jednostki już pokryte
- Wysokie koszty utrzymania

### Co testować?

#### Test: Pełny flow użytkownika

```typescript
it("powinien wykonać pełny flow: generuj → edytuj → zatwierdź → zapisz", async () => {
  // Mock API responses
  const mockGenerateResponse = { /* ... */ };
  const mockSaveResponse = { /* ... */ };

  // Render full component tree
  render(<GeneratorView />);

  // 1. Wpisz tekst
  const textarea = screen.getByPlaceholderText(/Wklej tutaj/i);
  await userEvent.type(textarea, "a".repeat(2000));

  // 2. Generuj
  await userEvent.click(screen.getByRole("button", { name: /Generuj/i }));
  await waitFor(() => expect(screen.getByText(/Propozycje fiszek/i)).toBeInTheDocument());

  // 3. Edytuj pierwszą fiszkę
  const editButtons = screen.getAllByTitle("Edytuj");
  await userEvent.click(editButtons[0]);

  const frontTextarea = screen.getAllByRole("textbox")[0];
  await userEvent.clear(frontTextarea);
  await userEvent.type(frontTextarea, "Edited question");

  await userEvent.click(screen.getByTitle("Zapisz"));

  // 4. Zatwierdź
  const approveButtons = screen.getAllByTitle("Zatwierdź");
  await userEvent.click(approveButtons[0]);

  // 5. Zapisz wszystkie
  await userEvent.click(screen.getByRole("button", { name: /Zapisz fiszki/i }));

  // Assert
  await waitFor(() => {
    expect(screen.queryByText(/Propozycje fiszek/i)).not.toBeInTheDocument(); // Reset
  });
});
```

---

## 📊 Podsumowanie planu

```
┌──────────────────────────────────────────────────────────────────┐
│  PLAN TESTOWANIA - GENERATOR FEATURE                            │
├──────────────────────────────────────────────────────────────────┤
│  ✅ ETAP 1: useGenerator.ts                     27 testów  DONE │
│  ⏳ ETAP 2: FlashcardProposalCard.tsx          10-12 testów     │
│  ⏳ ETAP 3: GenerationForm.tsx                  8-10 testów     │
│  ⏳ ETAP 4: FlashcardProposalList.tsx            6-8 testów     │
│  ⏸️  ETAP 5: Integration Tests (opcja)          2-3 testy      │
├──────────────────────────────────────────────────────────────────┤
│  📊 SUMA (bez Etapu 5):                        51-57 testów     │
│  📊 SUMA (z Etapem 5):                         53-60 testów     │
│                                                                  │
│  ⏱️  Szacowany czas realizacji:                                 │
│     ETAP 2: ~45-60 minut                                        │
│     ETAP 3: ~30-45 minut                                        │
│     ETAP 4: ~30-40 minut                                        │
│     ETAP 5: ~30-45 minut (opcjonalny)                           │
│  ═══════════════════════════════════════════════════════════════│
│     RAZEM: 2-3 godziny (bez Etapu 5)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Zalecenia implementacyjne

### Kolejność realizacji

1. **ETAP 2** → Zawiera najwięcej logiki UI
2. **ETAP 3** → Ważny dla UX (walidacja)
3. **ETAP 4** → Prosty, szybki win
4. **ETAP 5** → Tylko jeśli masz czas

### Best practices

- ✅ Testuj zachowanie, nie implementację
- ✅ Używaj `userEvent` zamiast `fireEvent`
- ✅ Mockuj tylko to co niezbędne
- ✅ Nazywaj testy opisowo
- ✅ Grupuj logicznie (`describe` blocks)

### Red flags - kiedy przerwać testowanie

- ❌ Testy UI łamią się przy każdej zmianie CSS
- ❌ Testy są dłuższe niż komponent
- ❌ Mockujesz więcej niż testujesz
- ❌ Testy nie dodają wartości biznesowej

---

## 📝 Instrukcje dla kontynuacji

Gdy będziesz gotowy kontynuować:

### Opcja A: Krok po kroku

```bash
# 1. Uruchom watch mode
npm run test:unit -- --watch

# 2. Powiedz: "Kontynuujemy ETAP 2 - Krok 2.1"
```

### Opcja B: Cały etap naraz

```bash
# Powiedz: "Zrób cały ETAP 2 naraz"
```

### Opcja C: Tylko konkretny test

```bash
# Powiedz: "Napisz test dla walidacji w FlashcardProposalCard"
```

---

## 🎉 Podsumowanie

**Masz już solidną podstawę** - 27 testów dla logiki biznesowej.

**Pozostałe etapy są opcjonalne**, ponieważ:

- Logika biznesowa (ETAP 1) to 80% wartości ✅
- Komponenty UI łatwiej testować E2E
- Częstsze zmiany UI = wyższe koszty utrzymania testów

**Rekomendacja:**

- MUST DO: ✅ ETAP 1 (DONE)
- SHOULD DO: ETAP 2-3 (jeśli masz czas)
- NICE TO HAVE: ETAP 4-5 (tylko dla kompletności)

---

_Dokument utworzony: Październik 2025_  
_Status: W trakcie planowania_
