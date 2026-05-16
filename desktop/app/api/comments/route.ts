import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { createComment, listCommentsForPost } from "@/lib/db/repositories/comments";
import { getUserByClerkId } from "@/lib/db/repositories/users";
import { rateLimit } from "@/lib/rate-limit";

const getSchema = z.object({
  postId: z.string().uuid(),
});

const postSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1).max(500),
  parentId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = getSchema.safeParse({ postId: url.searchParams.get("postId") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid postId" }, { status: 400 });
  }

  const data = await listCommentsForPost(parsed.data.postId);
  if (!data) {
    return NextResponse.json({ ok: true, source: "fallback", data: [] });
  }
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit("comment", userId, { limit: 40, windowMs: 60_000 });
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

  const result = await createComment({
    postId: parsed.data.postId,
    authorId: user.id,
    content: parsed.data.content,
    parentId: parsed.data.parentId,
  });

  if (!result) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
  if ("error" in result && result.error === "post_not_found") {
    return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
  }
  if (!("data" in result)) {
    return NextResponse.json({ ok: false, error: "Unexpected" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
}
