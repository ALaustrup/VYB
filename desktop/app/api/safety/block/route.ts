import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { blockUser, getUserIdByUsername } from "@/lib/db/repositories/connections";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const schema = z.object({
  username: z.string().min(1).max(40),
});

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const targetId = await getUserIdByUsername(parsed.data.username);
  if (!targetId) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  await blockUser(viewer.id, targetId);
  return NextResponse.json({ ok: true });
}
