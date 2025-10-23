import { useAccount } from "./useAccount";
import { AccountInfo } from "./AccountInfo";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import type { AccountViewProps } from "@/types";

/**
 * Główny komponent widoku konta
 * Wyświetla informacje o użytkowniku i umożliwia zarządzanie kontem
 */
export const AccountView = ({ user: initialUser }: AccountViewProps) => {
  const { user, isLoading, error, deleteAccount } = useAccount();

  // Używamy użytkownika z props jako fallback (dane SSR)
  const displayUser = user || initialUser;

  if (isLoading && !displayUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Ładowanie danych konta...</p>
        </div>
      </div>
    );
  }

  if (error && !displayUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-destructive font-medium">Wystąpił błąd podczas ładowania danych konta</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Nie znaleziono danych użytkownika</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Moje konto</h1>
        <p className="text-muted-foreground">Zarządzaj swoim kontem i przeglądaj podstawowe informacje</p>
      </div>

      {/* Account information */}
      <AccountInfo user={displayUser} />

      {/* Danger zone */}
      <div className="border border-destructive/50 rounded-lg p-6 space-y-3 bg-destructive/5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-destructive">Strefa niebezpieczna</h2>
          <p className="text-sm text-muted-foreground">Operacje poniżej są nieodwracalne. Postępuj ostrożnie.</p>
        </div>
        <DeleteAccountDialog onDeleteSuccess={deleteAccount} />
      </div>
    </div>
  );
};
