"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pushup_count_v1";

export default function Home() {
  const [count, setCount] = useState(0);

  // Load saved count on first load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setCount(Number(saved));
  }, []);

  // Save whenever count changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(count));
  }, [count]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h1 className="text-2xl font-semibold">Workout Tracker</h1>
        <p className="mt-1 text-sm text-white/60">Push-up Counter</p>

        <div className="mt-8 text-7xl font-bold tabular-nums">{count}</div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            className="rounded-xl bg-white text-black py-4 text-lg font-semibold active:scale-[0.99]"
            onClick={() => setCount((c) => c + 1)}
          >
            +1
          </button>

          <button
            className="rounded-xl bg-white/10 py-4 text-lg font-semibold active:scale-[0.99]"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
          >
            -1
          </button>

          <button
            className="col-span-2 rounded-xl bg-red-500/80 py-4 text-lg font-semibold active:scale-[0.99]"
            onClick={() => setCount(0)}
          >
            Reset
          </button>
        </div>

        <p className="mt-6 text-xs text-white/50">
          Saved automatically on this device.
        </p>
      </div>
    </main>
  );
}
