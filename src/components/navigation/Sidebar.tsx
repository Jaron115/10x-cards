import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarNavItem } from "./SidebarNavItem";
import type { SidebarProps, NavItem } from "@/types";
import { toast } from "sonner";

/**
 * Komponent nawigacji bocznej dla chronionych widoków
 * Wyświetla logo, listę linków nawigacyjnych oraz przycisk wylogowania
 */
export const Sidebar = ({ currentPath, userEmail }: SidebarProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Definicja elementów nawigacyjnych
  const navItems: NavItem[] = [
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

  /**
   * Obsługa wylogowania użytkownika
   */
  const handleLogout = () => {
    // Development: No real logout needed, just redirect
    // TODO: After middleware is updated, call supabase.auth.signOut()
    setIsLoggingOut(true);
    toast.success("Zostałeś wylogowany");
    window.location.href = "/";
  };

  return (
    <aside className="hidden lg:flex w-64 bg-background border-r border-border flex-col h-screen sticky top-0">
      {/* Header with logo */}
      <div className="p-6 border-b border-border">
        <a href="/app/generator" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">10x Cards</h1>
        </a>
        {userEmail && (
          <p className="text-xs text-muted-foreground mt-2 truncate" title={userEmail}>
            {userEmail}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isActive={currentPath === item.href}
            />
          ))}
        </ul>
      </nav>

      {/* Logout button at the bottom */}
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
        </Button>
      </div>
    </aside>
  );
};
