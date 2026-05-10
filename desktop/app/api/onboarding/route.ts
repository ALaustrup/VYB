import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { updateOnboardingByClerkId } from "@/lib/db/repositories/users";

const onboardingSchema = z.object({
  vibeQuizAnswers: z.record(z.string(), z.string()).optional(),
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(300).optional(),
  onboardingCompleted: z.boolean().optional(),
  interestSlugs: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateOnboardingByClerkId(userId, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { ok: true, persisted: false, reason: "Missing DATABASE_URL or local user row" },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true, data: updated });
}
