import { and, desc, eq, inArray, lt } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { posts, users } from "@/lib/db/schema";
import { canViewProfileContent, getConnectedUserIds } from "@/lib/privacy/access";
import { getFollowingUserIds } from "./connections";

export async function getFeedPage({
  cursor,
  limit,
  filter = "all",
  viewerUserId,
}: {
  cursor?: string;
  limit: number;
  filter?: "all" | "following";
  viewerUserId?: string;
}) {
  const db = getDb();
  if (!db) return null;

  let authorFilter: ReturnType<typeof inArray> | undefined;
  if (filter === "following" && viewerUserId) {
    const followingIds = await getFollowingUserIds(viewerUserId);
    const ids = followingIds ?? [];
    if (ids.length === 0) {
      return { posts: [], nextCursor: null };
    }
    authorFilter = inArray(posts.authorId, ids);
  }

  const connectedIds = viewerUserId ? await getConnectedUserIds(viewerUserId) : new Set<string>();

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      commentsCount: posts.commentsCount,
      authorId: posts.authorId,
      author: users.displayName,
      authorUsername: users.username,
      privacyLevel: users.privacyLevel,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      and(
        cursor ? lt(posts.createdAt, new Date(cursor)) : undefined,
        authorFilter,
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit((limit + 1) * 4);

  const filtered = rows.filter((row) => {
    const isOwner = viewerUserId ? row.authorId === viewerUserId : false;
    const isConnected = connectedIds.has(row.authorId);
    return canViewProfileContent(row.privacyLevel, isOwner, isConnected);
  });

  const hasMore = filtered.length > limit;
  const pageRows = hasMore ? filtered.slice(0, limit) : filtered;
  const nextCursor = hasMore ? pageRows.at(-1)?.createdAt.toISOString() ?? null : null;

  return {
    posts: pageRows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author ?? "Vyb Member",
      authorUsername: row.authorUsername,
      commentsCount: row.commentsCount,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor,
  };
}
