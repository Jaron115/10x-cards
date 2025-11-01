import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./ResetPasswordForm";

/**
 * Widok resetowania hasła
 * Zawiera formularz żądania resetu hasła w Card
 */
export function ResetPasswordView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Resetowanie hasła</CardTitle>
          <CardDescription>Podaj adres email, na który wyślemy link do resetowania hasła</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
