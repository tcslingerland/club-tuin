"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setConfirmedEmail(email);
        setConfirmed(true);
      }
    }

    setLoading(false);
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🌿</span>
          </div>
          <Card>
            <CardContent className="py-8 space-y-4">
              <p className="text-4xl">✉️</p>
              <h2 className="font-display text-2xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                Check je inbox
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                We stuurden een bevestigingslink naar<br />
                <span className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  {confirmedEmail}
                </span>
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Klik de link in de e-mail om je account te activeren.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                Niet ontvangen? Check je spam of{" "}
                <button
                  type="button"
                  onClick={() => { setConfirmed(false); setMode("signup"); }}
                  className="text-[var(--color-accent-primary)] hover:underline"
                >
                  probeer opnieuw
                </button>
                .
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
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🌿</span>
          </div>
          <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">
            Club Tuin
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {mode === "signin" ? "Inloggen op je account" : "Maak een account aan"}
          </p>
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
              <Input
                label="Wachtwoord"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "…" : mode === "signin" ? "Inloggen" : "Account aanmaken"}
              </Button>
              {mode === "signin" && (
                <p className="text-center text-xs text-[var(--color-text-muted)]">
                  <Link
                    href={`/login/forgot${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="hover:text-[var(--color-accent-primary)] transition-colors"
                  >
                    Wachtwoord vergeten?
                  </Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          {mode === "signin" ? "Nog geen account?" : "Al een account?"}{" "}
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-[var(--color-accent-primary)] hover:underline"
          >
            {mode === "signin" ? "Aanmelden" : "Inloggen"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
