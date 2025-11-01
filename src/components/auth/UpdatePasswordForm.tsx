import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordFormSchema, type UpdatePasswordFormData } from "@/lib/schemas/auth.schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { toast } from "sonner";

interface UpdatePasswordFormProps {
  supabaseClient: SupabaseClient<Database>;
}

/**
 * Formularz aktualizacji hasła
 * Używa react-hook-form + zod do walidacji
 * Używany po kliknięciu w link resetujący hasło z emaila
 * Aktualizacja hasła odbywa się bezpośrednio przez klienta Supabase (client-side)
 */
export function UpdatePasswordForm({ supabaseClient }: UpdatePasswordFormProps) {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const methods = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordFormSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting, isSubmitted },
  } = methods;

  // Handle redirect in useEffect to avoid side effects during render
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  /**
   * Obsługa wysłania formularza
   */
  const onSubmit = async (data: UpdatePasswordFormData): Promise<void> => {
    try {
      // Aktualizuj hasło bezpośrednio przez klienta Supabase
      // Sesja jest już ustawiona w usePasswordReset hook
      const { error } = await supabaseClient.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error("Nie udało się zmienić hasła. Spróbuj ponownie lub zażądaj nowego linku.");
        return;
      }

      // Sukces
      toast.success("Hasło zostało zmienione pomyślnie!");

      // Ustaw flagę przekierowania
      setShouldRedirect(true);
    } catch {
      toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form data-testid="update-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Pole nowego hasła */}
        <FormField
          name="password"
          label="Nowe hasło"
          type="password"
          placeholder="••••••••"
          testId="update-password-input"
          disabled={isSubmitting}
        />

        {/* Pole potwierdzenia hasła */}
        <FormField
          name="confirmPassword"
          label="Powtórz nowe hasło"
          type="password"
          placeholder="••••••••"
          testId="update-confirm-password-input"
          disabled={isSubmitting}
        />

        {/* Przycisk submit */}
        <Button
          data-testid="update-password-submit-button"
          type="submit"
          className="w-full"
          disabled={(!isValid && isSubmitted) || isSubmitting}
        >
          {isSubmitting ? "Aktualizowanie..." : "Zmień hasło"}
        </Button>
      </form>
    </FormProvider>
  );
}
