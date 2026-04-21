"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <span className="text-6xl block">🌿</span>
          <Card>
            <CardContent className="py-8 space-y-4">
              <p className="text-4xl">✉️</p>
              <h2 className="font-display text-2xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                Check je inbox
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                We stuurden een resetlink naar<br />
                <span className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  {email}
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                <Link href="/login" className="text-[var(--color-accent-primary)] hover:underline">
                  Terug naar inloggen
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-6xl block mb-4">🌿</span>
          <p className="text-sm text-[var(--color-text-muted)]">Wachtwoord opnieuw instellen</p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="E-mailadres"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "…" : "Stuur resetlink"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          <Link href="/login" className="text-[var(--color-accent-primary)] hover:underline">
            Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordInner />
    </Suspense>
  );
}
