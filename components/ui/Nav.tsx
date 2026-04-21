"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Tuin", icon: "⌂" },
  { href: "/planten", label: "Planten", icon: "✿" },
  { href: "/taken", label: "Taken", icon: "◎" },
  { href: "/biodiversiteit", label: "Natuur", icon: "◈" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-white/90 dark:bg-[var(--color-base-dark)]/90 backdrop-blur-md md:hidden">
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                  active
                    ? "text-[var(--color-accent-primary)]"
                    : "text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="hidden md:flex flex-col w-52 shrink-0 border-r border-[var(--color-border)] dark:border-[var(--color-border-dark)] min-h-screen py-8 px-4 gap-1">
      <div className="px-2 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">🌿</span>
          <h1 className="font-display text-xl tracking-tight text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
            Club Tuin
          </h1>
        </div>
        <DarkModeToggle />
      </div>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-medium"
                : "text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] hover:bg-[var(--color-surface)] dark:hover:bg-[var(--color-surface-dark)]"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] hover:bg-[var(--color-surface)] dark:hover:bg-[var(--color-surface-dark)] transition-colors"
        >
          <span>→</span>
          Uitloggen
        </button>
      </div>
    </nav>
  );
}
