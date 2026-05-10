import { currentUser } from "@clerk/nextjs/server";

import { syncUserFromClerk } from "./sync-user";

export async function ensureCurrentUserSynced() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const username = user.username ?? email.split("@")[0] ?? `user-${user.id.slice(0, 8)}`;
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || username;

  await syncUserFromClerk({
    clerkId: user.id,
    email,
    username,
    displayName,
    avatarUrl: user.imageUrl,
  });

  return user.id;
}
