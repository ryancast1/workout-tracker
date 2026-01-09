"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type WorkoutLog = {
  date: string; // YYYY-MM-DD
  workout_name: string | null; // only for "other"
  weight: number | null;
  reps: Array<number | null>;
  compact: string; // "55 - 12/12/12" OR "Leg Extension - 80 - 12/12/12"
  notes: string | null;
};

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoToMDY(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function WorkoutPage() {
  const params = useParams();
  const slug = params?.slug;
  const slugStr =
    typeof slug === "string" ? slug : Array.isArray(slug) ? slug[0] : "";

  const isOther = slugStr === "other";
  const setCount = slugStr === "leg-press" ? 4 : 3;

  const storageKey = slugStr ? `workout_log_${slugStr}_v1` : "workout_log__v1";

  const [otherName, setOtherName] = useState(""); // only used for "other"
  const [weightText, setWeightText] = useState("");
  const [repsText, setRepsText] = useState<string[]>(
    Array.from({ length: setCount }, () => "")
  );
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  const [lastCompact, setLastCompact] = useState<string | null>(null);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [lastNotes, setLastNotes] = useState<string | null>(null);

  // If setCount changes (leg press), re-shape reps inputs
  useEffect(() => {
    setRepsText((prev) =>
      Array.from({ length: setCount }, (_, i) => prev[i] ?? "")
    );
  }, [setCount]);

  // Load last session
  useEffect(() => {
    if (!slugStr) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as WorkoutLog;
      setLastCompact(parsed.compact || null);
      setLastDate(parsed.date || null);
      setLastNotes(parsed.notes || null);
    } catch {
      // ignore
    }
  }, [slugStr, storageKey]);

  const parsedOtherName = useMemo(() => otherName.trim(), [otherName]);

  const parsedWeight = useMemo(() => {
    const t = weightText.trim();
    if (t === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  }, [weightText]);

  const parsedReps = useMemo(() => {
    return repsText.map((t) => {
      const trimmed = t.trim();
      if (trimmed === "") return null;
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.floor(n);
    });
  }, [repsText]);

  const repsPart = useMemo(() => {
    const repsFilled = parsedReps.filter((n): n is number => n !== null);
    return repsFilled.map(String).join("/");
  }, [parsedReps]);

  const compact = useMemo(() => {
    const weightPart = parsedWeight !== null ? String(parsedWeight) : "";

    if (isOther) {
      const namePart = parsedOtherName;
      if (!namePart) return "";

      if (weightPart && repsPart) return `${namePart} - ${weightPart} - ${repsPart}`;
      if (weightPart && !repsPart) return `${namePart} - ${weightPart}`;
      if (!weightPart && repsPart) return `${namePart} - ${repsPart}`;
      return `${namePart}`;
    }

    // Standard: "Weight - rep/rep/rep"
    if (weightPart && repsPart) return `${weightPart} - ${repsPart}`;
    if (weightPart && !repsPart) return `${weightPart} -`;
    if (!weightPart && repsPart) return `- ${repsPart}`;
    return "";
  }, [isOther, parsedOtherName, parsedWeight, repsPart]);

  const canLog = useMemo(() => {
    const anyReps = parsedReps.some((n) => n !== null);
    const hasWeight = parsedWeight !== null;

    if (isOther) return parsedOtherName.length > 0 && (anyReps || hasWeight);
    return anyReps || hasWeight;
  }, [isOther, parsedOtherName, parsedReps, parsedWeight]);

  function setDigitsOnly(setter: (v: string) => void, value: string) {
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 3);
    setter(cleaned);
    setStatus("idle");
  }

  function setRepValue(idx: number, value: string) {
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 3);
    setRepsText((prev) => prev.map((v, i) => (i === idx ? cleaned : v)));
    setStatus("idle");
  }

  function logWorkout() {
    if (!slugStr || !canLog) return;

    const payload: WorkoutLog = {
      date: todayISODate(),
      workout_name: isOther ? parsedOtherName : null,
      weight: parsedWeight,
      reps: parsedReps,
      compact,
      notes: notes.trim() ? notes.trim() : null,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    setLastCompact(payload.compact || null);
    setLastDate(payload.date);
    setLastNotes(payload.notes);
    setStatus("saved");
  }

  if (!slugStr) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-semibold">Workout</h1>
        </div>
      </main>
    );
  }

  const title = titleizeSlug(slugStr);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
          {isOther ? (
            <input
              value={otherName}
              onChange={(e) => {
                setOtherName(e.target.value);
                setStatus("idle");
              }}
              placeholder=""
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-2xl font-semibold tracking-tight outline-none focus:border-white/20 focus:bg-black/40"
            />
          ) : (
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          )}

          {lastCompact && lastDate && (
            <div className="mt-2">
              <div className="text-sm text-white/70">
                <span className="text-white/60">Last Session: </span>
                <span className="font-semibold text-white">{lastCompact}</span>{" "}
                <span className="text-white/60">{isoToMDY(lastDate)}</span>
              </div>

              {lastNotes && (
                <div className="mt-1 text-sm text-white/60 whitespace-pre-wrap">
                  {lastNotes}
                </div>
              )}
            </div>
          )}
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
          {/* Weight (narrow + centered) */}
          <div className="mb-4 flex justify-center">
            <label className="block w-44">
              <span className="mb-1 block text-xs text-white/60 text-center">
                Weight
              </span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={weightText}
                onChange={(e) => setDigitsOnly(setWeightText, e.target.value)}
                className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-center text-xl font-semibold tracking-tight outline-none focus:border-white/20 focus:bg-black/40"
              />
            </label>
          </div>

          <div className={`grid gap-3 ${setCount === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {repsText.map((val, i) => (
              <label key={i} className="block">
                <span className="mb-1 block text-xs text-white/60">
                  Set {i + 1}
                </span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={val}
                  onChange={(e) => setRepValue(i, e.target.value)}
                  className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-xl font-semibold tracking-tight outline-none focus:border-white/20 focus:bg-black/40"
                />
              </label>
            ))}
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setStatus("idle");
                }}
                rows={2}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none focus:border-white/20 focus:bg-black/40"
              />
            </label>
          </div>

          <button
            onClick={logWorkout}
            disabled={!canLog}
            className="mt-6 h-14 w-full rounded-xl bg-white text-lg font-semibold text-black active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/60"
          >
            Log Workout
          </button>

          <div className="mt-3 text-center text-xs text-white/50">
            {status === "saved" ? "Saved ✓" : " "}
          </div>
        </section>
      </div>
    </main>
  );
}
