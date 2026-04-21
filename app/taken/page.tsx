export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TakenKalender } from "@/components/TakenKalender";
import Link from "next/link";

export default async function TakenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  const { data: gardens } = await supabase
    .from("gardens")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at");

  const gardenIds = (gardens ?? []).map(g => g.id);

  const { data: rawPlacements } = gardenIds.length
    ? await supabase
        .from("plant_placements")
        .select("id, plant_id, garden_id")
        .in("garden_id", gardenIds)
    : { data: [] };

  const gardenMap = Object.fromEntries((gardens ?? []).map(g => [g.id, g.name]));

  const placements = (rawPlacements ?? []).map(p => ({
    id: p.id as string,
    plant_id: p.plant_id as number,
    garden_id: p.garden_id as string,
    garden_name: gardenMap[p.garden_id] ?? "Tuin",
  }));

  const placementIds = placements.map(p => p.id);

  const { data: careLogs } = placementIds.length
    ? await supabase
        .from("care_logs")
        .select("id, placement_id, task, done_at")
        .in("placement_id", placementIds)
        .gte("done_at", `${year}-01-01`)
        .lte("done_at", `${year}-12-31`)
    : { data: [] };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <Link
          href="/"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
        >
          ← Home
        </Link>
        <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)] mt-1">
          Tuinkalender
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Verzorgingstaken per maand
        </p>
      </div>

      <TakenKalender
        placements={placements}
        initialCareLogs={(careLogs ?? []) as { id: string; placement_id: string; task: string; done_at: string }[]}
        gardens={(gardens ?? []) as { id: string; name: string }[]}
        year={year}
      />
    </div>
  );
}
