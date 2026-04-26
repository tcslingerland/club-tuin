"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { plantenDb } from "@/lib/plants";

const MAANDEN = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

const ACTIE_REGEX = /snoei|knip|bemest|bijmest|water\s|beregenen|gieten|zaai|oogst|uitplant|herplant|verpot|oppot|verdeel|bescherm|mulch|sproei|verwijder|behandel|controleer|uitdun|dunnen|snijd|omspit|spitten|stekken|dekken|poten\b|planten\b|voeg\s|herfstvoorbereiding|wintervoorbereiding|vorstbescherming/i;

function isActiepunt(taak: string) {
  return ACTIE_REGEX.test(taak);
}

interface Placement {
  id: string;
  plant_id: number;
  garden_id: string;
  garden_name: string;
}

interface CareLog {
  id: string;
  placement_id: string;
  task: string;
  done_at: string;
}

interface Garden {
  id: string;
  name: string;
}

export function TakenKalender({
  placements,
  initialCareLogs,
  gardens,
  year,
}: {
  placements: Placement[];
  initialCareLogs: CareLog[];
  gardens: Garden[];
  year: number;
}) {
  const supabase = createClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [gardenFilter, setGardenFilter] = useState<string>("all");
  const [careLogs, setCareLogs] = useState<CareLog[]>(initialCareLogs);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  function isDone(placementId: string, task: string) {
    return careLogs.some(
      cl => cl.placement_id === placementId && cl.task === task && cl.done_at.startsWith(monthKey)
    );
  }

  async function toggle(placementId: string, task: string) {
    if (isDone(placementId, task)) {
      // Remove
      const log = careLogs.find(
        cl => cl.placement_id === placementId && cl.task === task && cl.done_at.startsWith(monthKey)
      );
      if (!log) return;
      setCareLogs(prev => prev.filter(cl => cl.id !== log.id));
      await supabase.from("care_logs").delete().eq("id", log.id);
    } else {
      // Add
      const done_at = `${year}-${String(month).padStart(2, "0")}-01`;
      const { data } = await supabase
        .from("care_logs")
        .insert({ placement_id: placementId, task, done_at })
        .select()
        .single();
      if (data) setCareLogs(prev => [...prev, data as CareLog]);
    }
  }

  // Build plant rows for current month + filter
  const filteredPlacements = gardenFilter === "all"
    ? placements
    : placements.filter(p => p.garden_id === gardenFilter);

  // Deduplicate by plant_id, but keep track of all placements per plant
  const plantMap = new Map<number, { placements: Placement[]; gardens: string[] }>();
  for (const p of filteredPlacements) {
    const plant = plantenDb.find(pl => pl.id === p.plant_id);
    if (!plant) continue;
    const taken = (plant.v as Record<number, string[]>)[month] ?? [];
    if (taken.length === 0) continue;
    if (!plantMap.has(p.plant_id)) {
      plantMap.set(p.plant_id, { placements: [], gardens: [] });
    }
    const entry = plantMap.get(p.plant_id)!;
    entry.placements.push(p);
    if (!entry.gardens.includes(p.garden_name)) entry.gardens.push(p.garden_name);
  }

  const rows = [...plantMap.entries()].map(([plantId, { placements: pls, gardens: gNames }]) => {
    const plant = plantenDb.find(pl => pl.id === plantId)!;
    const taken = (plant.v as Record<number, string[]>)[month] ?? [];
    return { plant, placements: pls, gardens: gNames, taken };
  });

  const totalActies = rows.reduce((acc, r) => acc + r.taken.filter(isActiepunt).length, 0);
  const doneActies = rows.reduce((acc, r) =>
    acc + r.taken.filter(t => isActiepunt(t) && r.placements.some(p => isDone(p.id, t))).length, 0);

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border";
  const btnActive = "bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]";
  const btnIdle = "bg-transparent border-[var(--color-text-muted)]/40 dark:border-[var(--color-text-muted)]/40 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]";

  return (
    <div className="space-y-4">
      {/* Month tabs */}
      <div className="flex flex-wrap gap-1.5">
        {MAANDEN.map((naam, i) => (
          <button
            key={i}
            onClick={() => setMonth(i + 1)}
            className={`${btnBase} ${month === i + 1 ? btnActive : btnIdle}`}
          >
            {naam}
          </button>
        ))}
      </div>

      {/* Garden filter */}
      {gardens.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setGardenFilter("all")}
            className={`${btnBase} ${gardenFilter === "all" ? btnActive : btnIdle}`}
          >
            Alle tuinen
          </button>
          {gardens.map(g => (
            <button
              key={g.id}
              onClick={() => setGardenFilter(g.id)}
              className={`${btnBase} ${gardenFilter === g.id ? btnActive : btnIdle}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {totalActies > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {doneActies} / {totalActies} taken gedaan
        </p>
      )}

      {/* Task list */}
      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <span className="text-3xl block mb-2">🌿</span>
          <p className="text-sm text-[var(--color-text-muted)]">
            Geen taken voor {MAANDEN[month - 1]}
            {gardenFilter !== "all" && " in deze tuin"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ plant, placements: pls, gardens: gNames, taken }) => (
            <div
              key={plant.id}
              className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{plant.emoji}</span>
                <span className="font-medium text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  {plant.naam}
                </span>
                {gNames.map(g => (
                  <span
                    key={g}
                    className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]"
                  >
                    {g}
                  </span>
                ))}
              </div>
              <ul className="space-y-1.5">
                {taken.map((taak, ti) => {
                  const actie = isActiepunt(taak);
                  // For checkboxes, use first placement (tasks are per plant type, not per instance)
                  const placement = pls[0];
                  const done = actie && isDone(placement.id, taak);
                  return (
                    <li key={ti} className="flex items-start gap-2">
                      {actie ? (
                        <button
                          onClick={() => toggle(placement.id, taak)}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            done
                              ? "bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]"
                              : "border-orange-300 bg-white dark:bg-transparent"
                          }`}
                          aria-label={done ? "Markeer als niet gedaan" : "Markeer als gedaan"}
                        >
                          {done && (
                            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ) : (
                        <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                      )}
                      <span className={`text-sm ${done ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)] dark:text-[var(--color-text-dark)]"}`}>
                        {taak}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
