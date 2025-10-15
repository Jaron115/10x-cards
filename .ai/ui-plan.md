# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10x-cards została zaprojektowana w celu zapewnienia płynnego, intuicyjnego i responsywnego doświadczenia użytkownika. Aplikacja jest podzielona na dwie główne części:

1.  **Widoki publiczne:** Dostępne dla niezalogowanych użytkowników, skupiające się na prezentacji aplikacji oraz umożliwieniu rejestracji i logowania.
2.  **Widoki chronione (aplikacja):** Dostępne tylko dla zalogowanych użytkowników, zorganizowane wokół bocznego panelu nawigacyjnego (Sidebar), który zapewnia dostęp do wszystkich kluczowych funkcji, takich jak generator fiszek AI, zarządzanie fiszkami i sesje nauki.

Główne założenia architektury opierają się na podejściu "mobile-first" z wykorzystaniem Tailwind CSS, spójności wizualnej dzięki bibliotece komponentów Shadcn/ui oraz optymalizacji interakcji poprzez techniki "optimistic UI". Zarządzanie stanem globalnym (sesja użytkownika) będzie realizowane przez Zustand, a formularze przez React Hook Form, co zapewni solidne podstawy do walidacji i obsługi błędów.

## 2. Lista widoków

### Widok 1: Strona główna / Logowanie (Publiczny)

- **Nazwa widoku:** Dashboard
- **Ścieżka widoku:** `/`
- **Główny cel:** Umożliwienie nowym użytkownikom rejestracji, a powracającym zalogowania się do aplikacji.
- **Kluczowe informacje do wyświetlenia:** Krótki opis aplikacji, formularz logowania, formularz rejestracji.
- **Kluczowe komponenty widoku:**
  - `Card`: Obudowa dla formularzy.
  - `Tabs`: Przełącznik między formularzem logowania a rejestracji.
  - `Input`: Pola na e-mail i hasło.
  - `Button`: Przyciski do logowania, rejestracji.
  - `Alert`: Komponent do wyświetlania błędów (np. "Nieprawidłowe dane logowania").
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasny i prosty interfejs skupiony na jednej akcji (logowanie/rejestracja). Walidacja pól formularza w czasie rzeczywistym.
  - **Dostępność:** Poprawne etykiety dla pól formularzy, obsługa nawigacji klawiaturą, odpowiedni kontrast.
  - **Bezpieczeństwo:** Komunikacja z API przez HTTPS. Hasła nie są przechowywane w stanie aplikacji.

### Widok 2: Generator AI (Chroniony)

- **Nazwa widoku:** Generator AI
- **Ścieżka widoku:** `/app/generator`
- **Główny cel:** Umożliwienie użytkownikowi wygenerowania propozycji fiszek na podstawie wklejonego tekstu.
- **Kluczowe informacje do wyświetlenia:** Pole tekstowe na treść źródłową, przycisk do generowania, stan ładowania, lista wygenerowanych propozycji fiszek, komunikaty o błędach.
- **Kluczowe komponenty widoku:**
  - `Textarea`: Duże pole do wklejenia tekstu źródłowego.
  - `Button`: Przyciski "Generuj" oraz "Zapisz zaznaczone fiszki" lub "Zapisz wszystkie fiszki.
  - `Progress` lub `Skeleton`: Wskaźnik ładowania podczas komunikacji z API.
  - `Card`: Komponent dla każdej propozycji fiszki z opcjami edycji, akceptacji i odrzucenia.
  - `Dialog` (Modal): Do edycji treści pojedynczej propozycji przed zapisaniem.
  - `Toast`: Do wyświetlania powiadomień o sukcesie lub błędzie.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Blokowanie interfejsu podczas generowania, aby zapobiec wielokrotnemu wysyłaniu. Wyraźne oddzielenie propozycji od zapisanych fiszek. Licznik znaków w polu `Textarea` z informacją o minimalnych/maksymalnych wymaganiach.
  - **Dostępność:** Dostępność wszystkich interaktywnych elementów (przyciski, edycja) z klawiatury. Komunikaty o stanie ładowania dostępne dla czytników ekranu.
  - **Bezpieczeństwo:** Widok chroniony przez middleware, dostępny tylko dla zalogowanych użytkowników.

### Widok 3: Moje fiszki (Chroniony)

- **Nazwa widoku:** Moje fiszki
- **Ścieżka widoku:** `/app/flashcards`
- **Główny cel:** Przeglądanie, edytowanie i usuwanie wszystkich zapisanych fiszek.
- **Kluczowe informacje do wyświetlenia:** Lista fiszek (przód, tył), informacje o źródle (`manual`, `ai-full`, `ai-edited`), data utworzenia/modyfikacji.
- **Kluczowe komponenty widoku:**
  - `Table` lub `Card List`: Do wyświetlania listy fiszek.
  - `Pagination`: Kontrolki do nawigacji między stronami listy.
  - `DropdownMenu` / `Select`: Do sortowania i filtrowania listy.
  - `Button`: Przyciski do edycji i usuwania fiszek.
  - `AlertDialog`: Modal do potwierdzenia operacji usunięcia fiszki.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Stan pusty (gdy użytkownik nie ma jeszcze fiszek) z zachętą do ich stworzenia. Zastosowanie "optimistic UI" przy usuwaniu fiszki. Płynne ładowanie danych z paginacją.
  - **Dostępność:** Tabela z odpowiednimi nagłówkami, możliwość nawigacji po liście i interakcjach za pomocą klawiatury.
  - **Bezpieczeństwo:** Widok chroniony, zapytania do API zawsze zawierają kontekst użytkownika, aby uniemożliwić dostęp do danych innych osób.

### Widok 4: Dodaj swoją fiszkę (Chroniony)

- **Nazwa widoku:** Dodaj fiszkę
- **Ścieżka widoku:** `/app/flashcards/new`
- **Główny cel:** Ręczne tworzenie nowej fiszki.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na przód (pytanie) i tył (odpowiedź) fiszki.
- **Kluczowe komponenty widoku:**
  - `Card`: Obudowa dla formularza.
  - `Input` / `Textarea`: Pola formularza.
  - `Button`: Przycisk "Zapisz".
  - `Form validation messages`: Komunikaty o błędach walidacji (np. "Pole nie może być puste").
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Prosty, jednoznaczny formularz. Po zapisaniu, użytkownik jest przekierowywany do listy "Moje fiszki".
  - **Dostępność:** Poprawne etykiety i obsługa walidacji zgodna z a11y.
  - **Bezpieczeństwo:** Widok chroniony.

### Widok 5: Edytuj fiszkę (Chroniony)

- **Nazwa widoku:** Edytuj fiszkę
- **Ścieżka widoku:** `/app/flashcards/:id/edit`
- **Główny cel:** Modyfikacja istniejącej fiszki.
- **Kluczowe informacje do wyświetlenia:** Formularz identyczny jak w widoku "Dodaj fiszkę", wypełniony danymi edytowanej fiszki.
- **Kluczowe komponenty widoku:**
  - `Card`, `Input` / `Textarea`, `Button`, `Form validation messages`.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po zapisaniu zmian, użytkownik jest przekierowywany z powrotem do listy "Moje fiszki".
  - **Dostępność:** Standardy dostępności dla formularzy.
  - **Bezpieczeństwo:** Widok chroniony. Aplikacja musi zweryfikować, czy fiszka o danym `:id` należy do zalogowanego użytkownika.

### Widok 6: Sesja nauki (Chroniony)

- **Nazwa widoku:** Sesja nauki
- **Ścieżka widoku:** `/app/study`
- **Główny cel:** Przeprowadzenie sesji nauki z wykorzystaniem algorytmu powtórek (w MVP widok może być uproszczony).
- **Kluczowe informacje do wyświetlenia:** Przód fiszki, a po interakcji – tył fiszki. Przyciski do oceny znajomości odpowiedzi.
- **Kluczowe komponenty widoku:**
  - `Card`: Do wyświetlania aktualnej fiszki (przód/tył).
  - `Button`: Przyciski "Pokaż odpowiedź" oraz przyciski oceny (np. "Trudne", "Dobre", "Łatwe").
  - `Progress`: Pasek postępu sesji.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Minimalistyczny interfejs skupiony na nauce, bez zbędnych rozpraszaczy. Płynne animacje odwracania karty.
  - **Dostępność:** Obsługa za pomocą klawiatury jest kluczowa dla szybkiej nauki.
  - **Bezpieczeństwo:** Widok chroniony.

### Widok 7: Konto (Chroniony)

- **Nazwa widoku:** Moje konto
- **Ścieżka widoku:** `/app/account`
- **Główny cel:** Zarządzanie kontem użytkownika, w tym jego usunięcie.
- **Kluczowe informacje do wyświetlenia:** Adres e-mail użytkownika, przycisk do usunięcia konta.
- **Kluczowe komponenty widoku:**
  - `Card`: Do wyświetlania informacji o koncie.
  - `Button`: Przycisk "Usuń konto".
  - `AlertDialog`: Modal do potwierdzenia usunięcia konta.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Operacja usunięcia konta jest nieodwracalna, dlatego wymaga jednoznacznego potwierdzenia w modalu.
  - **Dostępność:** Standardowa dostępność dla przycisków i modali.
  - **Bezpieczeństwo:** Widok chroniony. Operacja usunięcia konta wymaga potwierdzenia i jest zabezpieczona po stronie API.

## 3. Mapa podróży użytkownika

**Główny przepływ: Generowanie, weryfikacja i zapis fiszek AI**

1.  **Start (Użytkownik niezalogowany):**
    - Użytkownik ląduje na **Stronie głównej / Logowanie** (`/`).
    - Wypełnia formularz rejestracji lub logowania.

2.  **Logowanie i przekierowanie:**
    - Po pomyślnym zalogowaniu, użytkownik jest przekierowywany do **Generatora AI** (`/app/generator`).

3.  **Generowanie fiszek:**
    - W widoku **Generatora AI**, użytkownik wkleja tekst do pola tekstowego i klika "Generuj".
    - Interfejs wyświetla stan ładowania.

4.  **Weryfikacja propozycji:**
    - Po otrzymaniu odpowiedzi z API, na ekranie pojawia się lista propozycji fiszek.
    - Użytkownik przegląda propozycje. Może:
      - **Edytować** propozycję (otwiera się modal).
      - **Odrzucić** propozycję (jest ona usuwana z listy).
      - **Zaakceptować** (pozostaje na liście do zapisu).

5.  **Zapis fiszek:**
    - Po zakończeniu weryfikacji, użytkownik klika "Zapisz".
    - Aplikacja wysyła zaakceptowane i zmodyfikowane fiszki do API.

6.  **Zakończenie:**
    - Po pomyślnym zapisie, użytkownik widzi komunikat "toast" o sukcesie.
    - Zostaje przekierowany do widoku **Moje fiszki** (`/app/flashcards`), gdzie widzi nowo dodane pozycje.

## 4. Układ i struktura nawigacji

- **Layout publiczny:**
  - Prosty układ bez nawigacji, skupiony na komponencie logowania/rejestracji.
- **Layout chroniony (`/app/*`):**
  - Dwukolumnowy układ:
    - **Lewa kolumna (Sidebar):** Stały panel nawigacyjny z linkami do wszystkich chronionych widoków: "Generator AI", "Moje fiszki", "Dodaj swoją fiszkę", "Sesja nauki", "Konto". Na dole znajduje się przycisk "Wyloguj".
    - **Prawa kolumna (Content Area):** Główna przestrzeń, w której renderowane są treści wybranego widoku.

Nawigacja jest spójna i zawsze dostępna dla zalogowanego użytkownika, co ułatwia przełączanie się między kluczowymi funkcjami aplikacji.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów (zgodnych z Shadcn/ui), które będą stanowić podstawę interfejsu:

- **`Sidebar`:** Główny komponent nawigacyjny dla zalogowanych użytkowników.
- **`Button`:** Standardowy przycisk do różnych akcji.
- **`Card`:** Kontener do grupowania powiązanych treści (np. pojedyncza fiszka, formularz).
- **`Input` / `Textarea`:** Podstawowe pola do wprowadzania tekstu w formularzach.
- **`Dialog` / `AlertDialog`:** Modale do interakcji wymagających skupienia (edycja) lub potwierdzenia (usuwanie).
- **`Toast`:** Dyskretne powiadomienia o stanie operacji (sukces, błąd).
- `Table`: Do prezentacji danych tabelarycznych (np. lista fiszek).
- **`Pagination`:** Komponent do nawigacji po podzielonych na strony listach.
- **`Skeleton` / `Progress`:** Wskaźniki stanu ładowania.
