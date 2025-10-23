# Plan implementacji widoku Konto i komponentu Sidebar

## 1. Przegląd

Widok "Moje konto" umożliwia zalogowanemu użytkownikowi zarządzanie swoim kontem, w tym przeglądanie podstawowych informacji (adres email) oraz usunięcie konta wraz ze wszystkimi powiązanymi danymi (fiszki, generacje). Dodatkowo implementacja obejmuje komponent Sidebar, który jest wspólnym elementem nawigacyjnym dla wszystkich chronionych widoków (`/app/*`).

Widok jest chroniony - dostępny tylko dla zalogowanych użytkowników. Operacja usunięcia konta jest nieodwracalna i wymaga wyraźnego potwierdzenia przez użytkownika w dialogu ostrzegawczym.

## 2. Routing widoku

**Ścieżka:** `/app/account`

**Typ:** Chroniony (wymaga aktywnej sesji Supabase)

**Plik:** `src/pages/app/account.astro`

**Layout:** Dwukolumnowy layout z Sidebar po lewej stronie i główną treścią po prawej.

## 3. Struktura komponentów

```
AccountPage (Astro)
├── Layout (Astro)
│   └── AppLayout (Astro) - nowy layout dla /app/*
│       ├── Sidebar (React)
│       │   ├── SidebarNav (React)
│       │   │   └── SidebarNavItem (React) x5
│       │   └── Button (logout)
│       └── AccountView (React)
│           ├── Card
│           │   ├── AccountInfo (React)
│           │   │   ├── Label
│           │   │   ├── Badge
│           │   │   └── Text (email, data utworzenia)
│           │   └── Button (Usuń konto)
│           └── DeleteAccountDialog (React)
│               ├── AlertDialog (shadcn/ui)
│               │   ├── AlertDialogHeader
│               │   ├── AlertDialogTitle
│               │   ├── AlertDialogDescription
│               │   ├── Checkbox (potwierdzenie)
│               │   └── AlertDialogFooter
│               │       ├── Button (Anuluj)
│               │       └── Button (Usuń - destructive)
│               └── Toast (potwierdzenie/błąd)
```

## 4. Szczegóły komponentów

### 4.1. AppLayout (Astro)

**Opis:** Layout wspólny dla wszystkich widoków chronionych (`/app/*`). Definiuje dwukolumnowy układ z Sidebar po lewej i główną treścią po prawej. Odpowiada za weryfikację sesji użytkownika i przekierowanie niezalogowanych użytkowników.

**Główne elementy:**

- `<div>` z układem grid/flex dla dwóch kolumn
- `<Sidebar>` jako komponent React po lewej
- `<slot>` dla głównej treści widoku po prawej
- Sprawdzenie sesji użytkownika (Supabase)

**Obsługiwane interakcje:**

- Nie ma bezpośrednich interakcji - jest to kontener layoutu

**Warunki walidacji:**

- Sprawdzenie obecności aktywnej sesji Supabase
- Przekierowanie do `/` jeśli użytkownik nie jest zalogowany

**Typy:**

- Props: `{ title?: string }`

**Propsy:**

- `title` (opcjonalny): Tytuł strony dla `<title>` w head

---

### 4.2. Sidebar (React)

**Opis:** Komponent nawigacji bocznej dostępny we wszystkich chronionych widokach. Wyświetla logo/nazwę aplikacji, listę linków nawigacyjnych oraz przycisk wylogowania na dole.

**Główne elementy:**

- Kontener `<aside>` lub `<nav>` z tłem i paddingiem
- Nagłówek z logo/nazwą aplikacji (opcjonalnie jako link do `/app/generator`)
- `<SidebarNav>` - lista linków nawigacyjnych
- Spacer (flex-grow) dla wypchania przycisku logout na dół
- `<Button>` "Wyloguj" na dole sidebara

**Obsługiwane interakcje:**

- Kliknięcie na link nawigacyjny → przekierowanie do odpowiedniego widoku
- Kliknięcie "Wyloguj" → wywołanie `supabase.auth.signOut()` i przekierowanie do `/`

**Warunki walidacji:**

- Brak bezpośredniej walidacji (wymaga sesji w layoutcie)

**Typy:**

- `SidebarProps: { currentPath: string }`

**Propsy:**

- `currentPath`: Aktywna ścieżka do podświetlenia odpowiedniego linku

---

### 4.3. SidebarNav (React)

**Opis:** Lista nawigacyjna zawierająca linki do wszystkich głównych widoków aplikacji. Podświetla aktualnie aktywny widok.

**Główne elementy:**

- `<nav>` z listą `<ul>`
- 5 elementów `<SidebarNavItem>`:
  1. "Generator AI" → `/app/generator`
  2. "Moje fiszki" → `/app/flashcards`
  3. "Dodaj fiszkę" → `/app/flashcards/new`
  4. "Sesja nauki" → `/app/study`
  5. "Konto" → `/app/account`

**Obsługiwane interakcje:**

- Kliknięcie na link → nawigacja do widoku
- Wizualne wskazanie aktywnego linku

**Warunki walidacji:**

- Brak

**Typy:**

- `SidebarNavProps: { currentPath: string }`
- `NavItem: { label: string; href: string; icon?: React.ReactNode }`

**Propsy:**

- `currentPath`: Aktualna ścieżka dla podświetlenia aktywnego elementu

---

### 4.4. SidebarNavItem (React)

**Opis:** Pojedynczy element nawigacyjny w Sidebar. Wyświetla link z ikoną i etykietą, z możliwością wizualnego wskazania aktywnego stanu.

**Główne elementy:**

- `<li>` z linkiem `<a>` (lub komponentem Link)
- Ikona (opcjonalna)
- Etykieta tekstowa
- Styling dla stanu aktywnego (np. bold, background, border)

**Obsługiwane interakcje:**

- Kliknięcie → nawigacja do `href`
- Hover → zmiana stylu

**Warunki walidacji:**

- Brak

**Typy:**

- `SidebarNavItemProps: { label: string; href: string; icon?: React.ReactNode; isActive: boolean }`

**Propsy:**

- `label`: Tekst linku
- `href`: Ścieżka docelowa
- `icon`: Opcjonalna ikona (React element)
- `isActive`: Czy link jest aktywny (podświetlenie)

---

### 4.5. AccountView (React)

**Opis:** Główny komponent widoku konta. Wyświetla informacje o użytkowniku i umożliwia zarządzanie kontem (usunięcie).

**Główne elementy:**

- Nagłówek `<h1>` "Moje konto"
- Komponent `<AccountInfo>` z informacjami o użytkowniku
- Komponent `<DeleteAccountDialog>` dla usunięcia konta
- Komponent `<Toaster>` dla powiadomień

**Obsługiwane interakcje:**

- Kliknięcie "Usuń konto" → otwiera dialog potwierdzenia
- Potwierdzenie w dialogu → wywołuje API DELETE i wylogowuje użytkownika
- Anulowanie → zamyka dialog

**Warunki walidacji:**

- Dialog wymaga zaznaczenia checkboxa potwierdzenia przed aktywacją przycisku "Usuń"

**Typy:**

- `AccountViewProps: { user: UserAccountDTO }`
- `UserAccountDTO` (nowy typ w types.ts)

**Propsy:**

- `user`: Obiekt z danymi użytkownika (email, id, created_at)

---

### 4.6. AccountInfo (React)

**Opis:** Komponent wyświetlający podstawowe informacje o koncie użytkownika w formie karty.

**Główne elementy:**

- `<Card>` jako kontener
- `<CardHeader>` z tytułem "Informacje o koncie"
- `<CardContent>` z listą informacji:
  - Email użytkownika (Label + wartość)
  - Data utworzenia konta (Label + sformatowana data)
  - Status konta (Badge "Aktywne")

**Obsługiwane interakcje:**

- Brak - komponent tylko do odczytu

**Warunki walidacji:**

- Brak

**Typy:**

- `AccountInfoProps: { user: UserAccountDTO }`

**Propsy:**

- `user`: Obiekt z danymi użytkownika

---

### 4.7. DeleteAccountDialog (React)

**Opis:** Dialog z ostrzeżeniem i potwierdzeniem usunięcia konta. Zawiera checkbox do potwierdzenia świadomości nieodwracalności operacji.

**Główne elementy:**

- `<AlertDialog>` (shadcn/ui)
- `<AlertDialogTrigger>` - przycisk "Usuń konto" (variant destructive)
- `<AlertDialogContent>`:
  - `<AlertDialogHeader>`:
    - `<AlertDialogTitle>` "Czy na pewno chcesz usunąć konto?"
    - `<AlertDialogDescription>` - ostrzeżenie o nieodwracalności
  - Checkbox z tekstem potwierdzenia (np. "Rozumiem, że ta operacja jest nieodwracalna i usunie wszystkie moje dane")
  - `<AlertDialogFooter>`:
    - `<AlertDialogCancel>` - przycisk "Anuluj"
    - `<AlertDialogAction>` - przycisk "Usuń konto" (disabled gdy checkbox nie zaznaczony)

**Obsługiwane interakcje:**

- Kliknięcie "Usuń konto" (trigger) → otwiera dialog
- Zaznaczenie checkboxa → aktywuje przycisk akcji
- Kliknięcie "Anuluj" → zamyka dialog
- Kliknięcie "Usuń konto" (action) → wywołuje `handleDeleteAccount()`

**Warunki walidacji:**

- Checkbox musi być zaznaczony, aby przycisk akcji był aktywny
- Sprawdzenie odpowiedzi API (200 OK)

**Typy:**

- `DeleteAccountDialogProps: { onDeleteSuccess: () => void }`

**Propsy:**

- `onDeleteSuccess`: Callback wywoływany po pomyślnym usunięciu konta

---

### 4.8. useAccount (Custom Hook)

**Opis:** Hook zarządzający stanem widoku konta, w tym operacją usunięcia konta i wylogowania.

**Zwracane wartości:**

```typescript
{
  user: UserAccountDTO | null;
  isLoading: boolean;
  error: string | null;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}
```

**Logika:**

- Pobieranie danych użytkownika z Supabase (`supabase.auth.getUser()`)
- Obsługa usunięcia konta:
  1. Wywołanie `DELETE /api/user/account`
  2. Wylogowanie użytkownika (`supabase.auth.signOut()`)
  3. Przekierowanie do `/`
- Obsługa wylogowania (dla Sidebar)

---

## 5. Typy

### 5.1. Nowe typy do dodania w `src/types.ts`

```typescript
/**
 * User account DTO - podstawowe informacje o koncie użytkownika
 * Używane w widoku konta
 */
export interface UserAccountDTO {
  id: string; // UUID użytkownika z Supabase Auth
  email: string;
  created_at: string; // ISO 8601
}

/**
 * Response dla DELETE /api/user/account
 */
export interface DeleteAccountResponseDTO {
  success: true;
  message: string;
}
```

### 5.2. Props dla nowych komponentów

```typescript
// AppLayout (Astro)
interface AppLayoutProps {
  title?: string;
}

// Sidebar (React)
interface SidebarProps {
  currentPath: string;
  client: init; // Dla obsługi wylogowania
}

// SidebarNav (React)
interface SidebarNavProps {
  currentPath: string;
}

// NavItem (wewnętrzny typ)
interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// SidebarNavItem (React)
interface SidebarNavItemProps {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isActive: boolean;
}

// AccountView (React)
interface AccountViewProps {
  user: UserAccountDTO;
  client: init; // Supabase client dla operacji
}

// AccountInfo (React)
interface AccountInfoProps {
  user: UserAccountDTO;
}

// DeleteAccountDialog (React)
interface DeleteAccountDialogProps {
  onDeleteSuccess: () => void;
  client: init;
}
```

### 5.3. Hook return types

```typescript
// useAccount hook
interface UseAccountReturn {
  user: UserAccountDTO | null;
  isLoading: boolean;
  error: string | null;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}
```

## 6. Zarządzanie stanem

### 6.1. Stan w komponencie AccountView

**Stan lokalny (useState):**

- `isDialogOpen: boolean` - stan otwarcia dialogu usunięcia konta
- `isConfirmed: boolean` - stan checkboxa potwierdzenia
- `isDeleting: boolean` - stan ładowania podczas usuwania

**Hook useAccount:**

- Zarządza operacjami na koncie (usuwanie, wylogowanie)
- Pobiera dane użytkownika z Supabase
- Obsługuje błędy i stan ładowania

### 6.2. Stan w komponencie Sidebar

**Stan lokalny:**

- Brak - komponent prezentacyjny z przekazanymi props

**Przekazywany stan:**

- `currentPath` - aktywna ścieżka z Astro.url.pathname

### 6.3. Zarządzanie sesją

Sesja użytkownika jest zarządzana przez Supabase Auth:

- W AppLayout sprawdzamy sesję: `await supabase.auth.getSession()`
- W przypadku braku sesji → redirect do `/`
- Dane użytkownika przekazywane jako props do AccountView

## 7. Integracja API

### 7.1. Endpoint usunięcia konta

**Endpoint:** `DELETE /api/user/account`

**Request:**

- Headers: `Authorization: Bearer <supabase_jwt_token>`
- Body: Brak

**Success Response (200 OK):**

```typescript
{
  success: true,
  message: "Account and all associated data permanently deleted"
}
```

**Error Responses:**

- 401 Unauthorized: Brak lub nieprawidłowy token

```typescript
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Missing or invalid authentication token"
  }
}
```

- 500 Internal Server Error: Błąd bazy danych

```typescript
{
  success: false,
  error: {
    code: "INTERNAL_ERROR",
    message: "Failed to delete account"
  }
}
```

### 7.2. Implementacja w komponencie

```typescript
const deleteAccount = async () => {
  try {
    setIsDeleting(true);

    const response = await fetch("/api/user/account", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    // Wylogowanie i przekierowanie
    await supabase.auth.signOut();
    window.location.href = "/";

    toast.success("Konto zostało pomyślnie usunięte");
  } catch (error) {
    toast.error(error.message || "Nie udało się usunąć konta");
  } finally {
    setIsDeleting(false);
  }
};
```

### 7.3. Typy żądania i odpowiedzi

**Request:** Brak body, tylko Authorization header

**Response Type:** `DeleteAccountResponseDTO | ApiErrorDTO`

## 8. Interakcje użytkownika

### 8.1. Nawigacja w Sidebar

1. **Wyświetlenie Sidebar:**
   - Użytkownik widzi listę linków nawigacyjnych
   - Aktywny widok jest podświetlony (bold, kolor, background)

2. **Kliknięcie linku nawigacyjnego:**
   - Przekierowanie do wybranego widoku
   - Aktualizacja podświetlenia aktywnego elementu

3. **Kliknięcie przycisku "Wyloguj":**
   - Wywołanie `supabase.auth.signOut()`
   - Przekierowanie do `/`
   - Wyświetlenie toast "Zostałeś wylogowany"

### 8.2. Przeglądanie informacji o koncie

1. **Wejście na `/app/account`:**
   - Automatyczne pobranie danych użytkownika z sesji
   - Wyświetlenie email i daty utworzenia konta
   - Wyświetlenie przycisku "Usuń konto"

### 8.3. Usunięcie konta

1. **Kliknięcie "Usuń konto":**
   - Otwiera się AlertDialog z ostrzeżeniem
   - Przycisk akcji "Usuń konto" jest disabled

2. **Zaznaczenie checkboxa potwierdzenia:**
   - Przycisk "Usuń konto" w dialogu staje się aktywny
   - Czerwony kolor przycisku (variant destructive)

3. **Kliknięcie "Usuń konto" w dialogu:**
   - Przycisk zmienia się w stan loading (spinner)
   - Wywołanie API DELETE /api/user/account
4. **Sukces:**
   - Toast "Konto zostało pomyślnie usunięte"
   - Automatyczne wylogowanie
   - Przekierowanie do `/`

5. **Błąd:**
   - Dialog pozostaje otwarty
   - Toast z komunikatem błędu
   - Możliwość ponowienia próby lub anulowania

6. **Kliknięcie "Anuluj":**
   - Dialog zostaje zamknięty
   - Checkbox wraca do stanu niezaznaczonego

## 9. Warunki i walidacja

### 9.1. Autoryzacja (AppLayout)

**Warunek:** Użytkownik musi mieć aktywną sesję Supabase

**Weryfikacja:**

```typescript
const {
  data: { session },
  error,
} = await supabase.auth.getSession();

if (!session || error) {
  return Astro.redirect("/");
}
```

**Wpływ na UI:** Jeśli brak sesji, użytkownik jest przekierowywany do strony logowania (nie widzi widoku konta)

### 9.2. Walidacja checkboxa potwierdzenia

**Warunek:** Checkbox musi być zaznaczony przed aktywacją przycisku "Usuń konto"

**Weryfikacja:**

```typescript
const [isConfirmed, setIsConfirmed] = useState(false);

// W komponencie Button
<Button
  disabled={!isConfirmed || isDeleting}
  onClick={handleDelete}
>
  {isDeleting ? 'Usuwanie...' : 'Usuń konto'}
</Button>
```

**Wpływ na UI:** Przycisk jest disabled (szary, nieklikowalny) dopóki checkbox nie jest zaznaczony

### 9.3. Walidacja odpowiedzi API

**Warunek:** API musi zwrócić status 200 i `success: true`

**Weryfikacja:**

```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error.message);
}
```

**Wpływ na UI:**

- Sukces → Toast sukcesu, wylogowanie, redirect
- Błąd → Toast błędu, dialog pozostaje otwarty

### 9.4. Stan ładowania

**Warunek:** Podczas operacji usuwania blokujemy UI

**Weryfikacja:**

```typescript
const [isDeleting, setIsDeleting] = useState(false);
```

**Wpływ na UI:**

- Przycisk pokazuje spinner i tekst "Usuwanie..."
- Przycisk jest disabled
- Użytkownik nie może zamknąć dialogu

## 10. Obsługa błędów

### 10.1. Błąd pobierania danych użytkownika

**Scenariusz:** Supabase nie może zwrócić danych sesji

**Obsługa:**

- W AppLayout: przekierowanie do `/`
- Użytkownik nie widzi widoku konta

**Komunikat:** Brak (automatyczne przekierowanie)

### 10.2. Błąd API podczas usuwania konta

**Scenariusz:** API zwraca błąd 401, 500 lub timeout

**Obsługa:**

```typescript
catch (error) {
  console.error('Delete account error:', error);
  toast.error(
    error.message || 'Nie udało się usunąć konta. Spróbuj ponownie.'
  );
  setIsDeleting(false);
  // Dialog pozostaje otwarty
}
```

**Komunikat dla użytkownika:**

- 401: "Sesja wygasła. Zaloguj się ponownie."
- 500: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Timeout: "Przekroczono limit czasu. Sprawdź połączenie internetowe."

### 10.3. Błąd wylogowania po usunięciu konta

**Scenariusz:** Konto zostało usunięte, ale wylogowanie kończy się błędem

**Obsługa:**

```typescript
try {
  await supabase.auth.signOut();
} catch (error) {
  console.error("Logout error:", error);
  // Mimo błędu wylogowania, przekierowujemy użytkownika
  // Sesja zostanie usunięta przez Supabase automatycznie
}
window.location.href = "/";
```

**Komunikat:** Toast sukcesu dla usunięcia konta (ignorujemy błąd wylogowania)

### 10.4. Błąd sieciowy

**Scenariusz:** Brak połączenia z internetem podczas usuwania konta

**Obsługa:**

```typescript
catch (error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie.');
  } else {
    toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}
```

**Komunikat dla użytkownika:** "Brak połączenia z internetem. Sprawdź swoje połączenie."

### 10.5. Edge case: Wielokrotne kliknięcie przycisku

**Scenariusz:** Użytkownik wielokrotnie klika "Usuń konto" przed zakończeniem operacji

**Obsługa:**

- Użycie flagi `isDeleting` do disabled przycisku
- Prevent default na przycisku podczas ładowania

```typescript
const handleDelete = async () => {
  if (isDeleting) return; // Dodatkowa ochrona
  setIsDeleting(true);
  // ... logika usuwania
};
```

**Wpływ na UI:** Przycisk jest disabled, nie można kliknąć ponownie

## 11. Kroki implementacji

### Krok 1: Rozszerzenie typów (src/types.ts)

- [ ] Dodać interfejs `UserAccountDTO`
- [ ] Dodać interfejs `DeleteAccountResponseDTO`
- [ ] Dodać typy Props dla wszystkich nowych komponentów

### Krok 2: Stworzenie AppLayout (src/layouts/AppLayout.astro)

- [ ] Utworzyć plik `src/layouts/AppLayout.astro`
- [ ] Zaimplementować sprawdzanie sesji Supabase
- [ ] Dodać przekierowanie dla niezalogowanych użytkowników
- [ ] Zaimplementować dwukolumnowy layout (grid lub flex)
- [ ] Dodać slot dla głównej treści
- [ ] Przekazać dane użytkownika do slot

### Krok 3: Implementacja Sidebar

- [ ] Utworzyć `src/components/navigation/Sidebar.tsx`
- [ ] Dodać logo/nazwę aplikacji
- [ ] Zaimplementować `SidebarNav` jako podkomponent
- [ ] Utworzyć `src/components/navigation/SidebarNavItem.tsx`
- [ ] Dodać logikę podświetlania aktywnego linku
- [ ] Dodać przycisk "Wyloguj" na dole Sidebar
- [ ] Zaimplementować obsługę wylogowania
- [ ] Dodać style (Tailwind) dla Sidebar

### Krok 4: Custom Hook useAccount

- [ ] Utworzyć `src/components/account/useAccount.ts`
- [ ] Zaimplementować pobieranie danych użytkownika
- [ ] Dodać funkcję `deleteAccount()` z wywołaniem API
- [ ] Dodać funkcję `logout()`
- [ ] Dodać obsługę stanów: loading, error
- [ ] Zaimplementować error handling

### Krok 5: Komponent AccountInfo

- [ ] Utworzyć `src/components/account/AccountInfo.tsx`
- [ ] Użyć komponentów Card z shadcn/ui
- [ ] Wyświetlić email użytkownika
- [ ] Wyświetlić datę utworzenia konta (sformatowaną)
- [ ] Dodać Badge "Aktywne"
- [ ] Dodać style (Tailwind)

### Krok 6: Komponent DeleteAccountDialog

- [ ] Utworzyć `src/components/account/DeleteAccountDialog.tsx`
- [ ] Zaimplementować AlertDialog z shadcn/ui
- [ ] Dodać trigger button (variant destructive)
- [ ] Dodać ostrzeżenie w opisie dialogu
- [ ] Zaimplementować checkbox potwierdzenia
- [ ] Dodać logikę disabled dla przycisku akcji
- [ ] Zaimplementować obsługę kliknięcia "Usuń konto"
- [ ] Dodać stan ładowania (spinner w przycisku)
- [ ] Zintegrować z hookiem useAccount

### Krok 7: Komponent AccountView

- [ ] Utworzyć `src/components/account/AccountView.tsx`
- [ ] Użyć hooka useAccount
- [ ] Zaimportować i użyć AccountInfo
- [ ] Zaimportować i użyć DeleteAccountDialog
- [ ] Dodać nagłówek "Moje konto"
- [ ] Dodać Toaster dla powiadomień
- [ ] Zaimplementować obsługę sukcesu usunięcia konta

### Krok 8: Strona Astro dla widoku konta

- [ ] Utworzyć `src/pages/app/account.astro`
- [ ] Użyć AppLayout jako layout
- [ ] Pobrać dane użytkownika z sesji Supabase
- [ ] Przekazać dane do komponentu AccountView
- [ ] Dodać title "Moje konto"
- [ ] Dodać client:load dla AccountView

### Krok 9: Aktualizacja istniejących widoków /app/\*

- [ ] Zmienić layout w `src/pages/app/flashcards.astro` na AppLayout
- [ ] Zmienić layout w `src/pages/app/flashcards/new.astro` na AppLayout
- [ ] Zmienić layout w `src/pages/app/flashcards/[id]/edit.astro` na AppLayout
- [ ] Zmienić layout w `src/pages/app/generator.astro` na AppLayout
- [ ] (Jeśli istnieje) Zmienić layout w `src/pages/app/study.astro` na AppLayout

### Krok 10: Endpoint API DELETE /api/user/account

- [ ] Utworzyć `src/pages/api/user/account.ts`
- [ ] Zaimplementować metodę DELETE
- [ ] Dodać walidację tokena autentykacji
- [ ] Zaimplementować usuwanie użytkownika z Supabase Auth
- [ ] (Cascade) Automatyczne usunięcie powiązanych danych (flashcards, generations)
- [ ] Dodać obsługę błędów (401, 500)
- [ ] Zwrócić odpowiedź w formacie DeleteAccountResponseDTO

### Krok 11: Testowanie i poprawki

- [ ] Przetestować wyświetlanie widoku konta
- [ ] Przetestować nawigację w Sidebar
- [ ] Przetestować wylogowanie z Sidebar
- [ ] Przetestować otwieranie dialogu usunięcia konta
- [ ] Przetestować walidację checkboxa
- [ ] Przetestować usunięcie konta (happy path)
- [ ] Przetestować obsługę błędów API
- [ ] Przetestować responsywność (mobile, tablet, desktop)
- [ ] Przetestować dostępność (keyboard navigation, ARIA)

### Krok 12: Styling i dopracowanie UI

- [ ] Dopracować kolory i spacing w Sidebar
- [ ] Dodać ikony do linków nawigacyjnych (opcjonalnie)
- [ ] Dopracować responsywność Sidebar (collapse na mobile?)
- [ ] Dodać animacje (hover states, transitions)
- [ ] Sprawdzić zgodność z design system (Tailwind theme)
- [ ] Przetestować dark mode (jeśli zaimplementowany)

### Krok 13: Dokumentacja

- [ ] Dodać komentarze JSDoc do komponentów
- [ ] Zaktualizować README (jeśli potrzebne)
- [ ] Dodać przykłady użycia w komentarzach

---

## Dodatkowe uwagi

### Bezpieczeństwo

- Endpoint usunięcia konta musi weryfikować token JWT z Supabase
- Operacja usunięcia jest nieodwracalna - wymaga wyraźnego potwierdzenia
- Wszystkie powiązane dane (fiszki, generacje) są usuwane automatycznie przez CASCADE w bazie danych
- Po usunięciu konta użytkownik jest automatycznie wylogowywany

### Dostępność (a11y)

- Sidebar: odpowiednie aria-labels dla nawigacji
- Dialog: focus trap, ESC do zamknięcia
- Checkbox: aria-describedby dla dodatkowych informacji
- Przyciski: odpowiednie aria-labels i disabled states
- Keyboard navigation: wszystkie interakcje dostępne z klawiatury

### Responsywność

- Sidebar: na mobile może być ukryty w hamburger menu (do rozważenia)
- Layout: stack vertical na małych ekranach
- Dialog: full-screen na małych ekranach dla lepszej czytelności

### UX Best Practices

- Wyraźne ostrzeżenie przed nieodwracalną operacją
- Loading states dla wszystkich operacji asynchronicznych
- Toast notifications dla feedback użytkownika
- Disabled states dla przycisków w trakcie operacji
- Error messages są czytelne i pomocne
