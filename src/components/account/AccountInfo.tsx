import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { AccountInfoProps } from "@/types";

/**
 * Komponent wyświetlający podstawowe informacje o koncie użytkownika
 * Prezentuje email, datę utworzenia konta i status
 */
export const AccountInfo = ({ user }: AccountInfoProps) => {
  /**
   * Formatowanie daty utworzenia konta
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o koncie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            Adres email
          </Label>
          <p id="email" className="text-base font-medium">
            {user.email}
          </p>
        </div>

        {/* Data utworzenia */}
        <div className="space-y-2">
          <Label htmlFor="created-at" className="text-sm font-medium text-muted-foreground">
            Data utworzenia konta
          </Label>
          <p id="created-at" className="text-base">
            {formatDate(user.created_at)}
          </p>
        </div>

        {/* Status konta */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">
            Status konta
          </Label>
          <div id="status">
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Aktywne
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
