/**
 * Wspólne funkcje walidacji dla formularzy uwierzytelniania
 */

/**
 * Walidacja adresu email
 * @param email - Adres email do walidacji
 * @returns Komunikat błędu lub undefined jeśli email jest poprawny
 */
export const validateEmail = (email: string): string | undefined => {
  const trimmedEmail = email.trim();

  if (trimmedEmail === "") {
    return "Email jest wymagany";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return "Nieprawidłowy format adresu email";
  }

  return undefined;
};

/**
 * Walidacja hasła dla formularza logowania
 * @param password - Hasło do walidacji
 * @returns Komunikat błędu lub undefined jeśli hasło jest poprawne
 */
export const validateLoginPassword = (password: string): string | undefined => {
  if (password === "") {
    return "Hasło jest wymagane";
  }

  return undefined;
};

/**
 * Walidacja hasła dla formularza rejestracji (z wymogiem minimalnej długości)
 * @param password - Hasło do walidacji
 * @returns Komunikat błędu lub undefined jeśli hasło jest poprawne
 */
export const validateRegisterPassword = (password: string): string | undefined => {
  if (password === "") {
    return "Hasło jest wymagane";
  }

  if (password.length < 6) {
    return "Hasło musi mieć minimum 6 znaków";
  }

  return undefined;
};

/**
 * Walidacja potwierdzenia hasła
 * @param confirmPassword - Potwierdzenie hasła
 * @param password - Oryginalne hasło
 * @returns Komunikat błędu lub undefined jeśli hasła są zgodne
 */
export const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
  if (confirmPassword === "") {
    return "Potwierdzenie hasła jest wymagane";
  }

  if (confirmPassword !== password) {
    return "Hasła nie są identyczne";
  }

  return undefined;
};
