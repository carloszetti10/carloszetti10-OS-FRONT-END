import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erro?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, erro, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 rounded-lg border bg-white px-3 text-sm text-neutral-900 shadow-soft",
            "placeholder:text-neutral-400 transition-colors",
            "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
            "dark:bg-neutral-900 dark:text-neutral-100",
            erro ? "border-red-400" : "border-neutral-200 dark:border-neutral-700",
            className
          )}
          aria-invalid={!!erro}
          {...props}
        />
        {erro && <span className="text-xs text-red-500">{erro}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
