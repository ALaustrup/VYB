import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { chatRoomMembers, chatRooms, messages, users } from "@/lib/db/schema";

export async function listRoomsForUser(userId: string) {
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
    .where(inArray(chatRooms.id, roomIds))
    .orderBy(desc(chatRooms.updatedAt));

  return rooms;
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
    if (ids.length === 2 && ids[0] === [userA, userB].sort()[0] && ids[1] === [userA, userB].sort()[1]) {
      const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
      return room ?? null;
    }
  }

  const [room] = await db.insert(chatRooms).values({ type: "direct" }).returning();
  if (!room) return null;
  await db.insert(chatRoomMembers).values([
    { roomId: room.id, userId: userA },
    { roomId: room.id, userId: userB },
  ]);
  return room;
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

  return { data: msg };
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
