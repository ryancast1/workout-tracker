"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");

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

  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!e) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        // important: no redirect links, we’re using codes
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (error) {
      alert(`Could not send code: ${error.message}`);
      return;
    }

    setPhase("code");
    alert("Check your email for the 6-digit code.");
  }

  async function verifyCode() {
    const e = email.trim().toLowerCase();
    const t = code.trim();
    if (!e || !t) return;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: e,
      token: t,
      type: "email",
    });
    setLoading(false);

    if (error) {
      alert(`Code failed: ${error.message}`);
      return;
    }

    // session will update via onAuthStateChange
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

          <div className="mt-4 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-center text-base outline-none focus:border-white/20"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
            />

            {phase === "email" ? (
              <button
                onClick={sendCode}
                className="h-14 w-full rounded-xl bg-white text-lg font-semibold text-black active:scale-[0.99]"
              >
                Send login code
              </button>
            ) : (
              <>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="6-digit code"
                  className="h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-center text-base outline-none focus:border-white/20 tracking-widest"
                  inputMode="numeric"
                />

                <button
                  onClick={verifyCode}
                  className="h-14 w-full rounded-xl bg-white text-lg font-semibold text-black active:scale-[0.99]"
                >
                  Verify code
                </button>

                <button
                  onClick={() => {
                    setPhase("email");
                    setCode("");
                  }}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/20 text-white/80"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}