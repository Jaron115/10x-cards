import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterFormData } from "@/lib/schemas/auth.schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { useAuth } from "./useAuth";

/**
 * Formularz rejestracji z walidacją po stronie klienta
 * Używa react-hook-form + zod do walidacji
 * Zintegrowany z useAuth hook dla komunikacji z API
 */
export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitted },
  } = methods;

  /**
   * Obsługa wysłania formularza
   */
  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    // Call register API (without confirmPassword)
    await registerUser({
      email: data.email,
      password: data.password,
    });
    // Note: Auto-redirect and toast handled by useAuth hook
  };

  return (
    <FormProvider {...methods}>
      <form data-testid="register-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Pole email */}
        <FormField name="email" label="Email" type="email" placeholder="twoj@email.pl" testId="register-email-input" />

        {/* Pole hasło */}
        <FormField
          name="password"
          label="Hasło"
          type="password"
          placeholder="••••••••"
          testId="register-password-input"
        />

        {/* Pole potwierdzenia hasła */}
        <FormField
          name="confirmPassword"
          label="Powtórz hasło"
          type="password"
          placeholder="••••••••"
          testId="register-confirm-password-input"
        />

        {/* Przycisk submit */}
        <Button
          data-testid="register-submit-button"
          type="submit"
          className="w-full"
          disabled={(!isValid && isSubmitted) || isLoading}
        >
          {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
        </Button>
      </form>
    </FormProvider>
  );
}
