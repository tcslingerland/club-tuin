"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function EditGardenPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("gardens")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setName(data.name ?? "");
        setDescription(data.description ?? "");
        setLocation(data.location ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("gardens")
      .update({ name, description: description || null, location: location || null })
      .eq("id", id);

    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(`/tuinen/${id}`);
    }
  }

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je deze tuin wilt verwijderen?")) return;
    await supabase.from("gardens").delete().eq("id", id);
    router.push("/tuinen");
  }

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <Link
          href={`/tuinen/${id}`}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
        >
          ← Terug
        </Link>
        <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)] mt-1">
          Tuin bewerken
        </h1>
      </div>

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
              <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
                {saving ? "…" : "Opslaan"}
              </Button>
              <Link href={`/tuinen/${id}`}>
                <Button type="button" variant="outline">
                  Annuleren
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                Tuin verwijderen
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Dit kan niet ongedaan worden gemaakt
              </p>
            </div>
            <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-200 hover:bg-red-50">
              Verwijderen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
