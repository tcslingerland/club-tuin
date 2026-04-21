export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NatuurDashboard } from "@/components/NatuurDashboard";
import Link from "next/link";

export default async function BiodiversiteitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: gardens } = await supabase
    .from("gardens")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at");

  const gardenIds = (gardens ?? []).map(g => g.id);

  const { data: placements } = gardenIds.length
    ? await supabase
        .from("plant_placements")
        .select("plant_id, garden_id")
        .in("garden_id", gardenIds)
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
          Natuur
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Biodiversiteit en bloeitijden van je tuin
        </p>
      </div>

      <NatuurDashboard
        gardens={(gardens ?? []) as { id: string; name: string }[]}
        placements={(placements ?? []) as { plant_id: number; garden_id: string }[]}
      />
    </div>
  );
}
