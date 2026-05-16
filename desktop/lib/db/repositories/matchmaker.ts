import { and, desc, eq, ne } from "drizzle-orm";

import { getNextMatchmakerStep, scoreVibeOverlap } from "@/lib/matchmaker/engine";
import { getDb } from "@/lib/db/client";
import { matchmakingSessions, users } from "@/lib/db/schema";
import { createSocialRoom, getOrCreateDirectRoom } from "@/lib/db/repositories/chat";

export async function advanceMatchmakerSession(userId: string, answer?: { stepId: string; value: string }) {
  const db = getDb();
  if (!db) return null;

  const [existing] = await db
    .select()
    .from(matchmakingSessions)
    .where(and(eq(matchmakingSessions.userId, userId), eq(matchmakingSessions.status, "in_progress")))
    .orderBy(desc(matchmakingSessions.createdAt))
    .limit(1);

  let session = existing;
  if (!session) {
    const [created] = await db
      .insert(matchmakingSessions)
      .values({ userId, answers: {}, status: "in_progress" })
      .returning();
    session = created;
  }
  if (!session) return null;

  const answers = { ...(session.answers ?? {}) };
  if (answer) answers[answer.stepId] = answer.value;

  const next = getNextMatchmakerStep(answers);
  if (next) {
    await db
      .update(matchmakingSessions)
      .set({ answers, updatedAt: new Date() })
      .where(eq(matchmakingSessions.id, session.id));
    return { status: "question" as const, step: next, answers };
  }

  const [self] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const candidates = await db
    .select()
    .from(users)
    .where(and(ne(users.id, userId), eq(users.onboardingCompleted, true)))
    .limit(20);

  let best = candidates[0];
  let bestScore = -1;
  for (const candidate of candidates) {
    const overlap = scoreVibeOverlap(self?.vibeQuizAnswers, candidate.vibeQuizAnswers);
    const matchAnswers = scoreVibeOverlap(answers, candidate.vibeQuizAnswers as Record<string, string>);
    const total = overlap + matchAnswers;
    if (total > bestScore) {
      bestScore = total;
      best = candidate;
    }
  }

  if (!best) {
    return { status: "no_match" as const, answers };
  }

  const wantsLive = answers.format === "Voice & webcam" || answers.format === "Either works";
  const room =
    (await createSocialRoom({
      hostId: userId,
      mode: "match_private",
      name: `Match · ${best.displayName ?? best.username}`,
      memberIds: [userId, best.id],
      settings: {
        privacy: "invite",
        allowWebcam: wantsLive,
        allowMic: wantsLive,
        description: "Vyb matchmaker introduction room",
      },
    })) ?? (await getOrCreateDirectRoom(userId, best.id));

  if (!room) return { status: "no_match" as const, answers };

  await db
    .update(matchmakingSessions)
    .set({
      answers,
      status: "matched",
      matchedUserId: best.id,
      roomId: room.id,
      updatedAt: new Date(),
    })
    .where(eq(matchmakingSessions.id, session.id));

  return {
    status: "matched" as const,
    roomId: room.id,
    matchedUser: {
      id: best.id,
      username: best.username,
      displayName: best.displayName ?? best.username,
    },
    answers,
  };
}
