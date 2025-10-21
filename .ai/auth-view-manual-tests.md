# Testy manualne widoku logowania/rejestracji

## Informacje ogólne

- **URL testowy**: http://localhost:4321/
- **Wersja**: UI-only (bez integracji z API)
- **Data**: 2025-10-21

## Testy funkcjonalności walidacji

### ✅ Test 1: Walidacja pól - puste pola (Logowanie)

**Kroki:**

1. Przejdź do zakładki "Logowanie"
2. Kliknij w pole email i opuść je bez wpisywania niczego (blur)
3. Kliknij w pole hasło i opuść je bez wpisywania niczego (blur)

**Oczekiwany rezultat:**

- ✅ Pod polem email wyświetla się komunikat: "Email jest wymagany"
- ✅ Pod polem hasło wyświetla się komunikat: "Hasło jest wymagane"
- ✅ Przycisk "Zaloguj się" jest disabled (opacity zmniejszona, cursor not-allowed)
- ✅ Inputy mają czerwone ramki

---

### ✅ Test 2: Walidacja email - nieprawidłowy format

**Kroki:**

1. Przejdź do zakładki "Logowanie"
2. Wpisz nieprawidłowy email: "test" (bez @)
3. Opuść pole (blur)
4. Wpisz "test@" i opuść pole
5. Wpisz "test@example" (bez domeny) i opuść pole

**Oczekiwany rezultat:**

- ✅ W każdym przypadku wyświetla się komunikat: "Nieprawidłowy format adresu email"
- ✅ Input ma czerwoną ramkę
- ✅ Przycisk submit disabled

---

### ✅ Test 3: Walidacja hasła - za krótkie (Rejestracja)

**Kroki:**

1. Przejdź do zakładki "Rejestracja"
2. Wpisz w pole hasło: "12345" (5 znaków)
3. Opuść pole (blur)

**Oczekiwany rezultat:**

- ✅ Wyświetla się komunikat: "Hasło musi mieć minimum 6 znaków"
- ✅ Input ma czerwoną ramkę
- ✅ Przycisk submit disabled

---

### ✅ Test 4: Walidacja zgodności haseł (Rejestracja)

**Kroki:**

1. Przejdź do zakładki "Rejestracja"
2. Wpisz w pole hasło: "password123"
3. Wpisz w pole powtórz hasło: "password456" (różne)
4. Opuść pole powtórz hasło (blur)

**Oczekiwany rezultat:**

- ✅ Wyświetla się komunikat: "Hasła nie są identyczne"
- ✅ Pole powtórz hasło ma czerwoną ramkę
- ✅ Przycisk submit disabled

---

### ✅ Test 5: Poprawne wypełnienie formularza

**Kroki (Logowanie):**

1. Przejdź do zakładki "Logowanie"
2. Wpisz poprawny email: "test@example.com"
3. Wpisz hasło: "password123"
4. Sprawdź stan przycisku submit
5. Kliknij przycisk "Zaloguj się"

**Oczekiwany rezultat:**

- ✅ Wszystkie błędy walidacji znikają
- ✅ Przycisk "Zaloguj się" staje się aktywny (pełna opacity, normany cursor)
- ✅ Po kliknięciu przycisku formularz wykonuje preventDefault (strona się nie przeładowuje)
- ✅ W konsoli nie ma błędów

**Kroki (Rejestracja):**

1. Przejdź do zakładki "Rejestracja"
2. Wpisz poprawny email: "test@example.com"
3. Wpisz hasło: "password123" (min. 6 znaków)
4. Wpisz powtórz hasło: "password123" (identyczne)
5. Sprawdź stan przycisku submit
6. Kliknij przycisk "Zarejestruj się"

**Oczekiwany rezultat:**

- ✅ Wszystkie błędy walidacji znikają
- ✅ Przycisk "Zarejestruj się" staje się aktywny
- ✅ Po kliknięciu przycisku formularz wykonuje preventDefault
- ✅ W konsoli nie ma błędów

---

### ✅ Test 6: Czyszczenie błędów przy edycji

**Kroki:**

1. Przejdź do zakładki "Logowanie"
2. Kliknij w pole email i opuść je bez wpisywania (pojawi się błąd "Email jest wymagany")
3. Zacznij wpisywać tekst w pole email

**Oczekiwany rezultat:**

- ✅ Błąd "Email jest wymagany" znika natychmiast przy pierwszym znaku
- ✅ Czerwona ramka znika
- ✅ Jeśli wpisujesz poprawny email, błąd nie pojawia się ponownie

---

### ✅ Test 7: Przełączanie między tabami

**Kroki:**

1. Przejdź do zakładki "Logowanie"
2. Wpisz email: "test@example.com" i hasło: "pass" (za krótkie dla rejestracji)
3. Kliknij w pole email i opuść je bez wpisywania (pojawi się błąd)
4. Przełącz na zakładkę "Rejestracja"
5. Wpisz coś w formularzu rejestracji
6. Wróć na zakładkę "Logowanie"

**Oczekiwany rezultat:**

- ✅ Formularz logowania zachowuje swój stan (wartości pól i błędy)
- ✅ Formularz rejestracji zachowuje swój stan
- ✅ Zakładki przełączają się płynnie
- ✅ Oba formularze działają niezależnie

---

### ✅ Test 8: Inteligentna walidacja hasła (Rejestracja)

**Kroki:**

1. Przejdź do zakładki "Rejestracja"
2. Wpisz hasło: "password123"
3. Wpisz powtórz hasło: "password456" (różne)
4. Opuść pole powtórz hasło (pojawi się błąd "Hasła nie są identyczne")
5. Wróć do pola hasło i zmień je na: "password456"

**Oczekiwany rezultat:**

- ✅ Błąd "Hasła nie są identyczne" znika automatycznie
- ✅ Nie trzeba ponownie edytować pola powtórz hasło
- ✅ Przycisk submit staje się aktywny (jeśli wszystkie inne pola są poprawne)

---

## Testy nawigacji klawiaturą

### ✅ Test 9: Nawigacja Tab przez formularz

**Kroki:**

1. Odśwież stronę
2. Używając tylko klawisza Tab, przejdź przez wszystkie elementy formularza
3. Kolejność tabulacji powinna być:
   - Zakładka "Logowanie"
   - Zakładka "Rejestracja"
   - Pole email
   - Pole hasło
   - Przycisk "Zaloguj się"

**Oczekiwany rezultat:**

- ✅ Focus przemieszcza się w logicznej kolejności (od góry do dołu)
- ✅ Wszystkie elementy są dostępne przez Tab
- ✅ Focus jest wyraźnie widoczny (ring wokół elementu)
- ✅ Shift+Tab cofa focus w odwrotnej kolejności

---

### ✅ Test 10: Aktywacja zakładek klawiaturą

**Kroki:**

1. Tab do zakładki "Rejestracja"
2. Naciśnij Enter lub Space
3. Tab do zakładki "Logowanie"
4. Naciśnij Enter lub Space

**Oczekiwany rezultat:**

- ✅ Enter aktywuje zakładkę
- ✅ Space aktywuje zakładkę
- ✅ Formularz zmienia się odpowiednio
- ✅ Focus pozostaje na zakładce

---

### ✅ Test 11: Wysłanie formularza Enter

**Kroki:**

1. Wpisz poprawny email i hasło w formularz logowania
2. Będąc w polu hasło, naciśnij Enter

**Oczekiwany rezultat:**

- ✅ Formularz zostaje wysłany (preventDefault)
- ✅ Strona się nie przeładowuje
- ✅ Działa tak samo jak kliknięcie przycisku submit

---

## Testy responsywności

### ✅ Test 12: Widok mobile (< 640px)

**Kroki:**

1. Otwórz DevTools (F12)
2. Przełącz na widok mobile (np. iPhone SE - 375px)
3. Sprawdź widok formularza

**Oczekiwany rezultat:**

- ✅ Card zajmuje całą szerokość z paddingiem (p-4)
- ✅ Wszystkie pola są czytelne
- ✅ Przyciski są łatwe do kliknięcia (duże cele dotykowe)
- ✅ Tekst nie przekracza granic kontenera

---

### ✅ Test 13: Widok tablet (640-1024px)

**Kroki:**

1. Ustaw szerokość okna na 768px (iPad)
2. Sprawdź widok formularza

**Oczekiwany rezultat:**

- ✅ Card ma max-width: 28rem (max-w-md)
- ✅ Card jest wycentrowany
- ✅ Layout wygląda dobrze

---

### ✅ Test 14: Widok desktop (> 1024px)

**Kroki:**

1. Ustaw pełną szerokość okna (> 1400px)
2. Sprawdź widok formularza

**Oczekiwany rezultat:**

- ✅ Card jest wycentrowany
- ✅ Card ma rozsądną szerokość (max-w-md = 448px)
- ✅ Nie rozciąga się na całą szerokość ekranu

---

## Testy dostępności

### ✅ Test 15: Screen reader (VoiceOver na Mac)

**Kroki:**

1. Włącz VoiceOver (Cmd + F5)
2. Użyj VO + strzałki, aby nawigować przez formularz
3. Sprawdź czy wszystkie elementy są poprawnie ogłaszane

**Oczekiwany rezultat:**

- ✅ Etykiety pól są ogłaszane (Label powiązany z Input przez htmlFor)
- ✅ Typ pola jest ogłaszany (email, password)
- ✅ Błędy walidacji są ogłaszane (aria-describedby + role="alert")
- ✅ Stan pola (poprawne/niepoprawne) jest ogłaszany (aria-invalid)
- ✅ Stan przycisku (disabled/enabled) jest ogłaszany
- ✅ Tytuł i opis aplikacji są ogłaszane

---

### ✅ Test 16: Lighthouse Accessibility Audit

**Kroki:**

1. Otwórz DevTools
2. Przejdź do zakładki Lighthouse
3. Wybierz kategorię "Accessibility"
4. Uruchom audit

**Oczekiwany rezultat:**

- ✅ Wynik minimum 90/100
- ✅ Brak critical issues
- ✅ Wszystkie elementy mają odpowiednie role i etykiety

---

### ✅ Test 17: Kontrast kolorów

**Kroki:**

1. Sprawdź kontrast tekstu błędu (czerwony na białym tle)
2. Sprawdź kontrast etykiet (domyślny kolor tekstu)
3. Sprawdź kontrast przycisków

**Oczekiwany rezultat:**

- ✅ Wszystkie teksty spełniają WCAG AA (min. 4.5:1)
- ✅ Czerwony kolor błędów (text-red-500) ma wystarczający kontrast
- ✅ Przyciski mają wystarczający kontrast (tło vs tekst)

---

## Testy edge case'ów

### ✅ Test 18: Email ze spacjami

**Kroki:**

1. Wpisz email: " test@example.com " (ze spacjami na początku i końcu)
2. Opuść pole

**Oczekiwany rezultat:**

- ✅ Email jest automatycznie trimowany
- ✅ Walidacja przechodzi (spacje są ignorowane)

---

### ✅ Test 19: Bardzo długi email

**Kroki:**

1. Wpisz bardzo długi email: "verylongemailaddress123456789@verylongdomainname123456789.com"
2. Sprawdź czy input radzi sobie z długim tekstem

**Oczekiwany rezultat:**

- ✅ Tekst nie przekracza granic inputa (scroll w polu)
- ✅ Walidacja działa poprawnie
- ✅ Layout nie jest zepsuty

---

### ✅ Test 20: Wklejanie tekstu

**Kroki:**

1. Skopiuj tekst "test@example.com"
2. Wklej go w pole email (Cmd/Ctrl + V)
3. Sprawdź czy walidacja działa

**Oczekiwany rezultat:**

- ✅ Tekst zostaje wklejony
- ✅ Jeśli istniał błąd, znika po wklejeniu
- ✅ Walidacja przy blur działa normalnie

---

## Podsumowanie testów

| Test                           | Status          | Uwagi |
| ------------------------------ | --------------- | ----- |
| Test 1: Puste pola             | ⏳ Do wykonania |       |
| Test 2: Nieprawidłowy email    | ⏳ Do wykonania |       |
| Test 3: Za krótkie hasło       | ⏳ Do wykonania |       |
| Test 4: Niezgodne hasła        | ⏳ Do wykonania |       |
| Test 5: Poprawne wypełnienie   | ⏳ Do wykonania |       |
| Test 6: Czyszczenie błędów     | ⏳ Do wykonania |       |
| Test 7: Przełączanie tabów     | ⏳ Do wykonania |       |
| Test 8: Inteligentna walidacja | ⏳ Do wykonania |       |
| Test 9: Nawigacja Tab          | ⏳ Do wykonania |       |
| Test 10: Zakładki klawiaturą   | ⏳ Do wykonania |       |
| Test 11: Submit przez Enter    | ⏳ Do wykonania |       |
| Test 12: Mobile                | ⏳ Do wykonania |       |
| Test 13: Tablet                | ⏳ Do wykonania |       |
| Test 14: Desktop               | ⏳ Do wykonania |       |
| Test 15: Screen reader         | ⏳ Do wykonania |       |
| Test 16: Lighthouse            | ⏳ Do wykonania |       |
| Test 17: Kontrast              | ⏳ Do wykonania |       |
| Test 18: Email ze spacjami     | ⏳ Do wykonania |       |
| Test 19: Długi email           | ⏳ Do wykonania |       |
| Test 20: Wklejanie tekstu      | ⏳ Do wykonania |       |

---

## Notatki z testów

_(Przestrzeń na dodanie uwag podczas testowania)_

---

## Zgłoszone problemy

_(Lista znalezionych bugów do naprawienia)_
