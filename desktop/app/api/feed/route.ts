import { NextResponse } from "next/server";
import { z } from "zod";
import { getFeedPage } from "@/lib/db/repositories/posts";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
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

  const dbFeed = await getFeedPage({ cursor: parsed.data.cursor, limit: parsed.data.limit });
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
