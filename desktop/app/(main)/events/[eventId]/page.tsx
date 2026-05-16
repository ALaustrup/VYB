import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventRsvpButton } from "@/components/events/event-rsvp-button";
import {
  getEventById,
  getViewerRsvp,
  listEventAttendees,
} from "@/lib/db/repositories/events";
import { getUserByClerkId } from "@/lib/db/repositories/users";

type PageProps = { params: Promise<{ eventId: string }> };

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (event === null) {
    return (
      <section className="mx-auto max-w-xl p-8 text-center text-white/80">
        <p>Event details require a configured database.</p>
        <Link className="mt-4 inline-block underline" href="/events">
          Back to events
        </Link>
      </section>
    );
  }

  if (!event) notFound();

  const attendees = (await listEventAttendees(eventId)) ?? [];
  const { userId } = await auth();
  let viewerRsvp: string | null = null;
  if (userId) {
    const user = await getUserByClerkId(userId);
    if (user) viewerRsvp = await getViewerRsvp(eventId, user.id);
  }

  const location = event.location as {
    type?: string;
    lat?: number;
    lng?: number;
    address?: string;
    virtualLink?: string;
  } | null;

  return (
    <section className="mx-auto max-w-2xl space-y-4 p-6 pb-16">
      <Link href="/events" className="text-sm text-white/60 hover:text-white">
        ← All events
      </Link>
      <article className="glass-panel p-8">
        {event.isNow ? (
          <span className="mb-3 inline-block rounded-full bg-[var(--vyb-sunset)]/30 px-2 py-0.5 text-xs text-white">
            Vyb Now
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold text-white">{event.title}</h1>
        <p className="mt-1 text-sm text-white/55">
          Hosted by @{event.hostUsername} · {new Date(event.startTime).toLocaleString()}
        </p>
        {event.description ? (
          <p className="mt-4 text-sm leading-relaxed text-white/85">{event.description}</p>
        ) : null}
        {location?.address ? <p className="mt-2 text-sm text-white/70">{location.address}</p> : null}
        {location?.virtualLink ? (
          <a href={location.virtualLink} className="mt-2 inline-block text-sm text-white underline" target="_blank" rel="noreferrer">
            Join online
          </a>
        ) : null}
        {location?.lat != null && location.lng != null ? (
          <a
            className="mt-2 block text-sm text-white/60 underline"
            href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            View on map
          </a>
        ) : null}
        <p className="mt-3 text-xs text-white/45">
          {event.currentAttendees ?? 0}
          {event.maxAttendees ? ` / ${event.maxAttendees}` : ""} attending
        </p>
        <EventRsvpButton eventId={eventId} initialStatus={viewerRsvp} />
      </article>

      <article className="glass-panel p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Attendees</h2>
        {attendees.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No RSVPs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {attendees.map((a) => (
              <li key={a.userId} className="flex items-center justify-between text-sm text-white/85">
                <Link href={`/profile/${encodeURIComponent(a.username)}`} className="hover:underline">
                  {a.displayName}
                </Link>
                <span className="text-xs capitalize text-white/45">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
