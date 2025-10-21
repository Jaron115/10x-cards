import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

/**
 * Główny widok uwierzytelniania (logowanie i rejestracja)
 * Zawiera komponenty Card i Tabs z przełączaniem między formularzami
 * UWAGA: Wersja UI-only, bez integracji z API
 */
export function AuthView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">10x-cards</CardTitle>
          <CardDescription>Twórz i zarządzaj fiszkami do nauki za pomocą AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logowanie</TabsTrigger>
              <TabsTrigger value="register">Rejestracja</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
