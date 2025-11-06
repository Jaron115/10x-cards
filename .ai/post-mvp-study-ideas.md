# Post-MVP Ideas: Study Session Enhancement

Dokument opisujący rozszerzenia funkcji Study Session po implementacji MVP.

---

## 🎯 Priorytet 1: Keyboard Shortcuts

**Cel:** Przyśpieszenie nauki dla power users

**Funkcjonalności:**

- `Space` → flip card (zamiast klikać)
- `1` lub `Arrow Left` → nie znam
- `2` lub `Arrow Right` → znam
- `Escape` → zakończ sesję przedwcześnie
- `?` → pokaż help overlay z shortcutami

**Implementacja:**

```typescript
// Hook: src/components/study/useKeyboardShortcuts.ts
const useKeyboardShortcuts = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          callbacks.onFlip();
          break;
        case "1":
        case "ArrowLeft":
          callbacks.onUnknown();
          break;
        case "2":
        case "ArrowRight":
          callbacks.onKnown();
          break;
        case "Escape":
          callbacks.onExit();
          break;
        case "?":
          callbacks.onHelp();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);
};
```

**UI Enhancements:**

- Toast informacyjny przy pierwszym użyciu: "Wskazówka: Użyj spacji aby przewrócić fiszkę"
- Overlay z listą skrótów (toggle `?`)
- Badge na przyciskach pokazujący skrót (np. "Znam `2`")

**Czas:** ~1-2h

---

## 🧠 Priorytet 2: Spaced Repetition Algorithm (SM-2)

**Cel:** Inteligentny algorytm powtórek dla efektywnej nauki długoterminowej

### Algorytm SuperMemo 2 (SM-2)

**Wzory:**

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

gdzie:
- EF = Ease Factor (początkowy: 2.5)
- q = quality of response (0-5)
- EF' = nowy Ease Factor (min: 1.3)

Intervals:
- I(1) = 1 (pierwszy interwał: 1 dzień)
- I(2) = 6 (drugi interwał: 6 dni)
- I(n) = I(n-1) * EF (kolejne: mnożnik)
```

**Oceny odpowiedzi (Quality):**

- `5` - Perfect response (natychmiastowa poprawna odpowiedź)
- `4` - Correct response (po zastanowieniu)
- `3` - Correct response with serious difficulty (trudna, ale poprawna)
- `2` - Incorrect response; correct answer easy to recall (błąd, ale łatwo przypomnieć)
- `1` - Incorrect response; correct answer remembered (błąd, pamiętam odpowiedź)
- `0` - Complete blackout (kompletny blackout)

### Zmiany w bazie danych

**Nowa tabela:**

```sql
CREATE TABLE flashcard_reviews (
  id BIGSERIAL PRIMARY KEY,
  flashcard_id BIGINT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- SM-2 Algorithm fields
  quality INT NOT NULL CHECK (quality BETWEEN 0 AND 5),
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 1,
  repetitions INT NOT NULL DEFAULT 0,

  -- Review tracking
  next_review_date TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX idx_flashcard_reviews_next_review ON flashcard_reviews(next_review_date);
CREATE INDEX idx_flashcard_reviews_user_next_review ON flashcard_reviews(user_id, next_review_date);

-- RLS Policies
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews" ON flashcard_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reviews" ON flashcard_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON flashcard_reviews
  FOR UPDATE USING (auth.uid() = user_id);
```

**View dla łatwiejszego dostępu:**

```sql
CREATE VIEW flashcards_with_review_data AS
SELECT
  f.*,
  r.ease_factor,
  r.interval_days,
  r.repetitions,
  r.next_review_date,
  r.reviewed_at AS last_reviewed_at,
  CASE
    WHEN r.next_review_date IS NULL THEN 'new'
    WHEN r.next_review_date <= NOW() THEN 'due'
    ELSE 'learning'
  END as review_status
FROM flashcards f
LEFT JOIN (
  SELECT DISTINCT ON (flashcard_id)
    flashcard_id,
    ease_factor,
    interval_days,
    repetitions,
    next_review_date,
    reviewed_at
  FROM flashcard_reviews
  ORDER BY flashcard_id, reviewed_at DESC
) r ON f.id = r.flashcard_id;
```

### Backend Implementation

**Service:**

```typescript
// src/lib/services/study/spacedRepetition.service.ts
export class SpacedRepetitionService {
  // Calculate next review based on SM-2 algorithm
  calculateNextReview(quality: number, currentEF: number, currentInterval: number, repetitions: number) {
    // SM-2 implementation
  }

  // Get flashcards due for review
  async getFlashcardsDue(userId: string, limit: number) {
    // Fetch due + new cards
  }

  // Record review result
  async recordReview(userId: string, flashcardId: number, quality: number) {
    // Save review + update next_review_date
  }
}
```

**Nowe endpointy:**

- `GET /api/study/due` - pobierz fiszki do powtórki (zastępuje /session dla SR mode)
- `POST /api/study/review` - zapisz wynik powtórki
- `GET /api/study/stats` - statystyki SR (due count, learned, etc.)

### Frontend Changes

**UI z 6 przyciskami oceny:**

```typescript
// Zamiast "Znam" / "Nie znam" → 6 przycisków z opisami
const qualityButtons = [
  { value: 0, label: "Blackout", color: "destructive" },
  { value: 1, label: "Błąd, pamiętam", color: "destructive" },
  { value: 2, label: "Błąd, łatwo przypomnieć", color: "warning" },
  { value: 3, label: "Trudna", color: "secondary" },
  { value: 4, label: "Dobra", color: "primary" },
  { value: 5, label: "Perfekcyjna", color: "success" },
];
```

**Hook:**

```typescript
// useSpacedRepetition.ts
const useSpacedRepetition = () => {
  // Podobny do useStudySession, ale z SR logic
  // POST do /api/study/review po każdej ocenie
};
```

**Settings:**

- Przełącznik: "Simple Mode" vs "Spaced Repetition"
- Config: max new cards per day (10/20/50)

**Czas:** ~8-12h (największa funkcja)

---

## 📊 Priorytet 3: Statystyki i Dashboard

**Cel:** Wizualizacja postępów i motywacja do regularnej nauki

### Overview Dashboard

**Metryki:**

- **Total flashcards** (wszystkie/nowe/learning/mastered)
- **Cards reviewed today** (liczba + % celu dziennego)
- **Current streak** (dni z rzędu, ikona 🔥)
- **Longest streak** (rekord)
- **Accuracy %** (ostatnie 7/30 dni)
- **Next review** (liczba due cards)

### Wykresy

**1. Line Chart - Reviews per day (30 dni):**

```typescript
<LineChart data={reviewsPerDay}>
  <Line dataKey="count" stroke="#8884d8" />
  <XAxis dataKey="date" />
  <YAxis />
</LineChart>
```

**2. Bar Chart - Accuracy over time:**

- Zielony: poprawne
- Czerwony: błędne
- Grouped bar chart tydzień po tygodniu

**3. Pie Chart - Flashcards by source:**

- Manual
- AI-full
- AI-edited

**4. Heatmap - Activity calendar (GitHub-style):**

```typescript
// react-activity-calendar lub custom implementation
<ActivityCalendar data={reviewsCalendar} />
```

### Streaks

**Implementacja:**

```sql
-- Function to calculate streak
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  current_streak INT := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (
      SELECT 1 FROM flashcard_reviews
      WHERE user_id = p_user_id
        AND DATE(reviewed_at) = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;
```

### Milestones & Badges

**System osiągnięć:**

```typescript
const ACHIEVEMENTS = [
  { id: "first_review", name: "Pierwsza powtórka", icon: "🎯" },
  { id: "streak_7", name: "Tydzień nauki", icon: "🔥", requirement: 7 },
  { id: "streak_30", name: "Miesiąc nauki", icon: "💪", requirement: 30 },
  { id: "reviews_100", name: "100 powtórek", icon: "💯", requirement: 100 },
  { id: "reviews_1000", name: "1000 powtórek", icon: "🏆", requirement: 1000 },
  { id: "perfect_session", name: "Perfekcyjna sesja", icon: "✨" },
];
```

**Tabela:**

```sql
CREATE TABLE user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

### Endpoint

**GET /api/study/stats:**

```typescript
interface StudyStats {
  overview: {
    total_flashcards: number;
    cards_reviewed_today: number;
    current_streak: number;
    longest_streak: number;
    accuracy_7d: number;
    accuracy_30d: number;
    due_cards: number;
  };
  charts: {
    reviews_per_day: { date: string; count: number }[];
    accuracy_over_time: { week: string; correct: number; incorrect: number }[];
    flashcards_by_source: { source: string; count: number }[];
    activity_calendar: { date: string; count: number; level: number }[];
  };
  achievements: {
    unlocked: string[];
    progress: { id: string; current: number; required: number }[];
  };
}
```

**Biblioteki do wykresów:**

- **Recharts** (preferowane - React-native)
- **Chart.js** (alternatywa)
- **react-activity-calendar** (dla heatmap)

**Czas:** ~6-8h

---

## 🎮 Priorytet 4: Tryby nauki

**Cel:** Różne sposoby nauki dopasowane do preferencji użytkownika

### 1. Tryb "Tylko trudne"

**Kryteria:**

- Ease Factor < 2.0 (trudne w SR)
- LUB: więcej "nie znam" niż "znam" w ostatnich 5 powtórkach
- LUB: nigdy nie ocenione jako 4-5

**Query param:** `?mode=difficult`

### 2. Tryb "Nowe fiszki"

**Kryteria:**

- Fiszki nigdy nie powtarzane
- Limit daily new cards (np. 10/day)

**Query param:** `?mode=new&limit=10`

### 3. Quiz Mode (Multiple Choice)

**Funkcjonalność:**

- 4 opcje odpowiedzi (1 poprawna + 3 dystraktory)
- Generowanie distractors:
  - Inne "back" z user's flashcards (ten sam topic jeśli tags)
  - Losowe z puli
- Time pressure (opcjonalnie)
- Punktacja: szybkość + poprawność

**UI:**

```typescript
<QuizCard>
  <Question>{front}</Question>
  <OptionsGrid>
    {options.map(opt =>
      <OptionButton
        key={opt.id}
        onClick={() => handleAnswer(opt)}
        correct={answered && opt.correct}
        incorrect={answered && selected === opt && !opt.correct}
      >
        {opt.text}
      </OptionButton>
    )}
  </OptionsGrid>
  <Timer>{timeLeft}s</Timer>
</QuizCard>
```

**Query param:** `?mode=quiz&time_limit=10`

### 4. Review Mode (przeglądanie)

**Funkcjonalność:**

- Przegląd wszystkich fiszek bez oceniania
- Auto-flip co X sekund (konfigurowalny)
- Slideshow mode
- Możliwość zaznaczenia do powtórki

**Query param:** `?mode=review&auto_flip=3`

### 5. Fiszki odwrócone (Reverse)

**Funkcjonalność:**

- Back → Front (pytanie z tyłu)
- Trening w obie strony
- Mix mode (losowo front/back jako pytanie)

**Query param:** `?mode=reverse`

### Implementacja

**ModeSelector Component:**

```typescript
<ModeSelector value={mode} onChange={setMode}>
  <ModeCard
    id="standard"
    name="Standardowa"
    description="Klasyczna nauka z fiszkami"
    icon={<BookOpen />}
  />
  <ModeCard
    id="quiz"
    name="Quiz"
    description="Wielokrotny wybór"
    icon={<CheckSquare />}
  />
  <ModeCard
    id="difficult"
    name="Tylko trudne"
    description="Fiszki wymagające powtórki"
    icon={<AlertCircle />}
  />
  {/* ... */}
</ModeSelector>
```

**Settings per mode:**

- Quiz: czas na odpowiedź, liczba opcji
- Review: auto-flip interval
- Standard: shuffle on/off

**Czas:** ~5-7h

---

## ✨ Priorytet 5: Animacje i Mikrointerakcje

**Cel:** Podniesienie jakości UX przez płynne animacje

### 1. 3D Flip Animation (Framer Motion)

**Implementacja:**

```typescript
import { motion } from "framer-motion";

export function FlashcardDisplay3D({ front, back, isFlipped, onFlip }) {
  return (
    <div className="perspective-1000" onClick={onFlip}>
      <motion.div
        className="relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front */}
        <motion.div className="backface-hidden">
          {front}
        </motion.div>

        {/* Back */}
        <motion.div
          className="backface-hidden absolute inset-0"
          style={{ rotateY: 180 }}
        >
          {back}
        </motion.div>
      </motion.div>
    </div>
  );
}
```

**CSS (Tailwind config):**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      perspective: {
        1000: "1000px",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".preserve-3d": {
          "transform-style": "preserve-3d",
        },
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
      });
    }),
  ],
};
```

### 2. Card Transitions

**Slide między fiszkami:**

```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={currentCardIndex}
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <FlashcardDisplay {...card} />
  </motion.div>
</AnimatePresence>
```

### 3. Confetti Effect

**Po 100% accuracy:**

```typescript
import Confetti from 'react-confetti';

{isSessionComplete && accuracy === 100 && (
  <Confetti
    width={width}
    height={height}
    recycle={false}
    numberOfPieces={500}
  />
)}
```

**Po milestone (streak 7 dni):**

```typescript
import { useConfetti } from "@/lib/hooks/useConfetti";

const { fire } = useConfetti();

useEffect(() => {
  if (newAchievementUnlocked) {
    fire();
  }
}, [newAchievementUnlocked]);
```

### 4. Animated Numbers

**Counter dla statystyk:**

```typescript
import { useSpring, animated } from 'react-spring';

function AnimatedNumber({ value }: { value: number }) {
  const props = useSpring({
    number: value,
    from: { number: 0 },
    config: { tension: 280, friction: 60 }
  });

  return (
    <animated.span>
      {props.number.to(n => n.toFixed(0))}
    </animated.span>
  );
}
```

### 5. Progress Animations

**Animated progress bar:**

```typescript
<motion.div
  className="h-full bg-primary"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>
```

**Pulse effect przy nowej fiszce:**

```typescript
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 0.3 }}
>
  <Badge>Nowa fiszka</Badge>
</motion.div>
```

### 6. Button Feedback

**Ripple effect:**

```typescript
const [ripples, setRipples] = useState([]);

const addRipple = (e) => {
  const ripple = {
    x: e.clientX - e.target.offsetLeft,
    y: e.clientY - e.target.offsetTop,
    id: Date.now(),
  };
  setRipples([...ripples, ripple]);
  setTimeout(() => {
    setRipples((ripples) => ripples.filter((r) => r.id !== ripple.id));
  }, 600);
};
```

### 7. Sounds (opcjonalne)

**Subtle audio feedback:**

```typescript
const sounds = {
  flip: new Audio("/sounds/flip.mp3"),
  correct: new Audio("/sounds/correct.mp3"),
  complete: new Audio("/sounds/complete.mp3"),
};

// Volume: 0.3 (subtle)
sounds.flip.volume = 0.3;
```

**User setting:** `enable_sounds` toggle w settings

### Biblioteki

- **Framer Motion** - główne animacje
- **react-confetti** - confetti effect
- **react-spring** - physics-based animations (alternatywa dla liczników)
- **react-use-sound** - audio playback (jeśli sounds)

**Czas:** ~3-4h

---

## 🔧 Priorytet 6: Advanced Features (Nice to Have)

### Tags/Categories

**Funkcjonalność:**

- Grupowanie fiszek po tematach
- Multi-select tags
- Filter po tagach w study session
- Auto-suggest tags (AI-based)

**Schema:**

```sql
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  color VARCHAR(7), -- hex color
  UNIQUE(user_id, name)
);

CREATE TABLE flashcard_tags (
  flashcard_id BIGINT REFERENCES flashcards(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (flashcard_id, tag_id)
);
```

### Import/Export

**Formaty:**

- **CSV Import/Export**
  - Format: `front,back,source,tags`
- **Anki Deck Import** (.apkg)
  - Parse Anki database format
  - Map fields
- **PDF Export**
  - Printable flashcards (grid layout)
  - 2-sided printing support

### Mobile App (PWA)

**Features:**

- Service Worker dla offline
- Add to Home Screen
- Push Notifications: "Czas na powtórkę!"
- Background sync
- Native-like experience

**manifest.json:**

```json
{
  "name": "10x Cards",
  "short_name": "10x Cards",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [...]
}
```

### Collaborative Decks

**Funkcjonalność:**

- Public/Private decks
- Share link dla deck
- Fork deck (copy to own)
- Browse community decks
- Rating system

**Schema:**

```sql
CREATE TABLE deck_shares (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(50) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deck_flashcards (
  deck_id UUID REFERENCES deck_shares(id),
  flashcard_id BIGINT REFERENCES flashcards(id),
  PRIMARY KEY (deck_id, flashcard_id)
);
```

### AI Enhancements

**1. Hint Generation:**

- Dla trudnych fiszek generuj hints
- "Podpowiedź: pierwsza litera to..."

**2. Pronunciation:**

- Text-to-speech dla języków obcych
- Web Speech API lub ElevenLabs

**3. Image Flashcards:**

- DALL-E integration
- Generate mnemonic images
- Visual learning mode

### Social Features

**1. Leaderboards:**

- Weekly/Monthly top learners
- Streaks leaderboard
- Most reviews

**2. Study Together:**

- Multiplayer quiz mode
- Real-time session
- WebSocket dla sync

**3. Share Progress:**

- "Ukończyłem 100 fiszek!" → Twitter/LinkedIn
- Beautiful shareable cards
- Screenshot with stats

---

## 📅 Roadmap Timeline

### Phase 1 (Week 1-2): Quick Wins

- [x] MVP Study Session
- [ ] Keyboard shortcuts
- [ ] Basic Framer Motion animations

### Phase 2 (Week 3-4): Core Value

- [ ] Spaced Repetition (SM-2)
- [ ] Basic stats dashboard

### Phase 3 (Week 5-6): Polish & Modes

- [ ] Quiz mode + difficult mode
- [ ] Advanced stats (heatmap)
- [ ] Confetti & microinteractions

### Phase 4 (Month 2): Advanced

- [ ] Tags/Categories
- [ ] PWA features
- [ ] Import/Export

### Phase 5 (Month 3+): Premium

- [ ] Collaborative decks
- [ ] AI enhancements
- [ ] Social features

---

## 📊 Metryki sukcesu

**Engagement:**

- Daily Active Users (DAU)
- Average session duration
- Cards reviewed per session
- Streak retention rate

**Learning:**

- Accuracy improvement over time
- Retention rate (7-day, 30-day)
- Time to mastery per flashcard

**Feature adoption:**

- % users using each mode
- Keyboard shortcuts usage
- SR adoption rate

---

## 💡 Uwagi implementacyjne

### Performance

- Lazy load wykresów (tylko gdy użytkownik otwiera stats)
- Pagination dla dużej liczby fiszek (>1000)
- Cache dla statystyk (Redis)
- Optimize queries z indexes

### Accessibility

- ARIA labels dla keyboard shortcuts
- Screen reader support dla quiz
- High contrast mode
- Keyboard navigation dla wszystkich features

### Mobile-first

- Touch gestures (swipe left/right)
- Responsive wykresy
- Bottom sheet dla mobile

### Analytics

- Track feature usage
- A/B test różnych UI
- Heatmap kliknięć (Hotjar)

---

**Dokument utworzony:** 2025-11-06  
**Status:** Draft - do aktualizacji po implementacji
