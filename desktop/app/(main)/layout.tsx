import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getUserByClerkId } from "@/lib/db/repositories/users";

export default async function MainAppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await ensureCurrentUserSynced();
  const user = await getUserByClerkId(userId);

  if (user && !user.onboardingCompleted) {
    redirect("/onboarding/vibe-quiz");
  }

  return children;
}
