import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, TrendingUp } from "lucide-react";

/**
 * Placeholder dla widoku sesji nauki
 * Pokazuje informacje o przyszłej funkcjonalności
 */
export function StudyView() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sesja nauki</h1>
        <p className="text-muted-foreground">
          Ucz się z wykorzystaniem algorytmu powtórek odstępowych (Spaced Repetition)
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="space-y-6">
        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Funkcja w przygotowaniu
            </CardTitle>
            <CardDescription>
              Pracujemy nad implementacją sesji nauki. Wkrótce będziesz mógł tutaj uczyć się swoich
              fiszek!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Sesja nauki będzie zawierać:
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Feature 1 */}
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Spaced Repetition</h3>
                  <p className="text-xs text-muted-foreground">
                    Algorytm optymalizujący czas powtórek dla efektywnej nauki
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Statystyki postępów</h3>
                  <p className="text-xs text-muted-foreground">
                    Śledź swoje wyniki i postępy w nauce
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <BookOpen className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Tryby nauki</h3>
                  <p className="text-xs text-muted-foreground">
                    Wybieraj różne tryby nauki dopasowane do Twoich potrzeb
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-center pt-4">
                <Button asChild variant="outline">
                  <a href="/app/generator">Wygeneruj fiszki</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground">
              💡 <strong>Wskazówka:</strong> W międzyczasie możesz wygenerować fiszki w Generatorze
              AI lub dodać własne fiszki ręcznie.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

