import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "inset";
}

function Card({ className = "", variant = "default", ...props }: CardProps) {
  const base = "rounded-xl border transition-colors";
  const variants = {
    default:
      "bg-white dark:bg-[var(--color-surface-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)]",
    inset:
      "bg-[var(--color-surface)] dark:bg-[var(--color-base-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)]",
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 pb-3 ${className}`} {...props} />;
}

function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 pb-5 ${className}`} {...props} />;
}

function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 pb-5 pt-3 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] ${className}`}
      {...props}
    />
  );
}

export { Card, CardHeader, CardContent, CardFooter };
