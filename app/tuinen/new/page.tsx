"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function NewGardenPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("gardens")
      .insert({ name, description: description || null, location: location || null, user_id: user.id })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(`/tuinen/${data.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/tuinen"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] text-sm"
        >
          ← Tuinen
        </Link>
      </div>

      <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        Nieuwe tuin
      </h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Naam"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Achtertuin"
              required
            />
            <Input
              label="Beschrijving (optioneel)"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijv. Zonnige tuin op het zuiden"
            />
            <Input
              label="Locatie (optioneel)"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bijv. Amsterdam"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                {loading ? "…" : "Tuin aanmaken"}
              </Button>
              <Link href="/tuinen">
                <Button type="button" variant="outline">
                  Annuleren
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
