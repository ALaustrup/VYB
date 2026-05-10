import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getPublicProfile } from "@/lib/db/repositories/profile";

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username } = await context.params;
  const { userId } = await auth();
  const decoded = decodeURIComponent(username);

  const result = await getPublicProfile(decoded, userId ?? null);

  if (result === null) {
    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }

  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (result.error === "private") {
      return NextResponse.json({ ok: false, error: "private_profile" }, { status: 403 });
    }
  }

  if (!("data" in result)) {
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
