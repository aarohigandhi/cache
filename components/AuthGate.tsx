"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_COLORS, type Category } from "@/lib/categories";
import type { Session } from "@supabase/supabase-js";

const SHOWCASE_TAGS: { label: string; category: Category; rotate: string }[] = [
  { label: "recipe", category: "recipe", rotate: "-rotate-3" },
  { label: "travel", category: "travel", rotate: "rotate-2" },
  { label: "outfit", category: "outfit", rotate: "-rotate-2" },
  { label: "receipt", category: "receipt", rotate: "rotate-3" },
  { label: "quote", category: "quote", rotate: "-rotate-1" },
];

const FEATURES: { title: string; body: string; category: Category }[] = [
  {
    title: "Search that understands content",
    body: 'Not just OCR keyword match — ask for "recipes under 30 minutes" and get the right screenshot back.',
    category: "recipe",
  },
  {
    title: "Zero manual effort",
    body: "Every upload is categorized and tagged automatically the moment it lands.",
    category: "outfit",
  },
  {
    title: "Private by default",
    body: "Your screenshots are yours — sign in or try it as a guest, no strings attached.",
    category: "travel",
  },
];

export function AuthGate({
  children,
}: {
  children: (session: Session) => ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfoMessage(
          "Check your email to confirm your account, then sign in."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    setSubmitting(false);
  }

  async function handleGuest() {
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
    }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="p-6 text-sm text-zinc-400">Loading...</div>;
  }

  if (!session) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />
          <div
            className="animate-blob absolute top-1/4 -right-32 h-[28rem] w-[28rem] rounded-full bg-blue-200/50 blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="animate-blob absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl"
            style={{ animationDelay: "-8s" }}
          />
          <div
            className="animate-blob absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl"
            style={{ animationDelay: "-2s" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="animate-fade-up mb-14 text-center">
            <h1 className="mb-4 text-5xl font-semibold tracking-tight text-zinc-900 italic sm:text-6xl">
              Cache
            </h1>
            <p className="mb-4 text-2xl font-medium text-zinc-900 sm:text-3xl">
              Stop scrolling. Start searching.
            </p>
            <p className="mx-auto mb-7 max-w-xl text-base leading-relaxed text-zinc-500">
              Dump your screenshots in and Cache reads, tags, and organizes
              them automatically. Instead of 4,000 images rotting in your
              camera roll, just search &quot;that pasta recipe I saved&quot;
              and find it instantly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {SHOWCASE_TAGS.map(({ label, category, rotate }, i) => {
                const colors = CATEGORY_COLORS[category];
                return (
                  <span
                    key={label}
                    className={`animate-float inline-block rounded-full px-3.5 py-1.5 text-sm font-medium shadow-sm ${rotate}`}
                    style={{
                      backgroundColor: colors.bg.replace("0.3", "1"),
                      color: colors.text,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
            <div
              className="animate-fade-up transition-transform duration-500 hover:-rotate-1 hover:scale-[1.015]"
              style={{ animationDelay: "150ms" }}
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-900/10">
                <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-zinc-400">
                    cache-cacheshots.vercel.app
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cache-demo.png"
                  alt="Cache app showing a searchable grid of categorized screenshots"
                  className="w-full"
                />
              </div>
            </div>

            <div
              id="auth"
              className="animate-fade-up w-full max-w-sm justify-self-center rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm lg:justify-self-start"
              style={{ animationDelay: "300ms" }}
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {infoMessage && (
                  <p className="text-sm text-green-700">{infoMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? "..." : mode === "signup" ? "Sign up" : "Sign in"}
                </button>
              </form>
              <button
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setError(null);
                  setInfoMessage(null);
                }}
                className="mt-5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "New here? Sign up"}
              </button>

              <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200" />
                or
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              <button
                onClick={handleGuest}
                disabled={submitting}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
              >
                Continue without an account
              </button>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                You can always add an email later to keep access to your
                screenshots from another device.
              </p>
            </div>
          </div>

          <div
            className="animate-fade-up mt-20 grid gap-6 sm:grid-cols-3"
            style={{ animationDelay: "450ms" }}
          >
            {FEATURES.map(({ title, body, category }) => {
              const colors = CATEGORY_COLORS[category];
              return (
                <div
                  key={title}
                  className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold"
                    style={{
                      backgroundColor: colors.bg.replace("0.3", "1"),
                      color: colors.text,
                    }}
                  >
                    ✓
                  </div>
                  <p className="mb-1.5 font-medium text-zinc-900">{title}</p>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  return <>{children(session)}</>;
}