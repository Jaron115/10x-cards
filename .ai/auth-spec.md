# Specyfikacja Techniczna Modułu Autentykacji - 10x-cards

## Wersja dokumentu

- Wersja: 2.0 (zaktualizowana)
- Data: Październik 2024
- Status: Propozycja implementacji - uproszczona z wykorzystaniem Supabase Auth

### Historia zmian v2.0:

- ✅ Usunięto funkcjonalność forgot/reset password (poza zakresem US-001 i US-002)
- ✅ Dodano automatyczne logowanie po rejestracji (wymaganie z US-001)
- ✅ Usunięto customowe Zod schemas dla auth (Supabase waliduje automatycznie)
- ✅ Usunięto customowy rate limiting (Supabase ma wbudowany)
- ✅ Uproszczono implementację endpointów wykorzystując wbudowane funkcjonalności Supabase
- ✅ Zmniejszono estymację czasu z 18-26h do 14-20h
- ✅ Dodano weryfikację zgodności z wymaganiami PRD

## 1. WPROWADZENIE

### 1.1 Cel dokumentu

Niniejszy dokument zawiera szczegółową specyfikację techniczną implementacji modułu autentykacji dla aplikacji 10x-cards wykorzystującego **wbudowany Supabase Auth**. Specyfikacja obejmuje rejestrację z automatycznym logowaniem, logowanie z przekierowaniem do generatora oraz wylogowanie, zgodnie z wymaganiami US-001 i US-002 z dokumentu PRD.

**Kluczowa zasada:** Maksymalne wykorzystanie gotowych funkcjonalności Supabase Auth, minimalizacja customowego kodu.

### 1.2 Zakres funkcjonalny

**Wymagania obligatoryjne (z PRD):**

- **US-001: Rejestracja konta** - formularz rejestracyjny z email i hasłem, automatyczne logowanie po rejestracji
- **US-002: Logowanie do aplikacji** - formularz logowania z przekierowaniem do generatora, bezpieczne zarządzanie sesją
- **Dodatkowe funkcjonalności**: wylogowanie

**Funkcjonalności nice-to-have (poza zakresem MVP z PRD):**

- Odzyskiwanie hasła (forgot password/reset password) - można zaimplementować później jeśli będzie potrzeba

### 1.3 Istniejący stan aplikacji

Aplikacja posiada już:

- Skonfigurowany Supabase Client (`src/db/supabase.client.ts`)
- Middleware wstrzykujący Supabase do `context.locals`
- Formularze UI dla logowania i rejestracji (bez integracji z API)
- Walidację po stronie klienta (`src/lib/validation/auth.validation.ts`)
- RLS policies w bazie danych PostgreSQL wymagające autentykowanego użytkownika
- Architekturę stron chronionych (`/app/*`) i publicznych (`/`)

**Obecne ograniczenia:**

- Brak prawdziwej autentykacji - używany jest `DEFAULT_USER_ID`
- Middleware nie weryfikuje sesji użytkownika
- Brak endpointów API dla operacji auth
- Brak mechanizmu przekierowań między stronami publicznymi a chronionymi

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Podział stron: publiczne vs chronione

#### 2.1.1 Strony publiczne (dostępne dla niezalogowanych)

| Ścieżka | Plik                    | Opis                                  | Redirect jeśli zalogowany |
| ------- | ----------------------- | ------------------------------------- | ------------------------- |
| `/`     | `src/pages/index.astro` | Strona główna z widokiem autentykacji | `/app/generator`          |

**Charakterystyka:**

- Renderowane server-side przez Astro
- Sprawdzają obecność sesji w middleware/na poziomie strony
- Jeśli użytkownik jest zalogowany → redirect do `/app/generator`
- Layout: `src/layouts/Layout.astro` (podstawowy, bez sidebaru)

#### 2.1.2 Strony chronione (wymagają zalogowania)

| Ścieżka                     | Plik                                       | Opis                | Redirect jeśli niezalogowany |
| --------------------------- | ------------------------------------------ | ------------------- | ---------------------------- |
| `/app/generator`            | `src/pages/app/generator.astro`            | Generator fiszek AI | `/`                          |
| `/app/flashcards`           | `src/pages/app/flashcards/index.astro`     | Lista fiszek        | `/`                          |
| `/app/flashcards/new`       | `src/pages/app/flashcards/new.astro`       | Dodaj fiszkę        | `/`                          |
| `/app/flashcards/[id]/edit` | `src/pages/app/flashcards/[id]/edit.astro` | Edytuj fiszkę       | `/`                          |
| `/app/account`              | `src/pages/app/account.astro`              | Konto użytkownika   | `/`                          |

**Charakterystyka:**

- Renderowane server-side przez Astro
- Layout: `src/layouts/AppLayout.astro` (z sideбаrem i nawigacją)
- Middleware lub kod strony sprawdza sesję użytkownika
- Jeśli brak sesji → redirect do `/`
- Otrzymują dane użytkownika z `Astro.locals.user`

### 2.2 Komponenty React (client-side)

#### 2.2.1 Komponent `AuthView` (istniejący - do rozszerzenia)

**Lokalizacja:** `src/components/auth/AuthView.tsx`

**Odpowiedzialności:**

- Renderowanie kontenerowego widoku z kartą (Card)
- Zarządzanie zakładkami (Tabs) dla przełączania Login/Register
- Obsługa globalnych komunikatów o sukcesie/błędzie (toasty)
- Integracja z komponentami LoginForm i RegisterForm

**Proponowane zmiany:**

- Dodanie obsługi stanu dla udanej rejestracji (komunikat + informacja o weryfikacji email, jeśli wymagana)
- Dodanie obsługi stanu dla udanego logowania (redirect wykonywany przez backend, ale komponent może pokazać loading)
- Opcjonalnie: dodanie zakładki "Zapomniałeś hasła?" lub osobnego linku

**Integracja:**

- Używany w `src/pages/index.astro` z dyrektywą `client:load`

#### 2.2.2 Komponent `LoginForm` (istniejący - do rozszerzenia)

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Obecne odpowiedzialności:**

- Zarządzanie stanem formularza (email, password)
- Walidacja kliencka z feedback użytkownikowi
- Obsługa zdarzeń onChange, onBlur, onSubmit

**Typy błędów do obsługi:**

- Błędy walidacji (klient - już obsłużone)
- Nieprawidłowe dane logowania (serwer - 401)
- Błędy sieciowe (500, timeout)
- Rate limiting (429)

#### 2.2.3 Komponent `RegisterForm` (istniejący - do rozszerzenia)

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Obecne odpowiedzialności:**

- Zarządzanie stanem formularza (email, password, confirmPassword)
- Walidacja kliencka
- Obsługa zdarzeń

**Typy błędów do obsługi:**

- Email już istnieje (409 Conflict)
- Hasło niespełniające wymagań Supabase (400)
- Błędy walidacji (klient + serwer)
- Błędy sieciowe

#### 2.2.4 Custom Hook `useAuth` (nowy)

**Lokalizacja:** `src/components/auth/useAuth.ts`

**Odpowiedzialności:**

- Centralizacja logiki komunikacji z API auth
- Zarządzanie stanami (loading, error)
- Zapewnienie spójnego interfejsu dla komponentów

**Interfejs:**

```typescript
export interface UseAuthReturn {
  // Akcje
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: Omit<RegisterFormData, "confirmPassword">) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Stany
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin", // Ważne dla cookies
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "Błąd logowania";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = "Błąd sieci. Spróbuj ponownie.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Omit<RegisterFormData, "confirmPassword">) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "Błąd rejestracji";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = "Błąd sieci. Spróbuj ponownie.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      // Przekierowanie po wylogowaniu
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Mimo błędu, przekieruj użytkownika
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  };
}
```

#### 2.2.5 Aktualizacja komponentu Sidebar (istniejący)

**Lokalizacja:** `src/components/navigation/Sidebar.tsx`

**Zmiany:**

- Funkcja `handleLogout` powinna używać `useAuth().logout()`
- Usunięcie mock userEmail - email będzie przekazywany z `Astro.locals.user`

```typescript
export const Sidebar = ({ currentPath, userEmail }: SidebarProps) => {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    // ... existing JSX
    <Button
      variant="outline"
      className="w-full"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
};
```

### 2.4 Walidacja i komunikaty błędów

#### 2.4.1 Walidacja po stronie klienta (istniejąca)

**Lokalizacja:** `src/lib/validation/auth.validation.ts`

Obecne funkcje są wystarczające:

- `validateEmail()` - format email
- `validateLoginPassword()` - niepuste hasło
- `validateRegisterPassword()` - min 6 znaków
- `validateConfirmPassword()` - zgodność haseł

#### 2.4.2 Komunikaty błędów z serwera (do obsługi w UI)

**Mapowanie kodów błędów:**
| Kod HTTP | Code | Komunikat użytkownika |
|----------|------|----------------------|
| 400 | VALIDATION_ERROR | "Nieprawidłowe dane. Sprawdź formularz." |
| 401 | UNAUTHORIZED | "Nieprawidłowy email lub hasło." |
| 409 | CONFLICT | "Konto z tym adresem email już istnieje." |
| 429 | RATE_LIMIT_EXCEEDED | "Zbyt wiele prób. Spróbuj ponownie później." |
| 500 | INTERNAL_ERROR | "Wystąpił błąd serwera. Spróbuj ponownie." |

### 2.5 Przepływ użytkownika (User Flow)

#### 2.5.1 Scenariusz: Rejestracja nowego użytkownika

**Zgodnie z US-001: "Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany"**

1. Użytkownik wchodzi na `/` (jest niezalogowany)
2. Wybiera zakładkę "Rejestracja"
3. Wypełnia formularz (email, hasło, potwierdź hasło)
4. Walidacja kliencka podczas wpisywania (onBlur)
5. Kliknięcie "Zarejestruj się"
6. Frontend: walidacja całego formularza
7. Frontend: wywołanie `useAuth().register()`
8. Backend: POST `/api/auth/register`
   - Wywołanie `supabase.auth.signUp()` (Supabase waliduje dane automatycznie)
   - Supabase tworzy sesję automatycznie podczas signUp
   - Ustawienie session cookies (HTTPOnly, Secure)
   - Obsługa błędów (email zajęty, itp.)
9. Odpowiedź z serwera:
   - **Sukces (201):** Toast "Konto utworzone!", automatyczne przekierowanie do `/app/generator` (użytkownik jest już zalogowany)
   - **Błąd (4xx/5xx):** Wyświetlenie komunikatu o błędzie
10. Użytkownik znajduje się w aplikacji jako zalogowany

#### 2.5.2 Scenariusz: Logowanie istniejącego użytkownika

1. Użytkownik wchodzi na `/` (jest niezalogowany)
2. Wypełnia formularz logowania (email, hasło)
3. Walidacja kliencka
4. Kliknięcie "Zaloguj się"
5. Frontend: wywołanie `useAuth().login()`
6. Backend: POST `/api/auth/login`
   - Walidacja danych
   - Wywołanie `supabase.auth.signInWithPassword()`
   - Ustawienie session cookie (HTTPOnly, Secure)
7. Odpowiedź z serwera:
   - **Sukces (200):** Przekierowanie do `/app/generator` (przez `window.location.href`)
   - **Błąd (401):** "Nieprawidłowy email lub hasło"
8. Użytkownik znajduje się na stronie `/app/generator`

#### 2.5.3 Scenariusz: Próba dostępu do chronionej strony bez logowania

1. Użytkownik (niezalogowany) próbuje wejść na `/app/generator`
2. Middleware sprawdza sesję w `Astro.locals`
3. Brak sesji → `Astro.redirect('/')`
4. Użytkownik zostaje przekierowany na stronę logowania

#### 2.5.4 Scenariusz: Wylogowanie

1. Użytkownik (zalogowany) klika "Wyloguj" w Sidebar
2. Frontend: wywołanie `useAuth().logout()`
3. Backend: POST `/api/auth/logout`
   - Wywołanie `supabase.auth.signOut()`
   - Usunięcie session cookie
4. Przekierowanie do `/`
5. Użytkownik widzi stronę logowania

---

**Uwaga:** Funkcjonalność odzyskiwania hasła (forgot/reset password) nie jest wymagana w US-001 i US-002. Może być dodana później jako nice-to-have feature. Supabase Auth ma wbudowane wsparcie dla tej funkcjonalności poprzez `supabase.auth.resetPasswordForEmail()`.

---

## 3. LOGIKA BACKENDOWA

### 3.1 Endpoints API

**Wymagane endpointy (zgodnie z US-001 i US-002):**

- POST `/api/auth/register` - rejestracja z automatycznym logowaniem
- POST `/api/auth/login` - logowanie
- POST `/api/auth/logout` - wylogowanie

Wszystkie endpointy będą umieszczone w katalogu `src/pages/api/auth/`.

#### 3.1.1 POST `/api/auth/register`

**Lokalizacja:** `src/pages/api/auth/register.ts`

**Odpowiedzialności:**

- Rejestracja nowego użytkownika w Supabase Auth
- Walidacja danych wejściowych (email, hasło)
- Obsługa błędów (email już istnieje, słabe hasło, itp.)

**Request Body:**

```typescript
{
  email: string; // Format email, wymagane
  password: string; // Min 6 znaków, wymagane
}
```

**Response (201 Created):**

```typescript
{
  success: true;
  data: {
    user: {
      id: string; // UUID użytkownika
      email: string;
    }
    message: string; // "Account created successfully"
  }
}
```

**Error Responses:**
| Status | Code | Scenariusz |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Nieprawidłowy format danych |
| 409 | CONFLICT | Email już zarejestrowany |
| 422 | VALIDATION_ERROR | Hasło nie spełnia wymagań Supabase |
| 500 | INTERNAL_ERROR | Błąd Supabase lub serwera |

**Implementacja (uproszczona - wykorzystująca Supabase Auth):**

```typescript
export const prerender = false;

export async function POST({ request, locals, cookies }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Parse request body
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON");
  }

  // 2. Sprawdź czy pola są obecne (podstawowa walidacja)
  if (!body.email || !body.password) {
    return createErrorResponse(400, "VALIDATION_ERROR", "Email and password are required");
  }

  // 3. Wywołaj Supabase Auth signUp
  // Supabase automatycznie:
  // - Waliduje format email
  // - Waliduje długość hasła (min 6 znaków)
  // - Sprawdza unikalność email
  // - Tworzy sesję (access_token i refresh_token)
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  // 4. Obsługa błędów z Supabase
  if (error) {
    console.error("[AUTH] Registration error:", error);
    const mappedError = mapSupabaseAuthError(error);
    return createErrorResponse(mappedError.status, mappedError.code, mappedError.message);
  }

  // 5. Ustaw session cookies (użytkownik automatycznie zalogowany)
  if (data.session) {
    cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: data.session.expires_in,
    });

    cookies.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dni
    });
  }

  // 6. Success response
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: "Account created successfully. You are now logged in.",
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kluczowe zmiany:**

- ❌ Usunięto Zod schema - Supabase waliduje automatycznie
- ✅ Dodano ustawienie cookies po rejestracji (zgodnie z US-001: automatyczne logowanie)
- ✅ Wykorzystano `mapSupabaseAuthError()` helper do mapowania błędów

#### 3.1.2 POST `/api/auth/login`

**Lokalizacja:** `src/pages/api/auth/login.ts`

**Odpowiedzialności:**

- Logowanie użytkownika w Supabase Auth
- Ustawienie session cookie (HTTPOnly, Secure, SameSite)
- Zwrócenie danych użytkownika

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK):**

```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
    }
    session: {
      access_token: string; // JWT token (opcjonalnie, jeśli potrzebny w JS)
      refresh_token: string; // Refresh token (opcjonalnie)
      expires_at: number; // Unix timestamp
    }
  }
}
```

**Uwaga:** Session będzie przechowywana w HTTPOnly cookie, więc dostęp do tokenów w JS nie jest konieczny.

**Error Responses:**
| Status | Code | Scenariusz |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Nieprawidłowy format danych |
| 401 | UNAUTHORIZED | Nieprawidłowe dane logowania |
| 429 | RATE_LIMIT_EXCEEDED | Za dużo prób logowania |
| 500 | INTERNAL_ERROR | Błąd Supabase lub serwera |

**Implementacja (uproszczona - wykorzystująca Supabase Auth):**

```typescript
export const prerender = false;

export async function POST({ request, locals, cookies }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Parse request body
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON");
  }

  // 2. Sprawdź czy pola są obecne
  if (!body.email || !body.password) {
    return createErrorResponse(400, "VALIDATION_ERROR", "Email and password are required");
  }

  // 3. Wywołaj Supabase Auth signInWithPassword
  // Supabase automatycznie:
  // - Sprawdza czy użytkownik istnieje
  // - Weryfikuje hasło
  // - Tworzy nową sesję
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  // 4. Obsługa błędów z Supabase
  if (error) {
    console.error("[AUTH] Login error:", error);
    const mappedError = mapSupabaseAuthError(error);
    return createErrorResponse(mappedError.status, mappedError.code, mappedError.message);
  }

  // 5. Ustaw session cookies
  cookies.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: data.session.expires_in,
  });

  cookies.set("sb-refresh-token", data.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dni
  });

  // 6. Success response
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Kluczowe zmiany:**

- ❌ Usunięto Zod schema - Supabase waliduje automatycznie
- ✅ Uproszczono obsługę błędów wykorzystując helper `mapSupabaseAuthError()`

#### 3.1.3 POST `/api/auth/logout`

**Lokalizacja:** `src/pages/api/auth/logout.ts`

**Odpowiedzialności:**

- Wylogowanie użytkownika z Supabase Auth
- Usunięcie session cookies

**Request Body:** Brak (może być pusty JSON `{}`)

**Response (200 OK):**

```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

**Error Responses:**
| Status | Code | Scenariusz |
|--------|------|-----------|
| 500 | INTERNAL_ERROR | Błąd serwera |

**Implementacja (pseudokod):**

```typescript
export const prerender = false;

export async function POST({ locals, cookies }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Get access token from cookie
  const accessToken = cookies.get("sb-access-token")?.value;

  // 2. Call Supabase Auth signOut (opcjonalnie, jeśli mamy token)
  if (accessToken) {
    await supabase.auth.signOut();
  }

  // 3. Delete session cookies
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  // 4. Success response
  return new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

---

**Endpointy poza zakresem MVP (nice-to-have):**

- `POST /api/auth/forgot-password` - można dodać później używając `supabase.auth.resetPasswordForEmail()`
- `POST /api/auth/reset-password` - można dodać później używając `supabase.auth.updateUser()`

---

### 3.2 Walidacja danych wejściowych

**Zasada:** Supabase Auth ma wbudowaną walidację email i hasła. Nie potrzebujemy customowych Zod schemas dla operacji auth.

**Walidacja kliencka (już istniejąca):**

- `src/lib/validation/auth.validation.ts` - funkcje walidacji formularzy po stronie klienta (React)
- Używane do pokazywania błędów w czasie rzeczywistym (onBlur, onChange)

**Walidacja serwerowa:**

- **Supabase Auth automatycznie waliduje:**
  - Format email (RFC 5322)
  - Minimalną długość hasła (6 znaków domyślnie, konfigurowalne w Supabase Dashboard)
  - Unikalność email
- **Zwraca szczegółowe błędy** które możemy mapować na przyjazne komunikaty dla użytkownika

**Backend endpoints** nie muszą implementować własnej walidacji Zod dla auth - wystarczy przekazać dane do Supabase i obsłużyć błędy.

### 3.3 Aktualizacja Middleware

**Lokalizacja:** `src/middleware/index.ts`

**Obecny stan:** Middleware wstrzykuje tylko Supabase client do `context.locals`.

**Wymagane zmiany:**

1. Odczyt session cookies
2. Weryfikacja JWT tokenu z Supabase
3. Wstrzyknięcie danych użytkownika do `context.locals`
4. Obsługa odświeżania tokenu (refresh token)

**Implementacja:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Inject Supabase client into context for all routes
  context.locals.supabase = supabaseClient;

  // 2. Get session tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // 3. If no access token, user is not authenticated
  if (!accessToken) {
    context.locals.user = null;
    return next();
  }

  // 4. Verify and get user from access token
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(accessToken);

  // 5. If token is valid, inject user into context
  if (!error && user) {
    context.locals.user = user;
    return next();
  }

  // 6. If access token is expired, try to refresh using refresh token
  if (error && refreshToken) {
    const { data, error: refreshError } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!refreshError && data.session) {
      // Update cookies with new tokens
      context.cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: data.session.expires_in,
      });

      context.cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      // Inject user into context
      context.locals.user = data.user;
      return next();
    }
  }

  // 7. Token invalid and refresh failed - clear cookies
  context.cookies.delete("sb-access-token", { path: "/" });
  context.cookies.delete("sb-refresh-token", { path: "/" });
  context.locals.user = null;

  return next();
});
```

**Aktualizacja typów w `src/env.d.ts`:**

```typescript
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null; // Dodane
    }
  }
}
```

### 3.4 Ochrona stron chronionych (Protected Pages)

**Podejście:** Każda strona w `/app/*` powinna sprawdzać obecność użytkownika i przekierowywać do `/` jeśli niezalogowany.

**Wzorzec dla stron chronionych:**

```typescript
---
// Przykład: src/pages/app/generator.astro
import AppLayout from "@/layouts/AppLayout.astro";
import { GeneratorView } from "@/components/generator/GeneratorView";

// Check if user is authenticated
const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/');
}
---

<AppLayout title="Generator AI - 10x Cards">
  <GeneratorView client:load />
</AppLayout>
```

**Alternatywne podejście (middleware na poziomie routing):**
Można utworzyć osobny middleware lub funkcję helper:

**Lokalizacja:** `src/lib/auth/guards.ts`

```typescript
import type { AstroGlobal } from "astro";
import type { User } from "@supabase/supabase-js";

/**
 * Guard for protected routes
 * Returns user if authenticated, redirects to / if not
 */
export function requireAuth(Astro: AstroGlobal): User {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/");
  }

  return user;
}

/**
 * Guard for public routes (login/register)
 * Redirects to /app/generator if already authenticated
 */
export function requireGuest(Astro: AstroGlobal): void {
  const user = Astro.locals.user;

  if (user) {
    return Astro.redirect("/app/generator");
  }
}
```

**Użycie w stronach:**

```typescript
---
// Protected page
import { requireAuth } from '@/lib/auth/guards';
const user = requireAuth(Astro);
---

---
// Public page (login)
import { requireGuest } from '@/lib/auth/guards';
requireGuest(Astro);
---
```

### 3.5 Aktualizacja istniejących endpointów API

**Problem:** Obecne endpointy używają `DEFAULT_USER_ID` i mają TODO komentarze dla autentykacji.

**Pliki do aktualizacji:**

- `src/pages/api/flashcards/index.ts`
- `src/pages/api/flashcards/[id].ts`
- `src/pages/api/flashcards/bulk.ts`
- `src/pages/api/generations.ts`
- `src/pages/api/user/account.ts`

**Wzorzec aktualizacji:**

```typescript
// BEFORE:
// const user = locals.user;
// if (!user) {
//   return createErrorResponse(401, "UNAUTHORIZED", "Invalid or missing authentication token");
// }
// const user_id = DEFAULT_USER_ID;

// AFTER:
const user = locals.user;

if (!user) {
  return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
}

const user_id = user.id;
```

**Uwaga:** Po tej zmianie, wszystkie API endpointy będą wymagać autentykacji. Frontend musi wysyłać requests z credentials: 'same-origin' aby cookies były dołączane.

### 3.6 Helper funkcje (utilities)

**Lokalizacja:** `src/lib/auth/helpers.ts` (nowy plik)

#### 3.6.1 Funkcja do tworzenia odpowiedzi błędów

```typescript
import type { ApiErrorDTO } from "@/types";

export function createErrorResponse(
  status: number,
  code: ApiErrorDTO["error"]["code"],
  message: string,
  details?: unknown
): Response {
  const errorResponse: ApiErrorDTO = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

#### 3.6.2 Funkcja do mapowania błędów Supabase

```typescript
import type { AuthError } from "@supabase/supabase-js";

export function mapSupabaseAuthError(error: AuthError): {
  status: number;
  code: ApiErrorDTO["error"]["code"];
  message: string;
} {
  // Email already registered
  if (error.message.includes("already registered") || error.message.includes("User already registered")) {
    return {
      status: 409,
      code: "CONFLICT",
      message: "Email address is already registered",
    };
  }

  // Invalid login credentials
  if (error.message.includes("Invalid login credentials")) {
    return {
      status: 401,
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    };
  }

  // Password requirements not met
  if (error.message.includes("password")) {
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Password does not meet security requirements",
    };
  }

  // Default internal error
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}
```

### 3.7 Obsługa błędów i logowanie

**Zasady:**

1. Wszystkie błędy Supabase logowane do console.error
2. Użytkownikom pokazywane są ogólne, przyjazne komunikaty
3. Szczegóły błędów (stack trace) NIE są zwracane w response (tylko w dev mode dla debugowania)

**Przykład logowania:**

```typescript
try {
  const { data, error } = await supabase.auth.signUp(...);

  if (error) {
    console.error('[AUTH] Registration error:', {
      message: error.message,
      status: error.status,
      name: error.name
    });

    const mappedError = mapSupabaseAuthError(error);
    return createErrorResponse(mappedError.status, mappedError.code, mappedError.message);
  }
} catch (error) {
  console.error('[AUTH] Unexpected error during registration:', error);
  return createErrorResponse(500, 'INTERNAL_ERROR', 'Registration failed');
}
```

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Supabase Auth - Konfiguracja

#### 4.1.1 Wymagane zmienne środowiskowe

Plik `.env` (już istniejące):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**Uwaga:** `SUPABASE_KEY` to **anon key** (public key), bezpieczny do użycia w aplikacji klienckich i SSR.

Dla operacji admin (usuwanie użytkownika w `DELETE /api/user/account`), potrzebny jest **service role key**:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 4.1.2 Tworzenie admin client (dla operacji privileged)

**Lokalizacja:** `src/db/supabase.admin.ts` (nowy plik)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
}

/**
 * Supabase Admin Client
 * WARNING: This client bypasses RLS policies. Use only for admin operations.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseAdminClient = typeof supabaseAdmin;
```

**Użycie w endpoint `DELETE /api/user/account`:**

```typescript
import { supabaseAdmin } from "@/db/supabase.admin";

// Delete user from Supabase Auth
const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

if (authError) {
  console.error("[AUTH] Failed to delete user from Auth:", authError);
  return createErrorResponse(500, "INTERNAL_ERROR", "Failed to delete account");
}
```

### 4.2 Session Management

#### 4.2.1 Strategia sesji: Cookie-based

- Access token przechowywany w HTTPOnly cookie (`sb-access-token`)
- Refresh token przechowywany w HTTPOnly cookie (`sb-refresh-token`)
- Tokeny NIE są dostępne dla JavaScript (bezpieczeństwo XSS)
- Middleware automatycznie odświeża wygasłe tokeny

#### 4.2.2 Czas życia tokenów

- **Access token:** 1 godzina (domyślnie w Supabase)
- **Refresh token:** 30 dni

#### 4.2.3 Refresh flow

1. Middleware sprawdza `sb-access-token`
2. Jeśli ważny → wstrzykuje użytkownika do `context.locals.user`
3. Jeśli wygasł → próbuje odświeżyć za pomocą `sb-refresh-token`
4. Jeśli refresh się powiedzie → aktualizuje cookies, wstrzykuje użytkownika
5. Jeśli refresh się nie powiedzie → usuwa cookies, `user = null`

**Diagram:**

```
Request → Middleware
  ├─ Access token valid? → Yes → Set user → Continue
  ├─ Access token expired? → Try refresh
  │    ├─ Refresh success → Update cookies → Set user → Continue
  │    └─ Refresh failed → Clear cookies → user = null → Continue
  └─ No access token → user = null → Continue
```

### 4.3 Row Level Security (RLS) Policies

RLS policies już istnieją w bazie danych (migracja `20251009000000_initial_schema.sql`).

**Kluczowe polityki:**

- Użytkownicy mogą odczytywać/modyfikować tylko swoje dane (`auth.uid() = user_id`)
- Wszystkie tabele (`flashcards`, `generations`, `generation_error_logs`) mają RLS włączone

**Po wdrożeniu autentykacji:**

- Supabase automatycznie używa JWT tokenu z cookie do identyfikacji użytkownika w zapytaniach
- `auth.uid()` w RLS policies zwróci ID zalogowanego użytkownika
- Zapytania bez tokenu lub z nieprawidłowym tokenem nie zwrócą żadnych danych

**Weryfikacja RLS:**

```sql
-- Test query (wykonaj w Supabase SQL Editor jako zalogowany użytkownik)
SELECT * FROM flashcards;
-- Powinno zwrócić tylko fiszki użytkownika

-- Test jako admin (powinno zwrócić wszystkie fiszki)
SELECT * FROM flashcards;
```

### 4.4 Email Configuration w Supabase

**Dla MVP wyłączamy email verification:**

**Supabase Dashboard:**

- Authentication → Settings → "Enable email confirmations" → **OFF**

Dzięki temu:

- Po rejestracji użytkownik jest od razu zalogowany (zgodnie z US-001)
- Nie trzeba czekać na potwierdzenie email
- Prostszy przepływ dla użytkownika

**W produkcji można włączyć** email verification dla dodatkowego bezpieczeństwa. Supabase ma gotowe szablony email w języku angielskim, które można przetłumaczyć na polski w: Authentication → Email Templates.

### 4.5 Bezpieczeństwo

#### 4.5.1 HTTPS

- Wymóg HTTPS w produkcji dla cookies `Secure`
- W developmencie (localhost) cookies działają bez HTTPS

#### 4.5.2 CSRF Protection

- Cookies `SameSite=lax` chronią przed atakami CSRF
- API endpointy nie wymagają CSRF tokenu (cookies są wystarczające)

#### 4.5.3 XSS Protection

- HTTPOnly cookies niedostępne dla JavaScript
- Walidacja wszystkich danych wejściowych (Zod)
- Escapowanie outputu w Astro (automatyczne)

#### 4.5.4 Rate Limiting

**Supabase Auth ma wbudowany rate limiting** dla operacji autentykacji:

- Login attempts: domyślnie 6 prób na godzinę na IP
- Registration: domyślnie 5 rejestracji na godzinę na IP
- Password reset: domyślnie 5 prób na godzinę na email

Limity można skonfigurować w Supabase Dashboard → Authentication → Rate Limits.

**Nie musimy implementować własnego rate limiting** - Supabase obsługuje to automatycznie i zwraca odpowiednie błędy 429 (Too Many Requests).

---

## 5. AKTUALIZACJA STRON ASTRO

### 5.1 Aktualizacja strony głównej

**Lokalizacja:** `src/pages/index.astro`

```typescript
---
import { AuthView } from "../components/auth/AuthView";
import Layout from "../layouts/Layout.astro";
import { requireGuest } from '@/lib/auth/guards';

// Redirect to /app/generator if already logged in
requireGuest(Astro);
---

<Layout title="Logowanie - 10x-cards">
  <AuthView client:load />
</Layout>
```

---

## 6. AKTUALIZACJA TYPÓW I KONTRAKTÓW

### 6.1 Typy Auth (dodać do `src/types.ts`)

```typescript
// ============================================================================
// Auth Types
// ============================================================================

/**
 * Request body for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Request body for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth user data returned in responses
 */
export interface AuthUserDTO {
  id: string; // UUID
  email: string;
}

/**
 * Response for successful registration
 */
export interface RegisterResponseDTO {
  user: AuthUserDTO;
  message: string;
}

/**
 * Session data returned after login
 */
export interface SessionDTO {
  access_token?: string; // Opcjonalne - jeśli potrzebne w JS
  refresh_token?: string; // Opcjonalne
  expires_at: number; // Unix timestamp
}

/**
 * Response for successful login
 */
export interface LoginResponseDTO {
  user: AuthUserDTO;
  session: SessionDTO;
}

/**
 * Response for logout
 */
export interface LogoutResponseDTO {
  success: true;
  message: string;
}
```

### 6.2 Aktualizacja `env.d.ts`

```typescript
/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null; // DODANE
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string; // DODANE (opcjonalne w dev, wymagane w prod)
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly OPENROUTER_TIMEOUT_MS?: string;
  readonly OPENROUTER_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 7. TESTOWANIE

### 7.1 Scenariusze testowe (manualne)

#### 7.1.1 Test rejestracji

1. Przejdź do `/`
2. Kliknij zakładkę "Rejestracja"
3. Wypełnij formularz:
   - Email: `test@example.com`
   - Hasło: `password123`
   - Potwierdź hasło: `password123`
4. Kliknij "Zarejestruj się"
5. **Oczekiwany rezultat:**
   - Toast "Konto utworzone!"
   - Przełączenie na zakładkę "Logowanie" (lub automatyczne logowanie)

#### 7.1.2 Test logowania

1. Przejdź do `/`
2. Wypełnij formularz logowania:
   - Email: `test@example.com`
   - Hasło: `password123`
3. Kliknij "Zaloguj się"
4. **Oczekiwany rezultat:**
   - Przekierowanie do `/app/generator`
   - Sidebar pokazuje email użytkownika
   - Dostęp do wszystkich stron w `/app/*`

#### 7.1.3 Test wylogowania

1. Będąc zalogowanym, kliknij "Wyloguj" w Sidebar
2. **Oczekiwany rezultat:**
   - Toast "Zostałeś wylogowany"
   - Przekierowanie do `/`
   - Brak dostępu do stron `/app/*` (próba wejścia przekierowuje do `/`)

#### 7.1.4 Test ochrony stron

1. Wyloguj się
2. Spróbuj wejść na `/app/flashcards`
3. **Oczekiwany rezultat:**
   - Natychmiastowe przekierowanie do `/`

#### 7.1.5 Test sesji i refresh token (automatyczny przez Supabase)

1. Zaloguj się
2. Poczekaj 1 godzinę (lub zmień czas ważności tokenu w Supabase na 1 minutę dla testów)
3. Odśwież stronę lub wykonaj akcję wymagającą autentykacji
4. **Oczekiwany rezultat:**
   - Token automatycznie odświeżony przez middleware
   - Użytkownik pozostaje zalogowany
   - Brak przekierowania do `/`

### 7.2 Obsługa błędów - scenariusze testowe

#### 7.2.1 Email już zajęty

1. Zarejestruj konto z emailem `test@example.com`
2. Spróbuj zarejestrować ponownie z tym samym emailem
3. **Oczekiwany rezultat:**
   - Błąd "Email address is already registered"
   - Status 409

#### 7.2.2 Nieprawidłowe dane logowania

1. Spróbuj zalogować się z nieprawidłowym hasłem
2. **Oczekiwany rezultat:**
   - Błąd "Invalid email or password"
   - Status 401

#### 7.2.3 Rate limiting (automatyczny przez Supabase)

1. Wykonaj 7 prób logowania z błędnym hasłem (domyślny limit Supabase: 6/godz)
2. **Oczekiwany rezultat:**
   - 7ma próba zwraca błąd 429 z Supabase "Too many requests"

---

## 8. DEPLOYMENT I KONFIGURACJA

### 8.1 Zmienne środowiskowe w produkcji

**Wymagane:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Konfiguracja w DigitalOcean / Docker:**

- Zmienne przekazane jako environment variables do kontenera
- `SUPABASE_SERVICE_ROLE_KEY` przechowywany bezpiecznie (secrets management)

### 8.2 Konfiguracja Supabase w produkcji

1. **Enable Auth Providers:**
   - Authentication → Providers → Email: **ENABLED**

2. **Email Confirmations:**
   - Authentication → Settings → "Enable email confirmations" → **OFF** (dla MVP)
   - W produkcji można włączyć dla dodatkowego bezpieczeństwa

3. **Site URL:**
   - Authentication → URL Configuration → Site URL: `https://yourdomain.com`

4. **Password Requirements:**
   - Domyślnie: min 6 znaków
   - Można dostosować w: Authentication → Settings → Password Requirements

5. **Rate Limiting:**
   - Supabase ma **wbudowane** rate limiting dla Auth API
   - Można dostosować limity w: Authentication → Rate Limits (jeśli potrzeba)

### 8.3 Monitoring i logi

**Zalecenia:**

1. Logowanie wszystkich operacji auth do console (z odpowiednim poziomem: info, error)
2. Monitorowanie metryk:
   - Liczba rejestracji
   - Liczba logowań
   - Liczba błędów auth
   - Liczba prób rate limitowanych
3. Alerting dla:
   - Wzrost liczby błędów auth (500)
   - Wzrost liczby nieprawidłowych prób logowania (potencjalny atak)

---

## 9. MIGRACJA Z OBECNEGO STANU

### 9.1 Plan migracji

**Krok 1: Przygotowanie**

- Utworzenie backupu bazy danych
- Przygotowanie zmiennych środowiskowych

**Krok 2: Backend**

1. Dodanie 3 endpointów auth: register, login, logout
2. Aktualizacja middleware (sprawdzanie sesji, refresh token)
3. Utworzenie Supabase admin client (dla DELETE account)
4. Dodanie helper functions (`createErrorResponse`, `mapSupabaseAuthError`)

**Krok 3: Frontend**

1. Utworzenie custom hook `useAuth`
2. Aktualizacja `LoginForm` i `RegisterForm` (integracja z useAuth)
3. Aktualizacja `Sidebar` (logout przez useAuth)

**Krok 4: Guards i ochrona stron**

1. Dodanie `requireAuth` i `requireGuest` guards
2. Aktualizacja wszystkich stron w `/app/*`
3. Aktualizacja strony głównej `/`

**Krok 5: Aktualizacja istniejących endpointów**

1. Zamiana `DEFAULT_USER_ID` na `Astro.locals.user.id`
2. Dodanie sprawdzenia autentykacji
3. Usunięcie TODO komentarzy

**Krok 6: Testowanie**

1. Testy manualne wszystkich scenariuszy
2. Weryfikacja RLS policies
3. Testowanie refresh token flow

**Krok 7: Deploy**

1. Konfiguracja zmiennych środowiskowych w produkcji (SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY)
2. Konfiguracja Supabase (wyłączenie email confirmation, ustawienie Site URL)
3. Deploy aplikacji
4. Smoke tests w produkcji

### 9.2 Backward compatibility

**Istniejące dane:**

- Obecny `DEFAULT_USER_ID` w tabeli `flashcards` i `generations` pozostaje bez zmian
- Po wdrożeniu auth, nowi użytkownicy będą mieć własne UUID
- Testowe dane mogą być zachowane lub usunięte

**Opcja 1 (zalecana dla MVP):**

- Usunąć wszystkie testowe dane przed wdrożeniem produkcyjnym
- Każdy użytkownik zaczyna z czystym kontem

**Opcja 2:**

- Zachować `DEFAULT_USER_ID` jako "demo account"
- Stworzyć prawdziwego użytkownika w Supabase Auth z UUID = `DEFAULT_USER_ID`

---

## 10. DODATKOWE UWAGI I REKOMENDACJE

### 10.1 UX Improvements (do rozważenia)

1. **Remember Me:** Opcja wydłużenia czasu życia sesji
2. **Loading states:** Skeleton loaders podczas ładowania danych użytkownika
3. **Error boundaries:** React Error Boundaries dla komponentów auth
4. **Toast notifications:** Spójne komunikaty sukcesu/błędu (już używane: sonner)

### 10.2 Bezpieczeństwo - dodatkowe środki

1. **Account lockout:** Po X nieudanych prób logowania, tymczasowa blokada konta
2. **Email verification:** Włączyć w produkcji dla zwiększenia bezpieczeństwa
3. **Password strength meter:** Wizualne wskazanie siły hasła podczas rejestracji
4. **Two-factor authentication (2FA):** Poza zakresem MVP, ale łatwe do dodania z Supabase

### 10.3 Zgodność z RODO

Implementacja zapewnia zgodność z RODO poprzez:

1. **Prawo do usunięcia danych:** Endpoint `DELETE /api/user/account` usuwa wszystkie dane użytkownika
2. **Przechowywanie haseł:** Hasła haszowane przez Supabase (bcrypt)
3. **Minimalizacja danych:** Zbieramy tylko email i hasło
4. **Transparentność:** Użytkownik ma wgląd w swoje dane (strona `/app/account`)

**Rekomendacja:** Dodanie polityki prywatności i regulaminu (poza zakresem technicznej specyfikacji).

### 10.4 Performance

1. **Middleware overhead:** Weryfikacja tokenu przy każdym request dodaje ~10-50ms latencji (akceptowalne)
2. **Refresh token flow:** Automatyczne odświeżanie nie wpływa na UX (dzieje się w tle)
3. **Cookie size:** Tokeny JWT są relatywnie małe (~200-500 bytes)

### 10.5 Skalowanie

1. **Rate limiting:** Obecne rozwiązanie (in-memory) działa dla single-instance
   - Dla multi-instance: użyć Redis lub bazy danych
2. **Session storage:** Supabase Auth przechowuje sesje w swojej bazie
   - Skalowanie obsługiwane przez Supabase

---

## 11. PODSUMOWANIE

### 11.1 Kluczowe komponenty do implementacji

**Backend (Astro API Routes) - wykorzystujące Supabase Auth:**

- `src/pages/api/auth/register.ts` - rejestracja z auto-logowaniem
- `src/pages/api/auth/login.ts` - logowanie
- `src/pages/api/auth/logout.ts` - wylogowanie

**Frontend (React Components):**

- `src/components/auth/useAuth.ts` - custom hook (nowy)
- Aktualizacja: `LoginForm.tsx` - integracja z useAuth
- Aktualizacja: `RegisterForm.tsx` - integracja z useAuth, redirect po rejestracji
- Aktualizacja: `Sidebar.tsx` - wylogowanie przez useAuth

**Middleware i Guards:**

- Aktualizacja: `src/middleware/index.ts` - sprawdzanie sesji, automatyczny refresh
- `src/lib/auth/guards.ts` - requireAuth, requireGuest (nowe)
- `src/lib/auth/helpers.ts` - createErrorResponse, mapSupabaseAuthError (nowe)

**Strony Astro:**

- Aktualizacja: `src/pages/index.astro` - dodanie requireGuest
- Aktualizacja wszystkich stron w `src/pages/app/*` - dodanie requireAuth

**Konfiguracja:**

- `src/db/supabase.admin.ts` - admin client (nowy)
- Aktualizacja: `src/env.d.ts` - dodanie user do Locals
- Aktualizacja: `src/types.ts` - typy auth (opcjonalnie)

### 11.2 Estymacja czasu implementacji

| Zadanie                              | Szacowany czas (uproszczona implementacja) |
| ------------------------------------ | ------------------------------------------ |
| Backend API endpoints (3 endpointy)  | 3-4 godziny                                |
| Middleware i guards                  | 2-3 godziny                                |
| Frontend: useAuth hook + integracja  | 3-4 godziny                                |
| Aktualizacja stron (guards)          | 1-2 godziny                                |
| Aktualizacja istniejących endpointów | 2-3 godziny                                |
| Testy i debugging                    | 3-4 godziny                                |
| **TOTAL**                            | **14-20 godzin**                           |

### 11.3 Kolejność implementacji (rekomendowana)

1. **Faza 1: Backend Foundation**
   - Middleware + guards
   - Auth endpoints (register, login, logout)
   - Supabase admin client

2. **Faza 2: Frontend Integration**
   - useAuth hook
   - Aktualizacja LoginForm i RegisterForm
   - Aktualizacja Sidebar

3. **Faza 3: Protected Routes**
   - Aktualizacja stron `/app/*` (dodanie requireAuth)
   - Aktualizacja istniejących API endpoints (zamiana DEFAULT_USER_ID na user.id)

4. **Faza 4: Testing & Polish**
   - Manualne testy wszystkich scenariuszy
   - Weryfikacja RLS policies
   - Poprawki błędów
   - Optymalizacje UX

### 11.4 Zgodność z wymaganiami PRD

✅ **US-001: Rejestracja konta** (w pełni zrealizowane)

Kryteria akceptacji z PRD:

- ✅ Formularz rejestracyjny zawiera pola na adres e-mail i hasło
- ✅ Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane
- ✅ **Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany** (automatyczne logowanie przez ustawienie session cookies)

✅ **US-002: Logowanie do aplikacji** (w pełni zrealizowane)

Kryteria akceptacji z PRD:

- ✅ Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku generowania fiszek
- ✅ Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych
- ✅ Dane dotyczące logowania przechowywane są w bezpieczny sposób (HTTPOnly cookies, JWT tokeny, bcrypt w Supabase)

✅ **US-009: Bezpieczny dostęp i autoryzacja** (wspierane)

Kryteria akceptacji z PRD:

- ✅ Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki (RLS policies)
- ✅ Nie ma dostępu do fiszek innych użytkowników (guards + middleware)

✅ **Dodatkowe:**

- Wylogowanie (implementowane)
- Ochrona danych zgodna z RODO (RLS, prawo do usunięcia konta przez endpoint DELETE /api/user/account)

❌ **Poza zakresem MVP** (zgodnie z PRD):

- Odzyskiwanie hasła (nice-to-have, łatwe do dodania później z Supabase Auth)

---

## KONIEC SPECYFIKACJI

**Dokument gotowy do implementacji.**

### Kluczowe zasady tej specyfikacji:

1. ✅ **Maksymalne wykorzystanie Supabase Auth** - nie tworzymy customowych rozwiązań tam gdzie Supabase już je ma
2. ✅ **Zgodność z PRD** - realizujemy tylko US-001 i US-002, forgot/reset password poza zakresem MVP
3. ✅ **Automatyczne logowanie po rejestracji** - zgodnie z wymaganiem z US-001
4. ✅ **Uproszczona implementacja** - 14-20h zamiast 18-26h dzięki wykorzystaniu wbudowanych funkcjonalności Supabase

### Co zapewnia Supabase Auth automatycznie:

- ✅ Walidacja email i hasła (nie potrzebujemy Zod schemas dla auth)
- ✅ Rate limiting (nie potrzebujemy własnego)
- ✅ Session management (access token + refresh token)
- ✅ Hashowanie haseł (bcrypt)
- ✅ Email templates (gotowe, można przetłumaczyć)
- ✅ Token refresh flow (automatyczny)

### Co implementujemy:

- 3 endpointy API (register, login, logout)
- Middleware ze sprawdzaniem sesji
- Guards dla ochrony stron
- useAuth hook dla integracji frontend
- Helper functions do mapowania błędów

Specyfikacja zapewnia zgodność z istniejącą architekturą aplikacji i nie narusza działania obecnych funkcjonalności.
