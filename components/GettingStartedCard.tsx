"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Link from "next/link";

export function GettingStartedCard({
  gardenCount,
  plantCount,
}: {
  gardenCount: number;
  plantCount: number;
}) {
  const [takenBezocht, setTakenBezocht] = useState(false);

  useEffect(() => {
    setTakenBezocht(localStorage.getItem("tuin_taken_bezocht") === "1");
  }, []);

  const steps = [
    { label: "Maak je eerste tuin aan", done: gardenCount > 0, href: "/tuinen/new" },
    { label: "Voeg planten toe aan je tuin", done: plantCount > 0, href: "/planten" },
    { label: "Bekijk je seizoenstaken", done: takenBezocht, href: "/taken" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  if (completedSteps === steps.length) return null;

  return (
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
  );
}
