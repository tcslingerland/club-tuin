"use client";

import { useState } from "react";
import { plantenDb, getPlantCategories } from "@/lib/plants";
import type { Plant, PlantCategory } from "@/lib/plants";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const CATEGORIE_LABELS: Record<string, string> = {
  bloem: "Bloemen",
  bol: "Bollen",
  struik: "Struiken",
  klimplant: "Klimplanten",
  boom: "Bomen",
  groente: "Groenten",
  kruid: "Kruiden",
  "vaste plant": "Vaste planten",
  "vaste planten": "Vaste planten",
  fruit: "Fruit",
  gras: "Grassen",
  siergras: "Siergrassen",
  varen: "Varens",
  bodembedekker: "Bodembedekkers",
};

const MAANDEN_KORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

function plantBloeitInMaand(plant: Plant, maand: number): boolean {
  return plant.v[maand as keyof typeof plant.v]?.some(t => t.toLowerCase().includes("bloei")) ?? false;
}

export default function PlantenPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PlantCategory | "alle">("alle");
  const [activeZon, setActiveZon] = useState<"alle" | "zon" | "halfschaduw" | "schaduw" | "beide">("alle");
  const [activeBloeiMaand, setActiveBloeiMaand] = useState<number>(0);

  const categories = getPlantCategories();

  const filtered = plantenDb.filter((p) => {
    const matchesQuery =
      query.trim() === "" ||
      p.naam.toLowerCase().includes(query.toLowerCase()) ||
      p.latijn.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      activeCategory === "alle" || p.cat === activeCategory;
    const matchesZon =
      activeZon === "alle" || p.zon === activeZon;
    const matchesBloei =
      activeBloeiMaand === 0 || plantBloeitInMaand(p, activeBloeiMaand);
    return matchesQuery && matchesCategory && matchesZon && matchesBloei;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-5">
      <h1 className="font-display text-3xl text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        Plantenbibliotheek
      </h1>

      {/* Search */}
      <Input
        label=""
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek op naam of Latijnse naam…"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("alle")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            activeCategory === "alle"
              ? "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]"
              : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
          }`}
        >
          Alle ({plantenDb.length})
        </button>
        {categories.map((cat) => {
          const count = plantenDb.filter((p) => p.cat === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]"
                  : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
              }`}
            >
              {CATEGORIE_LABELS[cat] ?? cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Sun filter */}
      <div className="flex flex-wrap gap-2">
        {(["alle", "zon", "halfschaduw", "schaduw", "beide"] as const).map((zon) => (
          <button
            key={zon}
            onClick={() => setActiveZon(zon)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeZon === zon
                ? "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]"
                : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
            }`}
          >
            {zon === "alle" ? "Alle zon" : zon === "zon" ? "☀️ Zon" : zon === "halfschaduw" ? "⛅ Half" : zon === "schaduw" ? "🌑 Schaduw" : "☀️⛅ Beide"}
          </button>
        ))}
      </div>

      {/* Bloom month filter */}
      <div className="overflow-x-auto w-full">
        <div className="flex gap-1.5 pb-1 w-max">
          <button
            onClick={() => setActiveBloeiMaand(0)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
              activeBloeiMaand === 0
                ? "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]"
                : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
            }`}
          >
            Alle maanden
          </button>
          {MAANDEN_KORT.map((maand, i) => {
            const nr = i + 1;
            return (
              <button
                key={nr}
                onClick={() => setActiveBloeiMaand(nr)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  activeBloeiMaand === nr
                    ? "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]"
                    : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
                }`}
              >
                {maand.charAt(0).toUpperCase() + maand.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[var(--color-text-muted)]">
        {filtered.length} {filtered.length === 1 ? "plant" : "planten"}
      </p>

      {/* Plant grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-[var(--color-text-muted)] text-sm">
            Geen planten gevonden{query ? ` voor "${query}"` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Link href={`/planten/${plant.id}`}>
      <Card className="hover:border-[var(--color-accent-primary)]/40 transition-colors cursor-pointer h-full">
        <CardContent className="py-3 flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{plant.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-tight">
              {plant.naam}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] italic mt-0.5 truncate">
              {plant.latijn}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="default" className="text-xs">
                {CATEGORIE_LABELS[plant.cat] ?? plant.cat}
              </Badge>
              <span className="text-xs text-[var(--color-text-muted)]">
                {plant.zon === "zon" ? "☀️" : plant.zon === "schaduw" ? "🌑" : "⛅"}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {plant.water === "weinig" ? "💧" : plant.water === "veel" ? "💧💧💧" : "💧💧"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
