# Plan implementacji widoku Logowanie/Rejestracja (UI Only)

## 1. Przegląd

Widok logowania i rejestracji stanowi punkt wejścia do aplikacji 10x-cards. Jest to widok publiczny dostępny dla niezalogowanych użytkowników, prezentujący interfejs do utworzenia nowego konta lub zalogowania się do istniejącego.

**UWAGA:** Na obecnym etapie implementacji skupiamy się wyłącznie na warstwie UI bez integracji z API. Formularze będą zawierać walidację po stronie klienta, ale nie będą wykonywać żadnych rzeczywistych operacji logowania czy rejestracji.

Widok charakteryzuje się minimalistycznym, przyjaznym interfejsem z przełączaniem między formularzami logowania i rejestracji przy użyciu komponentu Tabs z biblioteki Shadcn/ui. Formularz rejestracyjny zawiera dodatkową walidację potwierdzenia hasła, a oba formularze realizują walidację w czasie rzeczywistym z wyświetlaniem komunikatów o błędach.

## 2. Routing widoku

- **Ścieżka:** `/`
- **Plik Astro:** `src/pages/index.astro`
- **Dostępność:** Widok publiczny (brak wymaganej autoryzacji)
- **Logika:** Tylko prezentacja UI, brak przekierowań (na razie)

## 3. Struktura komponentów

```
src/pages/index.astro
└── src/components/auth/
    ├── AuthView.tsx (główny kontener)
    │   ├── Card (shadcn/ui)
    │   │   ├── CardHeader
    │   │   │   ├── CardTitle
    │   │   │   └── CardDescription
    │   │   └── CardContent
    │   │       └── Tabs (shadcn/ui)
    │   │           ├── TabsList
    │   │           │   ├── TabsTrigger ("Logowanie")
    │   │           │   └── TabsTrigger ("Rejestracja")
    │   │           ├── TabsContent (Logowanie)
    │   │           │   └── LoginForm.tsx
    │   │           │       ├── Form fields (email, password)
    │   │           │       └── Button (submit - disabled)
    │   │           └── TabsContent (Rejestracja)
    │   │               └── RegisterForm.tsx
    │   │                   ├── Form fields (email, password, confirmPassword)
    │   │                   └── Button (submit - disabled)
    ├── LoginForm.tsx
    └── RegisterForm.tsx
```

**Uwaga:** W tej wersji nie ma hooka `useAuth` ani żadnych wywołań API. Przyciski submit są aktywne tylko gdy formularz jest poprawnie wypełniony, ale nie wykonują żadnej akcji.

## 4. Szczegóły komponentów

### AuthView.tsx

**Opis komponentu:**
Główny komponent kontenerowy dla widoku uwierzytelniania. Zawiera komponenty Card i Tabs z shadcn/ui, które umożliwiają przełączanie między formularzami logowania i rejestracji. Komponent odpowiada za ogólny layout i strukturę widoku.

**Główne elementy:**

- `div` z klasami Tailwind do centrowania na stronie (flex, items-center, justify-center, min-h-screen)
- `Card` - kontener z shadcn/ui
- `CardHeader` z tytułem "10x-cards" i opisem aplikacji
- `CardContent` zawierający komponent `Tabs`
- `Tabs` z dwoma zakładkami: "Logowanie" i "Rejestracja"
- Komponenty `LoginForm` i `RegisterForm` wewnątrz odpowiednich `TabsContent`

**Obsługiwane zdarzenia:**

- Przełączanie między tabami (obsługiwane przez komponent Tabs z shadcn/ui)
- Delegowanie zdarzeń submit do komponentów formularzy

**Warunki walidacji:**
N/A - walidacja jest delegowana do komponentów `LoginForm` i `RegisterForm`

**Typy:**

- Brak propsów - komponent nie przyjmuje żadnych propsów zewnętrznych

**Propsy:**

```typescript
// AuthView nie przyjmuje propsów
interface AuthViewProps {}
```

### LoginForm.tsx

**Opis komponentu:**
Formularz logowania z polami email i hasło. Zarządza stanem formularza i walidacją po stronie klienta. Wyświetla błędy walidacji inline przy polach. Na tym etapie formularz nie wykonuje żadnych operacji po kliknięciu submit - przycisk jest aktywny tylko gdy formularz jest poprawnie wypełniony.

**Główne elementy:**

- `form` element z obsługą `onSubmit` (preventDefault tylko)
- `Label` + `Input` dla pola email (type="email")
- `Label` + `Input` dla pola hasło (type="password")
- `Button` typu submit z tekstem "Zaloguj się" (aktywny gdy formularz jest poprawny)
- Komunikaty błędów walidacji pod każdym polem (warunkowe renderowanie)

**Obsługiwane zdarzenia:**

- `onSubmit` - zapobiega domyślnej akcji formularza (preventDefault), docelowo tutaj będzie logika API
- `onChange` - aktualizacja wartości pól formularza, czyszczenie błędów walidacji
- `onBlur` - walidacja pola po opuszczeniu (blur)

**Warunki walidacji:**

- **Email:**
  - Wymagane: pole nie może być puste
  - Format: musi być poprawnym adresem email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Komunikat błędu (puste): "Email jest wymagany"
  - Komunikat błędu (nieprawidłowy format): "Nieprawidłowy format adresu email"

- **Hasło:**
  - Wymagane: pole nie może być puste
  - Komunikat błędu: "Hasło jest wymagane"

**Typy:**

- `LoginFormData` - dane formularza
- `LoginFormErrors` - błędy walidacji

**Propsy:**

```typescript
// LoginForm nie przyjmuje propsów
interface LoginFormProps {}
```

### RegisterForm.tsx

**Opis komponentu:**
Formularz rejestracji z polami email, hasło i powtórz hasło. Zarządza stanem formularza i walidacją po stronie klienta (w tym zgodność haseł). Wyświetla błędy walidacji inline przy polach. Na tym etapie formularz nie wykonuje żadnych operacji po kliknięciu submit - przycisk jest aktywny tylko gdy formularz jest poprawnie wypełniony.

**Główne elementy:**

- `form` element z obsługą `onSubmit` (preventDefault tylko)
- `Label` + `Input` dla pola email (type="email")
- `Label` + `Input` dla pola hasło (type="password")
- `Label` + `Input` dla pola powtórz hasło (type="password")
- `Button` typu submit z tekstem "Zarejestruj się" (aktywny gdy formularz jest poprawny)
- Komunikaty błędów walidacji pod każdym polem (warunkowe renderowanie)

**Obsługiwane zdarzenia:**

- `onSubmit` - zapobiega domyślnej akcji formularza (preventDefault), docelowo tutaj będzie logika API
- `onChange` - aktualizacja wartości pól formularza, czyszczenie błędów walidacji
- `onBlur` - walidacja pola po opuszczeniu (blur)

**Warunki walidacji:**

- **Email:**
  - Wymagane: pole nie może być puste
  - Format: musi być poprawnym adresem email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Komunikat błędu (puste): "Email jest wymagany"
  - Komunikat błędu (nieprawidłowy format): "Nieprawidłowy format adresu email"

- **Hasło:**
  - Wymagane: pole nie może być puste
  - Minimalna długość: 6 znaków
  - Komunikat błędu (puste): "Hasło jest wymagane"
  - Komunikat błędu (za krótkie): "Hasło musi mieć minimum 6 znaków"

- **Powtórz hasło:**
  - Wymagane: pole nie może być puste
  - Zgodność: musi być identyczne z polem hasło
  - Komunikat błędu (puste): "Potwierdzenie hasła jest wymagane"
  - Komunikat błędu (niezgodne): "Hasła nie są identyczne"

**Typy:**

- `RegisterFormData` - dane formularza
- `RegisterFormErrors` - błędy walidacji

**Propsy:**

```typescript
// RegisterForm nie przyjmuje propsów
interface RegisterFormProps {}
```

## 5. Typy

**Uwaga:** W tej wersji UI-only nie potrzebujemy hooka `useAuth` ani typów związanych z API. Skupiamy się tylko na typach formularzy i walidacji.

### LoginFormData

```typescript
/**
 * Dane formularza logowania
 */
interface LoginFormData {
  email: string;
  password: string;
}
```

### RegisterFormData

```typescript
/**
 * Dane formularza rejestracji
 */
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}
```

### LoginFormErrors

```typescript
/**
 * Błędy walidacji formularza logowania
 */
interface LoginFormErrors {
  email?: string;
  password?: string;
}
```

### RegisterFormErrors

```typescript
/**
 * Błędy walidacji formularza rejestracji
 */
interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}
```

## 6. Zarządzanie stanem

**Uwaga:** W tej wersji UI-only zarządzanie stanem jest ograniczone tylko do stanu formularzy i walidacji. Nie ma integracji z API ani zarządzania sesją użytkownika.

### Stany formularzy (LoginForm, RegisterForm)

Każdy formularz zarządza własnym stanem lokalnym przy użyciu React hooks (`useState`):

1. **Dane formularza:**
   - `formData: LoginFormData | RegisterFormData` - wartości pól
   - Stan inicjalizowany pustymi stringami: `{ email: '', password: '', confirmPassword: '' }` (dla rejestracji)
   - Aktualizowany przy każdej zmianie pola input

2. **Błędy walidacji:**
   - `validationErrors: LoginFormErrors | RegisterFormErrors` - błędy dla poszczególnych pól
   - Aktualizowane przy `onBlur` (po opuszczeniu pola) i `onSubmit` (przed wysłaniem formularza)
   - Czyszczone automatycznie gdy użytkownik zaczyna edytować pole

3. **Stan przycisku submit:**
   - Przycisk jest disabled gdy:
     - Jakiekolwiek pole jest puste
     - Istnieją błędy walidacji w `validationErrors`
     - Formularze nie zostały w ogóle dotknięte (opcjonalnie)

4. **Brak stanu ładowania:**
   - W tej wersji nie ma stanu `isLoading`, ponieważ nie ma wywołań API
   - Przycisk submit nie wykonuje żadnej akcji (tylko `preventDefault`)

### Przepływ danych

1. **Inicjalizacja:**

   ```typescript
   const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
   const [validationErrors, setValidationErrors] = useState<LoginFormErrors>({});
   ```

2. **Zmiana wartości pola:**
   - Użytkownik wpisuje tekst
   - `handleChange(field, value)` aktualizuje `formData`
   - Jeśli istniał błąd dla tego pola, jest czyszczony

3. **Walidacja przy blur:**
   - Użytkownik opuszcza pole
   - `handleBlur(field)` uruchamia walidację dla tego pola
   - Jeśli walidacja nie przechodzi, błąd jest zapisywany w `validationErrors`

4. **Wysłanie formularza:**
   - Użytkownik klika submit
   - `handleSubmit(e)` wywołuje `e.preventDefault()`
   - Wykonywana jest pełna walidacja wszystkich pól
   - Jeśli walidacja przechodzi, formularz jest "gotowy" (ale nic nie robi w tej wersji)
   - Jeśli walidacja nie przechodzi, błędy są wyświetlane

## 7. Integracja API

**UWAGA:** Na obecnym etapie implementacji **NIE MA INTEGRACJI Z API**.

Ta wersja widoku skupia się wyłącznie na warstwie prezentacyjnej (UI). Formularze:

- Zawierają pełną walidację po stronie klienta
- Wyświetlają błędy walidacji w czasie rzeczywistym
- Mają aktywny przycisk submit tylko gdy formularz jest poprawnie wypełniony
- **NIE** wykonują żadnych wywołań do Supabase Auth ani innych API
- **NIE** przekierowują użytkownika nigdzie
- **NIE** zapisują żadnych danych

### Przygotowanie do przyszłej integracji

W przyszłości, gdy będziemy dodawać integrację z API, należy:

1. **Utworzyć hook `useAuth`** z następującymi funkcjami:
   - `login(email, password)` - wywołanie Supabase Auth SDK: `supabase.auth.signInWithPassword()`
   - `register(email, password)` - wywołanie Supabase Auth SDK: `supabase.auth.signUp()`
   - Stan `isLoading` i `error`
   - Mapowanie błędów API na przyjazne komunikaty po polsku

2. **Dodać wywołania w formularzach:**
   - W `handleSubmit` funkcjach dodać wywołania do hooka `useAuth`
   - Obsłużyć stany ładowania (loading spinner na przycisku)
   - Wyświetlać błędy API w komponentach `Alert`
   - Przekierować użytkownika do `/app/generator` przy sukcesie

3. **Dodać import klienta Supabase:**
   - Import z `src/db/supabase.client.ts`

Na razie wszystkie te elementy są **pominięte** w implementacji.

## 8. Interakcje użytkownika

### Przełączanie między formularzami

- **Akcja:** Kliknięcie na zakładkę "Logowanie" lub "Rejestracja"
- **Rezultat:** Zmiana aktywnego taba, wyświetlenie odpowiedniego formularza
- **Stan:** Formularze zachowują swój stan (nie są resetowane przy zmianie taba)

### Wypełnianie pola formularza

- **Akcja:** Wpisywanie tekstu w pole input
- **Rezultat:** Aktualizacja stanu `formData` dla danego pola
- **Stan:** Czyszczenie błędu walidacji dla danego pola (jeśli istniał)

### Opuszczenie pola (blur)

- **Akcja:** Użytkownik klika poza pole lub przechodzi tabem do następnego
- **Rezultat:** Walidacja pola, wyświetlenie błędu walidacji (jeśli występuje)
- **Stan:** Aktualizacja `validationErrors` dla danego pola

### Wysłanie formularza logowania

- **Akcja:** Kliknięcie przycisku "Zaloguj się" lub naciśnięcie Enter w polu
- **Rezultat (w tej wersji UI-only):**
  1. Wywołanie `e.preventDefault()` - zapobiegnie domyślnej akcji formularza
  2. Walidacja wszystkich pól
  3. Jeśli walidacja przechodzi: formularz jest "gotowy" (konsola log lub nic)
  4. Jeśli walidacja nie przechodzi: wyświetlenie wszystkich błędów walidacji
- **Stan:** Aktualizacja `validationErrors` jeśli występują błędy

**Uwaga:** W przyszłej wersji z API tutaj zostanie dodane wywołanie do hooka `useAuth.login()`, przekierowanie użytkownika oraz obsługa błędów API.

### Wysłanie formularza rejestracji

- **Akcja:** Kliknięcie przycisku "Zarejestruj się" lub naciśnięcie Enter w polu
- **Rezultat (w tej wersji UI-only):**
  1. Wywołanie `e.preventDefault()` - zapobiegnie domyślnej akcji formularza
  2. Walidacja wszystkich pól (w tym zgodność haseł)
  3. Jeśli walidacja przechodzi: formularz jest "gotowy" (konsola log lub nic)
  4. Jeśli walidacja nie przechodzi: wyświetlenie wszystkich błędów walidacji
- **Stan:** Aktualizacja `validationErrors` jeśli występują błędy

**Uwaga:** W przyszłej wersji z API tutaj zostanie dodane wywołanie do hooka `useAuth.register()`, przekierowanie użytkownika oraz obsługa błędów API.

### Nawigacja klawiaturą

- **Akcja:** Użycie klawisza Tab do przechodzenia między polami
- **Rezultat:** Focus przemieszcza się między interaktywnymi elementami w logicznej kolejności
- **Dostępność:** Wszystkie elementy są osiągalne przez klawiaturę, przyciski i zakładki obsługują Enter/Space

## 9. Warunki i walidacja

### Walidacja pola email (LoginForm i RegisterForm)

**Komponenty:** `LoginForm`, `RegisterForm`  
**Timing:** onBlur, onSubmit

**Warunki:**

1. **Pole puste:**
   - Warunek: `email.trim() === ""`
   - Komunikat: "Email jest wymagany"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

2. **Nieprawidłowy format:**
   - Warunek: `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)`
   - Komunikat: "Nieprawidłowy format adresu email"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

### Walidacja pola hasło - Logowanie (LoginForm)

**Komponent:** `LoginForm`  
**Timing:** onBlur, onSubmit

**Warunki:**

1. **Pole puste:**
   - Warunek: `password === ""`
   - Komunikat: "Hasło jest wymagane"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

### Walidacja pola hasło - Rejestracja (RegisterForm)

**Komponent:** `RegisterForm`  
**Timing:** onBlur, onSubmit

**Warunki:**

1. **Pole puste:**
   - Warunek: `password === ""`
   - Komunikat: "Hasło jest wymagane"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

2. **Za krótkie hasło:**
   - Warunek: `password.length < 6`
   - Komunikat: "Hasło musi mieć minimum 6 znaków"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

### Walidacja pola powtórz hasło (RegisterForm)

**Komponent:** `RegisterForm`  
**Timing:** onBlur, onSubmit

**Warunki:**

1. **Pole puste:**
   - Warunek: `confirmPassword === ""`
   - Komunikat: "Potwierdzenie hasła jest wymagane"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

2. **Hasła niezgodne:**
   - Warunek: `confirmPassword !== password`
   - Komunikat: "Hasła nie są identyczne"
   - Wpływ na UI: Czerwona ramka input, komunikat pod polem, przycisk submit disabled

### Stan przycisku Submit

**Komponenty:** `LoginForm`, `RegisterForm`

**Warunki disabled:**

- Jakiekolwiek błędy walidacji w `validationErrors` (obiekt nie jest pusty)
- Jakiekolwiek puste wymagane pola w `formData`
- Logika: `disabled={!isFormValid()}` gdzie `isFormValid()` sprawdza oba warunki

**Wizualizacja:**

- Przycisk z atrybutem `disabled`
- Opacity zmniejszona (np. `opacity-50`)
- Cursor: not-allowed (`cursor-not-allowed`)
- Tailwind classes: `disabled:opacity-50 disabled:cursor-not-allowed`

## 10. Obsługa błędów

**UWAGA:** W tej wersji UI-only obsługujemy tylko błędy walidacji po stronie klienta. Nie ma obsługi błędów API, ponieważ nie ma integracji z API.

### Błędy walidacji (po stronie klienta)

**Kategoria:** Błędy walidacji formularza

**Obsługa:**

1. **Timing:** Walidacja uruchamiana przy `onBlur` (opuszczenie pola) i `onSubmit` (wysłanie formularza)
2. **Wyświetlanie:** Komunikaty błędów wyświetlane bezpośrednio pod odpowiednimi polami
3. **Stylowanie:**
   - Czerwona ramka wokół pola input (border-red-500)
   - Czerwony tekst komunikatu błędu (text-red-500)
   - Mały rozmiar czcionki (text-sm)
4. **Dostępność:**
   - Komunikaty błędów powiązane z inputami przez `aria-describedby`
   - Input ma `aria-invalid="true"` gdy zawiera błąd
   - Role i etykiety zgodne z ARIA
5. **Czyszczenie:** Błędy czyszczone automatycznie gdy użytkownik zaczyna edytować pole (zdarzenie `onChange`)

**Przykładowe błędy:**

- Puste wymagane pole: "Email jest wymagany", "Hasło jest wymagane"
- Nieprawidłowy format email: "Nieprawidłowy format adresu email"
- Za krótkie hasło: "Hasło musi mieć minimum 6 znaków"
- Niezgodne hasła (rejestracja): "Hasła nie są identyczne"

**Przykładowa struktura JSX z błędem:**

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    value={formData.email}
    onChange={(e) => handleChange("email", e.target.value)}
    onBlur={() => handleBlur("email")}
    aria-invalid={!!validationErrors.email}
    aria-describedby={validationErrors.email ? "email-error" : undefined}
    className={validationErrors.email ? "border-red-500" : ""}
  />
  {validationErrors.email && (
    <p id="email-error" className="text-sm text-red-500">
      {validationErrors.email}
    </p>
  )}
</div>
```

### Przypadki brzegowe

**1. Użytkownik próbuje wysłać pusty formularz:**

- Warunki: Wszystkie pola są puste
- Akcja: `handleSubmit` uruchamia walidację wszystkich pól
- Rezultat: Wszystkie błędy są wyświetlane pod odpowiednimi polami
- Przycisk submit pozostaje disabled

**2. Użytkownik wpisuje nieprawidłowy email:**

- Warunki: Email nie pasuje do regex
- Akcja: Walidacja uruchamiana przy `onBlur`
- Rezultat: Wyświetlenie komunikatu "Nieprawidłowy format adresu email"
- Przycisk submit jest disabled

**3. Hasła niezgodne (rejestracja):**

- Warunki: `password !== confirmPassword`
- Akcja: Walidacja przy `onBlur` na polu confirmPassword
- Rezultat: Wyświetlenie komunikatu "Hasła nie są identyczne"
- Przycisk submit jest disabled

### Best practices

1. **Używaj języka polskiego** dla wszystkich komunikatów użytkownika
2. **Bądź konkretny** - jasno określ co jest nie tak (np. "Hasło za krótkie" zamiast "Błąd")
3. **Waliduj w czasie rzeczywistym** - użytkownik dostaje natychmiastowy feedback
4. **Nie blokuj interakcji** - użytkownik może edytować wszystkie pola niezależnie od błędów
5. **Czyszczenie błędów** - automatycznie przy edycji pola
6. **Dostępność** - wszystkie błędy ogłaszane przez czytniki ekranu

### Przyszłe rozszerzenie (z API)

Gdy dodamy integrację z API, należy rozszerzyć obsługę błędów o:

- Błędy z Supabase Auth (nieprawidłowe credentials, email już istnieje, itp.)
- Błędy sieci (brak połączenia, timeout)
- Wyświetlanie błędów API w komponencie `Alert` nad formularzem
- Mapowanie błędów API na przyjazne komunikaty po polsku

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

- Utworzyć katalog `src/components/auth/`
- Utworzyć pliki:
  - `AuthView.tsx`
  - `LoginForm.tsx`
  - `RegisterForm.tsx`

**Uwaga:** Nie tworzymy pliku `useAuth.ts` w tej wersji UI-only.

### Krok 2: Definicja typów

- Dodać do `src/types.ts` nowe interfejsy:
  - `LoginFormData`
  - `RegisterFormData`
  - `LoginFormErrors`
  - `RegisterFormErrors`

**Uwaga:** Nie dodajemy typu `UseAuthReturn` w tej wersji.

### Krok 3: Implementacja LoginForm

- Utworzyć komponent `src/components/auth/LoginForm.tsx`
- Zaimportować React hooks: `useState`
- Zaimportować komponenty shadcn/ui: `Label`, `Input`, `Button`
- Utworzyć stan lokalny używając `useState`:
  - `formData: LoginFormData` - inicjalizowany jako `{ email: '', password: '' }`
  - `validationErrors: LoginFormErrors` - inicjalizowany jako `{}`
- Zaimplementować funkcje walidacji:
  - `validateEmail(email: string): string | undefined` - zwraca komunikat błędu lub undefined
  - `validatePassword(password: string): string | undefined` - zwraca komunikat błędu lub undefined
  - `validateField(field: keyof LoginFormData): void` - waliduje jedno pole i aktualizuje `validationErrors`
  - `validateForm(): boolean` - waliduje wszystkie pola i zwraca czy formularz jest poprawny
- Zaimplementować obsługę zdarzeń:
  - `handleChange(field: keyof LoginFormData, value: string)` - aktualizuje formData i czyści błąd tego pola
  - `handleBlur(field: keyof LoginFormData)` - uruchamia walidację pojedynczego pola
  - `handleSubmit(e: React.FormEvent)` - zapobiega domyślnej akcji, waliduje formularz, opcjonalnie loguje sukces
- Zaimplementować funkcję pomocniczą:
  - `isFormValid(): boolean` - sprawdza czy wszystkie pola są wypełnione i brak błędów walidacji
- Zbudować JSX:
  - `<form>` element z `onSubmit={handleSubmit}`
  - Sekcja z polem email: `<Label>`, `<Input>`, komunikat błędu
  - Sekcja z polem password: `<Label>`, `<Input>`, komunikat błędu
  - `<Button>` submit z atrybutem `disabled={!isFormValid()}`
  - Wszystkie elementy z odpowiednimi atrybutami ARIA dla dostępności

### Krok 4: Implementacja RegisterForm

- Utworzyć komponent `src/components/auth/RegisterForm.tsx`
- Zaimportować React hooks: `useState`
- Zaimportować komponenty shadcn/ui: `Label`, `Input`, `Button`
- Utworzyć stan lokalny używając `useState`:
  - `formData: RegisterFormData` - inicjalizowany jako `{ email: '', password: '', confirmPassword: '' }`
  - `validationErrors: RegisterFormErrors` - inicjalizowany jako `{}`
- Zaimplementować funkcje walidacji:
  - `validateEmail(email: string): string | undefined`
  - `validatePassword(password: string): string | undefined` - sprawdza długość minimum 6 znaków
  - `validateConfirmPassword(confirmPassword: string, password: string): string | undefined` - sprawdza zgodność
  - `validateField(field: keyof RegisterFormData): void`
  - `validateForm(): boolean`
- Zaimplementować obsługę zdarzeń:
  - `handleChange(field: keyof RegisterFormData, value: string)`
  - `handleBlur(field: keyof RegisterFormData)`
  - `handleSubmit(e: React.FormEvent)`
- Zaimplementować funkcję pomocniczą:
  - `isFormValid(): boolean`
- Zbudować JSX:
  - `<form>` element z `onSubmit={handleSubmit}`
  - Sekcja z polem email
  - Sekcja z polem password
  - Sekcja z polem confirmPassword
  - `<Button>` submit z `disabled={!isFormValid()}`
  - Wszystkie elementy z odpowiednimi atrybutami ARIA

### Krok 5: Implementacja AuthView

- Utworzyć komponent `src/components/auth/AuthView.tsx`
- Zaimportować komponenty shadcn/ui: `Card`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Zaimportować `LoginForm` i `RegisterForm`
- Zbudować strukturę:
  - Kontener z Tailwind classes do centrowania
  - Card z CardHeader (tytuł, opis aplikacji)
  - CardContent z komponentem Tabs
  - Tabs z dwoma triggerami: "Logowanie" i "Rejestracja"
  - TabsContent z LoginForm dla taba logowania
  - TabsContent z RegisterForm dla taba rejestracji
- Dodać obsługę czyszczenia błędów przy zmianie taba (opcjonalne)

### Krok 6: Integracja w stronie index.astro

- Otworzyć `src/pages/index.astro`
- Zaimportować `AuthView`: `import AuthView from '@/components/auth/AuthView'`
- Użyć layout `Layout` z `src/layouts/Layout.astro`
- Dodać komponent `AuthView` z dyrektywą `client:load`:
  ```astro
  <Layout title="Logowanie - 10x-cards">
    <AuthView client:load />
  </Layout>
  ```

### Krok 7: Stylowanie i dostępność

- Upewnić się, że wszystkie pola mają odpowiednie `Label` z atrybutem `htmlFor`
- Dodać `aria-describedby` do inputów, które mają błędy walidacji
- Dodać `aria-invalid` do inputów z błędami
- Przetestować nawigację klawiaturą (Tab, Enter, Escape)
- Sprawdzić kontrast kolorów (WCAG AA)
- Upewnić się, że przyciski i linki mają odpowiednie focus states
- Sprawdzić responsywność na różnych rozmiarach ekranu (mobile-first)
- Dodać Tailwind classes dla stanów: hover, focus, disabled

### Krok 8: Testowanie funkcjonalności UI

**UWAGA:** W tej wersji UI-only testujemy tylko walidację i interakcje, nie funkcjonalność API.

- **Test 1:** Walidacja pól - puste pola
  - Wypełnić formularz logowania i opuścić pola bez wpisywania niczego
  - Oczekiwany rezultat: Wyświetlenie komunikatów "Email jest wymagany", "Hasło jest wymagane"
  - Przycisk submit powinien być disabled

- **Test 2:** Walidacja email - nieprawidłowy format
  - Wpisać nieprawidłowy email (np. "test", "test@", "test@example")
  - Opuścić pole (blur)
  - Oczekiwany rezultat: Wyświetlenie komunikatu "Nieprawidłowy format adresu email"
  - Przycisk submit disabled

- **Test 3:** Walidacja hasła - za krótkie (rejestracja)
  - W formularzu rejestracji wpisać hasło krótsze niż 6 znaków
  - Opuścić pole
  - Oczekiwany rezultat: Wyświetlenie komunikatu "Hasło musi mieć minimum 6 znaków"
  - Przycisk submit disabled

- **Test 4:** Walidacja zgodności haseł (rejestracja)
  - Wpisać różne wartości w pola hasło i powtórz hasło
  - Opuścić pole potwierdzenia hasła
  - Oczekiwany rezultat: Wyświetlenie komunikatu "Hasła nie są identyczne"
  - Przycisk submit disabled

- **Test 5:** Poprawne wypełnienie formularza
  - Wypełnić wszystkie pola prawidłowymi danymi
  - Oczekiwany rezultat: Wszystkie błędy znikają, przycisk submit staje się aktywny
  - Kliknięcie przycisku wywołuje preventDefault i nic więcej się nie dzieje

- **Test 6:** Czyszczenie błędów przy edycji
  - Zostawić pole puste i opuścić je (pojawi się błąd)
  - Zacząć wpisywać tekst w to pole
  - Oczekiwany rezultat: Błąd znika natychmiast przy rozpoczęciu edycji

- **Test 7:** Przełączanie między tabami
  - Wypełnić formularz logowania z błędami
  - Przełączyć na tab rejestracji
  - Wrócić na tab logowania
  - Oczekiwany rezultat: Formularze zachowują swój stan (błędy i wartości)

- **Test 8:** Nawigacja klawiaturą
  - Używając tylko klawiatury (Tab, Shift+Tab, Enter, Space)
  - Przejść przez wszystkie elementy formularza
  - Oczekiwany rezultat: Wszystkie elementy są dostępne, widoczny focus, możliwość interakcji

### Krok 9: Testowanie dostępności

- Uruchomić Lighthouse Accessibility Audit (wynik minimum 90)
- Przetestować z czytnikiem ekranu (VoiceOver na Mac lub NVDA na Windows)
- Sprawdzić czy wszystkie etykiety są poprawnie ogłaszane
- Sprawdzić czy błędy walidacji są ogłaszane
- Przetestować nawigację tylko klawiaturą
- Sprawdzić kolejność tabulacji (logiczna: od góry do dołu, od lewej do prawej)
- Sprawdzić czy focus jest zawsze widoczny

### Krok 10: Optymalizacja i czyszczenie kodu

- Code review: sprawdzenie czy kod jest czytelny i zgodny z best practices
- Usunięcie zbędnych console.log
- Sprawdzenie czy wszystkie typy są prawidłowo zdefiniowane i używane
- Sprawdzenie czy nie ma duplikacji kodu
  - Rozważyć wydzielenie wspólnej logiki walidacji email (używanej w obu formularzach)
  - Rozważyć stworzenie wspólnego komponentu FormField z Label, Input i komunikatem błędu
- Dodanie komentarzy JSDoc do funkcji i komponentów
- Upewnić się, że wszystkie stringi są w języku polskim

### Krok 11: Dokumentacja i podsumowanie

- Dodać komentarze do komponentów wyjaśniające ich cel
- Dodać komentarze do skomplikowanych funkcji (np. walidacja)
- Stworzyć notatkę o tym, co zostało zaimplementowane i co będzie dodane później:
  - ✅ Zaimplementowano: UI, walidacja po stronie klienta, dostępność
  - ⏳ Do dodania w przyszłości: Hook useAuth, integracja z Supabase, przekierowania, obsługa błędów API

### Krok 12: Przygotowanie do przyszłej integracji z API

- Dodać komentarze TODO w miejscach gdzie będzie integracja z API:
  - W `handleSubmit` funkcjach dodać komentarz: `// TODO: Add useAuth.login() / useAuth.register() call here`
  - W importach dodać komentarz: `// TODO: Import useAuth hook when implementing API integration`
- Upewnić się, że struktura kodu pozwala na łatwe dodanie hooka useAuth bez refaktoryzacji
- Dokumentacja w README o tym, że to wersja UI-only i jak dodać integrację z API
