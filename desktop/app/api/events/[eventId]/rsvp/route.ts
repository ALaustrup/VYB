import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { rsvpEvent } from "@/lib/db/repositories/events";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const bodySchema = z.object({
  status: z.enum(["going", "interested"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not synced" }, { status: 409 });
  }

  const { eventId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  await rsvpEvent(eventId, user.id, parsed.data.status);
  return NextResponse.json({ ok: true });
}
