"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listSessionsSince } from "@/lib/db";

const START_ISO = "2026-01-01";

const WORKOUTS: { slug: string; label: string }[] = [
  { slug: "push-ups", label: "PU" },
  { slug: "bicep-curls", label: "BC" },
  { slug: "shoulder-press", label: "SP" },
  { slug: "chest-press", label: "CP" },
  { slug: "lat-pulldown", label: "LP" },
  { slug: "row", label: "RW" },
  { slug: "leg-press", label: "LPr" },
  { slug: "leg-curl", label: "LC" },
  { slug: "lateral-raise", label: "LR" },
];

function isoFromUTCDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function utcDateFromISO(iso: string) {
  const [y, m, da] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, da ?? 1));
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

// Monday-start week
function mondayOfUTC(d: Date) {
  const day = d.getUTCDay(); // 0=Sun ... 6=Sat
  const offset = (day + 6) % 7; // Mon=0 ... Sun=6
  return addDaysUTC(d, -offset);
}

function fmtMD(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<{ performed_on: string; workout_slug: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listSessionsSince(START_ISO);
        setPairs(data);
      } catch (e: any) {
        alert(`Dashboard load failed: ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const doneSet = useMemo(() => {
    const s = new Set<string>(); // key = "YYYY-MM-DD|slug"
    for (const p of pairs) s.add(`${p.performed_on}|${p.workout_slug}`);
    return s;
  }, [pairs]);

  const anyDaySet = useMemo(() => {
    const s = new Set<string>(); // key = "YYYY-MM-DD"
    for (const p of pairs) s.add(p.performed_on);
    return s;
  }, [pairs]);

  const dayList = useMemo(() => {
    const end = todayUTC();
    const start = utcDateFromISO(START_ISO);
    const out: string[] = [];
    for (let d = end; d.getTime() >= start.getTime(); d = addDaysUTC(d, -1)) {
      out.push(isoFromUTCDate(d));
    }
    return out; // today -> start
  }, []);

  const weekRows = useMemo(() => {
    const end = todayUTC();
    const start = utcDateFromISO(START_ISO);

    const thisMon = mondayOfUTC(end);
    const firstMon = mondayOfUTC(start);

    const rows: string[][] = [];
    for (let wk = thisMon; wk.getTime() >= firstMon.getTime(); wk = addDaysUTC(wk, -7)) {
      const row: string[] = [];
      for (let i = 0; i < 7; i++) row.push(isoFromUTCDate(addDaysUTC(wk, i)));
      rows.push(row);
    }
    return rows; // current week -> back
  }, []);

  const todayISO = isoFromUTCDate(todayUTC());

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-center">Dashboard</h1>

        <div className="mt-3 flex justify-center">
          <Link href="/" className="text-sm text-white/70 underline underline-offset-4">
            Back to workouts
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-white/60">Loading…</div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Card 1: matrix */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Consistency by workout</h2>
                <div className="text-xs text-white/50">since 1/1</div>
              </div>

              {/* tighter grid, no gaps */}
              <div className="mt-3">
                {/* header */}
                <div className="grid grid-cols-[76px_repeat(9,26px)] gap-0">
                  <div className="px-1 py-2 text-[11px] text-white/70 text-center">Date</div>
                  {WORKOUTS.map((w) => (
                    <div
                      key={w.slug}
                      className="py-2 text-[11px] text-white/70 text-center"
                      title={w.slug}
                    >
                      {w.label}
                    </div>
                  ))}
                </div>

                {/* rows */}
                <div className="mt-1">
                  {dayList.map((iso) => (
                    <div key={iso} className="grid grid-cols-[76px_repeat(9,26px)] gap-0">
                      <div className="px-1 py-[6px] text-[11px] text-white/70 text-center">
                        {fmtMD(iso)}
                      </div>

                      {WORKOUTS.map((w) => {
                        const filled = doneSet.has(`${iso}|${w.slug}`);
                        return (
                          <div
                            key={w.slug}
                            className={[
                              "h-6 border",
                              "rounded-sm",
                              filled
                                ? "bg-emerald-500/80 border-emerald-400/60"
                                : "bg-white/5 border-white/10",
                            ].join(" ")}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Card 2: calendar grid */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Any workout</h2>
                <div className="text-xs text-white/50">Mon → Sun</div>
              </div>

              {/* day-of-week header (fixed duplicate keys) */}
              <div className="mt-3 grid grid-cols-7 gap-0 text-[11px] text-white/60">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-1 space-y-0">
                {weekRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-0">
                    {row.map((iso) => {
                      const isBeforeStart = iso < START_ISO;
                      const isAfterToday = iso > todayISO;
                      const filled = anyDaySet.has(iso);

                      const cls =
                        isBeforeStart || isAfterToday
                          ? "bg-transparent border-white/5"
                          : filled
                          ? "bg-emerald-500/80 border-emerald-400/60"
                          : "bg-white/5 border-white/10";

                      const dayNum = Number(iso.slice(8, 10));
                      const showNum = !isBeforeStart && !isAfterToday;

                      return (
                        <div
                          key={iso}
                          className={[
                            "h-8 border rounded-sm flex items-center justify-center",
                            cls,
                            filled ? "text-black/80" : "text-white/35",
                            "text-[10px]",
                          ].join(" ")}
                        >
                          {showNum ? dayNum : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}