import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { interests, posts, userInterests, users } from "@/lib/db/schema";

const PROFILE_POST_LIMIT = 20;

export type PublicProfilePayload = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  privacyLevel: "public" | "friends" | "private";
  createdAt: string;
  interests: Array<{ slug: string; name: string; category: string }>;
  recentPosts: Array<{ id: string; content: string; createdAt: string }>;
  isViewerOwner: boolean;
};

export async function getPublicProfile(usernameParam: string, viewerClerkId: string | null) {
  const db = getDb();
  if (!db) return null;

  const handle = usernameParam.trim();
  if (!handle) return { error: "not_found" as const };

  const [row] = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      privacyLevel: users.privacyLevel,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`lower(${users.username}) = ${handle.toLowerCase()}`)
    .limit(1);

  if (!row) return { error: "not_found" as const };

  const isViewerOwner = Boolean(viewerClerkId && viewerClerkId === row.clerkId);

  if (row.privacyLevel === "private" && !isViewerOwner) {
    return { error: "private" as const };
  }

  const interestRows = await db
    .select({
      slug: interests.slug,
      name: interests.name,
      category: interests.category,
    })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, row.id));

  const postRows = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, row.id))
    .orderBy(desc(posts.createdAt))
    .limit(PROFILE_POST_LIMIT);

  const payload: PublicProfilePayload = {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    privacyLevel: row.privacyLevel,
    createdAt: row.createdAt.toISOString(),
    interests: interestRows,
    recentPosts: postRows.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
    })),
    isViewerOwner,
  };

  return { data: payload };
}
