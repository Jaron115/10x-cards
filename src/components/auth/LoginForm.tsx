import { useState } from "react";
import type { LoginFormData, LoginFormErrors } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateEmail, validateLoginPassword } from "@/lib/validation/auth.validation";
import { useAuth } from "./useAuth";

/**
 * Formularz logowania z walidacją po stronie klienta
 * Zintegrowany z useAuth hook dla komunikacji z API
 */
export function LoginForm() {
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<LoginFormErrors>({});

  /**
   * Walidacja pojedynczego pola
   */
  const validateField = (field: keyof LoginFormData): void => {
    let error: string | undefined;

    if (field === "email") {
      error = validateEmail(formData.email);
    } else if (field === "password") {
      error = validateLoginPassword(formData.password);
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
    const passwordError = validateLoginPassword(formData.password);

    setValidationErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  /**
   * Obsługa zmiany wartości pola
   */
  const handleChange = (field: keyof LoginFormData, value: string): void => {
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
  };

  /**
   * Obsługa zdarzenia blur (opuszczenie pola)
   */
  const handleBlur = (field: keyof LoginFormData): void => {
    validateField(field);
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const isValid = validateForm();

    if (isValid) {
      // Call login API
      await login(formData);
      // Note: Redirect and toast handled by useAuth hook
    }
  };

  /**
   * Sprawdza czy formularz jest poprawny (dla stanu przycisku submit)
   */
  const isFormValid = (): boolean => {
    // Sprawdza czy wszystkie pola są wypełnione
    const allFieldsFilled = formData.email.trim() !== "" && formData.password !== "";

    // Sprawdza czy nie ma błędów walidacji
    const noErrors = !validationErrors.email && !validationErrors.password;

    return allFieldsFilled && noErrors;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pole email */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? "login-email-error" : undefined}
          className={validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="twoj@email.pl"
        />
        {validationErrors.email && (
          <p id="login-email-error" className="text-sm text-red-500" role="alert">
            {validationErrors.email}
          </p>
        )}
      </div>

      {/* Pole hasło */}
      <div className="space-y-2">
        <Label htmlFor="login-password">Hasło</Label>
        <Input
          id="login-password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? "login-password-error" : undefined}
          className={validationErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p id="login-password-error" className="text-sm text-red-500" role="alert">
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Przycisk submit */}
      <Button type="submit" className="w-full" disabled={!isFormValid() || isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
