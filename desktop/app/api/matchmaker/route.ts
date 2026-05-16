import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { advanceMatchmakerSession } from "@/lib/db/repositories/matchmaker";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const bodySchema = z.object({
  stepId: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
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

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const result = await advanceMatchmakerSession(
    user.id,
    parsed.data.stepId && parsed.data.value
      ? { stepId: parsed.data.stepId, value: parsed.data.value }
      : undefined,
  );

  if (!result) {
    return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ...result });
}
