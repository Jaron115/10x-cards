import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UsePasswordResetProps {
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Hook do obsługi tokena resetowania hasła z URL
 * Supabase wysyła token w hash fragment (#access_token=...)
 * Ten hook przetwarza token i ustawia sesję
 */
export function usePasswordReset({ supabaseUrl, supabaseKey }: UsePasswordResetProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Sprawdź czy jesteśmy w przeglądarce
        if (typeof window === "undefined") {
          return;
        }

        // Pobierz hash fragment z URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenFromUrl = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // Sprawdź czy to link resetujący hasło
        if (!tokenFromUrl || type !== "recovery") {
          setError("Nieprawidłowy lub wygasły link resetujący hasło. Zażądaj nowego linku.");
          setIsReady(false);
          return;
        }

        // Utwórz klienta Supabase
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        // Ustaw sesję używając tokena z URL
        // Refresh token może być opcjonalny w przypadku recovery
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: tokenFromUrl,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          setError("Link wygasł lub jest nieprawidłowy. Zażądaj nowego linku do resetowania hasła.");
          setIsReady(false);
          return;
        }

        // Sprawdź czy sesja została poprawnie ustawiona
        if (!sessionData.session) {
          setError("Link wygasł lub jest nieprawidłowy. Zażądaj nowego linku do resetowania hasła.");
          setIsReady(false);
          return;
        }

        // Wyczyść hash z URL (opcjonalnie, dla lepszego UX)
        window.history.replaceState(null, "", window.location.pathname);

        // Zapisz klienta Supabase z ustawioną sesją
        setSupabaseClient(supabase);
        setIsReady(true);
        setError(null);
      } catch {
        setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
        setIsReady(false);
      }
    };

    handlePasswordReset();
  }, [supabaseUrl, supabaseKey]);

  return { isReady, error, supabaseClient };
}
