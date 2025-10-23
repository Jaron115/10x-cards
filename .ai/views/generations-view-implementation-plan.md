# Plan implementacji widoku – Generator AI

## 1. Przegląd

Widok "Generator AI" jest kluczowym elementem aplikacji, umożliwiającym użytkownikom automatyczne tworzenie fiszek na podstawie dostarczonego tekstu. Użytkownik wkleja tekst źródłowy, inicjuje proces generowania, a następnie otrzymuje listę propozycji fiszek. Każdą propozycję można zatwierdzić, zmodyfikować bezpośrednio na liście lub odrzucić, a na końcu zapisać tylko zatwierdzone pozycje.

## 2. Routing widoku

- **Ścieżka:** `/app/generator`
- **Ochrona:** Wymagane uwierzytelnienie (obsługiwane przez middleware).

## 3. Struktura komponentów

Hierarchia komponentów zostanie zaktualizowana, aby umożliwić edycję w miejscu, eliminując potrzebę użycia modala.

```
- GeneratorView.tsx (Główny kontener widoku)
  - Toaster (Komponent do wyświetlania powiadomień)
  - GenerationForm.tsx (Formularz z polem tekstowym i przyciskiem generowania)
    - Textarea
    - Button ("Generuj fiszki")
  - FlashcardProposalList.tsx (Lista wygenerowanych propozycji)
    - Skeleton (Wyświetlany w trakcie ładowania)
    - FlashcardProposalCard.tsx (Karta pojedynczej propozycji z edycją inline)
      - Card (Komponent `shadcn/ui`)
      - Textarea (Edytowalny przód fiszki, widoczny w trybie edycji)
      - Textarea (Edytowalny tył fiszki, widoczny w trybie edycji)
      - IconButton (Zatwierdź)
      - IconButton (Edytuj / Zapisz zmiany)
      - IconButton (Odrzuć)
    - Button ("Zapisz zatwierdzone fiszki")
```

## 4. Szczegóły komponentów

### `GeneratorView.tsx`

- **Opis:** Główny kontener, który zarządza stanem za pomocą hooka `useGenerator` i koordynuje interakcje między komponentami.
- **Główne elementy:** `GenerationForm`, `FlashcardProposalList`.
- **Propsy:** Brak.

### `GenerationForm.tsx`

- **Opis:** Formularz do wprowadzania tekstu źródłowego.
- **Główne elementy:** `Textarea`, `Button` "Generuj fiszki", licznik znaków.
- **Warunki walidacji:** Przycisk "Generuj fiszki" jest nieaktywny, jeśli długość tekstu nie mieści się w zakresie 1000-10000 znaków.
- **Propsy:**
  ```typescript
  interface GenerationFormProps {
    sourceText: string;
    onSourceTextChange: (text: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    characterCount: number;
    isTextValid: boolean;
  }
  ```

### `FlashcardProposalList.tsx`

- **Opis:** Wyświetla listę propozycji fiszek. Umożliwia zapisanie wszystkich zatwierdzonych propozycji.
- **Główne elementy:** Mapa po `FlashcardProposalCard`, `Button` "Zapisz fiszki".
- **Warunki walidacji:** Przycisk zapisu jest nieaktywny, jeśli żadna propozycja nie jest zatwierdzona.
- **Propsy:**
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

### `FlashcardProposalCard.tsx`

- **Opis:** Karta prezentująca pojedynczą propozycję fiszki, obsługująca wewnętrzny stan edycji oraz akcje zatwierdzenia i odrzucenia.
- **Główne elementy:**
  - Tryb widoku: Wyświetla tekst `front` i `back`.
  - Tryb edycji: Wyświetla pola `Textarea` do edycji treści.
  - Trzy przyciski-ikony: "Zatwierdź", "Edytuj" (zmieniający się w "Zapisz" w trybie edycji) i "Odrzuć".
- **Stan wewnętrzny:** `isEditing: boolean`, lokalne stany dla edytowanych pól `front` i `back`.
- **Obsługiwane interakcje:**
  - Kliknięcie "Zatwierdź": Zmienia status fiszki na `approved`.
  - Kliknięcie "Edytuj": Włącza tryb edycji (`isEditing = true`).
  - Kliknięcie "Zapisz" (w trybie edycji): Zapisuje zmiany i zmienia `source` na `ai-edited`.
  - Kliknięcie "Odrzuć": Zmienia status na `rejected`, co wizualnie "wyszarza" kartę.
- **Propsy:**
  ```typescript
  interface FlashcardProposalCardProps {
    proposal: FlashcardProposalViewModel;
    onUpdateProposal: (updatedProposal: FlashcardProposalViewModel) => void;
    onSetProposalStatus: (id: string, status: FlashcardProposalViewModel["status"]) => void;
  }
  ```

## 5. Typy

`FlashcardProposalViewModel` zostanie zaktualizowany, aby przechowywać status każdej propozycji zamiast flagi `isSelected`.

```typescript
import type { FlashcardProposalDTO } from "../../types";

export interface FlashcardProposalViewModel extends FlashcardProposalDTO {
  /** Unikalny identyfikator po stronie klienta (np. UUID). */
  id: string;
  /** Status propozycji: oczekująca, zatwierdzona lub odrzucona. */
  status: "pending" | "approved" | "rejected";
  /** Źródło pochodzenia fiszki, aktualizowane po edycji. */
  source: "ai-full" | "ai-edited";
}
```

## 6. Zarządzanie stanem

Hook `useGenerator` będzie zarządzał stanem całego widoku, w tym listą propozycji i ich statusami.

- **Zarządzany stan:**
  - `proposals: FlashcardProposalViewModel[]`: Lista propozycji.
  - `status`: Stan ładowania (`idle`, `loading`, `saving`, `error`).
- **Funkcje zwrotne:**
  - `handleGenerateProposals`: Wywołuje API generowania.
  - `handleSaveProposals`: Filtruje propozycje ze statusem `approved` i wysyła je do API.
  - `handleSetProposalStatus`: Aktualizuje status (`approved`/`rejected`) dla danej propozycji.
  - `handleUpdateProposal`: Aktualizuje treść (`front`/`back`) propozycji po edycji.

## 7. Integracja API

- **`POST /api/generations`**: Bez zmian. Odpowiedź mapowana na `FlashcardProposalViewModel[]` z domyślnym statusem `pending`.
- **`POST /api/flashcards/bulk`**: Przed wysłaniem, lista propozycji jest filtrowana, aby zawierała tylko te ze statusem `approved`. Odrzucone (`rejected`) i oczekujące (`pending`) są ignorowane.

## 8. Interakcje użytkownika

- **Zatwierdzanie:** Kliknięcie ikony "Zatwierdź" zmienia status fiszki na `approved` i jej wygląd (np. zielona ramka).
- **Edycja:** Kliknięcie "Edytuj" przełącza kartę w tryb edycji z polami `Textarea`. Ikona "Edytuj" zmienia się w "Zapisz". Po zapisaniu zmian, status fiszki automatycznie zmienia się na `approved`, a `source` na `ai-edited`.
- **Odrzucanie:** Kliknięcie "Odrzuć" zmienia status na `rejected`, co powoduje wizualne wyszarzenie karty i wyłączenie na niej dalszych akcji. Odrzucone fiszki nie są wysyłane do zapisu.
- **Zapisywanie:** Kliknięcie "Zapisz zatwierdzone fiszki" wysyła tylko te propozycje, które mają status `approved`.

## 9. Warunki i walidacja

- **Długość tekstu źródłowego:** Walidacja w `GenerationForm` (1000-10000 znaków) pozostaje bez zmian.
- **Edycja fiszki:** Front ma walidacje 200 znaków, a Back ma walidacje do 500 znaków.
- **Zatwierdzone fiszki:** Przycisk "Zapisz zatwierdzone fiszki" jest aktywny tylko wtedy, gdy co najmniej jedna fiszka ma status `approved`.

## 10. Obsługa błędów

Pozostaje bez zmian – błędy API będą komunikowane za pomocą komponentu `Toast`.

## 11. Kroki implementacji

1.  **Struktura plików:** Utworzenie folderu i plików dla komponentów w `src/components/generator/`.
2.  **Strona Astro:** Utworzenie strony w `src/pages/app/generator.astro` i osadzenie w niej `GeneratorView.tsx`.
3.  **Aktualizacja typów:** Zmiana definicji `FlashcardProposalViewModel`, aby zawierała pole `status`.
4.  **Komponent `FlashcardProposalCard`:** Implementacja logiki przełączania między trybem widoku a edycji, obsługi ikon i stanu wewnętrznego.
5.  **Komponent `FlashcardProposalList`:** Implementacja logiki wyświetlania listy i przycisku zapisu.
6.  **Custom Hook `useGenerator`:** Implementacja zaktualizowanej logiki zarządzania stanem propozycji (statusy, aktualizacja treści).
7.  **Integracja API:** Podłączenie wywołań API do hooka, w tym filtrowanie zatwierdzonych fiszek przed wysłaniem.
8.  **Obsługa błędów i ładowania:** Implementacja wizualnych wskaźników ładowania (`Skeleton`) i obsługa błędów przez `Toast`.
9.  **Testowanie manualne:** Weryfikacja całego przepływu: generowanie, zatwierdzanie, edycja, odrzucanie i zapisywanie, włączając przypadki brzegowe.
10. **Finalizacja:** Przegląd kodu i dopracowanie stylów oraz dostępności.
