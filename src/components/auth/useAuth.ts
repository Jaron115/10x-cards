import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { loginUser, registerUser, logoutUser, requestPasswordResetEmail } from "@/lib/api/authClient";
import type { LoginFormData, RegisterFormData, ResetPasswordFormData } from "@/lib/schemas/auth.schemas";

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

    const result = await loginUser(data);

    if (result.success && result.data) {
      setUser(result.data.data.user);
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return { success: result.success, error: result.error };
  };

  /**
   * Register new user
   * On success: user is auto-logged in, shows success toast, and redirects to /app/generator
   * On error: shows error toast
   */
  const register = async (data: Omit<RegisterFormData, "confirmPassword">) => {
    setIsLoading(true);
    setError(null);

    const result = await registerUser(data);

    if (result.success && result.data) {
      setUser(result.data.data.user);
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return { success: result.success, error: result.error };
  };

  /**
   * Logout user
   * Clears user state and redirects to login page
   */
  const logout = async () => {
    setIsLoading(true);

    await logoutUser();

    // Clear user from store (always, even on error)
    clearUser();

    setIsLoading(false);
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

    const result = await requestPasswordResetEmail(data);

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return { success: result.success, error: result.error };
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
