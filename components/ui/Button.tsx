import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-hover)] active:scale-[0.98]",
        cta:
          "bg-[var(--color-accent-cta)] text-white hover:bg-[var(--color-accent-cta-hover)] active:scale-[0.98]",
        secondary:
          "bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] dark:border-[var(--color-border-dark)] dark:text-[var(--color-text-dark)] dark:hover:bg-[var(--color-surface-dark)]",
        outline:
          "bg-transparent border border-[var(--color-accent-primary)] text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)] hover:text-white active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] dark:text-[var(--color-text-muted-dark)] dark:hover:text-[var(--color-text-dark)]",
        danger:
          "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded",
        md: "h-10 px-4 text-sm rounded-md",
        lg: "h-12 px-6 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={`${buttonVariants({ variant, size })} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
