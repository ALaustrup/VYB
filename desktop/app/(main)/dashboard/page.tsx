"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

const ACCENTS = ["#ff6b4a", "#a78bfa", "#2dd4bf", "#f472b6", "#fbbf24"] as const;

type Profile = {
  username: string;
  displayName: string | null;
  bio: string | null;
  privacyLevel: string;
  profileTheme: { accent?: string; tagline?: string; layout?: string } | null;
  shareLocation: boolean;
};

export default function DashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const res = await fetch("/api/profile/me");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { data: Profile };
    },
  });

  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState<string>(ACCENTS[0]);
  const [shareLocation, setShareLocation] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const data = profile.data?.data;

  useEffect(() => {
    if (!data || hydrated) return;
    setTagline(data.profileTheme?.tagline ?? "");
    setBio(data.bio ?? "");
    setAccent(data.profileTheme?.accent ?? ACCENTS[0]);
    setShareLocation(data.shareLocation);
    setHydrated(true);
  }, [data, hydrated]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          profileTheme: { accent, tagline, layout: "classic" },
          shareLocation,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    },
  });

  const displayName = data?.displayName ?? user?.fullName ?? "Your space";
  const username = data?.username ?? user?.username ?? "you";

  return (
    <section className="mx-auto max-w-4xl space-y-6 p-6 pb-28">
      <header
        className="glass-panel overflow-hidden border p-8"
        style={{
          borderColor: accent,
          boxShadow: `0 0 40px color-mix(in oklab, ${accent} 25%, transparent)`,
        }}
      >
        <p className="text-xs uppercase tracking-widest text-white/50">Your dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{displayName}</h1>
        <p className="text-white/55">@{username}</p>
        {tagline ? <p className="mt-3 text-sm text-white/80">{tagline}</p> : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/profile/${encodeURIComponent(username)}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
            Public profile
          </Link>
          <Link href="/settings/profile" className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85">
            Account settings
          </Link>
          <Link href="/chat" className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85">
            Connect hub
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Customize</h2>
          <label className="mt-4 block text-xs text-white/60">Tagline</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
            placeholder="What brings you to Vyb?"
          />
          <label className="mt-3 block text-xs text-white/60">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <p className="mt-4 text-xs text-white/50">Accent color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccent(c)}
                className={`h-8 w-8 rounded-full border-2 ${accent === c ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Accent ${c}`}
              />
            ))}
          </div>
        </article>

        <article className="glass-panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Privacy & location</h2>
          <label className="mt-4 flex items-center gap-2 text-sm text-white/85">
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} />
            Share location for local chats
          </label>
          <p className="mt-2 text-xs text-white/50">Enables distance-based local rooms when you create or join them.</p>
          <p className="mt-4 text-xs text-white/45">Visibility: {data?.privacyLevel ?? "public"}</p>
          <Link href="/settings/profile" className="mt-3 inline-block text-sm text-white underline">
            Change privacy
          </Link>
        </article>
      </div>

      <article className="glass-panel p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Quick connect</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/chat/matchmaker" className="glass-panel block p-4 text-sm text-white/90 hover:bg-white/10">
            Vyb Match · AI introductions
          </Link>
          <Link href="/chat/create?mode=local" className="glass-panel block p-4 text-sm text-white/90 hover:bg-white/10">
            Start a local group
          </Link>
          <Link href="/chat/create?mode=world" className="glass-panel block p-4 text-sm text-white/90 hover:bg-white/10">
            Open a world room
          </Link>
          <Link href="/chat/create?mode=random_cam" className="glass-panel block p-4 text-sm text-white/90 hover:bg-white/10">
            Random cam chat
          </Link>
        </div>
      </article>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save dashboard"}
        </button>
      </div>
    </section>
  );
}
