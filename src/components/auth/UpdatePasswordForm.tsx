import { useState } from "react";
import type { UpdatePasswordFormData, UpdatePasswordFormErrors } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateUpdatePassword, validateConfirmPassword } from "@/lib/validation/auth.validation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { toast } from "sonner";

interface UpdatePasswordFormProps {
  supabaseClient: SupabaseClient<Database>;
}

/**
 * Formularz aktualizacji hasła
 * Używany po kliknięciu w link resetujący hasło z emaila
 * Aktualizacja hasła odbywa się bezpośrednio przez klienta Supabase (client-side)
 */
export function UpdatePasswordForm({ supabaseClient }: UpdatePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<UpdatePasswordFormErrors>({});

  /**
   * Walidacja pojedynczego pola
   */
  const validateField = (field: keyof UpdatePasswordFormData): void => {
    let error: string | undefined;

    if (field === "password") {
      error = validateUpdatePassword(formData.password);
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
    const passwordError = validateUpdatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    setValidationErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    return !passwordError && !confirmPasswordError;
  };

  /**
   * Obsługa zmiany wartości pola
   */
  const handleChange = (field: keyof UpdatePasswordFormData, value: string): void => {
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
  const handleBlur = (field: keyof UpdatePasswordFormData): void => {
    validateField(field);
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Aktualizuj hasło bezpośrednio przez klienta Supabase
      // Sesja jest już ustawiona w usePasswordReset hook
      const { error } = await supabaseClient.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        toast.error("Nie udało się zmienić hasła. Spróbuj ponownie lub zażądaj nowego linku.");
        return;
      }

      // Sukces
      toast.success("Hasło zostało zmienione pomyślnie!");

      // Przekieruj do strony logowania po krótkiej przerwie
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sprawdza czy formularz jest poprawny (dla stanu przycisku submit)
   */
  const isFormValid = (): boolean => {
    // Sprawdza czy wszystkie pola są wypełnione
    const allFieldsFilled = formData.password !== "" && formData.confirmPassword !== "";

    // Sprawdza poprawność bezpośrednio (bez ustawiania błędów w stanie)
    const isPasswordValid = !validateUpdatePassword(formData.password);
    const isConfirmPasswordValid = !validateConfirmPassword(formData.confirmPassword, formData.password);

    return allFieldsFilled && isPasswordValid && isConfirmPasswordValid;
  };

  return (
    <form data-testid="update-password-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Pole nowego hasła */}
      <div className="space-y-2">
        <Label htmlFor="update-password">Nowe hasło</Label>
        <Input
          data-testid="update-password-input"
          id="update-password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? "update-password-error" : undefined}
          className={validationErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p id="update-password-error" className="text-sm text-red-500" role="alert">
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Pole potwierdzenia hasła */}
      <div className="space-y-2">
        <Label htmlFor="update-confirm-password">Powtórz nowe hasło</Label>
        <Input
          data-testid="update-confirm-password-input"
          id="update-confirm-password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          aria-invalid={!!validationErrors.confirmPassword}
          aria-describedby={validationErrors.confirmPassword ? "update-confirm-password-error" : undefined}
          className={validationErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="••••••••"
        />
        {validationErrors.confirmPassword && (
          <p id="update-confirm-password-error" className="text-sm text-red-500" role="alert">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Przycisk submit */}
      <Button
        data-testid="update-password-submit-button"
        type="submit"
        className="w-full"
        disabled={!isFormValid() || isLoading}
      >
        {isLoading ? "Aktualizowanie..." : "Zmień hasło"}
      </Button>
    </form>
  );
}
