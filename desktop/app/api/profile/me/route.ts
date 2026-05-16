import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getUserByClerkId, updateProfileSettings } from "@/lib/db/repositories/users";

const patchSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
  privacyLevel: z.enum(["public", "friends", "private"]).optional(),
  interestSlugs: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: user });
}

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

  const payload = {
    ...parsed.data,
    avatarUrl: parsed.data.avatarUrl === "" ? undefined : parsed.data.avatarUrl,
  };

  const updated = await updateProfileSettings(userId, payload);
  if (!updated) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  return NextResponse.json({ ok: true, data: updated });
}
