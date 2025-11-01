/**
 * Universal textarea component integrated with react-hook-form
 * Includes character counter and validation error display
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  testId?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  minHeight?: string;
  helperText?: string;
}

/**
 * FormTextarea component
 * Must be used inside a FormProvider from react-hook-form
 *
 * @example
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <FormTextarea
 *     name="back"
 *     label="Tył fiszki"
 *     placeholder="Odpowiedź lub definicja"
 *     maxLength={500}
 *     showCharCount
 *   />
 * </form>
 */
export function FormTextarea({
  name,
  label,
  placeholder,
  disabled = false,
  className,
  testId,
  rows = 4,
  maxLength,
  showCharCount = true,
  minHeight,
  helperText,
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const inputId = `form-textarea-${name}`;
  const errorId = `${inputId}-error`;
  const counterId = `${inputId}-counter`;
  const helperId = `${inputId}-helper`;

  // Watch field value for character count
  const fieldValue = watch(name);
  const charCount = typeof fieldValue === "string" ? fieldValue.length : 0;

  // Determine color for character count
  const getCountColor = () => {
    if (!maxLength) return "text-muted-foreground";
    if (charCount > maxLength) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        data-testid={testId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : showCharCount && maxLength ? counterId : undefined}
        className={cn(
          error && "border-red-500 focus-visible:ring-red-500",
          minHeight && `min-h-[${minHeight}]`,
          "resize-y"
        )}
        style={minHeight ? { minHeight } : undefined}
        {...register(name)}
      />

      {/* Helper text, error message, or character count */}
      {(error || helperText || (showCharCount && maxLength)) && (
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {error ? (
              <p id={errorId} className="text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : helperText ? (
              <p id={helperId} className="text-xs text-muted-foreground">
                {helperText}
              </p>
            ) : (
              <span />
            )}
          </div>

          {showCharCount && maxLength && (
            <span id={counterId} className={cn("text-xs shrink-0", getCountColor())} aria-live="polite">
              {charCount.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
