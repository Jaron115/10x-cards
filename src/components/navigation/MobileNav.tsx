import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { navItems } from "./navItems";
import { useAuth } from "@/components/auth/useAuth";
import { useAuthStore } from "@/lib/stores/authStore";

interface MobileNavProps {
  currentPath: string;
  userEmail?: string;
}

/**
 * Mobilna nawigacja z hamburger menu
 * Wyświetla Sheet (drawer) z lewej strony ekranu zawierający pełną nawigację
 */
export const MobileNav = ({ currentPath, userEmail }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const { logout, isLoading } = useAuth();
  const user = useAuthStore((state) => state.user);

  // Use email from auth store if not provided via props
  const displayEmail = userEmail || user?.email;

  /**
   * Obsługa wylogowania użytkownika
   */
  const handleLogout = async () => {
    setOpen(false); // Close sheet before logout
    await logout();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Otwórz menu nawigacji"
          data-testid="mobile-menu-trigger"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        {/* Header with logo */}
        <div data-testid="mobile-nav-header" className="p-6 border-b border-border">
          <a href="/app/generator" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">10x Cards</h1>
          </a>
          {displayEmail && (
            <p className="text-xs text-muted-foreground mt-2 truncate" title={displayEmail}>
              {displayEmail}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav data-testid="mobile-nav-items" className="flex-1 p-4 overflow-y-auto">
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
        <div className="p-4 border-t border-border mt-auto">
          <Button
            data-testid="mobile-logout-button"
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? "Wylogowywanie..." : "Wyloguj"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
