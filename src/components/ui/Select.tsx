import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  erro?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, erro, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-neutral-900 shadow-soft",
              "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              "dark:bg-neutral-900 dark:text-neutral-100",
              erro ? "border-red-400" : "border-neutral-200 dark:border-neutral-700",
              className
            )}
            aria-invalid={!!erro}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {erro && <span className="text-xs text-red-500">{erro}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
