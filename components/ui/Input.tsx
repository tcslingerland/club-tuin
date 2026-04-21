import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "h-10 w-full rounded-md border px-3 text-sm",
            "bg-white dark:bg-[var(--color-surface-dark)]",
            "border-[var(--color-border)] dark:border-[var(--color-border-dark)]",
            "text-[var(--color-text)] dark:text-[var(--color-text-dark)]",
            "placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-text-muted-dark)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-1",
            "transition-shadow",
            error ? "border-red-400 focus:ring-red-400" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {hint && !error && (
          <span className="text-xs text-[var(--color-text-muted)]">{hint}</span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm",
            "bg-white dark:bg-[var(--color-surface-dark)]",
            "border-[var(--color-border)] dark:border-[var(--color-border-dark)]",
            "text-[var(--color-text)] dark:text-[var(--color-text-dark)]",
            "placeholder:text-[var(--color-text-muted)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]",
            "resize-none transition-shadow",
            error ? "border-red-400" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
