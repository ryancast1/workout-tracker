import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-center">Dashboard</h1>
        <div className="mt-3 flex justify-center">
          <Link href="/" className="text-sm text-white/70 underline underline-offset-4">
            Back to workouts
          </Link>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
          Coming soon.
        </div>
      </div>
    </main>
  );
}
