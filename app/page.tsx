import Link from "next/link";

const workouts = [
  { name: "Push Ups", href: "/push-ups" },
  { name: "Bicep Curls", href: "/workout/bicep-curls" },
  { name: "Shoulder Press", href: "/workout/shoulder-press" },
  { name: "Chest Press", href: "/workout/chest-press" },
  { name: "Lat Pulldown", href: "/workout/lat-pulldown" },
  { name: "Row", href: "/workout/row" },
  { name: "Leg Press", href: "/workout/leg-press" },
  { name: "Leg Curl", href: "/workout/leg-curl" },
  { name: "Lateral Raise", href: "/workout/lateral-raise" },
  { name: "Other", href: "/workout/other" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
         <h1 className="text-3xl font-semibold tracking-tight text-center">
  Workout Tracker
</h1>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
<div className="grid grid-cols-2 gap-3">
              {workouts.map((w) => (
              <Link
                key={w.href}
                href={w.href}
className="flex h-16 items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 text-center text-sm font-semibold text-white/90 active:scale-[0.99]"
              >
                {w.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
