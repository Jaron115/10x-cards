import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, type LoginFormData } from "@/lib/schemas/auth.schemas";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "./useAuth";

/**
 * Formularz logowania z walidacją po stronie klienta
 * Używa react-hook-form + zod do walidacji
 * Zintegrowany z useAuth hook dla komunikacji z API
 */
export function LoginForm() {
  const { login, isLoading } = useAuth();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitted },
  } = methods;

  /**
   * Obsługa wysłania formularza
   */
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    await login(data);
    // Note: Redirect and toast handled by useAuth hook
  };

  return (
    <FormProvider {...methods}>
      <form data-testid="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Pole email */}
        <FormField name="email" label="Email" type="email" placeholder="twoj@email.pl" testId="login-email-input" />

        {/* Pole hasło z linkiem resetowania */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="form-field-password">Hasło</Label>
            <a href="/auth/reset-password" className="text-sm text-primary hover:underline">
              Nie pamiętam hasła
            </a>
          </div>
          <FormField name="password" type="password" placeholder="••••••••" testId="login-password-input" />
        </div>

        {/* Przycisk submit */}
        <Button
          data-testid="login-submit-button"
          type="submit"
          className="w-full"
          disabled={(!isValid && isSubmitted) || isLoading}
        >
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>
    </FormProvider>
  );
}
