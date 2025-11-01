/**
 * Authentication API client
 * Provides type-safe methods for all auth operations
 * Uses generic callApi for consistent error handling and toast notifications
 */

import { toast } from "sonner";
import { callApi } from "./apiClient";
import type { LoginFormData, RegisterFormData, ResetPasswordFormData } from "../schemas/auth.schemas";
import type { AuthUserDTO } from "@/types";

/**
 * API Response types
 */
interface AuthSuccessResponse {
  data: {
    user: AuthUserDTO;
  };
}

interface PasswordResetSuccessResponse {
  data: {
    message: string;
  };
}

/**
 * Login user
 * On success: redirects to /app/generator
 * On error: shows error toast
 */
export async function loginUser(data: LoginFormData) {
  return callApi<LoginFormData, AuthSuccessResponse>({
    endpoint: "/api/auth/login",
    method: "POST",
    body: data,
    loadingMessage: "Logowanie...",
    redirectUrl: "/app/generator",
  });
}

/**
 * Register new user
 * On success: user is auto-logged in and redirected to /app/generator
 * On error: shows error toast
 */
export async function registerUser(data: Omit<RegisterFormData, "confirmPassword">) {
  return callApi<Omit<RegisterFormData, "confirmPassword">, AuthSuccessResponse>({
    endpoint: "/api/auth/register",
    method: "POST",
    body: data,
    successMessage: "Konto utworzone!",
    redirectUrl: "/app/generator",
    redirectDelay: 500,
  });
}

/**
 * Logout user
 * Clears session and redirects to login page
 */
export async function logoutUser() {
  return callApi({
    endpoint: "/api/auth/logout",
    method: "POST",
    successMessage: "Zostałeś wylogowany",
    redirectUrl: "/",
    redirectDelay: 0,
  });
}

/**
 * Request password reset email
 * On success: shows success message from API response
 * On error: shows error toast
 */
export async function requestPasswordResetEmail(data: ResetPasswordFormData) {
  return callApi<ResetPasswordFormData, PasswordResetSuccessResponse>({
    endpoint: "/api/auth/request-reset",
    method: "POST",
    body: data,
    onSuccess: (response) => {
      // Show custom success message from API
      if (response?.data?.message) {
        toast.success(response.data.message);
      }
    },
  });
}
