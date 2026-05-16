import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import {
  createSocialRoom,
  getOrCreateDirectRoom,
  joinPublicRoom,
  listRoomsForUser,
  type ChatMode,
} from "@/lib/db/repositories/chat";
import { getUserIdByUsername } from "@/lib/db/repositories/connections";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const postSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dm"),
    username: z.string().min(1).max(40),
  }),
  z.object({
    kind: z.literal("create"),
    mode: z.enum(["local", "world", "webcam", "random_cam", "group"]),
    name: z.string().min(1).max(80),
    description: z.string().max(300).optional(),
    privacy: z.enum(["public", "friends", "invite"]).default("public"),
    allowWebcam: z.boolean().optional(),
    radiusKm: z.number().min(1).max(500).optional(),
  }),
  z.object({
    kind: z.literal("join"),
    roomId: z.string().uuid(),
  }),
]);

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

  const raw = await request.json().catch(() => null);
  const body =
    raw && typeof raw === "object" && "username" in raw && !("kind" in raw)
      ? { kind: "dm", username: (raw as { username: string }).username }
      : raw;
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.kind === "dm") {
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

  if (parsed.data.kind === "join") {
    const result = await joinPublicRoom(parsed.data.roomId, viewer.id);
    if (result && "error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: result?.data });
  }

  const mode = parsed.data.mode as ChatMode;
  const room = await createSocialRoom({
    hostId: viewer.id,
    mode,
    name: parsed.data.name,
    settings: {
      privacy: parsed.data.privacy,
      allowWebcam: parsed.data.allowWebcam ?? (mode === "webcam" || mode === "random_cam"),
      allowMic: parsed.data.allowWebcam ?? (mode === "webcam" || mode === "random_cam"),
      radiusKm: parsed.data.radiusKm,
      description: parsed.data.description,
    },
    latitude: viewer.latitude ?? undefined,
    longitude: viewer.longitude ?? undefined,
  });

  if (!room) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true, data: room }, { status: 201 });
}
