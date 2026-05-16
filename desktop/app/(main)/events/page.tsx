"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  isNow: boolean;
  host: string;
  location: { type: string; lat?: number; lng?: number } | null;
};

export default function EventsPage() {
  const [onlyNow, setOnlyNow] = useState(false);

  const events = useQuery({
    queryKey: ["events", onlyNow],
    queryFn: async () => {
      const res = await fetch(`/api/events${onlyNow ? "?now=1" : ""}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { data: EventRow[] };
    },
  });

  const items = events.data?.data ?? [];

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Events</h1>
          <p className="text-sm text-white/65">Meetups and Vyb Now spontaneous hangs.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOnlyNow(!onlyNow)}
            className={`rounded-full px-4 py-2 text-xs ${onlyNow ? "bg-white text-black" : "border border-white/20 text-white/80"}`}
          >
            Vyb Now only
          </button>
          <Link href="/events/create" className="rounded-full bg-white px-4 py-2 text-xs font-medium text-black">
            Create
          </Link>
        </div>
      </div>
      {events.isLoading ? (
        <article className="glass-panel p-8 text-center text-white/70">Loading…</article>
      ) : items.length === 0 ? (
        <article className="glass-panel p-8 text-center text-white/70">No events yet. Start one!</article>
      ) : (
        <ul className="grid gap-3">
          {items.map((ev) => (
            <li key={ev.id} className="glass-panel p-5">
              {ev.isNow ? (
                <span className="mb-2 inline-block rounded-full bg-[var(--vyb-sunset)]/30 px-2 py-0.5 text-xs text-white">
                  Vyb Now
                </span>
              ) : null}
              <h2 className="font-semibold text-white">{ev.title}</h2>
              <p className="text-xs text-white/50">
                {ev.host} · {new Date(ev.startTime).toLocaleString()}
              </p>
              {ev.description ? <p className="mt-2 text-sm text-white/80">{ev.description}</p> : null}
              {ev.location?.lat != null && ev.location.lng != null ? (
                <a
                  className="mt-2 inline-block text-xs text-white/60 underline"
                  href={`https://www.openstreetmap.org/?mlat=${ev.location.lat}&mlon=${ev.location.lng}#map=15/${ev.location.lat}/${ev.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on map
                </a>
              ) : null}
              <Link
                href={`/events/${ev.id}`}
                className="mt-3 inline-block rounded-full border border-white/25 px-3 py-1 text-xs text-white/85"
              >
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
