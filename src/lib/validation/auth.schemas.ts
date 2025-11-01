/**
 * Zod validation schemas for authentication API endpoints
 * Used for backend request validation
 */

import { z } from "zod";

/**
 * Schema for login API request
 * Validates email and password fields
 */
export const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema for register API request
 * Validates email and password fields (no confirmPassword - that's frontend only)
 */
export const RegisterSchema = z.object({
  email: z.string().trim().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

/**
 * Schema for password reset request API
 * Validates email field only
 */
export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email"),
});

/**
 * Type exports
 */
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type RequestPasswordResetData = z.infer<typeof RequestPasswordResetSchema>;
