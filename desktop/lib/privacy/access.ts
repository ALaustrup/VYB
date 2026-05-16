import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { connections } from "@/lib/db/schema";

const CONNECTED_STATUSES = ["following", "accepted"] as const;

/** Users the viewer shares a follow/accepted link with (either direction), excluding blocks. */
export async function getConnectedUserIds(viewerUserId: string) {
  const db = getDb();
  if (!db) return new Set<string>();

  const outbound = await db
    .select({ id: connections.toUserId, status: connections.status })
    .from(connections)
    .where(eq(connections.fromUserId, viewerUserId));

  const inbound = await db
    .select({ id: connections.fromUserId, status: connections.status })
    .from(connections)
    .where(eq(connections.toUserId, viewerUserId));

  const ids = new Set<string>();
  for (const row of outbound) {
    if (row.status !== "blocked" && CONNECTED_STATUSES.includes(row.status as "following" | "accepted")) {
      ids.add(row.id);
    }
  }
  for (const row of inbound) {
    if (row.status !== "blocked" && CONNECTED_STATUSES.includes(row.status as "following" | "accepted")) {
      ids.add(row.id);
    }
  }
  return ids;
}

export async function areUsersConnected(viewerUserId: string, profileUserId: string) {
  if (viewerUserId === profileUserId) return true;
  const connected = await getConnectedUserIds(viewerUserId);
  return connected.has(profileUserId);
}

export async function isBlockedBetween(userA: string, userB: string) {
  const db = getDb();
  if (!db) return false;

  const blocked = await db
    .select()
    .from(connections)
    .where(
      and(
        or(
          and(eq(connections.fromUserId, userA), eq(connections.toUserId, userB)),
          and(eq(connections.fromUserId, userB), eq(connections.toUserId, userA)),
        ),
        eq(connections.status, "blocked"),
      ),
    )
    .limit(1);

  return blocked.length > 0;
}

export function canViewProfileContent(
  privacyLevel: "public" | "friends" | "private",
  isOwner: boolean,
  isConnected: boolean,
) {
  if (isOwner) return true;
  if (privacyLevel === "public") return true;
  if (privacyLevel === "private") return false;
  if (privacyLevel === "friends") return isConnected;
  return false;
}
