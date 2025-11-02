import type { NavItem } from "@/types";

/**
 * Definicja elementów nawigacyjnych dla aplikacji
 * Współdzielone między desktopowym Sidebar i mobilnym MobileNav
 */
export const navItems: NavItem[] = [
  {
    label: "Generator AI",
    href: "/app/generator",
  },
  {
    label: "Moje fiszki",
    href: "/app/flashcards",
  },
  {
    label: "Dodaj fiszkę",
    href: "/app/flashcards/new",
  },
  {
    label: "Sesja nauki",
    href: "/app/study",
  },
  {
    label: "Konto",
    href: "/app/account",
  },
];
