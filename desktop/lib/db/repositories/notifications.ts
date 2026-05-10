import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { notifications, users } from "@/lib/db/schema";

export async function listNotificationsForClerkUser(clerkId: string, limit = 40) {
  const db = getDb();
  if (!db) return null;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) return null;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function markNotificationsRead(clerkId: string, ids?: string[]) {
  const db = getDb();
  if (!db) return null;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) return null;

  if (ids?.length) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), inArray(notifications.id, ids)));
  } else {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
  }

  return { updated: true };
}
