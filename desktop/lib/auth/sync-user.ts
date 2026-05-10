import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

type SyncUserInput = {
  clerkId: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

export async function syncUserFromClerk(input: SyncUserInput) {
  const db = getDb();
  if (!db) {
    return { persisted: false };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, input.clerkId),
  });

  if (existing) {
    await db
      .update(users)
      .set({
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { persisted: true };
  }

  await db.insert(users).values({
    clerkId: input.clerkId,
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
  });

  return { persisted: true };
}
