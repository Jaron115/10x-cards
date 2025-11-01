import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema, type ResetPasswordFormData } from "@/lib/schemas/auth.schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "./useAuth";

/**
 * Formularz żądania resetu hasła
 * Używa react-hook-form + zod do walidacji
 * Wysyła email z linkiem do resetowania hasła
 */
export function ResetPasswordForm() {
  const { requestPasswordReset, isLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const methods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitted: formIsSubmitted },
  } = methods;

  /**
   * Obsługa wysłania formularza
   */
  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    const result = await requestPasswordReset(data);

    if (result.success) {
      setIsSubmitted(true);
    }
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
        <Button type="button" variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>
          Powrót do logowania
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form data-testid="reset-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Pole email */}
        <div className="space-y-2">
          <FormField name="email" label="Email" type="email" placeholder="twoj@email.pl" testId="reset-email-input" />
          <p className="text-sm text-gray-500">
            Wprowadź adres email powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
          </p>
        </div>

        {/* Przycisk submit */}
        <Button
          data-testid="reset-submit-button"
          type="submit"
          className="w-full"
          disabled={(!isValid && formIsSubmitted) || isLoading}
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
    </FormProvider>
  );
}
