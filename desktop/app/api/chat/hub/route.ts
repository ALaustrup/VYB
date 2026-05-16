import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { listPublicRoomsByMode, listRoomsForUser } from "@/lib/db/repositories/chat";
import { getUserByClerkId } from "@/lib/db/repositories/users";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);
  if (!user) {
    return NextResponse.json({ ok: true, data: { mine: [], world: [], local: [] } });
  }

  const [mine, world, local] = await Promise.all([
    listRoomsForUser(user.id),
    listPublicRoomsByMode("world"),
    listPublicRoomsByMode("local"),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      mine: mine ?? [],
      world: world ?? [],
      local: local ?? [],
    },
  });
}
