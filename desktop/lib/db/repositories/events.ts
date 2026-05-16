import { and, desc, eq, gt, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { eventAttendees, events, users } from "@/lib/db/schema";

export async function listActiveEvents({ onlyNow = false }: { onlyNow?: boolean } = {}) {
  const db = getDb();
  if (!db) return null;
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      type: events.type,
      location: events.location,
      startTime: events.startTime,
      isNow: events.isNow,
      expiresAt: events.expiresAt,
      currentAttendees: events.currentAttendees,
      maxAttendees: events.maxAttendees,
      hostName: users.displayName,
      hostUsername: users.username,
    })
    .from(events)
    .innerJoin(users, eq(events.hostId, users.id))
    .where(
      onlyNow
        ? and(eq(events.isNow, true), gt(events.expiresAt, now))
        : gt(events.startTime, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    )
    .orderBy(desc(events.startTime))
    .limit(40);

  return rows
    .filter((row) => !row.isNow || (row.expiresAt && row.expiresAt > now))
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      location: row.location,
      startTime: row.startTime.toISOString(),
      isNow: row.isNow,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      currentAttendees: row.currentAttendees,
      maxAttendees: row.maxAttendees,
      host: row.hostName ?? row.hostUsername,
      hostUsername: row.hostUsername,
    }));
}

export async function createEvent(input: {
  hostId: string;
  title: string;
  description?: string;
  startTime: Date;
  isNow?: boolean;
  expiresAt?: Date;
  location?: {
    type: "physical" | "virtual";
    address?: string;
    lat?: number;
    lng?: number;
    virtualLink?: string;
  };
  maxAttendees?: number;
}) {
  const db = getDb();
  if (!db) return null;

  const [event] = await db
    .insert(events)
    .values({
      hostId: input.hostId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      isNow: input.isNow ?? false,
      expiresAt: input.expiresAt,
      location: input.location,
      maxAttendees: input.maxAttendees,
      type: input.isNow ? "spontaneous" : "scheduled",
    })
    .returning();

  if (event) {
    await db.insert(eventAttendees).values({
      eventId: event.id,
      userId: input.hostId,
      status: "host",
    });
  }

  return event;
}

export async function rsvpEvent(eventId: string, userId: string, status: "going" | "interested") {
  const db = getDb();
  if (!db) return null;

  await db
    .insert(eventAttendees)
    .values({ eventId, userId, status })
    .onConflictDoUpdate({
      target: [eventAttendees.eventId, eventAttendees.userId],
      set: { status, rsvpAt: new Date() },
    });

  if (status === "going") {
    await db
      .update(events)
      .set({ currentAttendees: sql`${events.currentAttendees} + 1` })
      .where(eq(events.id, eventId));
  }

  return { ok: true };
}

export async function getEventById(eventId: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      event: events,
      hostName: users.displayName,
      hostUsername: users.username,
    })
    .from(events)
    .innerJoin(users, eq(events.hostId, users.id))
    .where(eq(events.id, eventId))
    .limit(1);
  if (!row) return null;
  return {
    ...row.event,
    startTime: row.event.startTime.toISOString(),
    expiresAt: row.event.expiresAt?.toISOString() ?? null,
    host: row.hostName ?? row.hostUsername,
    hostUsername: row.hostUsername,
  };
}
