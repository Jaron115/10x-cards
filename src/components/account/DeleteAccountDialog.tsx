import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DeleteAccountDialogProps } from "@/types";

/**
 * Dialog z potwierdzeniem usunięcia konta
 * Zawiera checkbox z potwierdzeniem świadomości nieodwracalności operacji
 */
export const DeleteAccountDialog = ({ onDeleteSuccess }: DeleteAccountDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Obsługa usunięcia konta
   */
  const handleDelete = async () => {
    if (!isConfirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDeleteSuccess();
      // Po pomyślnym usunięciu użytkownik jest przekierowywany
      // więc nie musimy zamykać dialogu ani resetować stanu
    } catch {
      // Błąd jest obsługiwany w hooku useAccount
      // Dialog pozostaje otwarty, aby użytkownik mógł spróbować ponownie
      setIsDeleting(false);
    }
  };

  /**
   * Reset stanu przy zamknięciu dialogu
   */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset stanu przy zamknięciu
      setIsConfirmed(false);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="mt-4">
          Usuń konto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Ta operacja jest <strong>nieodwracalna</strong> i spowoduje <strong>trwałe usunięcie</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Twojego konta użytkownika</li>
              <li>Wszystkich Twoich fiszek</li>
              <li>Całej historii generacji AI</li>
              <li>Wszystkich powiązanych danych</li>
            </ul>
            <p className="text-sm font-medium text-destructive">Nie będzie możliwości przywrócenia tych danych.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Checkbox potwierdzenia */}
        <div className="flex items-start space-x-3 py-4">
          <Checkbox
            id="confirm-delete"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            disabled={isDeleting}
          />
          <Label htmlFor="confirm-delete" className="text-sm font-medium leading-relaxed cursor-pointer">
            Rozumiem, że ta operacja jest nieodwracalna i usunie wszystkie moje dane
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń konto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
