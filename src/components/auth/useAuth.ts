import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import type { LoginFormData, RegisterFormData, ResetPasswordFormData } from "@/types";

export interface UseAuthReturn {
  // Actions
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: Omit<RegisterFormData, "confirmPassword">) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (data: ResetPasswordFormData) => Promise<{ success: boolean; error?: string }>;

  // States
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for authentication operations
 * Handles login, register, and logout with error handling and state management
 * Uses toast notifications for errors (per user preference: Option A)
 * Performs client-side redirects after successful operations (per user preference: Option A)
 */
export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, clearUser } = useAuthStore();

  /**
   * Login user
   * On success: shows loading toast and redirects to /app/generator
   * On error: shows error toast
   */
  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      if (response.ok) {
        const responseData = await response.json();

        // Update auth store
        setUser(responseData.data.user);

        // Show loading toast and redirect
        toast.loading("Logowanie...");

        // Redirect to app
        window.location.href = "/app/generator";

        return { success: true };
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "Błąd logowania";

        // Show error toast
        toast.error(errorMsg);

        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = "Błąd sieci. Spróbuj ponownie.";

      // Show error toast
      toast.error(errorMsg);

      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   * On success: user is auto-logged in, shows success toast, and redirects to /app/generator
   * On error: shows error toast
   */
  const register = async (data: Omit<RegisterFormData, "confirmPassword">) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      if (response.ok) {
        const responseData = await response.json();

        // Update auth store
        setUser(responseData.data.user);

        // Show success toast (per user preference: Option A)
        toast.success("Konto utworzone!");

        // Auto-redirect to app (per user preference: Option A)
        setTimeout(() => {
          window.location.href = "/app/generator";
        }, 500); // Small delay to let toast show

        return { success: true };
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "Błąd rejestracji";

        // Show error toast
        toast.error(errorMsg);

        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = "Błąd sieci. Spróbuj ponownie.";

      // Show error toast
      toast.error(errorMsg);

      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   * Clears user state and redirects to login page
   */
  const logout = async () => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      // Clear user from store
      clearUser();

      // Show success toast
      toast.success("Zostałeś wylogowany");

      // Redirect to login page
      window.location.href = "/";
    } catch {
      // Clear user anyway and redirect
      clearUser();
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset
   * Sends email with password reset link
   * On success: shows success toast with instructions
   * On error: shows error toast
   */
  const requestPasswordReset = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      if (response.ok) {
        const responseData = await response.json();

        // Show success toast
        toast.success(responseData.data.message);

        return { success: true };
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || "Błąd wysyłania emaila";

        // Show error toast
        toast.error(errorMsg);

        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch {
      const errorMsg = "Błąd sieci. Spróbuj ponownie.";

      // Show error toast
      toast.error(errorMsg);

      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    requestPasswordReset,
    isLoading,
    error,
  };
}
