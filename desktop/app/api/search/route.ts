import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { searchAll } from "@/lib/db/repositories/search";
import { rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  q: z.string().min(1).max(120),
});

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const limited = await rateLimit("search", userId, { limit: 60, windowMs: 60_000 });
  if (!limited.success) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  await ensureCurrentUserSynced();

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await searchAll(parsed.data.q);
  if (result) {
    return NextResponse.json({ ok: true, source: "database", data: result });
  }

  return NextResponse.json({
    ok: true,
    source: "fallback",
    data: { people: [], posts: [], interests: [] },
  });
}
