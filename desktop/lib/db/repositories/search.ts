import { desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { interests, posts, users } from "@/lib/db/schema";

const MAX_PER_GROUP = 8;

export async function searchAll(q: string) {
  const db = getDb();
  if (!db) return null;

  const term = `%${q.trim()}%`;
  if (q.trim().length < 2) {
    return { people: [], posts: [], interests: [] };
  }

  const people = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
    })
    .from(users)
    .where(
      or(
        ilike(users.username, term),
        ilike(users.displayName, term),
        ilike(users.bio, term),
      ),
    )
    .orderBy(desc(users.updatedAt))
    .limit(MAX_PER_GROUP);

  const feedPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: users.displayName,
      authorUsername: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(ilike(posts.content, term))
    .orderBy(desc(posts.createdAt))
    .limit(MAX_PER_GROUP);

  const interestRows = await db
    .select({ id: interests.id, slug: interests.slug, name: interests.name, category: interests.category })
    .from(interests)
    .where(or(ilike(interests.name, term), ilike(interests.slug, term)))
    .limit(MAX_PER_GROUP);

  return {
    people: people.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName ?? row.username,
      bio: row.bio,
    })),
    posts: feedPosts.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      author: row.authorName ?? row.authorUsername,
    })),
    interests: interestRows,
  };
}
