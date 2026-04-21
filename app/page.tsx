export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

  const steps = [
    { label: "Maak je eerste tuin aan", done: gardenCount > 0, href: "/tuinen/new" },
    { label: "Voeg planten toe aan je tuin", done: false, href: "/planten" },
    { label: "Bekijk je seizoenstaken", done: false, href: "/taken" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const showChecklist = completedSteps < steps.length;

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
      {showChecklist && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Aan de slag</h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                {completedSteps}/{steps.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent-primary)] transition-all"
                style={{ width: `${(completedSteps / steps.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-1">
            {steps.map((step, i) => {
              const isActive = !step.done && steps.slice(0, i).every((s) => s.done);
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
                    isActive ? "bg-[var(--color-accent-primary)]/8" : ""
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
                      step.done
                        ? "bg-[var(--color-accent-primary)] text-white"
                        : isActive
                        ? "bg-[var(--color-accent-primary)] text-white"
                        : "bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {step.done ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {step.done ? (
                    <span className="text-sm text-[var(--color-text-muted)] line-through flex-1">
                      {step.label}
                    </span>
                  ) : isActive ? (
                    <Link
                      href={step.href}
                      className="text-sm font-medium text-[var(--color-accent-primary)] flex-1 hover:underline"
                    >
                      {step.label} →
                    </Link>
                  ) : (
                    <span className="text-sm text-[var(--color-text-muted)]/50 flex-1">
                      {step.label}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
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
