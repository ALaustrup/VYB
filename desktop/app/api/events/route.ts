import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { createEvent, listActiveEvents } from "@/lib/db/repositories/events";
import { getUserByClerkId } from "@/lib/db/repositories/users";
import { rateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  isNow: z.boolean().optional(),
  expiresInMinutes: z.number().int().min(15).max(480).optional(),
  location: z
    .object({
      type: z.enum(["physical", "virtual"]),
      address: z.string().max(200).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      virtualLink: z.string().url().optional(),
    })
    .optional(),
  maxAttendees: z.number().int().min(2).max(500).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const onlyNow = url.searchParams.get("now") === "1";
  const data = await listActiveEvents({ onlyNow });
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit("post", userId, { limit: 10, windowMs: 60_000 });
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
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const startTime = new Date(parsed.data.startTime);
  let expiresAt: Date | undefined;
  if (parsed.data.isNow && parsed.data.expiresInMinutes) {
    expiresAt = new Date(Date.now() + parsed.data.expiresInMinutes * 60_000);
  }

  const event = await createEvent({
    hostId: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    startTime,
    isNow: parsed.data.isNow,
    expiresAt,
    location: parsed.data.location,
    maxAttendees: parsed.data.maxAttendees,
  });

  if (!event) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true, data: event }, { status: 201 });
}
