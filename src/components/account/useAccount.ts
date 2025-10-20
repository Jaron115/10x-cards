import { useState } from "react";
import type { UseAccountReturn } from "@/types";
import { toast } from "sonner";

/**
 * Custom hook do zarządzania stanem widoku konta
 * Obsługuje operacje usunięcia konta i wylogowania
 */
export const useAccount = (): UseAccountReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Development: User data comes from SSR (props), not from client-side fetch
  // TODO: After middleware is updated, fetch user from session
  const user = null;

  /**
   * Usunięcie konta użytkownika
   * Wywołuje API DELETE /api/user/account, następnie przekierowuje
   */
  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Development: No authentication token needed, API uses DEFAULT_USER_ID
      // TODO: After middleware is updated, add Authorization header with JWT token

      // Wywołanie API usunięcia konta
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się usunąć konta");
      }

      // Przekierowanie do strony głównej
      toast.success("Konto zostało pomyślnie usunięte");
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
      throw err; // Rzucamy błąd dalej, aby komponent mógł obsłużyć stan dialogu
    }
  };

  /**
   * Wylogowanie użytkownika
   */
  const logout = async () => {
    // Development: No real logout needed, just redirect
    // TODO: After middleware is updated, call supabase.auth.signOut()
    toast.success("Zostałeś wylogowany");
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    error,
    deleteAccount,
    logout,
  };
};
