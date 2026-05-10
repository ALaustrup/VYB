import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { syncUserFromClerk } from "@/lib/auth/sync-user";

type ClerkUserPayload = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  email_addresses: Array<{ email_address: string }>;
};

export async function POST(request: Request) {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true, skipped: "Missing CLERK_WEBHOOK_SECRET" });
  }

  const body = await request.text();
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, error: "Missing svix headers" }, { status: 400 });
  }

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let evt: { type: string; data: ClerkUserPayload };

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: ClerkUserPayload };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const email = evt.data.email_addresses[0]?.email_address ?? "";
    const username = evt.data.username ?? email.split("@")[0] ?? `user-${evt.data.id.slice(0, 8)}`;
    const displayName = [evt.data.first_name, evt.data.last_name].filter(Boolean).join(" ") || username;

    await syncUserFromClerk({
      clerkId: evt.data.id,
      email,
      username,
      displayName,
      avatarUrl: evt.data.image_url ?? undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
