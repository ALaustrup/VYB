import { getDb } from "@/lib/db/client";
import { safetyReports } from "@/lib/db/schema";

export async function createReport(input: {
  reporterId: string;
  targetType: "user" | "post" | "comment" | "listing" | "event";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .insert(safetyReports)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details,
    })
    .returning();

  return row;
}
