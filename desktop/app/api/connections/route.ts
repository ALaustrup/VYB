import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import {
  blockUser,
  followUser,
  getConnectionStatus,
  getUserIdByUsername,
  unfollowUser,
} from "@/lib/db/repositories/connections";
import { getUserByClerkId } from "@/lib/db/repositories/users";
import { createNotification } from "@/lib/notifications/create";

const postSchema = z.object({
  username: z.string().min(1).max(40),
  action: z.enum(["follow", "unfollow", "block"]),
});

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const username = new URL(request.url).searchParams.get("username");
  if (!username) {
    return NextResponse.json({ ok: false, error: "username required" }, { status: 400 });
  }

  const viewer = await getUserByClerkId(userId);
  const targetId = await getUserIdByUsername(username);
  if (!viewer || !targetId) {
    return NextResponse.json({ ok: true, status: "none" });
  }

  const status = await getConnectionStatus(viewer.id, targetId);
  return NextResponse.json({ ok: true, status: status ?? "none" });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const viewer = await getUserByClerkId(userId);
  const targetId = await getUserIdByUsername(parsed.data.username);
  if (!viewer || !targetId) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  if (parsed.data.action === "follow") {
    const result = await followUser(viewer.id, targetId);
    if (result && "error" in result && result.error === "self") {
      return NextResponse.json({ ok: false, error: "Cannot follow yourself" }, { status: 400 });
    }
    if (result && "ok" in result) {
      await createNotification({
        userId: targetId,
        type: "follow",
        title: "Someone followed you",
        body: `${viewer.displayName ?? viewer.username} started following you`,
        metadata: { fromUserId: viewer.id },
      });
    }
  } else if (parsed.data.action === "unfollow") {
    await unfollowUser(viewer.id, targetId);
  } else {
    await blockUser(viewer.id, targetId);
  }

  const status = await getConnectionStatus(viewer.id, targetId);
  return NextResponse.json({ ok: true, status: status ?? "none" });
}
