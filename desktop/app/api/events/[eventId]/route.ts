import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getEventById,
  getViewerRsvp,
  listEventAttendees,
} from "@/lib/db/repositories/events";
import { getUserByClerkId } from "@/lib/db/repositories/users";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const event = await getEventById(eventId);

  if (event === null) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  if (!event) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const attendees = (await listEventAttendees(eventId)) ?? [];
  const { userId } = await auth();
  let viewerRsvp: string | null = null;
  if (userId) {
    const user = await getUserByClerkId(userId);
    if (user) viewerRsvp = await getViewerRsvp(eventId, user.id);
  }

  return NextResponse.json({
    ok: true,
    data: { event, attendees, viewerRsvp },
  });
}
