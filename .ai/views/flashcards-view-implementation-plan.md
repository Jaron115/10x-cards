# Plan implementacji widoku Fiszki

## 1. Przegląd

Moduł "Moje fiszki" składa się z trzech powiązanych widoków umożliwiających pełne zarządzanie fiszkami edukacyjnymi. Główny widok to lista wszystkich fiszek użytkownika z możliwością paginacji, filtrowania i sortowania. Użytkownik może przeglądać, edytować i usuwać swoje fiszki. Dodatkowe widoki umożliwiają ręczne tworzenie nowych fiszek oraz edycję istniejących.

Kluczowe funkcjonalności:

- Wyświetlanie paginowanej listy fiszek w formacie kart
- Filtrowanie fiszek według źródła (manual, ai-full, ai-edited)
- Sortowanie fiszek (według daty utworzenia lub modyfikacji)
- Tworzenie nowych fiszek ręcznie
- Edycja istniejących fiszek
- Usuwanie fiszek z potwierdzeniem
- Stan pusty z zachętą do utworzenia pierwszej fiszki
- Optimistic UI przy operacji usuwania
- Pełna dostępność klawiatury i czytników ekranu

## 2. Routing widoku

Moduł składa się z trzech ścieżek:

1. **Lista fiszek**: `/app/flashcards`
   - Główny widok z listą wszystkich fiszek użytkownika
   - Parametry URL query: `page`, `limit`, `source`, `sort`, `order`
2. **Dodaj fiszkę**: `/app/flashcards/new`
   - Formularz tworzenia nowej fiszki
3. **Edytuj fiszkę**: `/app/flashcards/[id]/edit`
   - Formularz edycji istniejącej fiszki
   - Parametr URL: `id` - identyfikator edytowanej fiszki

Wszystkie trzy widoki są chronione i wymagają uwierzytelnienia (middleware sprawdza sesję użytkownika).

## 3. Struktura komponentów

```
FlashcardListPage (/app/flashcards)
└── FlashcardListView (React)
    ├── Header
    │   ├── Title
    │   └── CreateButton
    ├── FlashcardListControls (React)
    │   ├── SourceFilter (Select)
    │   ├── SortSelect (Select)
    │   └── PaginationControls
    └── FlashcardGrid (React)
        ├── EmptyState (conditional)
        └── FlashcardCard (repeated)
            ├── CardHeader (front, source badge)
            ├── CardContent (back)
            ├── CardFooter (dates, actions)
            └── DeleteConfirmDialog

FlashcardNewPage (/app/flashcards/new)
└── FlashcardFormView (React)
    └── FlashcardForm (React)
        ├── Header
        ├── Card
        │   ├── Input (front)
        │   ├── Textarea (back)
        │   └── CharacterCounters
        └── Actions
            ├── CancelButton
            └── SaveButton

FlashcardEditPage (/app/flashcards/[id]/edit)
└── FlashcardFormView (React)
    └── FlashcardForm (React)
        ├── Header
        ├── Card
        │   ├── Input (front)
        │   ├── Textarea (back)
        │   └── CharacterCounters
        └── Actions
            ├── CancelButton
            └── SaveButton
```

## 4. Szczegóły komponentów

### 4.1 FlashcardListView (główny kontener)

**Opis:**
Główny komponent React dla widoku listy fiszek. Zarządza stanem całego widoku, w tym listą fiszek, paginacją, filtrowaniem i sortowaniem. Odpowiada za koordynację wszystkich operacji CRUD oraz synchronizację z URL query params.

**Główne elementy:**

```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  <Toaster />
  <Header />
  <FlashcardListControls />
  <FlashcardGrid />
  <DeleteConfirmDialog />
</div>
```

**Obsługiwane interakcje:**

- Zmiana strony paginacji
- Zmiana filtra źródła fiszek
- Zmiana sortowania
- Kliknięcie przycisku "Dodaj fiszkę"
- Kliknięcie przycisku "Edytuj" na fiszce
- Kliknięcie przycisku "Usuń" na fiszce
- Potwierdzenie usunięcia w dialogu

**Walidacja:**

- Brak walidacji na poziomie tego komponentu (walidacja jest w formularzu tworzenia/edycji)

**Typy:**

- `FlashcardDTO[]` - lista fiszek
- `PaginationDTO` - metadane paginacji
- `GetFlashcardsQueryDTO` - parametry zapytania
- `FlashcardListViewModel` - view model stanu widoku

**Propsy:**
Brak (komponent główny, nie przyjmuje propsów)

---

### 4.2 FlashcardListControls

**Opis:**
Komponent zawierający kontrolki filtrowania, sortowania i paginacji. Synchronizuje wybrane opcje z URL query params i przekazuje zmiany do komponentu nadrzędnego.

**Główne elementy:**

```tsx
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <div className="flex gap-2 flex-wrap">
    <Select> {/* Source Filter */}
    <Select> {/* Sort By */}
    <Select> {/* Order */}
  </div>
  <div className="ml-auto">
    <Pagination /> {/* Shadcn/ui Pagination */}
  </div>
</div>
```

**Obsługiwane interakcje:**

- `onFilterChange(source: FlashcardSource | "all")` - zmiana filtra źródła
- `onSortChange(field: "created_at" | "updated_at", order: "asc" | "desc")` - zmiana sortowania
- `onPageChange(page: number)` - zmiana strony

**Walidacja:**

- Numer strony musi być >= 1 i <= total_pages
- Limit musi być w zakresie 1-100
- Source może być jedną z wartości: "all", "manual", "ai-full", "ai-edited"

**Typy:**

- `GetFlashcardsQueryDTO` - parametry zapytania
- `PaginationDTO` - metadane paginacji

**Propsy:**

```typescript
interface FlashcardListControlsProps {
  queryParams: GetFlashcardsQueryDTO;
  pagination: PaginationDTO;
  onFilterChange: (source: FlashcardSource | "all") => void;
  onSortChange: (field: "created_at" | "updated_at", order: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
}
```

---

### 4.3 FlashcardGrid

**Opis:**
Komponent odpowiedzialny za wyświetlanie listy fiszek w formacie siatki kart. Pokazuje stan pusty, gdy brak fiszek, oraz skeleton loader podczas ładowania.

**Główne elementy:**

```tsx
{
  isLoading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton /> {/* Repeat 6 times */}
    </div>
  ) : flashcards.length === 0 ? (
    <EmptyState />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((flashcard) => (
        <FlashcardCard key={flashcard.id} flashcard={flashcard} />
      ))}
    </div>
  );
}
```

**Obsługiwane interakcje:**

- Przekazuje zdarzenia edit/delete z kart do komponentu nadrzędnego

**Walidacja:**
Brak

**Typy:**

- `FlashcardDTO[]` - lista fiszek

**Propsy:**

```typescript
interface FlashcardGridProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onEdit: (id: number) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}
```

---

### 4.4 FlashcardCard

**Opis:**
Komponent reprezentujący pojedynczą fiszkę w formie karty. Wyświetla przód, tył, źródło, daty oraz przyciski akcji (edytuj, usuń).

**Główne elementy:**

```tsx
<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <CardTitle className="text-lg">{front}</CardTitle>
      <Badge>{sourceLabel}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">{back}</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <div className="text-xs text-muted-foreground">
      <div>Utworzono: {formatDate(created_at)}</div>
      {updated_at !== created_at && <div>Edytowano: {formatDate(updated_at)}</div>}
    </div>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={handleEdit}>
        Edytuj
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDelete}>
        Usuń
      </Button>
    </div>
  </CardFooter>
</Card>
```

**Obsługiwane interakcje:**

- `onEdit()` - kliknięcie przycisku edycji
- `onDelete()` - kliknięcie przycisku usunięcia

**Walidacja:**
Brak

**Typy:**

- `FlashcardDTO` - dane fiszki

**Propsy:**

```typescript
interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: (id: number) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}
```

---

### 4.5 EmptyState

**Opis:**
Komponent wyświetlany, gdy użytkownik nie ma jeszcze żadnych fiszek. Zachęca do utworzenia pierwszej fiszki lub wygenerowania ich przy pomocy AI.

**Główne elementy:**

```tsx
<div className="text-center py-16 px-4">
  <div className="mb-6">
    <svg className="w-24 h-24 mx-auto text-muted-foreground/50" />
  </div>
  <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych fiszek</h2>
  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
    Stwórz swoją pierwszą fiszkę ręcznie lub wygeneruj zestaw fiszek przy pomocy AI
  </p>
  <div className="flex gap-4 justify-center">
    <Button onClick={handleCreateManual}>Dodaj fiszkę</Button>
    <Button variant="outline" onClick={handleNavigateToGenerator}>
      Użyj generatora AI
    </Button>
  </div>
</div>
```

**Obsługiwane interakcje:**

- `onCreateManual()` - nawigacja do /app/flashcards/new
- `onNavigateToGenerator()` - nawigacja do /app/generator

**Walidacja:**
Brak

**Typy:**
Brak

**Propsy:**

```typescript
interface EmptyStateProps {
  onCreateManual: () => void;
  onNavigateToGenerator: () => void;
}
```

---

### 4.6 DeleteConfirmDialog

**Opis:**
Dialog potwierdzenia usunięcia fiszki. Wykorzystuje komponent AlertDialog z Shadcn/ui.

**Główne elementy:**

```tsx
<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
      <AlertDialogDescription>Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Anuluj</AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm}>Usuń</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Obsługiwane interakcje:**

- `onConfirm()` - potwierdzenie usunięcia
- `onCancel()` / `onOpenChange(false)` - anulowanie

**Walidacja:**
Brak

**Typy:**

- `FlashcardDTO | null` - fiszka do usunięcia

**Propsy:**

```typescript
interface DeleteConfirmDialogProps {
  flashcard: FlashcardDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
```

---

### 4.7 FlashcardFormView (kontener formularza)

**Opis:**
Główny komponent React dla widoków tworzenia i edycji fiszki. Zarządza stanem formularza, walidacją i operacjami zapisu. Działa w dwóch trybach: "create" (nowa fiszka) i "edit" (edycja istniejącej).

**Główne elementy:**

```tsx
<div className="container mx-auto px-4 py-8 max-w-2xl">
  <Toaster />
  <FlashcardForm
    mode={mode}
    initialData={flashcard}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    isLoading={isLoading}
    validationErrors={validationErrors}
  />
</div>
```

**Obsługiwane interakcje:**

- Submit formularza (utworzenie lub aktualizacja fiszki)
- Anulowanie (powrót do listy)

**Walidacja:**

- front: wymagane, max 200 znaków
- back: wymagane, max 500 znaków

**Typy:**

- `FlashcardDTO | null` - dane fiszki (dla trybu edit)
- `CreateFlashcardCommand` - dane do utworzenia
- `UpdateFlashcardCommand` - dane do aktualizacji
- `FlashcardFormViewModel` - view model stanu formularza

**Propsy:**

```typescript
interface FlashcardFormViewProps {
  mode: "create" | "edit";
  flashcardId?: number; // Required for edit mode
}
```

---

### 4.8 FlashcardForm

**Opis:**
Formularz tworzenia/edycji fiszki. Zawiera pola na przód i tył fiszki z licznikami znaków, walidacją w czasie rzeczywistym i komunikatami błędów.

**Główne elementy:**

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>{mode === "create" ? "Dodaj nową fiszkę" : "Edytuj fiszkę"}</CardTitle>
      <CardDescription>
        {mode === "create" ? "Stwórz własną fiszkę do nauki" : "Wprowadź zmiany w treści fiszki"}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="front">Przód fiszki</Label>
        <Input
          id="front"
          value={front}
          onChange={handleFrontChange}
          placeholder="Pytanie lub pojęcie"
          maxLength={200}
          aria-invalid={!!errors.front}
          aria-describedby={errors.front ? "front-error" : undefined}
        />
        <div className="flex justify-between text-xs">
          <span id="front-error" className="text-destructive">
            {errors.front}
          </span>
          <span className={frontCharCount > 200 ? "text-destructive" : "text-muted-foreground"}>
            {frontCharCount}/200
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="back">Tył fiszki</Label>
        <Textarea
          id="back"
          value={back}
          onChange={handleBackChange}
          placeholder="Odpowiedź lub definicja"
          rows={4}
          maxLength={500}
          aria-invalid={!!errors.back}
          aria-describedby={errors.back ? "back-error" : undefined}
        />
        <div className="flex justify-between text-xs">
          <span id="back-error" className="text-destructive">
            {errors.back}
          </span>
          <span className={backCharCount > 500 ? "text-destructive" : "text-muted-foreground"}>
            {backCharCount}/500
          </span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Anuluj
      </Button>
      <Button type="submit" disabled={isLoading || !isValid}>
        {isLoading ? "Zapisywanie..." : "Zapisz"}
      </Button>
    </CardFooter>
  </Card>
</form>
```

**Obsługiwane interakcje:**

- `onChange` dla pól front i back - aktualizacja wartości i walidacja
- `onSubmit` - wysłanie formularza
- `onCancel` - anulowanie i powrót do listy

**Walidacja:**

- front:
  - Wymagane (nie może być puste)
  - Maksymalnie 200 znaków
  - Walidacja w czasie rzeczywistym (on change)
  - Walidacja przy blur
  - Walidacja przy submit
- back:
  - Wymagane (nie może być puste)
  - Maksymalnie 500 znaków
  - Walidacja w czasie rzeczywistym (on change)
  - Walidacja przy blur
  - Walidacja przy submit

**Typy:**

- `FlashcardDTO | null` - początkowe dane (dla trybu edit)
- `CreateFlashcardCommand` - dane do utworzenia
- `UpdateFlashcardCommand` - dane do aktualizacji
- `ValidationErrors` - obiekt z błędami walidacji

**Propsy:**

```typescript
interface FlashcardFormProps {
  mode: "create" | "edit";
  initialData?: FlashcardDTO;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  validationErrors?: Record<string, string>;
}
```

## 5. Typy

### 5.1 Istniejące typy (już zdefiniowane w types.ts)

```typescript
// DTO dla fiszki (odpowiedź z API)
export type FlashcardDTO = Omit<FlashcardEntity, "user_id">;

// Komenda utworzenia fiszki
export interface CreateFlashcardCommand {
  front: string; // Max 200 characters
  back: string; // Max 500 characters
}

// Komenda aktualizacji fiszki
export interface UpdateFlashcardCommand {
  front?: string; // Optional, max 200 characters
  back?: string; // Optional, max 500 characters
  source?: "ai-edited" | "manual"; // Optional
}

// Parametry zapytania dla listy fiszek
export interface GetFlashcardsQueryDTO {
  page?: number; // Default: 1
  limit?: number; // Default: 50, max: 100
  source?: FlashcardSource; // Filter: "manual" | "ai-full" | "ai-edited"
  sort?: "created_at" | "updated_at"; // Default: "created_at"
  order?: "asc" | "desc"; // Default: "desc"
}

// Odpowiedź dla listy fiszek
export interface GetFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

// Metadane paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Typy źródła fiszki
export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

// Wrapper odpowiedzi API
export interface ApiResponseDTO<T> {
  success: true;
  data: T;
}

// Błąd API
export interface ApiErrorDTO {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### 5.2 Nowe typy View Model (do dodania w types.ts)

```typescript
/**
 * View Model dla widoku listy fiszek
 * Reprezentuje kompletny stan widoku z listą fiszek, paginacją i kontrolkami
 */
export interface FlashcardListViewModel {
  // Lista fiszek do wyświetlenia
  flashcards: FlashcardDTO[];

  // Metadane paginacji
  pagination: PaginationDTO;

  // Aktualne parametry zapytania (filtry, sortowanie, strona)
  queryParams: GetFlashcardsQueryDTO;

  // Stan ładowania danych
  isLoading: boolean;

  // Komunikat błędu (jeśli wystąpił)
  error: string | null;

  // Fiszka oczekująca na usunięcie (dla dialogu potwierdzenia)
  flashcardToDelete: FlashcardDTO | null;
}

/**
 * View Model dla formularza fiszki (tworzenie/edycja)
 * Reprezentuje stan formularza z danymi, błędami i statusem operacji
 */
export interface FlashcardFormViewModel {
  // Tryb formularza
  mode: "create" | "edit";

  // Dane fiszki (wypełnione w trybie edit, puste w trybie create)
  flashcard: {
    front: string;
    back: string;
  };

  // Stan zapisywania
  isLoading: boolean;

  // Błąd ogólny (np. błąd sieci)
  error: string | null;

  // Błędy walidacji dla poszczególnych pól
  validationErrors: {
    front?: string;
    back?: string;
  };

  // Czy formularz jest poprawny (można zapisać)
  isValid: boolean;
}

/**
 * Typ dla akcji związanych z fiszkami
 * Używany przez hook useFlashcardMutations
 */
export interface FlashcardMutations {
  createFlashcard: (data: CreateFlashcardCommand) => Promise<FlashcardDTO>;
  updateFlashcard: (id: number, data: UpdateFlashcardCommand) => Promise<FlashcardDTO>;
  deleteFlashcard: (id: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

### 5.3 Typy pomocnicze

```typescript
/**
 * Typ dla funkcji formatowania daty
 */
export type DateFormatter = (date: string) => string;

/**
 * Etykiety dla źródeł fiszek (do wyświetlenia w UI)
 */
export const FLASHCARD_SOURCE_LABELS: Record<FlashcardSource, string> = {
  manual: "Ręczna",
  "ai-full": "AI",
  "ai-edited": "AI (edytowana)",
};

/**
 * Opcje dla filtra źródła
 */
export interface SourceFilterOption {
  value: FlashcardSource | "all";
  label: string;
}

export const SOURCE_FILTER_OPTIONS: SourceFilterOption[] = [
  { value: "all", label: "Wszystkie" },
  { value: "manual", label: "Ręczne" },
  { value: "ai-full", label: "AI" },
  { value: "ai-edited", label: "AI (edytowane)" },
];

/**
 * Opcje dla sortowania
 */
export interface SortOption {
  field: "created_at" | "updated_at";
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { field: "created_at", label: "Data utworzenia" },
  { field: "updated_at", label: "Data modyfikacji" },
];
```

## 6. Zarządzanie stanem

### 6.1 Widok listy fiszek - Custom Hook: useFlashcardList

Stan widoku listy fiszek jest zarządzany przez custom hook `useFlashcardList`, który:

- Synchronizuje parametry zapytania z URL (query params)
- Pobiera listę fiszek z API
- Obsługuje paginację, filtrowanie i sortowanie
- Zarządza operacją usuwania z optimistic UI

```typescript
/**
 * Hook zarządzający stanem widoku listy fiszek
 * Synchronizuje query params z URL i pobiera dane z API
 */
function useFlashcardList() {
  // Routing - parsowanie i aktualizacja URL query params
  const [searchParams, setSearchParams] = useSearchParams();

  // Parsowanie parametrów z URL (z wartościami domyślnymi)
  const queryParams: GetFlashcardsQueryDTO = useMemo(
    () => ({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
      source: (searchParams.get("source") as FlashcardSource) || undefined,
      sort: (searchParams.get("sort") as "created_at" | "updated_at") || "created_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
    }),
    [searchParams]
  );

  // Stan listy fiszek
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stan dialogu usuwania
  const [flashcardToDelete, setFlashcardToDelete] = useState<FlashcardDTO | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Pobieranie fiszek z API
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = new URLSearchParams(
        Object.entries(queryParams)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();

      const response = await fetch(`/api/flashcards?${queryString}`);

      if (!response.ok) {
        throw new Error("Błąd podczas pobierania fiszek");
      }

      const data: ApiResponseDTO<GetFlashcardsResponseDTO> = await response.json();
      setFlashcards(data.data.flashcards);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
      toast.error("Nie udało się pobrać fiszek");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  // Pobierz dane przy montowaniu i zmianie parametrów
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Aktualizacja query params w URL
  const updateQueryParams = useCallback(
    (updates: Partial<GetFlashcardsQueryDTO>) => {
      const newParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  // Handlery dla kontrolek
  const handleFilterChange = useCallback(
    (source: FlashcardSource | "all") => {
      updateQueryParams({
        source: source === "all" ? undefined : source,
        page: 1, // Reset do pierwszej strony przy zmianie filtra
      });
    },
    [updateQueryParams]
  );

  const handleSortChange = useCallback(
    (field: "created_at" | "updated_at", order: "asc" | "desc") => {
      updateQueryParams({ sort: field, order });
    },
    [updateQueryParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateQueryParams({ page });
    },
    [updateQueryParams]
  );

  // Usuwanie fiszki z optimistic UI
  const handleDeleteFlashcard = useCallback(async () => {
    if (!flashcardToDelete) return;

    const flashcardId = flashcardToDelete.id;
    const originalFlashcards = [...flashcards];

    // Optimistic update - usuń z UI natychmiast
    setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
    setIsDeleteDialogOpen(false);
    setFlashcardToDelete(null);

    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania fiszki");
      }

      toast.success("Fiszka została usunięta");

      // Odśwież dane, aby zaktualizować paginację
      fetchFlashcards();
    } catch (err) {
      // Przywróć fiszkę przy błędzie
      setFlashcards(originalFlashcards);
      toast.error("Nie udało się usunąć fiszki");
    }
  }, [flashcardToDelete, flashcards, fetchFlashcards]);

  // Handler dla otwierania dialogu usuwania
  const handleOpenDeleteDialog = useCallback((flashcard: FlashcardDTO) => {
    setFlashcardToDelete(flashcard);
    setIsDeleteDialogOpen(true);
  }, []);

  return {
    flashcards,
    pagination,
    queryParams,
    isLoading,
    error,
    flashcardToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleOpenDeleteDialog,
    handleDeleteFlashcard,
  };
}
```

### 6.2 Widok formularza - Custom Hook: useFlashcardForm

Stan formularza tworzenia/edycji fiszki jest zarządzany przez custom hook `useFlashcardForm`:

```typescript
/**
 * Hook zarządzający stanem formularza fiszki
 * Obsługuje tryby create i edit, walidację i operacje zapisu
 */
function useFlashcardForm(mode: "create" | "edit", flashcardId?: number) {
  const navigate = useNavigate();

  // Stan formularza
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    front?: string;
    back?: string;
  }>({});

  // Pobierz dane fiszki w trybie edit
  useEffect(() => {
    if (mode === "edit" && flashcardId) {
      fetchFlashcard(flashcardId);
    }
  }, [mode, flashcardId]);

  const fetchFlashcard = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/flashcards/${id}`);

      if (!response.ok) {
        throw new Error("Nie znaleziono fiszki");
      }

      const data: ApiResponseDTO<FlashcardDTO> = await response.json();
      setFront(data.data.front);
      setBack(data.data.back);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas pobierania fiszki");
      toast.error("Nie udało się pobrać fiszki");
    } finally {
      setIsLoading(false);
    }
  };

  // Walidacja pola front
  const validateFront = useCallback((value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Przód fiszki jest wymagany";
    }
    if (value.length > 200) {
      return "Przód fiszki może mieć maksymalnie 200 znaków";
    }
    return undefined;
  }, []);

  // Walidacja pola back
  const validateBack = useCallback((value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Tył fiszki jest wymagany";
    }
    if (value.length > 500) {
      return "Tył fiszki może mieć maksymalnie 500 znaków";
    }
    return undefined;
  }, []);

  // Handler zmiany pola front
  const handleFrontChange = useCallback(
    (value: string) => {
      setFront(value);
      // Walidacja w czasie rzeczywistym
      const error = validateFront(value);
      setValidationErrors((prev) => ({ ...prev, front: error }));
    },
    [validateFront]
  );

  // Handler zmiany pola back
  const handleBackChange = useCallback(
    (value: string) => {
      setBack(value);
      // Walidacja w czasie rzeczywistym
      const error = validateBack(value);
      setValidationErrors((prev) => ({ ...prev, back: error }));
    },
    [validateBack]
  );

  // Sprawdź czy formularz jest poprawny
  const isValid = useMemo(() => {
    return !validateFront(front) && !validateBack(back);
  }, [front, back, validateFront, validateBack]);

  // Submit formularza
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Walidacja przed wysłaniem
      const frontError = validateFront(front);
      const backError = validateBack(back);

      if (frontError || backError) {
        setValidationErrors({ front: frontError, back: backError });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (mode === "create") {
          // Tworzenie nowej fiszki
          const command: CreateFlashcardCommand = { front, back };
          const response = await fetch("/api/flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
          });

          if (!response.ok) {
            throw new Error("Błąd podczas tworzenia fiszki");
          }

          toast.success("Fiszka została utworzona");
        } else {
          // Edycja istniejącej fiszki
          const command: UpdateFlashcardCommand = { front, back };
          const response = await fetch(`/api/flashcards/${flashcardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command),
          });

          if (!response.ok) {
            throw new Error("Błąd podczas aktualizacji fiszki");
          }

          toast.success("Fiszka została zaktualizowana");
        }

        // Przekieruj do listy fiszek
        navigate("/app/flashcards");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
        toast.error(mode === "create" ? "Nie udało się utworzyć fiszki" : "Nie udało się zaktualizować fiszki");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, front, back, flashcardId, validateFront, validateBack, navigate]
  );

  // Anulowanie - powrót do listy
  const handleCancel = useCallback(() => {
    navigate("/app/flashcards");
  }, [navigate]);

  return {
    front,
    back,
    isLoading,
    error,
    validationErrors,
    isValid,
    handleFrontChange,
    handleBackChange,
    handleSubmit,
    handleCancel,
  };
}
```

### 6.3 Diagram przepływu stanu

```
URL Query Params
      ↓
useFlashcardList hook
      ↓
[State: flashcards, pagination, queryParams, isLoading, error]
      ↓
FlashcardListView component
      ↓
├── FlashcardListControls (controls: filter, sort, page)
└── FlashcardGrid (data: flashcards)
    └── FlashcardCard (actions: edit, delete)
        └── DeleteConfirmDialog (confirm/cancel)

---

Route Params (flashcardId)
      ↓
useFlashcardForm hook
      ↓
[State: front, back, isLoading, validationErrors, isValid]
      ↓
FlashcardFormView component
      ↓
└── FlashcardForm (input: front, back, actions: submit, cancel)
```

## 7. Integracja API

### 7.1 GET /api/flashcards - Pobieranie listy fiszek

**Użycie:** Hook `useFlashcardList`, funkcja `fetchFlashcards`

**Request:**

```typescript
// Query params z URLSearchParams
const queryString = new URLSearchParams({
  page: "1",
  limit: "50",
  source: "manual", // Optional
  sort: "created_at",
  order: "desc",
}).toString();

const response = await fetch(`/api/flashcards?${queryString}`, {
  method: "GET",
  headers: {
    // Authorization jest automatycznie dodawany przez middleware/cookie
  },
});
```

**Response Type:** `ApiResponseDTO<GetFlashcardsResponseDTO>`

**Success Response (200):**

```typescript
{
  success: true,
  data: {
    flashcards: [
      {
        id: 1,
        front: "Co to jest React?",
        back: "Biblioteka JavaScript do budowania interfejsów użytkownika",
        source: "manual",
        generation_id: null,
        created_at: "2025-10-10T10:00:00Z",
        updated_at: "2025-10-10T10:00:00Z"
      }
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 150,
      total_pages: 3
    }
  }
}
```

**Error Handling:**

- 401 Unauthorized → Przekierowanie do logowania
- 400 Bad Request → Wyświetl toast z błędem
- 500 Internal Server Error → Wyświetl toast z błędem

---

### 7.2 GET /api/flashcards/:id - Pobieranie pojedynczej fiszki

**Użycie:** Hook `useFlashcardForm`, funkcja `fetchFlashcard` (tylko w trybie edit)

**Request:**

```typescript
const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: "GET",
});
```

**Response Type:** `ApiResponseDTO<FlashcardDTO>`

**Success Response (200):**

```typescript
{
  success: true,
  data: {
    id: 1,
    front: "Co to jest React?",
    back: "Biblioteka JavaScript do budowania interfejsów użytkownika",
    source: "manual",
    generation_id: null,
    created_at: "2025-10-10T10:00:00Z",
    updated_at: "2025-10-10T10:00:00Z"
  }
}
```

**Error Handling:**

- 404 Not Found → Toast z błędem + przekierowanie do listy
- 401 Unauthorized → Przekierowanie do logowania

---

### 7.3 POST /api/flashcards - Tworzenie fiszki

**Użycie:** Hook `useFlashcardForm`, funkcja `handleSubmit` (tryb create)

**Request:**

```typescript
const command: CreateFlashcardCommand = {
  front: "Co to jest TypeScript?",
  back: "Typowany nadzbiór JavaScript kompilowany do czystego JS",
};

const response = await fetch("/api/flashcards", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(command),
});
```

**Response Type:** `ApiResponseDTO<FlashcardDTO>`

**Success Response (201):**

```typescript
{
  success: true,
  data: {
    id: 2,
    front: "Co to jest TypeScript?",
    back: "Typowany nadzbiór JavaScript kompilowany do czystego JS",
    source: "manual",
    generation_id: null,
    created_at: "2025-10-10T10:05:00Z",
    updated_at: "2025-10-10T10:05:00Z"
  }
}
```

**Error Handling:**

- 400 Validation Error → Wyświetl błędy przy polach formularza
- 401 Unauthorized → Przekierowanie do logowania
- 500 Internal Server Error → Toast z błędem

---

### 7.4 PATCH /api/flashcards/:id - Aktualizacja fiszki

**Użycie:** Hook `useFlashcardForm`, funkcja `handleSubmit` (tryb edit)

**Request:**

```typescript
const command: UpdateFlashcardCommand = {
  front: "Co to jest React? (zaktualizowane)",
  back: "Biblioteka JavaScript do budowania UI (zaktualizowane)",
};

const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(command),
});
```

**Response Type:** `ApiResponseDTO<FlashcardDTO>`

**Success Response (200):**

```typescript
{
  success: true,
  data: {
    id: 1,
    front: "Co to jest React? (zaktualizowane)",
    back: "Biblioteka JavaScript do budowania UI (zaktualizowane)",
    source: "manual", // Lub "ai-edited" jeśli była "ai-full"
    generation_id: null,
    created_at: "2025-10-10T10:00:00Z",
    updated_at: "2025-10-10T10:15:00Z"
  }
}
```

**Error Handling:**

- 400 Validation Error → Wyświetl błędy przy polach formularza
- 404 Not Found → Toast z błędem + przekierowanie do listy
- 401 Unauthorized → Przekierowanie do logowania

---

### 7.5 DELETE /api/flashcards/:id - Usuwanie fiszki

**Użycie:** Hook `useFlashcardList`, funkcja `handleDeleteFlashcard`

**Request:**

```typescript
const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: "DELETE",
});
```

**Response Type:** `ApiResponseDTO<DeleteResourceResponseDTO>`

**Success Response (200):**

```typescript
{
  success: true,
  message: "Flashcard deleted successfully"
}
```

**Error Handling:**

- 404 Not Found → Toast z błędem
- 401 Unauthorized → Przekierowanie do logowania
- **Optimistic UI:** Fiszka jest usuwana z UI natychmiast, w przypadku błędu jest przywracana

---

### 7.6 Obsługa błędów API - Uniwersalna funkcja

```typescript
/**
 * Uniwersalna funkcja obsługi błędów API
 * Sprawdza status odpowiedzi i przekierowuje lub wyświetla odpowiednie komunikaty
 */
async function handleApiError(response: Response): Promise<never> {
  if (response.status === 401) {
    // Brak autoryzacji - przekieruj do logowania
    window.location.href = "/";
    throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  }

  if (response.status === 404) {
    throw new Error("Nie znaleziono zasobu");
  }

  // Spróbuj odczytać szczegóły błędu z API
  try {
    const errorData: ApiErrorDTO = await response.json();
    throw new Error(errorData.error.message || "Wystąpił błąd");
  } catch {
    throw new Error("Wystąpił nieoczekiwany błąd");
  }
}
```

## 8. Interakcje użytkownika

### 8.1 Przeglądanie listy fiszek

**Scenariusz:** Użytkownik wchodzi na stronę `/app/flashcards`

**Przepływ:**

1. Komponent `FlashcardListView` montuje się
2. Hook `useFlashcardList` parsuje query params z URL (lub używa wartości domyślnych)
3. Wywołanie `fetchFlashcards()` pobiera dane z API
4. Podczas ładowania wyświetlany jest skeleton loader (6 kart)
5. Po otrzymaniu danych wyświetlana jest lista fiszek w siatce
6. Jeśli lista jest pusta, wyświetlany jest `EmptyState`

**Komponenty:**

- `FlashcardListView`
- `FlashcardGrid`
- `FlashcardCard` (dla każdej fiszki)
- `Skeleton` (podczas ładowania)
- `EmptyState` (jeśli brak fiszek)

---

### 8.2 Filtrowanie fiszek według źródła

**Scenariusz:** Użytkownik wybiera opcję z dropdown "Źródło"

**Przepływ:**

1. Użytkownik klika dropdown "Źródło" w `FlashcardListControls`
2. Wybiera opcję (Wszystkie / Ręczne / AI / AI edytowane)
3. Handler `handleFilterChange` jest wywoływany z nową wartością
4. Query params w URL są aktualizowane (np. `?source=manual&page=1`)
5. Hook `useFlashcardList` wykrywa zmianę params i wywołuje `fetchFlashcards()`
6. Lista fiszek jest ponownie pobierana z nowym filtrem
7. Strona jest resetowana do 1

**Komponenty:**

- `FlashcardListControls`
- Shadcn/ui `Select` component

---

### 8.3 Zmiana sortowania

**Scenariusz:** Użytkownik zmienia sortowanie fiszek

**Przepływ:**

1. Użytkownik wybiera pole sortowania (Data utworzenia / Data modyfikacji)
2. Użytkownik wybiera kierunek (Rosnąco / Malejąco)
3. Handler `handleSortChange` aktualizuje query params
4. Lista fiszek jest ponownie pobierana z nowym sortowaniem

**Komponenty:**

- `FlashcardListControls`
- Shadcn/ui `Select` components

---

### 8.4 Paginacja - zmiana strony

**Scenariusz:** Użytkownik klika przycisk następnej/poprzedniej strony lub numer strony

**Przepływ:**

1. Użytkownik klika kontrolkę paginacji
2. Handler `handlePageChange` aktualizuje query param `page`
3. Lista fiszek jest ponownie pobierana dla nowej strony
4. Scroll jest przesuwany na górę strony

**Komponenty:**

- `FlashcardListControls`
- Shadcn/ui `Pagination` component

---

### 8.5 Nawigacja do formularza tworzenia fiszki

**Scenariusz:** Użytkownik klika przycisk "Dodaj fiszkę"

**Przepływ:**

1. Użytkownik klika przycisk "Dodaj fiszkę" w nagłówku lub w `EmptyState`
2. Nawigacja do `/app/flashcards/new`
3. Komponent `FlashcardFormView` montuje się w trybie "create"
4. Formularz jest pusty i gotowy do wypełnienia

**Komponenty:**

- `FlashcardListView` (przycisk w nagłówku)
- `EmptyState` (przycisk w stanie pustym)
- Router (Astro lub client-side)

---

### 8.6 Tworzenie nowej fiszki

**Scenariusz:** Użytkownik wypełnia formularz i zapisuje nową fiszkę

**Przepływ:**

1. Użytkownik wpisuje tekst w pole "Przód fiszki"
   - Licznik znaków aktualizuje się w czasie rzeczywistym (X/200)
   - Walidacja on-change sprawdza długość i wyświetla błędy
2. Użytkownik wpisuje tekst w pole "Tył fiszki"
   - Licznik znaków aktualizuje się (X/500)
   - Walidacja on-change sprawdza długość
3. Przycisk "Zapisz" jest aktywny tylko gdy formularz jest poprawny
4. Użytkownik klika "Zapisz"
5. Handler `handleSubmit` waliduje ponownie dane
6. Wywołanie POST /api/flashcards z `CreateFlashcardCommand`
7. Podczas zapisu przycisk pokazuje "Zapisywanie..." i jest disabled
8. Po sukcesie:
   - Toast "Fiszka została utworzona"
   - Nawigacja do `/app/flashcards`
9. W przypadku błędu:
   - Toast z komunikatem błędu
   - Użytkownik pozostaje na formularzu

**Komponenty:**

- `FlashcardFormView` (mode: "create")
- `FlashcardForm`
- Shadcn/ui `Input`, `Textarea`, `Button`

---

### 8.7 Edycja istniejącej fiszki

**Scenariusz:** Użytkownik klika "Edytuj" na fiszce i modyfikuje jej treść

**Przepływ:**

1. Użytkownik klika przycisk "Edytuj" na `FlashcardCard`
2. Nawigacja do `/app/flashcards/:id/edit`
3. Komponent `FlashcardFormView` montuje się w trybie "edit"
4. Hook `useFlashcardForm` pobiera dane fiszki (GET /api/flashcards/:id)
5. Podczas ładowania wyświetlany jest skeleton
6. Po załadowaniu formularz jest wypełniony danymi fiszki
7. Użytkownik modyfikuje pola (walidacja działa tak samo jak przy tworzeniu)
8. Użytkownik klika "Zapisz"
9. Handler `handleSubmit` wywołuje PATCH /api/flashcards/:id
10. Po sukcesie:
    - Toast "Fiszka została zaktualizowana"
    - Nawigacja do `/app/flashcards`
11. Jeśli fiszka nie zostanie znaleziona (404):
    - Toast z błędem
    - Nawigacja do `/app/flashcards`

**Komponenty:**

- `FlashcardCard` (przycisk "Edytuj")
- `FlashcardFormView` (mode: "edit")
- `FlashcardForm`

---

### 8.8 Usuwanie fiszki

**Scenariusz:** Użytkownik usuwa fiszkę z potwierdzeniem

**Przepływ:**

1. Użytkownik klika przycisk "Usuń" na `FlashcardCard`
2. Handler `handleOpenDeleteDialog` ustawia `flashcardToDelete` i otwiera dialog
3. `DeleteConfirmDialog` pokazuje się z pytaniem o potwierdzenie
4. **Scenariusz A - Potwierdzenie:**
   - Użytkownik klika "Usuń" w dialogu
   - Handler `handleDeleteFlashcard` jest wywoływany
   - **Optimistic UI:** Fiszka jest natychmiast usuwana z listy
   - Dialog się zamyka
   - Wywołanie DELETE /api/flashcards/:id
   - Po sukcesie:
     - Toast "Fiszka została usunięta"
     - `fetchFlashcards()` odświeża listę (aktualizuje paginację)
   - W przypadku błędu:
     - Fiszka jest przywracana do listy
     - Toast "Nie udało się usunąć fiszki"
5. **Scenariusz B - Anulowanie:**
   - Użytkownik klika "Anuluj" lub zamyka dialog
   - Dialog się zamyka bez żadnych zmian

**Komponenty:**

- `FlashcardCard` (przycisk "Usuń")
- `DeleteConfirmDialog`
- Shadcn/ui `AlertDialog`

---

### 8.9 Anulowanie formularza

**Scenariusz:** Użytkownik anuluje tworzenie/edycję fiszki

**Przepływ:**

1. Użytkownik klika przycisk "Anuluj" na formularzu
2. Handler `handleCancel` wykonuje nawigację do `/app/flashcards`
3. Żadne dane nie są zapisywane

**Komponenty:**

- `FlashcardForm` (przycisk "Anuluj")

---

### 8.10 Stan pusty

**Scenariusz:** Użytkownik nie ma jeszcze żadnych fiszek

**Przepływ:**

1. Użytkownik wchodzi na `/app/flashcards`
2. API zwraca pustą listę (pagination.total = 0)
3. Zamiast siatki kart wyświetlany jest `EmptyState`
4. Użytkownik ma dwie opcje:
   - **"Dodaj fiszkę"** → Nawigacja do `/app/flashcards/new`
   - **"Użyj generatora AI"** → Nawigacja do `/app/generator`

**Komponenty:**

- `EmptyState`

## 9. Warunki i walidacja

### 9.1 Walidacja formularza (front i back)

**Pole: front (Przód fiszki)**

Warunki walidacji:

- **Wymagane:** Pole nie może być puste
- **Maksymalna długość:** 200 znaków

Moment walidacji:

- **On change:** Po każdej zmianie wartości
- **On blur:** Gdy użytkownik opuszcza pole
- **On submit:** Przed wysłaniem formularza

Wyświetlanie błędów:

- Komunikat błędu pod polem (czerwony tekst)
- Licznik znaków zmienia kolor na czerwony gdy przekroczony limit
- Czerwona ramka wokół pola (aria-invalid)

Implementacja:

```typescript
const validateFront = (value: string): string | undefined => {
  if (!value || value.trim() === "") {
    return "Przód fiszki jest wymagany";
  }
  if (value.length > 200) {
    return "Przód fiszki może mieć maksymalnie 200 znaków";
  }
  return undefined;
};
```

**Pole: back (Tył fiszki)**

Warunki walidacji:

- **Wymagane:** Pole nie może być puste
- **Maksymalna długość:** 500 znaków

Moment walidacji i wyświetlanie błędów: identycznie jak dla `front`

Implementacja:

```typescript
const validateBack = (value: string): string | undefined => {
  if (!value || value.trim() === "") {
    return "Tył fiszki jest wymagany";
  }
  if (value.length > 500) {
    return "Tył fiszki może mieć maksymalnie 500 znaków";
  }
  return undefined;
};
```

**Stan przycisku "Zapisz"**

- Disabled gdy `!isValid` (formularz zawiera błędy)
- Disabled gdy `isLoading` (trwa zapisywanie)
- Pokazuje "Zapisywanie..." gdy `isLoading`

---

### 9.2 Walidacja parametrów zapytania (query params)

**Komponent:** `FlashcardListControls`

**Parametr: page**

- Typ: number
- Wartość domyślna: 1
- Minimum: 1
- Maximum: pagination.total_pages
- Parsowanie: `parseInt(searchParams.get("page") || "1")`

**Parametr: limit**

- Typ: number
- Wartość domyślna: 50
- Minimum: 1
- Maximum: 100
- Parsowanie: `parseInt(searchParams.get("limit") || "50")`

**Parametr: source**

- Typ: FlashcardSource | undefined
- Wartości dozwolone: "manual", "ai-full", "ai-edited"
- Parsowanie: `searchParams.get("source") as FlashcardSource`
- Jeśli wartość nie jest dozwolona, traktuj jako undefined

**Parametr: sort**

- Typ: "created_at" | "updated_at"
- Wartość domyślna: "created_at"
- Parsowanie: `searchParams.get("sort") as "created_at" | "updated_at" || "created_at"`

**Parametr: order**

- Typ: "asc" | "desc"
- Wartość domyślna: "desc"
- Parsowanie: `searchParams.get("order") as "asc" | "desc" || "desc"`

---

### 9.3 Warunki wyświetlania elementów UI

**EmptyState**

- Warunek: `flashcards.length === 0 && !isLoading`
- Komponent: `FlashcardGrid`

**Skeleton Loader**

- Warunek: `isLoading`
- Komponent: `FlashcardGrid`
- Liczba skeletonów: 6

**Lista fiszek**

- Warunek: `flashcards.length > 0 && !isLoading`
- Komponent: `FlashcardGrid`

**Kontrolki paginacji**

- Warunek: `pagination && pagination.total_pages > 1`
- Komponent: `FlashcardListControls`

**Przycisk "Następna strona"**

- Disabled: `pagination.page >= pagination.total_pages`

**Przycisk "Poprzednia strona"**

- Disabled: `pagination.page <= 1`

**Data modyfikacji w karcie**

- Warunek: `flashcard.updated_at !== flashcard.created_at`
- Komponent: `FlashcardCard`

**Badge źródła fiszki**

- Zawsze wyświetlany
- Tekst: `FLASHCARD_SOURCE_LABELS[flashcard.source]`
- Kolor: różny dla każdego typu źródła

---

### 9.4 Warunki operacji

**Usuwanie fiszki**

- Możliwe tylko gdy użytkownik potwierdzi w dialogu
- Optimistic UI: fiszka usuwana natychmiast z widoku
- W przypadku błędu: fiszka przywracana do listy

**Edycja fiszki**

- Możliwa tylko gdy fiszka należy do użytkownika (sprawdzane przez API)
- W przypadku 404: przekierowanie do listy z komunikatem błędu

**Nawigacja między stronami**

- Możliwa tylko gdy `pagination.page` jest w zakresie `[1, total_pages]`

## 10. Obsługa błędów

### 10.1 Błędy sieciowe (Network errors)

**Scenariusz:** Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**

```typescript
try {
  const response = await fetch("/api/flashcards");
  // ...
} catch (error) {
  setError("Błąd połączenia. Sprawdź połączenie z internetem.");
  toast.error("Nie udało się pobrać danych");
}
```

**Wyświetlanie:**

- Toast z komunikatem błędu
- Komunikat w widoku z przyciskiem "Spróbuj ponownie"
- Opcjonalnie: automatyczne ponowienie próby po X sekundach

---

### 10.2 Błąd 401 Unauthorized

**Scenariusz:** Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa:**

```typescript
if (response.status === 401) {
  // Przekieruj do strony logowania
  window.location.href = "/";
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
  return;
}
```

**Wyświetlanie:**

- Toast z komunikatem
- Automatyczne przekierowanie do `/` (strona logowania)

---

### 10.3 Błąd 404 Not Found

**Scenariusz:** Fiszka nie istnieje lub nie należy do użytkownika

**Obsługa w trybie edit:**

```typescript
if (response.status === 404) {
  toast.error("Nie znaleziono fiszki");
  navigate("/app/flashcards");
  return;
}
```

**Wyświetlanie:**

- Toast z komunikatem
- Automatyczne przekierowanie do listy fiszek

---

### 10.4 Błąd 400 Bad Request (Validation Error)

**Scenariusz:** Dane wysłane do API są niepoprawne

**Obsługa:**

```typescript
if (response.status === 400) {
  const errorData: ApiErrorDTO = await response.json();

  if (errorData.error.code === "VALIDATION_ERROR" && errorData.error.details) {
    // Mapuj błędy walidacji na pola formularza
    const details = errorData.error.details as ValidationErrorDetailDTO[];
    const errors: Record<string, string> = {};

    details.forEach((detail) => {
      errors[detail.field] = detail.message;
    });

    setValidationErrors(errors);
  } else {
    toast.error(errorData.error.message);
  }
  return;
}
```

**Wyświetlanie:**

- Błędy walidacji przy odpowiednich polach formularza
- Ogólny toast jeśli błąd nie dotyczy konkretnego pola

---

### 10.5 Błąd 500 Internal Server Error

**Scenariusz:** Błąd serwera (baza danych, logika biznesowa, itp.)

**Obsługa:**

```typescript
if (response.status === 500) {
  toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
  setError("Błąd serwera");
  return;
}
```

**Wyświetlanie:**

- Toast z ogólnym komunikatem
- Opcjonalnie: przycisk "Zgłoś problem"

---

### 10.6 Błąd podczas usuwania (z Optimistic UI)

**Scenariusz:** Usuwanie fiszki kończy się błędem po optimistic update

**Obsługa:**

```typescript
// Zapisz oryginalną listę
const originalFlashcards = [...flashcards];

// Optimistic update
setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));

try {
  const response = await fetch(`/api/flashcards/${flashcardId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Błąd podczas usuwania");
  }

  toast.success("Fiszka została usunięta");
} catch (error) {
  // Przywróć oryginalną listę
  setFlashcards(originalFlashcards);
  toast.error("Nie udało się usunąć fiszki");
}
```

**Wyświetlanie:**

- Fiszka natychmiast znika z UI
- Jeśli błąd: fiszka wraca na swoje miejsce z animacją
- Toast z komunikatem błędu

---

### 10.7 Błędy parsowania danych

**Scenariusz:** API zwraca dane w nieoczekiwanym formacie

**Obsługa:**

```typescript
try {
  const data: ApiResponseDTO<GetFlashcardsResponseDTO> = await response.json();

  if (!data.data || !data.data.flashcards) {
    throw new Error("Nieprawidłowy format danych");
  }

  setFlashcards(data.data.flashcards);
} catch (error) {
  toast.error("Błąd odczytu danych");
  setError("Błąd parsowania odpowiedzi");
}
```

**Wyświetlanie:**

- Toast z komunikatem
- Stan błędu w widoku

---

### 10.8 Timeout (długie ładowanie)

**Scenariusz:** Request trwa bardzo długo

**Obsługa:**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch("/api/flashcards", {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === "AbortError") {
    toast.error("Ładowanie trwa zbyt długo. Spróbuj ponownie.");
  }
}
```

**Wyświetlanie:**

- Toast z komunikatem o timeout
- Możliwość ponowienia próby

---

### 10.9 Pusta lista wyników

**Scenariusz:** Użytkownik ma fiszki, ale po zastosowaniu filtra lista jest pusta

**Obsługa:**

```typescript
if (flashcards.length === 0 && !isLoading) {
  if (queryParams.source) {
    // Lista pusta przez filtr
    return <EmptyFilterState onClearFilters={handleClearFilters} />;
  } else {
    // Brak fiszek w ogóle
    return <EmptyState />;
  }
}
```

**Wyświetlanie:**

- Komunikat "Brak fiszek spełniających kryteria"
- Przycisk "Wyczyść filtry"
- Odróżnienie od stanu "brak fiszek w ogóle"

---

### 10.10 Globalna obsługa błędów (Error Boundary)

**Scenariusz:** Nieoczekiwany błąd w komponencie React

**Obsługa:**

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Opcjonalnie: wysłanie błędu do serwisu logowania
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Coś poszło nie tak</h2>
          <Button onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Użycie:**

```tsx
<ErrorBoundary>
  <FlashcardListView />
</ErrorBoundary>
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utwórz strukturę katalogów:

```
src/
├── components/
│   └── flashcards/
│       ├── FlashcardListView.tsx
│       ├── FlashcardListControls.tsx
│       ├── FlashcardGrid.tsx
│       ├── FlashcardCard.tsx
│       ├── EmptyState.tsx
│       ├── DeleteConfirmDialog.tsx
│       ├── FlashcardFormView.tsx
│       ├── FlashcardForm.tsx
│       ├── useFlashcardList.ts
│       └── useFlashcardForm.ts
├── pages/
│   └── app/
│       └── flashcards/
│           ├── index.astro
│           ├── new.astro
│           └── [id]/
│               └── edit.astro
```

1.2. Dodaj nowe typy do `src/types.ts`:

- `FlashcardListViewModel`
- `FlashcardFormViewModel`
- `FlashcardMutations`
- `FLASHCARD_SOURCE_LABELS`
- `SOURCE_FILTER_OPTIONS`
- `SORT_OPTIONS`

  1.3. Upewnij się, że istnieją komponenty Shadcn/ui:

- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Button`
- `Input`
- `Textarea`
- `Select`
- `Label`
- `Badge`
- `AlertDialog`
- `Skeleton`
- `Pagination`

---

### Krok 2: Implementacja hooków zarządzania stanem

2.1. **Stwórz hook `useFlashcardList`** (`src/components/flashcards/useFlashcardList.ts`):

- Import zależności (useState, useEffect, useCallback, useMemo, toast)
- Definicja stanu (flashcards, pagination, isLoading, error, flashcardToDelete)
- Parsowanie query params z URL
- Funkcja `fetchFlashcards()` z obsługą błędów
- Handlery dla kontrolek (filter, sort, page)
- Handler dla usuwania z optimistic UI
- Return wszystkich wartości i funkcji

  2.2. **Stwórz hook `useFlashcardForm`** (`src/components/flashcards/useFlashcardForm.ts`):

- Import zależności
- Definicja stanu formularza (front, back, isLoading, validationErrors)
- Funkcja `fetchFlashcard()` dla trybu edit
- Funkcje walidacji (`validateFront`, `validateBack`)
- Handlery zmian pól z walidacją w czasie rzeczywistym
- Handler submit z walidacją i wywołaniem API
- Handler cancel z nawigacją
- Return wszystkich wartości i funkcji

---

### Krok 3: Implementacja komponentów widoku listy

3.1. **Stwórz `FlashcardCard`** (`src/components/flashcards/FlashcardCard.tsx`):

- Propsy: `flashcard`, `onEdit`, `onDelete`
- Struktura Card z Shadcn/ui
- Wyświetlanie: front, back, source badge, daty
- Przyciski akcji: Edytuj, Usuń
- Formatowanie dat (pomocnicza funkcja)
- Style i klasy Tailwind

  3.2. **Stwórz `EmptyState`** (`src/components/flashcards/EmptyState.tsx`):

- Propsy: `onCreateManual`, `onNavigateToGenerator`
- Ikona (SVG)
- Tekst zachęcający
- Dwa przyciski: "Dodaj fiszkę" i "Użyj generatora AI"

  3.3. **Stwórz `DeleteConfirmDialog`** (`src/components/flashcards/DeleteConfirmDialog.tsx`):

- Propsy: `flashcard`, `isOpen`, `onOpenChange`, `onConfirm`
- Użycie AlertDialog z Shadcn/ui
- Wyświetlanie przodu fiszki w opisie
- Przyciski: Anuluj, Usuń

  3.4. **Stwórz `FlashcardGrid`** (`src/components/flashcards/FlashcardGrid.tsx`):

- Propsy: `flashcards`, `isLoading`, `onEdit`, `onDelete`
- Warunkowe renderowanie:
  - Skeleton (6 kart) jeśli `isLoading`
  - EmptyState jeśli `flashcards.length === 0`
  - Siatka kart jeśli dane są dostępne
- Grid responsive (1/2/3 kolumny)

  3.5. **Stwórz `FlashcardListControls`** (`src/components/flashcards/FlashcardListControls.tsx`):

- Propsy: `queryParams`, `pagination`, `onFilterChange`, `onSortChange`, `onPageChange`
- Select dla source filter
- Select dla sort field
- Select dla order
- Komponenty Pagination z Shadcn/ui
- Layout responsive (kolumna na mobile, rząd na desktop)

  3.6. **Stwórz `FlashcardListView`** (`src/components/flashcards/FlashcardListView.tsx`):

- Użycie hooka `useFlashcardList`
- Nagłówek z tytułem i przyciskiem "Dodaj fiszkę"
- FlashcardListControls
- FlashcardGrid
- DeleteConfirmDialog
- Toaster dla komunikatów
- Obsługa wszystkich interakcji

---

### Krok 4: Implementacja komponentów formularza

4.1. **Stwórz `FlashcardForm`** (`src/components/flashcards/FlashcardForm.tsx`):

- Propsy: `mode`, `initialData`, `onSubmit`, `onCancel`, `isLoading`, `validationErrors`
- Struktura formularza w Card
- Input dla front z licznikiem znaków
- Textarea dla back z licznikiem znaków
- Wyświetlanie błędów walidacji
- Aria attributes dla dostępności
- Przyciski: Anuluj, Zapisz
- Disabled state przycisku Zapisz

  4.2. **Stwórz `FlashcardFormView`** (`src/components/flashcards/FlashcardFormView.tsx`):

- Propsy: `mode`, `flashcardId` (optional)
- Użycie hooka `useFlashcardForm`
- Skeleton podczas ładowania (tryb edit)
- FlashcardForm z odpowiednimi propsami
- Toaster dla komunikatów
- Obsługa submit i cancel

---

### Krok 5: Implementacja stron Astro

5.1. **Stwórz stronę listy** (`src/pages/app/flashcards/index.astro`):

```astro
---
import Layout from "@/layouts/Layout.astro";
import { FlashcardListView } from "@/components/flashcards/FlashcardListView";

export const prerender = false;
// Page is protected by middleware
---

<Layout title="Moje fiszki - 10x Cards">
  <FlashcardListView client:load />
</Layout>
```

5.2. **Stwórz stronę tworzenia** (`src/pages/app/flashcards/new.astro`):

```astro
---
import Layout from "@/layouts/Layout.astro";
import { FlashcardFormView } from "@/components/flashcards/FlashcardFormView";

export const prerender = false;
---

<Layout title="Dodaj fiszkę - 10x Cards">
  <FlashcardFormView client:load mode="create" />
</Layout>
```

5.3. **Stwórz stronę edycji** (`src/pages/app/flashcards/[id]/edit.astro`):

```astro
---
import Layout from "@/layouts/Layout.astro";
import { FlashcardFormView } from "@/components/flashcards/FlashcardFormView";

export const prerender = false;

const { id } = Astro.params;
const flashcardId = parseInt(id || "0");
---

<Layout title="Edytuj fiszkę - 10x Cards">
  <FlashcardFormView client:load mode="edit" flashcardId={flashcardId} />
</Layout>
```

---

### Krok 6: Stylowanie i dostępność

6.1. **Dodaj style Tailwind:**

- Upewnij się, że wszystkie komponenty używają spójnych klas
- Użyj zmiennych CSS z Shadcn/ui dla kolorów
- Dodaj klasy hover i focus dla interaktywnych elementów
- Responsive breakpoints: `sm:`, `md:`, `lg:`

  6.2. **Zapewnij dostępność:**

- Dodaj `aria-label` dla wszystkich przycisków bez tekstu
- Użyj `aria-invalid` i `aria-describedby` dla pól formularza z błędami
- Upewnij się, że wszystkie interaktywne elementy są dostępne z klawiatury
- Dodaj `role` i ARIA attributes dla custom komponentów
- Testuj z czytnikiem ekranu

  6.3. **Dodaj animacje:**

- Transition dla hover states
- Fade in dla toastów
- Slide in dla dialogów
- Skeleton pulse animation

---

### Krok 7: Integracja z API

7.1. **Przetestuj wszystkie endpointy:**

- GET /api/flashcards z różnymi parametrami
- GET /api/flashcards/:id
- POST /api/flashcards
- PATCH /api/flashcards/:id
- DELETE /api/flashcards/:id

  7.2. **Sprawdź obsługę błędów:**

- Test z nieprawidłowymi danymi (400)
- Test z nieistniejącą fiszką (404)
- Test bez autoryzacji (401)
- Test z błędem serwera (symulacja 500)

  7.3. **Sprawdź typy:**

- Upewnij się, że typy request i response są zgodne z API
- Sprawdź, czy wszystkie pola DTO są poprawnie mapowane

---

### Krok 8: Testowanie funkcjonalności

8.1. **Testy widoku listy:**

- [ ] Lista fiszek ładuje się poprawnie
- [ ] Paginacja działa (zmiana strony)
- [ ] Filtrowanie według źródła działa
- [ ] Sortowanie działa (pole i kierunek)
- [ ] Stan pusty wyświetla się gdy brak fiszek
- [ ] Skeleton pokazuje się podczas ładowania
- [ ] Query params są synchronizowane z URL
- [ ] Przycisk "Dodaj fiszkę" kieruje do formularza

  8.2. **Testy usuwania:**

- [ ] Dialog potwierdzenia otwiera się po kliknięciu "Usuń"
- [ ] Anulowanie dialogu nie usuwa fiszki
- [ ] Potwierdzenie usuwa fiszkę z optimistic UI
- [ ] Fiszka znika natychmiast z listy
- [ ] Toast z sukcesem pokazuje się po usunięciu
- [ ] W przypadku błędu fiszka wraca do listy
- [ ] Paginacja aktualizuje się po usunięciu

  8.3. **Testy tworzenia fiszki:**

- [ ] Formularz jest pusty w trybie create
- [ ] Walidacja działa w czasie rzeczywistym
- [ ] Liczniki znaków aktualizują się
- [ ] Błędy walidacji wyświetlają się przy polach
- [ ] Przycisk "Zapisz" jest disabled gdy formularz niepoprawny
- [ ] Fiszka tworzy się po kliknięciu "Zapisz"
- [ ] Toast z sukcesem pokazuje się
- [ ] Przekierowanie do listy po zapisaniu
- [ ] Przycisk "Anuluj" wraca do listy bez zapisywania

  8.4. **Testy edycji fiszki:**

- [ ] Dane fiszki ładują się w trybie edit
- [ ] Skeleton pokazuje się podczas ładowania
- [ ] Formularz jest wypełniony danymi fiszki
- [ ] Walidacja działa tak samo jak przy tworzeniu
- [ ] Fiszka aktualizuje się po zapisaniu
- [ ] Toast z sukcesem pokazuje się
- [ ] Przekierowanie do listy po zapisaniu
- [ ] 404 error powoduje przekierowanie do listy

  8.5. **Testy dostępności:**

- [ ] Nawigacja klawiaturą działa (Tab, Enter, Escape)
- [ ] Focus visible jest widoczny
- [ ] Czytnik ekranu poprawnie czyta zawartość
- [ ] Błędy formularza są ogłaszane przez czytnik
- [ ] ARIA attributes są poprawnie ustawione

  8.6. **Testy responsywności:**

- [ ] Layout działa na mobile (320px+)
- [ ] Layout działa na tablet (768px+)
- [ ] Layout działa na desktop (1024px+)
- [ ] Siatka kart zmienia liczbę kolumn
- [ ] Kontrolki układają się poprawnie na różnych rozmiarach

---

### Krok 9: Optymalizacja i polerowanie

9.1. **Optymalizacja wydajności:**

- Użyj `React.memo()` dla `FlashcardCard` jeśli lista jest długa
- Użyj `useCallback` i `useMemo` w hookach
- Rozważ virtual scrolling dla bardzo długich list (opcjonalne)
- Zoptymalizuj rozmiar bundla (code splitting)

  9.2. **Polepszenie UX:**

- Dodaj transition animations
- Smooth scroll po zmianie strony
- Autofocus na pierwszy input formularza
- Pokazuj liczbę wyników ("Znaleziono X fiszek")
- Dodaj wskaźnik ładowania w przyciskach

  9.3. **Obsługa edge cases:**

- Bardzo długi tekst w fiszce (overflow handling)
- Specjalne znaki w tekście
- Brak danych w odpowiedzi API
- Bardzo wolne połączenie (loading states)

---

### Krok 10: Dokumentacja i code review

10.1. **Dodaj komentarze JSDoc:**

- Wszystkie komponenty powinny mieć opis
- Wszystkie propsy powinny być opisane
- Wszystkie hooki powinny mieć dokumentację

  10.2. **Sprawdź linting:**

```bash
npm run lint
```

10.3. **Sprawdź TypeScript:**

```bash
npm run type-check
```

10.4. **Code review:**

- Przejrzyj kod pod kątem best practices
- Sprawdź naming conventions
- Upewnij się, że kod jest DRY (Don't Repeat Yourself)
- Sprawdź, czy nie ma console.log w produkcji

---

### Krok 11: Testowanie końcowe i deploy

11.1. **Testy end-to-end:**

- Pełny flow: Lista → Tworzenie → Lista → Edycja → Usuwanie
- Flow z filtrowaniem i sortowaniem
- Flow ze stanem pustym

  11.2. **Testy w różnych przeglądarkach:**

- Chrome
- Firefox
- Safari
- Edge

  11.3. **Deploy na staging:**

- Zbuduj aplikację
- Deploy na środowisko testowe
- Przeprowadź smoke tests

  11.4. **Deploy na produkcję:**

- Upewnij się, że wszystkie testy przeszły
- Merge do głównej gałęzi
- Deploy na produkcję
- Monitoruj błędy w pierwszych godzinach

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowy przewodnik do stworzenia modułu zarządzania fiszkami w aplikacji 10x-cards. Obejmuje:

- **3 widoki:** Lista fiszek, Tworzenie fiszki, Edycja fiszki
- **8 głównych komponentów React:** Odpowiedzialne za logikę i UI
- **2 custom hooki:** Zarządzanie stanem i logiką biznesową
- **5 endpointów API:** Pełne CRUD dla fiszek
- **Kompletna obsługa błędów:** Wszystkie scenariusze błędów
- **Dostępność:** ARIA, keyboard navigation, screen readers
- **Responsywność:** Mobile-first design
- **Optymalizacja:** Performance i UX improvements

Implementacja powinna zająć doświadczonemu programiście frontendowemu około 16-24 godzin pracy, w zależności od poziomu znajomości stosu technologicznego.
