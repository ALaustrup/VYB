import { and, eq, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { connections, users } from "@/lib/db/schema";

export async function getConnectionStatus(fromUserId: string, toUserId: string) {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(connections)
    .where(
      and(eq(connections.fromUserId, fromUserId), eq(connections.toUserId, toUserId)),
    )
    .limit(1);

  if (row?.status === "blocked") return "blocked";
  if (row?.status === "following" || row?.status === "accepted") return "following";

  const [reverse] = await db
    .select()
    .from(connections)
    .where(
      and(eq(connections.fromUserId, toUserId), eq(connections.toUserId, fromUserId)),
    )
    .limit(1);

  if (reverse?.status === "blocked") return "blocked_by_them";
  return row ? row.status : "none";
}

export async function followUser(fromUserId: string, toUserId: string) {
  const db = getDb();
  if (!db) return null;
  if (fromUserId === toUserId) return { error: "self" as const };

  await db
    .insert(connections)
    .values({ fromUserId, toUserId, status: "following" })
    .onConflictDoUpdate({
      target: [connections.fromUserId, connections.toUserId],
      set: { status: "following" },
    });

  return { ok: true };
}

export async function unfollowUser(fromUserId: string, toUserId: string) {
  const db = getDb();
  if (!db) return null;

  await db
    .delete(connections)
    .where(and(eq(connections.fromUserId, fromUserId), eq(connections.toUserId, toUserId)));

  return { ok: true };
}

export async function blockUser(fromUserId: string, toUserId: string) {
  const db = getDb();
  if (!db) return null;

  await db
    .insert(connections)
    .values({ fromUserId, toUserId, status: "blocked" })
    .onConflictDoUpdate({
      target: [connections.fromUserId, connections.toUserId],
      set: { status: "blocked" },
    });

  return { ok: true };
}

export async function getFollowingUserIds(viewerUserId: string) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({ toUserId: connections.toUserId })
    .from(connections)
    .where(
      and(
        eq(connections.fromUserId, viewerUserId),
        or(eq(connections.status, "following"), eq(connections.status, "accepted")),
      ),
    );

  return rows.map((r) => r.toUserId);
}

export async function getUserIdByUsername(username: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${username.trim().toLowerCase()}`)
    .limit(1);
  return row?.id ?? null;
}
