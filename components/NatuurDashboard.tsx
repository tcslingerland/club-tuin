"use client";

import { useState } from "react";
import { plantenDb } from "@/lib/plants";
import type { Plant } from "@/lib/plants/types";
import { berekenBiodiversiteit, biodivKleur } from "@/lib/biodiversiteit";

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

const HEATMAP_KLEUREN = (n: number) => {
  if (n === 0) return "bg-[#EDEAE4] dark:bg-[#2a2a2a]";
  if (n <= 2) return "bg-[#D8E8D8]";
  if (n <= 5) return "bg-[#A8C8A8]";
  if (n <= 9) return "bg-[#5A9A6A]";
  return "bg-[#2D7A4D]";
};

function isBloeiMaand(plant: Plant, maand: number): boolean {
  const taken = plant.v[maand as keyof typeof plant.v] ?? [];
  return taken.some(t => /bloei|bloesem/i.test(t));
}

interface Garden { id: string; name: string }
interface Placement { plant_id: number; garden_id: string }

export function NatuurDashboard({
  gardens,
  placements,
}: {
  gardens: Garden[];
  placements: Placement[];
}) {
  const [gardenFilter, setGardenFilter] = useState("all");
  const huidigeMaand = new Date().getMonth() + 1;

  const filtered = gardenFilter === "all"
    ? placements
    : placements.filter(p => p.garden_id === gardenFilter);

  // Unique plants (deduplicate by plant_id)
  const plantIds = [...new Set(filtered.map(p => p.plant_id))];
  const planten = plantIds.map(id => plantenDb.find(p => p.id === id)).filter(Boolean) as Plant[];

  const biodiv = berekenBiodiversiteit(planten);
  const kleur = biodivKleur(biodiv.totaal);
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (biodiv.totaal / 100) * circumference;

  // Bloei matrix
  const bloeiPerMaand = Array.from({ length: 12 }, (_, m) =>
    planten.filter(p => isBloeiMaand(p, m + 1)).length
  );

  // Only plants that bloom in at least one month
  const bloeiPlanten = planten.filter(p =>
    Array.from({ length: 12 }, (_, m) => isBloeiMaand(p, m + 1)).some(Boolean)
  );

  const subscores = [
    { label: "Insecten", icon: "🐝", score: biodiv.insecten, max: 25 },
    { label: "Vogels",   icon: "🐦", score: biodiv.vogels,   max: 25 },
    { label: "Bloeidekking", icon: "🌸", score: biodiv.bloei, max: 20 },
    { label: "Structuur", icon: "🌳", score: biodiv.structuur, max: 15 },
    { label: "Winterhabitat", icon: "❄️", score: biodiv.winter, max: 15 },
  ];

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border";
  const btnActive = "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]";
  const btnIdle = "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)]";

  return (
    <div className="space-y-6">
      {/* Tuin filter */}
      {gardens.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setGardenFilter("all")} className={`${btnBase} ${gardenFilter === "all" ? btnActive : btnIdle}`}>
            Alle tuinen
          </button>
          {gardens.map(g => (
            <button key={g.id} onClick={() => setGardenFilter(g.id)} className={`${btnBase} ${gardenFilter === g.id ? btnActive : btnIdle}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {planten.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <p className="text-sm text-[var(--color-text-muted)]">
            Voeg planten toe aan je tuin om de biodiversiteit te zien
          </p>
        </div>
      ) : (
        <>
          {/* Biodiversiteitscore */}
          <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-5">
            <h2 className="font-display text-lg text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">
              Biodiversiteit
            </h2>
            <div className="flex items-center gap-6">
              {/* Ring */}
              <div className="flex-shrink-0">
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={kleur} strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                  <text x="40" y="37" textAnchor="middle" fontSize="16" fontWeight="700" fill={kleur}>{biodiv.totaal}</text>
                  <text x="40" y="50" textAnchor="middle" fontSize="9" fill="#9ca3af">/100</text>
                </svg>
              </div>
              {/* Sub-scores */}
              <div className="flex-1 space-y-2">
                {subscores.map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-sm w-4">{s.icon}</span>
                    <span className="text-xs text-[var(--color-text-muted)] w-24">{s.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(s.score / s.max) * 100}%`, backgroundColor: kleur }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] w-8 text-right">{s.score}/{s.max}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bloeitijdlijn */}
          <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-5">
            <h2 className="font-display text-lg text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">
              Bloeitijdlijn
            </h2>

            {/* Heatmap */}
            <div className="grid grid-cols-12 gap-1 mb-4">
              {MAANDEN.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full aspect-square rounded-md ${HEATMAP_KLEUREN(bloeiPerMaand[i])} ${i + 1 === huidigeMaand ? "ring-2 ring-[var(--color-accent-primary)]" : ""}`}
                    title={`${m}: ${bloeiPerMaand[i]} plant${bloeiPerMaand[i] !== 1 ? "en" : ""}`}
                  />
                  <span className="text-[9px] text-[var(--color-text-muted)]">{m}</span>
                </div>
              ))}
            </div>

            {/* Plant grid */}
            {bloeiPlanten.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-2 pr-3 font-normal text-[var(--color-text-muted)] w-32">Plant</th>
                      {MAANDEN.map((m, i) => (
                        <th key={i} className={`pb-2 font-normal text-[var(--color-text-muted)] text-center w-7 ${i + 1 === huidigeMaand ? "text-[var(--color-accent-primary)] font-medium" : ""}`}>
                          {m.slice(0, 1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloeiPlanten.map(plant => (
                      <tr key={plant.id} className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                        <td className="py-1.5 pr-3">
                          <span className="mr-1">{plant.emoji}</span>
                          <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] truncate max-w-[80px] inline-block align-bottom">{plant.naam}</span>
                        </td>
                        {Array.from({ length: 12 }, (_, m) => (
                          <td key={m} className="py-1.5 text-center">
                            {isBloeiMaand(plant, m + 1) ? (
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: m + 1 === huidigeMaand ? "#5a9a30" : "#a8c8a8" }}
                              />
                            ) : (
                              <span className="inline-block w-3 h-3" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Geen bloeidata beschikbaar voor de geselecteerde planten
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
