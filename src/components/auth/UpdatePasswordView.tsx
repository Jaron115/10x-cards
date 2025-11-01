import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { usePasswordReset } from "./usePasswordReset";

interface UpdatePasswordViewProps {
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Widok aktualizacji hasła
 * Zawiera formularz ustawiania nowego hasła w Card
 * Obsługuje token z URL przed pokazaniem formularza
 */
export function UpdatePasswordView({ supabaseUrl, supabaseKey }: UpdatePasswordViewProps) {
  const { isReady, error, supabaseClient } = usePasswordReset({ supabaseUrl, supabaseKey });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Nowe hasło</CardTitle>
          <CardDescription>
            {isReady ? "Wprowadź nowe hasło dla Twojego konta" : "Weryfikacja linku..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Błąd - nieprawidłowy lub wygasły link */}
          {error && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = "/auth/reset-password")}
              >
                Zażądaj nowego linku
              </Button>
              <div className="text-center">
                <a href="/" className="text-sm text-primary hover:underline">
                  Powrót do logowania
                </a>
              </div>
            </div>
          )}

          {/* Ładowanie - weryfikacja tokena */}
          {!error && !isReady && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-gray-600">Weryfikacja linku resetującego...</p>
            </div>
          )}

          {/* Sukces - pokaż formularz */}
          {!error && isReady && supabaseClient && <UpdatePasswordForm supabaseClient={supabaseClient} />}
        </CardContent>
      </Card>
    </div>
  );
}
