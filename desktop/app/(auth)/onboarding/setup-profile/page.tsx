"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const INTEREST_PRESETS = [
  { slug: "walking", label: "Walking" },
  { slug: "music", label: "Music" },
  { slug: "cooking", label: "Cooking" },
  { slug: "gaming", label: "Gaming" },
  { slug: "wellness", label: "Wellness" },
  { slug: "photography", label: "Photography" },
  { slug: "art", label: "Art" },
];

export default function SetupProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interestSlugs, setInterestSlugs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          interestSlugs,
          onboardingCompleted: true,
        }),
      });
      router.push("/feed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <article className="glass-panel p-8">
        <h1 className="text-3xl font-semibold text-white">Set up your profile</h1>
        <p className="mt-2 text-white/70">This is your first impression in the Vyb ecosystem.</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-white/85">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none"
              placeholder="Your name"
            />
          </label>
          <div className="grid gap-2 text-sm text-white/85">
            <span>Interests (pick a few)</span>
            <div className="flex flex-wrap gap-2">
              {INTEREST_PRESETS.map((item) => {
                const active = interestSlugs.includes(item.slug);
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() =>
                      setInterestSlugs((prev) =>
                        prev.includes(item.slug)
                          ? prev.filter((s) => s !== item.slug)
                          : [...prev, item.slug].slice(0, 12),
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-white/60 bg-white/20 text-white"
                        : "border-white/20 text-white/75 hover:border-white/40"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="grid gap-2 text-sm text-white/85">
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="min-h-24 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none"
              placeholder="What makes you come alive?"
            />
          </label>
          <button
            type="submit"
            disabled={isSaving || !displayName.trim()}
            className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </article>
    </section>
  );
}
