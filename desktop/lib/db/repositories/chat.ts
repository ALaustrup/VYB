import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { chatRoomMembers, chatRooms, messages, users } from "@/lib/db/schema";

export type ChatMode =
  | "direct"
  | "group"
  | "local"
  | "world"
  | "webcam"
  | "random_cam"
  | "match_private";

export async function listRoomsForUser(userId: string, modeFilter?: ChatMode) {
  const db = getDb();
  if (!db) return null;

  const memberships = await db
    .select({ roomId: chatRoomMembers.roomId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, userId));

  const roomIds = memberships.map((m) => m.roomId);
  if (roomIds.length === 0) return [];

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(
      modeFilter
        ? and(inArray(chatRooms.id, roomIds), eq(chatRooms.mode, modeFilter))
        : inArray(chatRooms.id, roomIds),
    )
    .orderBy(desc(chatRooms.updatedAt));

  const enriched = [];
  for (const room of rooms) {
    const members = await db
      .select({
        userId: chatRoomMembers.userId,
        displayName: users.displayName,
        username: users.username,
      })
      .from(chatRoomMembers)
      .innerJoin(users, eq(chatRoomMembers.userId, users.id))
      .where(eq(chatRoomMembers.roomId, room.id));

    const peer = members.find((m) => m.userId !== userId);
    enriched.push({
      ...room,
      peerName: peer?.displayName ?? peer?.username ?? room.name ?? "Chat",
      peerUsername: peer?.username ?? null,
      memberCount: members.length,
    });
  }

  return enriched;
}

export async function listPublicRoomsByMode(mode: ChatMode, limit = 20) {
  const db = getDb();
  if (!db) return null;

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.mode, mode))
    .orderBy(desc(chatRooms.updatedAt))
    .limit(limit);

  const enriched = [];
  for (const room of rooms) {
    const members = await db
      .select({ userId: chatRoomMembers.userId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.roomId, room.id));
    enriched.push({ ...room, memberCount: members.length });
  }
  return enriched;
}

export async function createSocialRoom(input: {
  hostId: string;
  mode: ChatMode;
  name?: string;
  memberIds?: string[];
  settings?: {
    privacy?: "public" | "friends" | "invite";
    allowWebcam?: boolean;
    allowMic?: boolean;
    radiusKm?: number;
    description?: string;
  };
  latitude?: string;
  longitude?: string;
}) {
  const db = getDb();
  if (!db) return null;

  const type = input.mode === "direct" || input.mode === "match_private" ? "direct" : "group";
  const [room] = await db
    .insert(chatRooms)
    .values({
      type,
      mode: input.mode,
      name: input.name,
      hostId: input.hostId,
      settings: input.settings,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .returning();

  if (!room) return null;

  const memberSet = new Set([input.hostId, ...(input.memberIds ?? [])]);
  await db.insert(chatRoomMembers).values(
    [...memberSet].map((userId) => ({ roomId: room.id, userId })),
  );

  return room;
}

export async function joinPublicRoom(roomId: string, userId: string) {
  const db = getDb();
  if (!db) return { error: "no_db" as const };

  const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  if (!room) return { error: "not_found" as const };

  await db
    .insert(chatRoomMembers)
    .values({ roomId, userId })
    .onConflictDoNothing();

  return { data: room };
}

export async function getOrCreateDirectRoom(userA: string, userB: string) {
  const db = getDb();
  if (!db) return null;

  const membershipsA = await db
    .select({ roomId: chatRoomMembers.roomId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, userA));

  for (const { roomId } of membershipsA) {
    const members = await db
      .select({ userId: chatRoomMembers.userId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.roomId, roomId));
    const ids = members.map((m) => m.userId).sort();
    const sorted = [userA, userB].sort();
    if (ids.length === 2 && ids[0] === sorted[0] && ids[1] === sorted[1]) {
      const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
      return room ?? null;
    }
  }

  return createSocialRoom({
    hostId: userA,
    mode: "direct",
    memberIds: [userB],
  });
}

export async function listMessages(roomId: string, limit = 50) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      userId: messages.userId,
      authorName: users.displayName,
      authorUsername: users.username,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse().map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    author: row.authorName ?? row.authorUsername,
  }));
}

export async function sendMessage(roomId: string, userId: string, content: string) {
  const db = getDb();
  if (!db) return null;

  const [member] = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)))
    .limit(1);
  if (!member) return { error: "forbidden" as const };

  const [msg] = await db
    .insert(messages)
    .values({ roomId, userId, content, type: "text" })
    .returning();

  await db.update(chatRooms).set({ updatedAt: new Date() }).where(eq(chatRooms.id, roomId));

  const members = await db
    .select({ userId: chatRoomMembers.userId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.roomId, roomId));

  return { data: msg, recipientIds: members.map((m) => m.userId).filter((id) => id !== userId) };
}

export async function isRoomMember(roomId: string, userId: string) {
  const db = getDb();
  if (!db) return false;
  const [row] = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function getRoomById(roomId: string) {
  const db = getDb();
  if (!db) return null;
  const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  return room ?? null;
}
