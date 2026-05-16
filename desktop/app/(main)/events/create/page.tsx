"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function CreateEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isNow, setIsNow] = useState(true);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          startTime: new Date().toISOString(),
          isNow,
          expiresInMinutes: isNow ? 120 : undefined,
          location:
            lat && lng
              ? { type: "physical", lat: Number(lat), lng: Number(lng) }
              : undefined,
        }),
      });
      if (res.ok) router.push("/events");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl p-6">
      <article className="glass-panel p-8">
        <h1 className="text-2xl font-semibold text-white">Create event</h1>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm text-white/85">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/85">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-white/85">
            <input type="checkbox" checked={isNow} onChange={(e) => setIsNow(e.target.checked)} />
            Vyb Now (spontaneous, expires in 2h)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm text-white/85">
              Latitude
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
                placeholder="optional"
              />
            </label>
            <label className="grid gap-2 text-sm text-white/85">
              Longitude
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
                placeholder="optional"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {saving ? "Creating…" : "Publish"}
          </button>
        </form>
      </article>
    </section>
  );
}
