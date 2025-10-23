# Generator AI - Lista Testów Manualnych

## Przygotowanie

1. Uruchom dev server: `npm run dev`
2. Otwórz przeglądarkę: `http://localhost:3001/app/generator`
3. Otwórz DevTools (Console + Network)

---

## Test 1: Walidacja formularza ✓

### 1.1 Tekst za krótki

- [ ] Wklej tekst < 1000 znaków (np. "Test")
- [ ] Sprawdź licznik znaków (powinien być szary)
- [ ] Przycisk "Generuj fiszki" powinien być disabled
- [ ] Komunikat: "Minimum: 1000 znaków"

### 1.2 Tekst za długi

- [ ] Wklej tekst > 10000 znaków
- [ ] Licznik znaków powinien być czerwony
- [ ] Przycisk "Generuj fiszki" powinien być disabled
- [ ] Komunikat: "Przekroczono limit o X znaków"

### 1.3 Tekst poprawny

- [ ] Wklej tekst 1000-10000 znaków (użyj przykładu z `.ai/sample-data.md`)
- [ ] Licznik znaków powinien być zielony
- [ ] Przycisk "Generuj fiszki" powinien być aktywny

---

## Test 2: Generowanie fiszek ✓

### 2.1 Rozpoczęcie generowania

- [ ] Kliknij "Generuj fiszki" z poprawnym tekstem
- [ ] Przycisk zmienia się na "Generowanie..." z animacją ⏳
- [ ] Textarea staje się disabled
- [ ] Pojawia się skeleton (6 kart ładowania)

### 2.2 Pomyślne generowanie

- [ ] Po ~2 sekundach pojawia się lista propozycji
- [ ] Nagłówek: "Propozycje fiszek"
- [ ] Licznik: "Wygenerowano X fiszek"
- [ ] Toast: "Wygenerowano X fiszek" (sukces)
- [ ] Każda karta ma 3 przyciski: ✓ ✏️ 🗑️

### 2.3 Błąd generowania (opcjonalnie)

- [ ] Wyłącz internet / zatrzymaj dev server
- [ ] Kliknij "Generuj fiszki"
- [ ] Toast z błędem powinien się pokazać
- [ ] Status error w console

---

## Test 3: Akcje na fiszkach ✓

### 3.1 Zatwierdzanie fiszki (Approve)

- [ ] Kliknij przycisk ✓ na fiszce
- [ ] Przycisk zmienia kolor na zielony
- [ ] Karta dostaje zieloną ramkę i lekkie tło
- [ ] Licznik "Zatwierdzono: 1" pojawia się w nagłówku
- [ ] Przyciski "Zapisz fiszki (1)" pojawiają się (góra i dół)
- [ ] Kliknij ✓ ponownie - fiszka wraca do statusu pending

### 3.2 Odrzucanie fiszki (Reject)

- [ ] Kliknij przycisk 🗑️ na fiszce
- [ ] Przycisk zmienia kolor na czerwony
- [ ] Karta staje się wyszarzona (opacity + grayscale)
- [ ] Przycisk ✏️ Edit powinien być nadal widoczny
- [ ] Kliknij 🗑️ ponownie - fiszka wraca do statusu pending

### 3.3 Edycja fiszki (Edit)

- [ ] Kliknij przycisk ✏️ na fiszce (status pending)
- [ ] Przód i tył zamieniają się w pola textarea
- [ ] Pojawia się licznik znaków (200/500)
- [ ] Przyciski zmieniają się na: 💾 Save i ✕ Cancel
- [ ] Przycisk ✓ Approve znika

### 3.4 Zapisanie edycji

- [ ] Zmień tekst w polach
- [ ] Kliknij 💾 Save
- [ ] Fiszka wraca do widoku normalnego
- [ ] Status automatycznie zmienia się na "approved" (zielona ramka)
- [ ] Etykieta zmienia się na "Edytowane"
- [ ] Licznik zatwierdzonych rośnie

### 3.5 Anulowanie edycji

- [ ] Kliknij ✏️ Edit
- [ ] Zmień tekst
- [ ] Kliknij ✕ Cancel
- [ ] Zmiany zostają cofnięte
- [ ] Fiszka wraca do pierwotnego stanu

### 3.6 Walidacja w edycji

- [ ] Kliknij ✏️ Edit
- [ ] Usuń cały tekst z przodu lub tyłu
- [ ] Przycisk 💾 Save powinien być disabled
- [ ] Dodaj tekst > 200 znaków (przód) lub > 500 (tył)
- [ ] Ramka pola zmienia się na czerwoną

### 3.7 Edycja odrzuconej fiszki

- [ ] Odrzuć fiszkę (klik 🗑️)
- [ ] Przycisk ✏️ powinien być nadal widoczny (zgodnie z ostatnim feedbackiem)
- [ ] Tooltip powinien pokazywać "Edytuj"

---

## Test 4: Zapisywanie fiszek ✓

### 4.1 Przygotowanie

- [ ] Zatwierdź kilka fiszek (np. 3)
- [ ] Edytuj i zapisz jedną fiszkę
- [ ] Odrzuć jedną fiszkę
- [ ] Sprawdź licznik: "Zatwierdzono: X"

### 4.2 Zapisywanie

- [ ] Kliknij "Zapisz fiszki (X)"
- [ ] Przycisk zmienia się na "Zapisywanie..." z animacją
- [ ] Przycisk staje się disabled
- [ ] Po ~1 sekundzie: Toast "Zapisano X fiszek"
- [ ] Formularz zostaje wyczyszczony
- [ ] Lista propozycji znika
- [ ] Można wkleić nowy tekst

### 4.3 Próba zapisu bez zatwierdzonych

- [ ] Wygeneruj fiszki
- [ ] NIE zatwierdzaj żadnej
- [ ] Przycisk "Zapisz fiszki" NIE powinien być widoczny
- [ ] (Opcjonalnie: odrzuć wszystkie - przycisk dalej niewidoczny)

### 4.4 Błąd zapisu (opcjonalnie)

- [ ] Zatwierdź fiszki
- [ ] Wyłącz internet
- [ ] Kliknij "Zapisz fiszki"
- [ ] Toast z błędem
- [ ] Propozycje NIE znikają (można spróbować ponownie)

---

## Test 5: Statusy i przejścia ✓

### 5.1 Status: pending → approved

- [ ] Nowa fiszka (pending): wszystkie 3 przyciski widoczne, outline
- [ ] Klik ✓ Approve
- [ ] Status: approved, przycisk ✓ zielony, ramka zielona

### 5.2 Status: approved → pending → rejected

- [ ] Fiszka approved
- [ ] Klik ✓ (odklikanie) → pending
- [ ] Wszystkie przyciski outline
- [ ] Klik 🗑️ → rejected
- [ ] Przycisk 🗑️ czerwony, karta wyszarzona

### 5.3 Status: rejected → pending → approved

- [ ] Fiszka rejected
- [ ] Klik 🗑️ (odklikanie) → pending
- [ ] Klik ✓ → approved

### 5.4 Status: edit → save → approved (auto)

- [ ] Fiszka pending
- [ ] Klik ✏️ → tryb edycji
- [ ] Zmień tekst
- [ ] Klik 💾 Save
- [ ] Fiszka automatycznie approved, źródło "Edytowane"

---

## Test 6: Responsywność ✓

### 6.1 Desktop (> 768px)

- [ ] Lista fiszek w 2 kolumnach (grid)
- [ ] Przyciski "Zapisz" widoczne na górze i dole

### 6.2 Mobile (< 768px)

- [ ] Lista fiszek w 1 kolumnie
- [ ] Przycisk "Generuj fiszki" na całą szerokość
- [ ] Wszystkie elementy czytelne

---

## Test 7: Edge Cases ✓

### 7.1 Wielokrotne generowanie

- [ ] Wygeneruj fiszki
- [ ] Wklej nowy tekst (bez zapisywania)
- [ ] Wygeneruj ponownie
- [ ] Poprzednie propozycje zostają zastąpione

### 7.2 Generowanie podczas ładowania

- [ ] Kliknij "Generuj fiszki"
- [ ] Natychmiast kliknij ponownie
- [ ] Przycisk powinien być disabled (nie można wielokrotnie klikać)

### 7.3 Maksymalna liczba zatwierdzonych

- [ ] Wygeneruj fiszki (np. 5)
- [ ] Zatwierdź wszystkie
- [ ] Licznik: "Zatwierdzono: 5"
- [ ] Zapisz - wszystkie powinny zostać zapisane

### 7.4 Edycja z maksymalną długością

- [ ] Edytuj fiszkę
- [ ] Wpisz dokładnie 200 znaków (przód) / 500 (tył)
- [ ] Przycisk Save powinien być aktywny
- [ ] Zapisz - powinno działać

---

## Test 8: Konsola i Network ✓

### 8.1 Generowanie

- [ ] Network → POST `/api/generations`
- [ ] Status: 200 OK
- [ ] Response zawiera `generation_id`, `flashcards_proposals`
- [ ] Brak błędów w konsoli

### 8.2 Zapisywanie

- [ ] Network → POST `/api/flashcards/bulk`
- [ ] Status: 200 OK
- [ ] Request body zawiera `generation_id` i tablicę `flashcards`
- [ ] Response zawiera `created_count`
- [ ] Brak błędów w konsoli

---

## Wynik testów

**Data testów:** **\*\***\_\_\_**\*\***  
**Tester:** **\*\***\_\_\_**\*\***  
**Wersja:** **\*\***\_\_\_**\*\***

**Testy zakończone:** ☐ Wszystkie przeszły ☐ Znaleziono błędy

**Znalezione błędy:**

1. ***
2. ***
3. ***

**Uwagi:**

---

---
