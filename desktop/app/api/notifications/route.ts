import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import {
  listNotificationsForClerkUser,
  markNotificationsRead,
} from "@/lib/db/repositories/notifications";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();

  const data = await listNotificationsForClerkUser(userId);
  if (data) {
    return NextResponse.json({ ok: true, source: "database", data });
  }

  return NextResponse.json({ ok: true, source: "fallback", data: [] });
}

const patchSchema = z
  .object({
    ids: z.array(z.string().uuid()).max(50).optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((body) => body.markAllRead === true || (body.ids?.length ?? 0) > 0, {
    message: "Provide ids or markAllRead",
  });

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const shouldMarkAll = parsed.data.markAllRead === true;
  const result = await markNotificationsRead(userId, shouldMarkAll ? undefined : parsed.data.ids);
  if (!result) {
    return NextResponse.json(
      { ok: true, persisted: false, reason: "Missing DATABASE_URL or user" },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true, data: result });
}
