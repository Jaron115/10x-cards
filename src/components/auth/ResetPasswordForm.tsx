import { useState } from "react";
import type { ResetPasswordFormData, ResetPasswordFormErrors } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateEmail } from "@/lib/validation/auth.validation";
import { useAuth } from "./useAuth";

/**
 * Formularz żądania resetu hasła
 * Wysyła email z linkiem do resetowania hasła
 */
export function ResetPasswordForm() {
  const { requestPasswordReset, isLoading } = useAuth();

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: "",
  });

  const [validationErrors, setValidationErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  /**
   * Walidacja pola email
   */
  const validateField = (): void => {
    const error = validateEmail(formData.email);

    setValidationErrors({
      email: error,
    });
  };

  /**
   * Walidacja całego formularza
   * @returns true jeśli formularz jest poprawny
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);

    setValidationErrors({
      email: emailError,
    });

    return !emailError;
  };

  /**
   * Obsługa zmiany wartości pola
   */
  const handleChange = (value: string): void => {
    setFormData({
      email: value,
    });

    // Czyści błąd dla edytowanego pola
    if (validationErrors.email) {
      setValidationErrors({
        email: undefined,
      });
    }
  };

  /**
   * Obsługa zdarzenia blur (opuszczenie pola)
   */
  const handleBlur = (): void => {
    validateField();
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const isValid = validateForm();

    if (isValid) {
      const result = await requestPasswordReset(formData);
      
      if (result.success) {
        setIsSubmitted(true);
      }
    }
  };

  /**
   * Sprawdza czy formularz jest poprawny (dla stanu przycisku submit)
   */
  const isFormValid = (): boolean => {
    // Sprawdza czy pole jest wypełnione
    const fieldFilled = formData.email.trim() !== "";

    // Sprawdza poprawność emaila bezpośrednio (bez ustawiania błędu w stanie)
    const isEmailValid = !validateEmail(formData.email);

    return fieldFilled && isEmailValid;
  };

  // Po wysłaniu formularza pokazujemy komunikat sukcesu
  if (isSubmitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-800">
            Email z instrukcjami został wysłany. Sprawdź swoją skrzynkę pocztową i kliknij w link resetujący hasło.
          </p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={() => window.location.href = "/"}
        >
          Powrót do logowania
        </Button>
      </div>
    );
  }

  return (
    <form data-testid="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Pole email */}
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          data-testid="reset-email-input"
          id="reset-email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? "reset-email-error" : undefined}
          className={validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="twoj@email.pl"
        />
        {validationErrors.email && (
          <p id="reset-email-error" className="text-sm text-red-500" role="alert">
            {validationErrors.email}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Wprowadź adres email powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
        </p>
      </div>

      {/* Przycisk submit */}
      <Button 
        data-testid="reset-submit-button" 
        type="submit" 
        className="w-full" 
        disabled={!isFormValid() || isLoading}
      >
        {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>

      {/* Link powrotu do logowania */}
      <div className="text-center">
        <a href="/" className="text-sm text-primary hover:underline">
          Powrót do logowania
        </a>
      </div>
    </form>
  );
}

