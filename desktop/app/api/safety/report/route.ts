import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { createReport } from "@/lib/db/repositories/safety";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const schema = z.object({
  targetType: z.enum(["user", "post", "comment", "listing", "event"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(3).max(120),
  details: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not synced" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Validation failed" }, { status: 400 });
  }

  const row = await createReport({
    reporterId: user.id,
    ...parsed.data,
  });
  if (!row) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true, data: { id: row.id } }, { status: 201 });
}
