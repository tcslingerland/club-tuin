export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GettingStartedCard } from "@/components/GettingStartedCard";
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
