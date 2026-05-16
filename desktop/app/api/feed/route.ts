import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getFeedPage } from "@/lib/db/repositories/posts";
import { getUserByClerkId } from "@/lib/db/repositories/users";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
  filter: z.enum(["all", "following"]).default("all"),
});

const samplePosts = [
  {
    id: "1",
    author: "Avery",
    authorUsername: "avery",
    content: "Hosting a spontaneous sunset walk at 7pm.",
  },
  {
    id: "2",
    author: "Mina",
    authorUsername: "mina",
    content: "Looking to trade guitar basics for cooking lessons.",
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = await auth();
  let viewerUserId: string | undefined;
  if (parsed.data.filter === "following" && userId) {
    await ensureCurrentUserSynced();
    const viewer = await getUserByClerkId(userId);
    viewerUserId = viewer?.id;
  }

  const dbFeed = await getFeedPage({
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
    filter: parsed.data.filter,
    viewerUserId,
  });
  if (dbFeed) {
    return NextResponse.json({ ok: true, data: dbFeed, source: "database" });
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        posts: samplePosts.slice(0, parsed.data.limit),
        nextCursor: null,
      },
      source: "fallback",
    },
    { status: 200 },
  );
}
