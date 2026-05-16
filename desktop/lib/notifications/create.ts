import { getDb } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

type NotificationType = "like" | "comment" | "follow" | "message" | "event_reminder" | "wellness_tip";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    })
    .returning();

  return row;
}
