import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getDb } from "@/lib/db/client";
import { posts, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(500),
  mediaUrls: z.array(z.string().url()).max(4).default([]),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const limited = await rateLimit("post", userId, { limit: 20, windowMs: 60_000 });
  if (!limited.success) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  await ensureCurrentUserSynced();

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        ok: true,
        persisted: false,
        data: { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() },
      },
      { status: 202 },
    );
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not synced. Configure Clerk webhook + DATABASE_URL." },
      { status: 409 },
    );
  }

  const [inserted] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      content: parsed.data.content,
      mediaUrls: parsed.data.mediaUrls,
      type: "text",
    })
    .returning();

  return NextResponse.json({ ok: true, persisted: true, data: inserted }, { status: 201 });
}
