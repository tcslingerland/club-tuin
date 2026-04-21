"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlantById } from "@/lib/plants";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const MAANDEN = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

const HUIDIGE_MAAND = new Date().getMonth() + 1;

export default function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const plant = getPlantById(Number(id));

  if (!plant) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-[var(--color-text-muted)]">Plant niet gevonden.</p>
        <Link href="/planten" className="text-[var(--color-accent-primary)] text-sm mt-2 inline-block">
          ← Terug naar bibliotheek
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/planten"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
        >
          ← Plantenbibliotheek
        </Link>
        <div className="flex items-start gap-4 mt-2">
          <span className="text-5xl leading-none">{plant.emoji}</span>
          <div>
            <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
              {plant.naam}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] italic">{plant.latijn}</p>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-lg">{plant.zon === "zon" ? "☀️" : plant.zon === "schaduw" ? "🌑" : plant.zon === "halfschaduw" ? "⛅" : "☀️⛅"}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 capitalize">{plant.zon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-lg">{plant.water === "weinig" ? "💧" : plant.water === "veel" ? "💧💧💧" : "💧💧"}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 capitalize">{plant.water} water</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-lg font-display text-[var(--color-accent-primary)]">{plant.h}m</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">hoogte</p>
          </CardContent>
        </Card>
      </div>

      {/* Eco score */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-base">Biodiversiteitswaarde</h2>
        </CardHeader>
        <CardContent className="pb-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg">🐝</p>
            <p className="text-xs text-[var(--color-text-muted)]">Insecten</p>
            <p className="font-medium text-sm text-[var(--color-accent-primary)]">{plant.eco.ins}/3</p>
          </div>
          <div>
            <p className="text-lg">🐦</p>
            <p className="text-xs text-[var(--color-text-muted)]">Vogels</p>
            <p className="font-medium text-sm text-[var(--color-accent-primary)]">{plant.eco.vog}/3</p>
          </div>
          <div>
            <p className="text-lg">🌸</p>
            <p className="text-xs text-[var(--color-text-muted)]">Bestuivers</p>
            <p className="font-medium text-sm text-[var(--color-accent-primary)]">{plant.eco.bes}/1</p>
          </div>
        </CardContent>
      </Card>

      {/* Care schedule */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-base">Verzorgingskalender</h2>
        </CardHeader>
        <CardContent className="pb-4 space-y-2">
          {MAANDEN.map((maand, i) => {
            const maandNr = i + 1;
            const taken = plant.v[maandNr];
            const isHuidig = maandNr === HUIDIGE_MAAND;
            if (!taken || taken.length === 0) return null;
            return (
              <div
                key={maandNr}
                className={`rounded-lg px-3 py-2 ${
                  isHuidig
                    ? "bg-[var(--color-accent-primary)]/8 border border-[var(--color-accent-primary)]/20"
                    : "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]"
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${isHuidig ? "text-[var(--color-accent-primary)]" : "text-[var(--color-text-muted)]"}`}>
                  {maand.charAt(0).toUpperCase() + maand.slice(1)}{isHuidig ? " — nu" : ""}
                </p>
                <ul className="space-y-0.5">
                  {taken.map((taak, j) => (
                    <li key={j} className="text-xs text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                      · {taak}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Add to garden */}
      <AddToGardenSection plantId={plant.id} />
    </div>
  );
}

function AddToGardenSection({ plantId }: { plantId: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [gardens, setGardens] = useState<{ id: string; name: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function loadGardens() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("gardens").select("id, name").eq("user_id", user.id).order("created_at");
    setGardens(data ?? []);
    setLoading(false);
  }

  async function addToGarden(gardenId: string) {
    setAdding(true);
    await supabase.from("plant_placements").insert({ garden_id: gardenId, plant_id: plantId, x: 0, y: 0 });
    setAdding(false);
    setAdded(true);
  }

  if (added) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-[var(--color-accent-primary)] font-medium">✓ Plant toegevoegd aan tuin!</p>
          <Link href="/tuinen" className="text-xs text-[var(--color-text-muted)] hover:underline mt-2 inline-block">
            Naar mijn tuinen →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (gardens === null) {
    return (
      <Button className="w-full" onClick={loadGardens} disabled={loading}>
        {loading ? "…" : "+ Toevoegen aan tuin"}
      </Button>
    );
  }

  if (gardens.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">Je hebt nog geen tuinen.</p>
          <Link href="/tuinen/new"><Button>Maak een tuin aan</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-base">Toevoegen aan tuin</h2>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        {gardens.map((g) => (
          <button
            key={g.id}
            onClick={() => addToGarden(g.id)}
            disabled={adding}
            className="w-full text-left px-3 py-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:border-[var(--color-accent-primary)] transition-colors text-sm"
          >
            {g.name}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
