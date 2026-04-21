export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function TuinenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: gardens } = await supabase
    .from("gardens")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
          Mijn tuinen
        </h1>
        <Link href="/tuinen/new">
          <Button>+ Nieuwe tuin</Button>
        </Link>
      </div>

      {gardens && gardens.length > 0 ? (
        <div className="space-y-3">
          {gardens.map((garden) => (
            <Link key={garden.id} href={`/tuinen/${garden.id}`}>
              <Card className="hover:border-[var(--color-accent-primary)]/40 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                      {garden.name}
                    </p>
                    {garden.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                        {garden.description}
                      </p>
                    )}
                    {garden.location && (
                      <p className="text-xs text-[var(--color-text-muted)]/70 mt-1">
                        📍 {garden.location}
                      </p>
                    )}
                  </div>
                  <span className="text-[var(--color-text-muted)] ml-4">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-5xl block mb-4">🌱</span>
            <p className="text-[var(--color-text-muted)] mb-6">
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
