import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { comments, posts, users } from "@/lib/db/schema";

export async function listCommentsForPost(postId: string) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      authorName: users.displayName,
      authorUsername: users.username,
      authorId: users.id,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    parentId: row.parentId,
    createdAt: row.createdAt.toISOString(),
    author: row.authorName ?? row.authorUsername,
    authorUsername: row.authorUsername,
    authorId: row.authorId,
  }));
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}) {
  const db = getDb();
  if (!db) return null;

  return db.transaction(async (tx) => {
    const [post] = await tx
      .select({ id: posts.id, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1);
    if (!post) return { error: "post_not_found" as const };

    const [inserted] = await tx
      .insert(comments)
      .values({
        postId: input.postId,
        authorId: input.authorId,
        content: input.content,
        parentId: input.parentId,
      })
      .returning();

    await tx
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1`, updatedAt: new Date() })
      .where(eq(posts.id, input.postId));

    return { data: inserted, postAuthorId: post.authorId };
  });
}
