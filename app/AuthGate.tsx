"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendLink() {
    if (!email.trim()) return;
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    alert("Check your email for the sign-in link.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white grid place-items-center">
        <div className="text-white/70">Loading…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
          <h1 className="text-2xl font-semibold text-center">Sign in</h1>

          <div className="mt-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-center text-base outline-none focus:border-white/20"
            />
            <button
              onClick={sendLink}
              className="mt-3 h-14 w-full rounded-xl bg-white text-lg font-semibold text-black active:scale-[0.99]"
            >
              Email me a login link
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
