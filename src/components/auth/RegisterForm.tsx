import { useState } from "react";
import type { RegisterFormData, RegisterFormErrors } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateEmail, validateRegisterPassword, validateConfirmPassword } from "@/lib/validation/auth.validation";

/**
 * Formularz rejestracji z walidacją po stronie klienta
 * UWAGA: Wersja UI-only, bez integracji z API
 */
export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<RegisterFormErrors>({});

  /**
   * Walidacja pojedynczego pola
   */
  const validateField = (field: keyof RegisterFormData): void => {
    let error: string | undefined;

    if (field === "email") {
      error = validateEmail(formData.email);
    } else if (field === "password") {
      error = validateRegisterPassword(formData.password);
    } else if (field === "confirmPassword") {
      error = validateConfirmPassword(formData.confirmPassword, formData.password);
    }

    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  /**
   * Walidacja całego formularza
   * @returns true jeśli formularz jest poprawny
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validateRegisterPassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    setValidationErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    return !emailError && !passwordError && !confirmPasswordError;
  };

  /**
   * Obsługa zmiany wartości pola
   */
  const handleChange = (field: keyof RegisterFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Czyści błąd dla edytowanego pola
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Jeśli użytkownik edytuje hasło i pole confirmPassword ma błąd, sprawdź ponownie zgodność
    if (field === "password" && validationErrors.confirmPassword && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value);
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  /**
   * Obsługa zdarzenia blur (opuszczenie pola)
   */
  const handleBlur = (field: keyof RegisterFormData): void => {
    validateField(field);
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    const isValid = validateForm();

    if (isValid) {
      // TODO: Add useAuth.register() call here when implementing API integration
      // Formularz jest poprawny, gotowy do integracji z API
    }
  };

  /**
   * Sprawdza czy formularz jest poprawny (dla stanu przycisku submit)
   */
  const isFormValid = (): boolean => {
    // Sprawdza czy wszystkie pola są wypełnione
    const allFieldsFilled = formData.email.trim() !== "" && formData.password !== "" && formData.confirmPassword !== "";

    // Sprawdza czy nie ma błędów walidacji
    const noErrors = !validationErrors.email && !validationErrors.password && !validationErrors.confirmPassword;

    return allFieldsFilled && noErrors;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pole email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? "register-email-error" : undefined}
          className={validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="twoj@email.pl"
        />
        {validationErrors.email && (
          <p id="register-email-error" className="text-sm text-red-500" role="alert">
            {validationErrors.email}
          </p>
        )}
      </div>

      {/* Pole hasło */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Hasło</Label>
        <Input
          id="register-password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? "register-password-error" : undefined}
          className={validationErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p id="register-password-error" className="text-sm text-red-500" role="alert">
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Pole potwierdzenia hasła */}
      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Powtórz hasło</Label>
        <Input
          id="register-confirm-password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          aria-invalid={!!validationErrors.confirmPassword}
          aria-describedby={validationErrors.confirmPassword ? "register-confirm-password-error" : undefined}
          className={validationErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="••••••••"
        />
        {validationErrors.confirmPassword && (
          <p id="register-confirm-password-error" className="text-sm text-red-500" role="alert">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Przycisk submit */}
      <Button type="submit" className="w-full" disabled={!isFormValid()}>
        Zarejestruj się
      </Button>
    </form>
  );
}
