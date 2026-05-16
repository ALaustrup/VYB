"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

const INTEREST_PRESETS = [
  { slug: "walking", label: "Walking" },
  { slug: "music", label: "Music" },
  { slug: "cooking", label: "Cooking" },
  { slug: "gaming", label: "Gaming" },
  { slug: "wellness", label: "Wellness" },
  { slug: "photography", label: "Photography" },
  { slug: "art", label: "Art" },
];

type Me = {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  privacyLevel: "public" | "friends" | "private";
  interestsSummary: string[];
  username: string;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState<"public" | "friends" | "private">("public");
  const [interestSlugs, setInterestSlugs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((json: { data?: Me }) => {
        if (!json.data) return;
        setMe(json.data);
        setDisplayName(json.data.displayName ?? "");
        setBio(json.data.bio ?? "");
        setAvatarUrl(json.data.avatarUrl ?? "");
        setPrivacyLevel(json.data.privacyLevel);
        setInterestSlugs(json.data.interestsSummary ?? []);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl: avatarUrl || undefined,
          privacyLevel,
          interestSlugs,
        }),
      });
      router.push(`/profile/${encodeURIComponent(me?.username ?? "")}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl p-6">
      <article className="glass-panel p-8">
        <h1 className="text-2xl font-semibold text-white">Profile settings</h1>
        <p className="mt-1 text-sm text-white/65">Bio, avatar, privacy, and interests.</p>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm text-white/85">
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/85">
            Avatar URL
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
              placeholder="https://…"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/85">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-24 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/85">
            Privacy
            <select
              value={privacyLevel}
              onChange={(e) => setPrivacyLevel(e.target.value as Me["privacyLevel"])}
              className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </label>
          <div className="grid gap-2 text-sm text-white/85">
            <span>Interests</span>
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
                          : [...prev, item.slug],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active ? "border-white/60 bg-white/20" : "border-white/20"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/feed" className="rounded-full px-5 py-2 text-sm text-white/80">
              Cancel
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
