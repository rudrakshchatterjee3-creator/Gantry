"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Replaces GoogleSignInButton. Real credential auth against
// /api/auth/{signup,login} (lib/auth/*, Cloudflare KV-backed) — no OAuth
// provider. The invite code is shown directly in the UI rather than tucked
// in docs, since this is a hackathon demo judges need to open with zero
// friction; see SECURITY.md for why a visible demo code is still a real
// (not decorative) access check.

const DEMO_INVITE_CODE = process.env.NEXT_PUBLIC_OFFICIAL_INVITE_CODE_HINT;

type Mode = "login" | "signup";

export function OfficialAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        mode === "login" ? { email, password } : { email, password, inviteCode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-surface-raised/60 p-6 backdrop-blur">
      <div className="mb-6 flex gap-2 rounded-lg bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-floodlight text-surface" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-floodlight text-surface" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-left text-xs font-medium text-slate-400">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-floodlight"
            placeholder="you@fifa2026.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-left text-xs font-medium text-slate-400">
          Password
          <input
            type="password"
            required
            minLength={mode === "signup" ? 10 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-floodlight"
            placeholder={mode === "signup" ? "At least 10 characters" : "••••••••"}
          />
        </label>

        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-left text-xs font-medium text-slate-400">
            Staff invite code
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-floodlight"
              placeholder="Required to create a staff account"
            />
            {DEMO_INVITE_CODE && (
              <span className="mt-1 text-[11px] text-slate-500">
                Demo code for judging: <code className="text-floodlight">{DEMO_INVITE_CODE}</code>
              </span>
            )}
          </label>
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-floodlight px-6 py-3 font-sans text-sm font-semibold text-surface transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
