import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { interests, userInterests, users } from "@/lib/db/schema";

export async function getUserByClerkId(clerkId: string) {
  const db = getDb();
  if (!db) return null;
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
}

function slugToLabel(slug: string) {
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function syncUserInterestSlugs(userId: string, slugs: string[]) {
  const db = getDb();
  if (!db) return;
  const unique = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
  await db.delete(userInterests).where(eq(userInterests.userId, userId));
  if (unique.length === 0) return;

  for (const slug of unique) {
    await db
      .insert(interests)
      .values({ slug, name: slugToLabel(slug), category: "social" })
      .onConflictDoNothing({ target: interests.slug });
  }

  const rows = await db.select({ id: interests.id }).from(interests).where(inArray(interests.slug, unique));
  if (rows.length) {
    await db.insert(userInterests).values(
      rows.map((row) => ({ userId, interestId: row.id, score: 70 })),
    );
  }
}

export async function updateOnboardingByClerkId(
  clerkId: string,
  payload: {
    vibeQuizAnswers?: Record<string, string>;
    displayName?: string;
    bio?: string;
    onboardingCompleted?: boolean;
    interestSlugs?: string[];
  },
) {
  const db = getDb();
  if (!db) return null;
  const user = await getUserByClerkId(clerkId);
  if (!user) return null;

  const interestSlugs = payload.interestSlugs;
  const normalizedInterestSlugs =
    interestSlugs !== undefined
      ? [...new Set(interestSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, 12)
      : undefined;

  await db
    .update(users)
    .set({
      vibeQuizAnswers: payload.vibeQuizAnswers ?? user.vibeQuizAnswers ?? undefined,
      displayName: payload.displayName ?? user.displayName ?? undefined,
      bio: payload.bio ?? user.bio ?? undefined,
      onboardingCompleted: payload.onboardingCompleted ?? user.onboardingCompleted,
      interestsSummary: normalizedInterestSlugs ?? user.interestsSummary,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  if (normalizedInterestSlugs !== undefined) {
    await syncUserInterestSlugs(user.id, normalizedInterestSlugs);
  }

  return getUserByClerkId(clerkId);
}

export async function updateProfileSettings(
  clerkId: string,
  payload: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    privacyLevel?: "public" | "friends" | "private";
    interestSlugs?: string[];
  },
) {
  const db = getDb();
  if (!db) return null;
  const user = await getUserByClerkId(clerkId);
  if (!user) return null;

  const normalizedInterestSlugs =
    payload.interestSlugs !== undefined
      ? [...new Set(payload.interestSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, 12)
      : undefined;

  await db
    .update(users)
    .set({
      displayName: payload.displayName ?? user.displayName ?? undefined,
      bio: payload.bio ?? user.bio ?? undefined,
      avatarUrl: payload.avatarUrl ?? user.avatarUrl ?? undefined,
      privacyLevel: payload.privacyLevel ?? user.privacyLevel,
      interestsSummary: normalizedInterestSlugs ?? user.interestsSummary,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  if (normalizedInterestSlugs !== undefined) {
    await syncUserInterestSlugs(user.id, normalizedInterestSlugs);
  }

  return getUserByClerkId(clerkId);
}
