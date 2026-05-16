"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const MODES = ["local", "world", "webcam", "random_cam", "group"] as const;

export default function CreateChatRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as (typeof MODES)[number]) || "world";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>(initialMode);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "invite">("public");
  const [allowWebcam, setAllowWebcam] = useState(mode === "webcam" || mode === "random_cam");
  const [radiusKm, setRadiusKm] = useState(25);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "create",
          mode,
          name: name.trim(),
          description: description.trim() || undefined,
          privacy,
          allowWebcam,
          radiusKm: mode === "local" ? radiusKm : undefined,
        }),
      });
      const json = (await res.json()) as { data?: { id: string }; error?: string };
      if (!res.ok || !json.data?.id) {
        setError(json.error ?? "Could not create room");
        return;
      }
      router.push(`/chat/${json.data.id}`);
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 p-6 pb-28">
      <Link href="/chat" className="text-sm text-white/60 hover:text-white">
        ← Connect hub
      </Link>
      <form onSubmit={handleSubmit} className="glass-panel space-y-4 p-6">
        <h1 className="text-xl font-semibold text-white">Create a space</h1>
        <label className="block text-xs text-white/60">Type</label>
        <select
          value={mode}
          onChange={(e) => {
            const m = e.target.value as (typeof MODES)[number];
            setMode(m);
            setAllowWebcam(m === "webcam" || m === "random_cam");
          }}
          className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label className="block text-xs text-white/60">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white"
          placeholder="Room name"
        />
        <label className="block text-xs text-white/60">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white"
        />
        <label className="block text-xs text-white/60">Privacy</label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as typeof privacy)}
          className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        >
          <option value="public">Public</option>
          <option value="friends">Friends only</option>
          <option value="invite">Invite only</option>
        </select>
        {mode === "local" ? (
          <>
            <label className="block text-xs text-white/60">Radius (km)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white"
            />
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-white/85">
          <input type="checkbox" checked={allowWebcam} onChange={(e) => setAllowWebcam(e.target.checked)} />
          Enable webcam & microphone
        </label>
        {error ? <p className="text-sm text-[var(--vyb-sunset)]">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-white py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create room"}
        </button>
      </form>
    </section>
  );
}
