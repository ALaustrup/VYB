import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { isRoomMember, listMessages, sendMessage } from "@/lib/db/repositories/chat";
import { getUserByClerkId } from "@/lib/db/repositories/users";
import { createNotification } from "@/lib/notifications/create";
import { rateLimit } from "@/lib/rate-limit";

const getSchema = z.object({
  roomId: z.string().uuid(),
});

const postSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const parsed = getSchema.safeParse({ roomId: url.searchParams.get("roomId") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid roomId" }, { status: 400 });
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await isRoomMember(parsed.data.roomId, user.id);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const data = await listMessages(parsed.data.roomId);
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit("auth", userId, { limit: 60, windowMs: 60_000 });
  if (!limited.success) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not synced" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Validation failed" }, { status: 400 });
  }

  const result = await sendMessage(parsed.data.roomId, user.id, parsed.data.content);
  if (!result) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 403 });
  }

  for (const recipientId of result.recipientIds ?? []) {
    await createNotification({
      userId: recipientId,
      type: "message",
      title: "New message",
      body: parsed.data.content.slice(0, 120),
      metadata: { roomId: parsed.data.roomId },
    });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
}
