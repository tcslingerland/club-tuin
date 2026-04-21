export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function GardenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: garden } = await supabase
    .from("gardens")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!garden) notFound();

  const { data: placements } = await supabase
    .from("plant_placements")
    .select("*")
    .eq("garden_id", id);

  const plantCount = placements?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/tuinen"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
          >
            ← Tuinen
          </Link>
          <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)] mt-1">
            {garden.name}
          </h1>
          {garden.description && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {garden.description}
            </p>
          )}
          {garden.location && (
            <p className="text-xs text-[var(--color-text-muted)]/70 mt-1">
              📍 {garden.location}
            </p>
          )}
        </div>
        <Link href={`/tuinen/${id}/bewerken`}>
          <Button variant="outline" size="sm">
            Bewerken
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-display text-[var(--color-accent-primary)]">
              {plantCount}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {plantCount === 1 ? "plant" : "planten"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-display text-[var(--color-accent-primary)]">
              —
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              biodiversiteitsscore
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canvas placeholder */}
      <Card>
        <CardContent className="py-12 text-center">
          <span className="text-4xl block mb-3">⌂</span>
          <p className="text-[var(--color-text-muted)] text-sm mb-4">
            Tuinkaart komt hier — sleep planten op de kaart
          </p>
          <Button variant="outline" disabled>
            Canvas — binnenkort beschikbaar
          </Button>
        </CardContent>
      </Card>

      {/* Plants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
            Planten
          </h2>
          <Link href="/planten">
            <Button size="sm">+ Plant toevoegen</Button>
          </Link>
        </div>

        {plantCount === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <span className="text-3xl block mb-2">✿</span>
              <p className="text-sm text-[var(--color-text-muted)]">
                Nog geen planten in deze tuin
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {placements!.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Plant #{p.plant_id ?? p.custom_plant_id}</p>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {p.in_pot ? "🪴 pot" : "🌍 grond"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
