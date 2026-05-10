import { desc, eq, lt } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { posts, users } from "@/lib/db/schema";

export async function getFeedPage({ cursor, limit }: { cursor?: string; limit: number }) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      author: users.displayName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(cursor ? lt(posts.createdAt, new Date(cursor)) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? pageRows.at(-1)?.createdAt.toISOString() ?? null : null;

  return {
    posts: pageRows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author ?? "Vyb Member",
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor,
  };
}
