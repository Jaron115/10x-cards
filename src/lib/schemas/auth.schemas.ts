/**
 * Zod validation schemas for authentication forms (frontend)
 * Used with react-hook-form for client-side validation
 */

import { z } from "zod";

/**
 * Schema for login form
 * Validates email and password fields
 */
export const loginFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .trim()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email"),
  password: z.string({ required_error: "Hasło jest wymagane" }).min(1, "Hasło jest wymagane"),
});

/**
 * Schema for register form
 * Validates email, password and password confirmation
 */
export const registerFormSchema = z
  .object({
    email: z
      .string({ required_error: "Email jest wymagany" })
      .trim()
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy format adresu email"),
    password: z.string({ required_error: "Hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for password reset request form
 * Validates email field only
 */
export const resetPasswordFormSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .trim()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email"),
});

/**
 * Schema for update password form
 * Validates new password and confirmation
 */
export const updatePasswordFormSchema = z
  .object({
    password: z.string({ required_error: "Nowe hasło jest wymagane" }).min(6, "Hasło musi mieć minimum 6 znaków"),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type exports for form data
 */
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordFormSchema>;
