import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getOrCreateDirectRoom, listRoomsForUser } from "@/lib/db/repositories/chat";
import { getUserIdByUsername } from "@/lib/db/repositories/connections";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const postSchema = z.object({
  username: z.string().min(1).max(40),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: true, data: [] });
  }
  const rooms = await listRoomsForUser(user.id);
  return NextResponse.json({ ok: true, data: rooms ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();
  const viewer = await getUserByClerkId(userId);
  if (!viewer) {
    return NextResponse.json({ ok: false, error: "User not synced" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const targetId = await getUserIdByUsername(parsed.data.username);
  if (!targetId) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const room = await getOrCreateDirectRoom(viewer.id, targetId);
  if (!room) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true, data: room });
}
