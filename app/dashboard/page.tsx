"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listSessionsSince, listWeightSeries } from "@/lib/db";

const START_ISO = "2026-01-01";

const WORKOUTS: { slug: string; label: string }[] = [
 { slug: "push-ups", label: "PU" },
  { slug: "bicep-curls", label: "BC" },
  { slug: "shoulder-press", label: "SP" },
  { slug: "chest-press", label: "CP" },
  { slug: "lateral-raise", label: "LR" },
  { slug: "triceps-press", label: "TP" },
  { slug: "lat-pulldown", label: "LP" },
  { slug: "row", label: "RW" },
  { slug: "rear-delt-fly", label: "RD" },
  { slug: "leg-press", label: "LG" },
  { slug: "leg-curl", label: "LC" },
] as const;

const WEIGHT_WORKOUTS = WORKOUTS.filter((w) => w.slug !== "push-ups");

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
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return `${m}/${d}`;
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<{ performed_on: string; workout_slug: string }[]>([]);

  // weight chart state
  const [weightSlug, setWeightSlug] = useState<string>(() => {
    if (typeof window === "undefined") return "bicep-curls";
    return localStorage.getItem("dash_weight_slug") ?? "bicep-curls";
  });
  const [weightSeries, setWeightSeries] = useState<{ performed_on: string; weight: number }[]>([]);
  const [weightLoading, setWeightLoading] = useState(false);

  // Matrix sizing (tuned for iPhone width)
  const DATE_COL = 48; // narrower date column
  const CELL = 24; // slightly larger cells
  const matrixCols = `${DATE_COL}px repeat(${WORKOUTS.length}, ${CELL}px)`;

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

  useEffect(() => {
    if (!weightSlug) return;

    localStorage.setItem("dash_weight_slug", weightSlug);

    (async () => {
      setWeightLoading(true);
      try {
        const rows = await listWeightSeries(weightSlug, START_ISO);
        setWeightSeries(rows);
      } catch (e: any) {
        alert(`Weight chart failed: ${e?.message ?? e}`);
      } finally {
        setWeightLoading(false);
      }
    })();
  }, [weightSlug]);

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
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-4 py-8 text-white">
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
            <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Consistency by workout</h2>
                <div className="text-xs text-white/50">since 1/1</div>
              </div>

              <div className="mt-3">
                {/* header */}
                <div className="grid gap-0" style={{ gridTemplateColumns: matrixCols }}>
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
                    <div key={iso} className="grid gap-0" style={{ gridTemplateColumns: matrixCols }}>
                      <div className="px-1 py-[6px] text-[11px] text-white/70 text-center">
                        {fmtMD(iso)}
                      </div>

                      {WORKOUTS.map((w) => {
                        const filled = doneSet.has(`${iso}|${w.slug}`);
                        return (
                          <div
                            key={w.slug}
                            className={[
                              "h-[22px] border rounded-sm",
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

              {/* weekday header */}
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
                            "h-8 border rounded-sm flex items-center justify-center text-[10px]",
                            cls,
                            filled ? "text-black/80" : "text-white/35",
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

            {/* Card 3: weight over time */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Weight over time</h2>
                <div className="text-xs text-white/50">since 1/1</div>
              </div>

              <div className="mt-3">
                <div className="mb-1 text-xs text-white/60 text-center">Exercise</div>
                <select
                  value={weightSlug}
                  onChange={(e) => setWeightSlug(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white"
                >
                  {WEIGHT_WORKOUTS.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.label} — {titleFromSlug(w.slug)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                {weightLoading ? (
                  <div className="text-center text-white/60 text-sm py-8">Loading…</div>
                ) : weightSeries.length < 2 ? (
                  <div className="text-center text-white/60 text-sm py-8">Not enough data yet.</div>
                ) : (
                  <WeightLineChart data={weightSeries} />
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function WeightLineChart({ data }: { data: { performed_on: string; weight: number }[] }) {
  const W = 320;
  const H = 180;
  const padL = 32;
  const padR = 10;
  const padT = 10;
  const padB = 22;

  const weights = data.map((d) => Number(d.weight)).filter((x) => Number.isFinite(x));
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const spread = Math.max(1, maxW - minW);
  const yMin = minW - spread * 0.08;
  const yMax = maxW + spread * 0.08;

  const x0 = padL;
  const x1 = W - padR;
  const y0 = H - padB;
  const y1 = padT;

  const n = data.length;

  const xFor = (i: number) => (n === 1 ? x0 : x0 + (i * (x1 - x0)) / (n - 1));
  const yFor = (w: number) => y0 - ((w - yMin) * (y0 - y1)) / (yMax - yMin);

  const path = data
    .map((d, i) => {
      const x = xFor(i);
      const y = yFor(Number(d.weight));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const fmt = (iso: string) => {
    const m = Number(iso.slice(5, 7));
    const d = Number(iso.slice(8, 10));
    return `${m}/${d}`;
  };

  const firstDate = data[0]?.performed_on ?? "";
  const lastDate = data[data.length - 1]?.performed_on ?? "";

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px]">
          <text x={padL - 6} y={y1 + 10} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">
            {Math.round(yMax)}
          </text>
          <text x={padL - 6} y={y0} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">
            {Math.round(yMin)}
          </text>

          <line x1={padL} y1={y0} x2={x1} y2={y0} stroke="rgba(255,255,255,0.10)" />

          <path d={path} fill="none" stroke="rgba(16,185,129,0.95)" strokeWidth="2" />

          {(() => {
            const i = n - 1;
            const x = xFor(i);
            const y = yFor(Number(data[i].weight));
            return <circle cx={x} cy={y} r="3.5" fill="rgba(16,185,129,0.95)" />;
          })()}

          <text x={padL} y={H - 6} fontSize="10" fill="rgba(255,255,255,0.50)">
            {fmt(firstDate)}
          </text>
          <text x={x1} y={H - 6} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.50)">
            {fmt(lastDate)}
          </text>
        </svg>
      </div>

      <div className="mt-2 text-center text-xs text-white/50">
        {n} points • {Math.round(minW)}–{Math.round(maxW)}
      </div>
    </div>
  );
}