/**
 * Universal form field component integrated with react-hook-form
 * Supports text, email, and password inputs with automatic error display
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  name: string;
  label?: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  testId?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * FormField component
 * Must be used inside a FormProvider from react-hook-form
 *
 * @example
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <FormField
 *     name="email"
 *     label="Email"
 *     type="email"
 *     placeholder="twoj@email.pl"
 *   />
 * </form>
 */
export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  disabled = false,
  className,
  testId,
  maxLength,
  showCharCount = false,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const inputId = `form-field-${name}`;
  const errorId = `${inputId}-error`;
  const counterId = `${inputId}-counter`;

  // Watch field value for character count
  const fieldValue = showCharCount && maxLength ? watch(name) : "";
  const charCount = typeof fieldValue === "string" ? fieldValue.length : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        data-testid={testId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : showCharCount && maxLength ? counterId : undefined}
        className={cn(error && "border-red-500 focus-visible:ring-red-500")}
        {...register(name)}
      />

      {/* Error message or character count */}
      {(error || (showCharCount && maxLength)) && (
        <div className="flex justify-between items-center">
          {error ? (
            <p id={errorId} className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}

          {showCharCount && maxLength && (
            <span
              id={counterId}
              className={cn("text-xs", charCount > maxLength ? "text-destructive" : "text-muted-foreground")}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
