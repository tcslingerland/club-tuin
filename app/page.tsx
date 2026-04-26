export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GettingStartedCard } from "@/components/GettingStartedCard";
import { plantenDb } from "@/lib/plants";
import type { Plant } from "@/lib/plants/types";
import { berekenBiodiversiteit, biodivKleur } from "@/lib/biodiversiteit";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] dark:bg-[var(--color-base-dark)]">
        {/* Hero */}
        <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="flex justify-center mb-8">
            <span className="text-8xl leading-none">🌿</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-tight text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-6">
            Jouw tuin,<br />helemaal bij.
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg max-w-md mx-auto mb-10">
            Plan je tuinindeling, beheer je planten en volg taken per seizoen — op elk apparaat.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login?mode=signup">
              <Button size="lg">Gratis beginnen</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Inloggen</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon="⌂"
              title="Tuinkaart"
              description="Teken je tuin en zie in één oogopslag welke planten waar staan."
            />
            <FeatureCard
              icon="✿"
              title="Plantenbibliotheek"
              description="130+ planten met maandelijkse zorgtaken, zonwensen en biodiversiteitswaarde."
            />
            <FeatureCard
              icon="◎"
              title="Seizoenstaken"
              description="Altijd weten wat er deze maand in de tuin te doen is."
            />
            <FeatureCard
              icon="◈"
              title="Biodiversiteit"
              description="Bereken je biodiversiteitsscore en ontdek hoe je insecten en vogels aantrekt."
            />
            <FeatureCard
              icon="☁"
              title="Overal beschikbaar"
              description="Gesynchroniseerd in de cloud — ook op je telefoon in de tuin."
            />
            <FeatureCard
              icon="✎"
              title="Eigen planten"
              description="Voeg je eigen planten toe met persoonlijke zorgrooster en foto."
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <div className="max-w-2xl mx-auto px-6 py-10 text-center">
            <p className="font-display text-2xl mb-4 text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
              Klaar om te beginnen?
            </p>
            <Link href="/login?mode=signup">
              <Button size="lg">Maak je account aan</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in dashboard — will grow as we add data
  const { data: gardens } = await supabase
    .from("gardens")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const gardenCount = gardens?.length ?? 0;

  const gardenIds = gardens?.map(g => g.id) ?? [];
  const { count: plantCount } = gardenIds.length > 0
    ? await supabase
        .from("plant_placements")
        .select("id", { count: "exact", head: true })
        .in("garden_id", gardenIds)
    : { count: 0 };

  // Dashboard stats
  const { data: allPlacements } = gardenIds.length > 0
    ? await supabase.from("plant_placements").select("plant_id").in("garden_id", gardenIds)
    : { data: [] as { plant_id: number }[] };

  const currentMonth = new Date().getMonth() + 1;
  const maandNamen = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
  const maandNaam = maandNamen[currentMonth - 1];

  const uniquePlantIds = [...new Set((allPlacements ?? []).map(p => p.plant_id))];
  const planten = uniquePlantIds
    .map(id => plantenDb.find(p => p.id === id))
    .filter((p): p is Plant => p !== undefined);

  const biodiv = berekenBiodiversiteit(planten);
  const ringKleur = biodivKleur(biodiv.totaal);
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (biodiv.totaal / 100) * circumference;

  const plantenMetTaken = planten.filter(p =>
    ((p.v as Record<number, string[]>)[currentMonth] ?? []).length > 0
  ).length;

  const bloeiend = planten.filter(p =>
    ((p.v as Record<number, string[]>)[currentMonth] ?? []).some((t: string) => /bloei|bloesem/i.test(t))
  );

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
          Goeie{getTimeOfDay()}.
        </h1>
        {gardenCount > 0 && (
          <Link href="/tuinen/new">
            <Button size="lg">+ Nieuwe tuin</Button>
          </Link>
        )}
      </div>

      {/* Getting started */}
      <GettingStartedCard gardenCount={gardenCount} plantCount={plantCount ?? 0} />

      {/* Dashboard stats — only when there are plants */}
      {planten.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Taken shortcut */}
            <Link href="/taken">
              <Card className="hover:border-[var(--color-accent-primary)]/40 transition-colors cursor-pointer h-full">
                <CardContent className="py-4 px-4">
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-2">{maandNaam}</p>
                  <p className="font-display text-3xl text-[var(--color-accent-primary)] leading-none">{plantenMetTaken}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {plantenMetTaken === 1 ? "plant vraagt" : "planten vragen"} aandacht
                  </p>
                  <p className="text-xs text-[var(--color-accent-primary)] mt-3">Naar kalender →</p>
                </CardContent>
              </Card>
            </Link>

            {/* Biodiversiteit shortcut */}
            <Link href="/biodiversiteit">
              <Card className="hover:border-[var(--color-accent-primary)]/40 transition-colors cursor-pointer h-full">
                <CardContent className="py-4 px-4 flex flex-col items-center justify-center gap-1">
                  <svg viewBox="0 0 80 80" width="60" height="60">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={ringKleur} strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                    <text x="40" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill={ringKleur}>{biodiv.totaal}</text>
                    <text x="40" y="50" textAnchor="middle" fontSize="9" fill="#9ca3af">/100</text>
                  </svg>
                  <p className="text-xs text-[var(--color-text-muted)]">biodiversiteit</p>
                  <p className="text-xs text-[var(--color-accent-primary)]">Meer info →</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Bloeiende planten */}
          {bloeiend.length > 0 && (
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mb-2">In bloei — {maandNaam}</p>
                <div className="flex flex-wrap gap-2">
                  {bloeiend.map(p => (
                    <Link key={p.id} href={`/planten/${p.id}`}>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--color-accent-primary)]/8 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/15 transition-colors">
                        {p.emoji} {p.naam}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent gardens */}
      {gardens && gardens.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Jouw tuinen</h2>
            <Link
              href="/tuinen/new"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
            >
              + Nieuw
            </Link>
          </div>
          <div className="space-y-2">
            {gardens.map((garden) => (
              <Link key={garden.id} href={`/tuinen/${garden.id}`}>
                <Card className="hover:border-[var(--color-accent-primary)]/30 transition-colors cursor-pointer">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium leading-tight">{garden.name}</p>
                      {garden.description && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {garden.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[var(--color-text-muted)] text-sm">→</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {gardens?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <span className="text-4xl block mb-3">🌱</span>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">
              Je hebt nog geen tuinen aangemaakt
            </p>
            <Link href="/tuinen/new">
              <Button>Maak je eerste tuin</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morgen";
  if (h < 17) return "middag";
  return " avond";
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl p-5 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
      <span className="text-2xl leading-none block mb-3">{icon}</span>
      <h3 className="font-display text-base mb-1 text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{description}</p>
    </div>
  );
}
