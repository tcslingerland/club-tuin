import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)]",
        primary:
          "bg-[#4A7A5C]/10 text-[#3d6b4f] border border-[#4A7A5C]/20 dark:text-[#6daa84]",
        success:
          "bg-[#4A7A5C]/10 text-[#3d6b4f] border border-[#4A7A5C]/20 dark:text-[#6daa84]",
        cta:
          "bg-[#D4784A]/10 text-[#D4784A] border border-[#D4784A]/20",
        muted:
          "bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]",
        sun:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        shade:
          "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className = "", variant, ...props }: BadgeProps) {
  return (
    <span className={`${badgeVariants({ variant })} ${className}`} {...props} />
  );
}

export { Badge };
