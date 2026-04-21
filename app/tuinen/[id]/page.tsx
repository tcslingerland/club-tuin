export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GardenCanvas } from "@/components/GardenCanvas";
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

  const { data: shapes } = await supabase
    .from("garden_shapes")
    .select("*")
    .eq("garden_id", id);

  const plantCount = placements?.length ?? 0;

  const initialShapes = (shapes ?? []).map(s => ({
    id: s.id as string,
    type: s.type as "boundary" | "zone",
    zone_type: (s.zone_type ?? undefined) as "zon" | "halfschaduw" | "schaduw" | undefined,
    points: JSON.parse(s.svg_path) as { x: number; y: number }[],
  }));

  const initialPlacements = (placements ?? []).map(p => ({
    id: p.id as string,
    plant_id: p.plant_id as number,
    x: Number(p.x),
    y: Number(p.y),
    in_pot: (p.in_pot ?? false) as boolean,
  }));

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

      {/* Canvas */}
      <GardenCanvas gardenId={id} initialShapes={initialShapes} initialPlacements={initialPlacements} />
    </div>
  );
}
