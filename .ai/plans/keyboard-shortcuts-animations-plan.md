# Plan implementacji: Keyboard Shortcuts + Framer Motion Animations

**Data utworzenia:** 2025-11-06  
**Priorytet:** 1 (Quick wins - duży impact na UX)  
**Szacowany czas:** 3-4 godziny

---

## 🎯 Cele

1. **Keyboard Shortcuts** - przyśpieszenie nauki dla power users
2. **Framer Motion 3D Flip** - profesjonalna animacja przewracania fiszki
3. **Smooth Transitions** - płynne przejścia między fiszkami

---

## 📦 Część 1: Keyboard Shortcuts (1-1.5h)

### Funkcjonalności

| Klawisz     | Akcja           | Warunek                        |
| ----------- | --------------- | ------------------------------ |
| `Space`     | Przewróć fiszkę | Zawsze dostępne                |
| `1` lub `←` | Nie znam        | Tylko gdy fiszka przewrócona   |
| `2` lub `→` | Znam            | Tylko gdy fiszka przewrócona   |
| `Escape`    | Zakończ sesję   | Pokazuje dialog potwierdzenia  |
| `?`         | Pokaż pomoc     | Toggle overlay z listą skrótów |

### Implementacja

#### Krok 1.1: Hook useKeyboardShortcuts

**Plik:** `src/components/study/useKeyboardShortcuts.ts`

```typescript
import { useEffect, useCallback } from "react";

interface KeyboardShortcutsCallbacks {
  onFlip: () => void;
  onKnown: () => void;
  onUnknown: () => void;
  onExit: () => void;
  onHelp: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  isFlipped: boolean;
}

/**
 * Hook managing keyboard shortcuts for study session
 * Handles Space, 1/2, arrows, Escape, and ? key
 */
export function useKeyboardShortcuts(
  callbacks: KeyboardShortcutsCallbacks,
  options: UseKeyboardShortcutsOptions = { enabled: true, isFlipped: false }
) {
  const { enabled = true, isFlipped } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case " ":
          event.preventDefault();
          callbacks.onFlip();
          break;

        case "1":
        case "ArrowLeft":
          if (isFlipped) {
            event.preventDefault();
            callbacks.onUnknown();
          }
          break;

        case "2":
        case "ArrowRight":
          if (isFlipped) {
            event.preventDefault();
            callbacks.onKnown();
          }
          break;

        case "Escape":
          event.preventDefault();
          callbacks.onExit();
          break;

        case "?":
          event.preventDefault();
          callbacks.onHelp();
          break;

        default:
          break;
      }
    },
    [callbacks, enabled, isFlipped]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

**Weryfikacja:**

- [ ] Hook dodaje event listener
- [ ] Shortcuty działają poprawnie
- [ ] Ignoruje input/textarea
- [ ] Cleanup przy unmount

---

#### Krok 1.2: ShortcutsHelp Component

**Plik:** `src/components/study/ShortcutsHelp.tsx`

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: "Space", description: "Przewróć fiszkę", icon: "⎵" },
  { key: "1 lub ←", description: "Nie znam", icon: "←" },
  { key: "2 lub →", description: "Znam", icon: "→" },
  { key: "Escape", description: "Zakończ sesję", icon: "Esc" },
  { key: "?", description: "Pokaż/ukryj pomoc", icon: "?" },
];

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skróty klawiszowe</DialogTitle>
          <DialogDescription>
            Użyj klawiatury aby przyśpieszyć naukę
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm">{shortcut.description}</span>
              <Badge variant="secondary" className="font-mono">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Naciśnij <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd> aby
          pokazać/ukryć tę pomoc
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

**UI z alertem przy pierwszym użyciu:**

```typescript
// W useStudySession - dodać:
const [hasSeenShortcutHint, setHasSeenShortcutHint] = useState(localStorage.getItem("hasSeenShortcutHint") === "true");

useEffect(() => {
  if (!hasSeenShortcutHint && session) {
    toast.info("💡 Wskazówka: Użyj spacji aby przewrócić fiszkę", {
      duration: 5000,
    });
    localStorage.setItem("hasSeenShortcutHint", "true");
    setHasSeenShortcutHint(true);
  }
}, [session, hasSeenShortcutHint]);
```

**Weryfikacja:**

- [ ] Dialog pokazuje wszystkie skróty
- [ ] Toast przy pierwszym użyciu
- [ ] Można ukryć przez `?`

---

#### Krok 1.3: Integracja w StudyView

**Plik:** `src/components/study/StudyView.tsx`

```typescript
// Dodać importy:
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { useState } from "react";

// W komponencie:
const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
const [showExitDialog, setShowExitDialog] = useState(false);

useKeyboardShortcuts(
  {
    onFlip: flipCard,
    onKnown: markAsKnown,
    onUnknown: markAsUnknown,
    onExit: () => setShowExitDialog(true),
    onHelp: () => setShowShortcutsHelp(!showShortcutsHelp),
  },
  {
    enabled: !isLoading && !error && !isSessionComplete,
    isFlipped: session?.isFlipped || false,
  }
);

// W return:
<>
  {/* ... existing content */}

  <ShortcutsHelp
    open={showShortcutsHelp}
    onOpenChange={setShowShortcutsHelp}
  />

  {/* Exit dialog */}
  <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Zakończyć sesję?</AlertDialogTitle>
        <AlertDialogDescription>
          Twój postęp nie zostanie zapisany. Czy na pewno chcesz zakończyć?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Anuluj</AlertDialogCancel>
        <AlertDialogAction onClick={() => (window.location.href = "/app/flashcards")}>
          Zakończ sesję
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</>
```

**Badge na przyciskach:**

```typescript
<Button onClick={markAsKnown} size="lg" className="w-full">
  <CheckCircle2 className="mr-2 h-5 w-5" />
  Znam
  <Badge variant="secondary" className="ml-2 font-mono text-xs">
    2
  </Badge>
</Button>
```

**Weryfikacja:**

- [ ] Wszystkie skróty działają
- [ ] Dialog exit z potwierdzeniem
- [ ] Help overlay toggle
- [ ] Badge na przyciskach

---

## ✨ Część 2: Framer Motion Animations (1.5-2h)

### Instalacja

```bash
npm install framer-motion
```

### Funkcjonalności

1. **3D Flip Animation** - profesjonalne przewracanie fiszki
2. **Slide Transition** - płynne przejście między fiszkami
3. **Fade Animations** - animacje pojawiania się elementów

---

#### Krok 2.1: 3D Flip Animation

**Plik:** `src/components/study/FlashcardDisplay.tsx` (refactor)

```typescript
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardDisplayProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardDisplay({ front, back, isFlipped, onFlip }: FlashcardDisplayProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={isFlipped ? "Pokaż przód fiszki" : "Pokaż tył fiszki"}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0.0, 0.2, 1], // Custom easing
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="w-full h-full flex items-center justify-center p-8">
            <CardContent className="text-center p-0 w-full">
              <p className="text-sm text-muted-foreground mb-2">Przód</p>
              <p className="text-xl font-medium break-words">{front}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className="absolute inset-0 backface-hidden bg-primary/5"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Card className="w-full h-full flex items-center justify-center p-8 bg-primary/5">
            <CardContent className="text-center p-0 w-full">
              <p className="text-sm text-muted-foreground mb-2">Tył</p>
              <p className="text-lg break-words">{back}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

**CSS (Tailwind config):**

**Plik:** `tailwind.config.js` (dodać do plugins)

```javascript
const plugin = require("tailwindcss/plugin");

module.exports = {
  // ... existing config
  plugins: [
    // ... existing plugins
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".perspective-1000": {
          perspective: "1000px",
        },
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

**Weryfikacja:**

- [ ] Flip animation płynny
- [ ] 3D perspective działa
- [ ] Backface hidden poprawnie

---

#### Krok 2.2: Slide Transition między fiszkami

**Plik:** `src/components/study/StudyView.tsx` (aktualizacja)

```typescript
import { AnimatePresence, motion } from "framer-motion";

// W części z active session:
<AnimatePresence mode="wait">
  <motion.div
    key={session.currentCardIndex}
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 30,
    }}
  >
    <FlashcardDisplay
      front={currentFlashcard.front}
      back={currentFlashcard.back}
      isFlipped={session.isFlipped}
      onFlip={flipCard}
    />
  </motion.div>
</AnimatePresence>
```

**Weryfikacja:**

- [ ] Slide in/out działa
- [ ] Spring animation naturalna
- [ ] Brak glitchy między kartami

---

#### Krok 2.3: Progress Bar Animation

**Plik:** `src/components/ui/progress.tsx` (aktualizacja)

```typescript
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number;
}

function Progress({ value = 0, className, ...props }: ProgressProps) {
  return (
    <div
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <motion.div
        className="h-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      />
    </div>
  );
}

export { Progress };
```

**Weryfikacja:**

- [ ] Progress animuje się płynnie
- [ ] Nie ma jittery przy aktualizacji

---

#### Krok 2.4: Fade Animations dla UI

**Stats fade in:**

```typescript
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <div className="flex items-center gap-4 text-sm text-muted-foreground">
    <span>Fiszka {session.currentCardIndex + 1} z {session.flashcards.length}</span>
    <span>•</span>
    <span>Znam: {session.sessionStats.known} | Nie znam: {session.sessionStats.unknown}</span>
  </div>
</motion.div>
```

**Button hover effects:**

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
>
  {/* Button content */}
</motion.button>
```

**Weryfikacja:**

- [ ] Fade in naturalne
- [ ] Hover scale subtle
- [ ] Tap feedback responsive

---

## 📋 Checklist implementacji

### Keyboard Shortcuts

- [ ] Hook `useKeyboardShortcuts` utworzony
- [ ] Component `ShortcutsHelp` utworzony
- [ ] Toast przy pierwszym użyciu
- [ ] Badge na przyciskach z shortcuts
- [ ] Exit dialog z potwierdzeniem
- [ ] Wszystkie skróty działają (Space, 1/2, arrows, Esc, ?)
- [ ] Ignoruje input/textarea
- [ ] Help overlay toggle

### Framer Motion

- [ ] Framer Motion zainstalowany (`npm install framer-motion`)
- [ ] Tailwind config z utilities (perspective, preserve-3d)
- [ ] 3D flip animation w FlashcardDisplay
- [ ] Slide transition między fiszkami
- [ ] Progress bar z animacją
- [ ] Fade animations dla stats
- [ ] Hover/tap effects na przyciskach
- [ ] Brak jittery/glitchy

### Testing

- [ ] Space flip działa
- [ ] 1/← oznacza "nie znam" (tylko po flip)
- [ ] 2/→ oznacza "znam" (tylko po flip)
- [ ] Esc pokazuje dialog
- [ ] ? toggle help
- [ ] 3D flip smooth i naturalny
- [ ] Slide między kartami płynny
- [ ] Wszystko działa na mobile (touch)
- [ ] Performance dobry (60fps)

---

## 🐛 Potencjalne problemy i rozwiązania

### Problem 1: Keyboard shortcuts konflikt z browser

**Rozwiązanie:** `event.preventDefault()` dla wszystkich skrótów

### Problem 2: Framer Motion performance na mobile

**Rozwiązanie:**

- Użyć `will-change: transform` w CSS
- Reduce motion dla użytkowników z prefers-reduced-motion

```typescript
const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

<motion.div
  animate={{ rotateY: isFlipped ? 180 : 0 }}
  transition={{
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: "easeInOut"
  }}
>
```

### Problem 3: Backface visibility buggy w Safari

**Rozwiązanie:** Dodać `-webkit-` prefix

```css
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### Problem 4: AnimatePresence key issues

**Rozwiązanie:** Użyć unique key (currentCardIndex + flashcard.id)

```typescript
<AnimatePresence mode="wait">
  <motion.div key={`${session.currentCardIndex}-${currentFlashcard.id}`}>
```

---

## 🎯 Metryki sukcesu

**UX:**

- [ ] Użytkownicy używają keyboard shortcuts (analytics)
- [ ] Animations są smooth (60fps, Chrome DevTools)
- [ ] Brak crash/error z Framer Motion

**Performance:**

- [ ] Flip animation < 600ms
- [ ] Transition między kartami < 500ms
- [ ] No layout shift (CLS = 0)

**Accessibility:**

- [ ] Keyboard navigation działa
- [ ] Reduced motion respected
- [ ] Screen reader friendly

---

## 📚 Referencje

- [Framer Motion Docs](https://www.framer.com/motion/)
- [3D Card Flip Tutorial](https://www.framer.com/motion/examples/#card-flip)
- [React Keyboard Events](https://react.dev/reference/react-dom/components/common#keyboardevent-handler)
- [Tailwind 3D Transforms](https://tailwindcss.com/docs/transform)

---

**Status:** Ready for implementation  
**Next steps:** Start with Keyboard Shortcuts (easier), then Framer Motion
