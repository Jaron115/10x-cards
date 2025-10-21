# Auth Components (Komponenty uwierzytelniania)

Komponenty odpowiedzialne za logowanie i rejestrację użytkowników.

## 🚧 Obecny status: UI-only

**UWAGA**: W obecnej wersji komponenty działają tylko jako UI bez integracji z API. Formularz nie wysyła danych do backendu i nie loguje/rejestruje użytkowników.

## 📦 Komponenty

### AuthView.tsx

Główny kontener widoku uwierzytelniania. Zawiera:

- Card z nagłówkiem aplikacji
- Tabs do przełączania między logowaniem a rejestracją
- Integrację z LoginForm i RegisterForm

**Użycie w Astro**:

```astro
---
import { AuthView } from "@/components/auth/AuthView";
---

<AuthView client:load />
```

### LoginForm.tsx

Formularz logowania z walidacją po stronie klienta.

**Pola**:

- Email (wymagane, format email)
- Hasło (wymagane)

**Walidacja**:

- onBlur - po opuszczeniu pola
- onSubmit - przed wysłaniem formularza
- Automatyczne czyszczenie błędów przy edycji

**TODO (API Integration)**:

- Dodać wywołanie do `useAuth.login()` w `handleSubmit`

### RegisterForm.tsx

Formularz rejestracji z walidacją po stronie klienta.

**Pola**:

- Email (wymagane, format email)
- Hasło (wymagane, min. 6 znaków)
- Powtórz hasło (wymagane, musi być identyczne z hasłem)

**Walidacja**:

- onBlur - po opuszczeniu pola
- onSubmit - przed wysłaniem formularza
- Automatyczne czyszczenie błędów przy edycji
- Inteligentna walidacja: rewaliduje "Powtórz hasło" przy zmianie "Hasło"

**TODO (API Integration)**:

- Dodać wywołanie do `useAuth.register()` w `handleSubmit`

## 🛠️ Funkcje walidacji

Wspólne funkcje walidacji znajdują się w `src/lib/validation/auth.validation.ts`:

- `validateEmail(email)` - walidacja adresu email
- `validateLoginPassword(password)` - walidacja hasła (logowanie)
- `validateRegisterPassword(password)` - walidacja hasła z min. długością (rejestracja)
- `validateConfirmPassword(confirmPassword, password)` - walidacja zgodności haseł

## 🎨 Dostępność

Wszystkie komponenty są w pełni dostępne:

- ✅ Label powiązane z Input przez htmlFor
- ✅ aria-invalid na polach z błędami
- ✅ aria-describedby łączące pola z komunikatami błędów
- ✅ role="alert" na komunikatach błędów
- ✅ Nawigacja klawiaturą (Tab, Enter, Space)
- ✅ Focus states wyraźnie widoczne

## 🧪 Testowanie

Szczegółowe scenariusze testowe znajdują się w:

- `.ai/auth-view-manual-tests.md`

## 🚀 Przyszła integracja z API

### Krok 1: Utworzenie hooka useAuth

Utwórz plik `src/components/auth/useAuth.ts`:

```typescript
import { useState } from "react";
import { supabase } from "@/db/supabase.client";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Mapowanie błędów na przyjazne komunikaty
        if (error.message === "Invalid login credentials") {
          setError("Nieprawidłowy email lub hasło");
        } else {
          setError("Wystąpił błąd podczas logowania");
        }
        return false;
      }

      // Przekierowanie do /app/generator
      window.location.href = "/app/generator";
      return true;
    } catch (err) {
      setError("Błąd połączenia z serwerem");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    // Podobna implementacja jak login
    // ...
  };

  return { login, register, isLoading, error };
}
```

### Krok 2: Aktualizacja LoginForm

W pliku `LoginForm.tsx`, dodaj import i użycie hooka:

```typescript
import { useAuth } from "./useAuth";

export function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    await login(formData.email, formData.password);
  };

  // W JSX dodaj wyświetlanie błędu API:
  // {error && <Alert variant="destructive">{error}</Alert>}

  // Przycisk submit z loading state:
  // <Button disabled={!isFormValid() || isLoading}>
  //   {isLoading ? 'Logowanie...' : 'Zaloguj się'}
  // </Button>
}
```

### Krok 3: Instalacja komponentu Alert

```bash
npx shadcn@latest add alert
```

### Krok 4: Testowanie

Przetestuj pełną integrację:

1. Próba logowania z niepoprawnymi danymi
2. Próba logowania z poprawnymi danymi
3. Sprawdzenie przekierowania
4. Obsługa błędów sieci

---

**Autor**: AI Assistant  
**Data**: 2025-10-21  
**Wersja**: 1.0 (UI-only)
