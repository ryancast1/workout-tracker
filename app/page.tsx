"use client";

import { useMemo, useState } from "react";

type PushupLog = {
  date: string; // YYYY-MM-DD
  sets: Array<number | null>; // length 5
};

const STORAGE_KEY = "pushups_log_v1";

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Home() {
  const [setsText, setSetsText] = useState<string[]>(["", "", "", "", ""]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  const parsedSets = useMemo(() => {
    return setsText.map((t) => {
      const trimmed = t.trim();
      if (trimmed === "") return null;
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.floor(n);
    });
  }, [setsText]);

  const canLog = useMemo(() => parsedSets.some((n) => n !== null), [parsedSets]);

  function setSetValue(idx: number, value: string) {
    // digits only, max 3 chars (you said ~2 digits, but allow 3 just in case)
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 3);
    setSetsText((prev) => prev.map((v, i) => (i === idx ? cleaned : v)));
    setStatus("idle");
  }

  function logWorkout() {
    if (!canLog) return;

    const payload: PushupLog = {
      date: todayISODate(),
      sets: parsedSets,
    };

    // For now: save ONLY the latest log (we’ll expand to a list later)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...payload,
        notes: notes.trim() || null,
      })
    );

    setStatus("saved");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Push Ups</h1>
          <p className="mt-1 text-sm text-white/60">
            Enter reps for up to 5 sets.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {setsText.map((val, i) => (
              <label key={i} className="block">
                <span className="mb-1 block text-xs text-white/60">
                  Set {i + 1}
                </span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={val}
                  onChange={(e) => setSetValue(i, e.target.value)}
                  className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-xl font-semibold tracking-tight outline-none ring-0 placeholder:text-white/20 focus:border-white/20 focus:bg-black/40"
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
                placeholder="Anything notable…"
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none placeholder:text-white/20 focus:border-white/20 focus:bg-black/40"
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

        <p className="mt-6 text-center text-xs text-white/40">
          (For now this saves the latest entry locally on this device.)
        </p>
      </div>
    </main>
  );
}