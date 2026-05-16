import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ensureCurrentUserSynced } from "@/lib/auth/ensure-user";
import { getUserByClerkId } from "@/lib/db/repositories/users";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    await ensureCurrentUserSynced();
    const user = await getUserByClerkId(userId);
    if (user && !user.onboardingCompleted) {
      redirect("/onboarding/vibe-quiz");
    }
    redirect("/feed");
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-8">
      <article className="glass-panel p-8">
        <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/80">
          Desktop-first · Neon + Clerk
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Vyb</h1>
        <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
          A calm, premium social space for Windows, macOS, and Linux — feed, profiles, chat, and
          events with a human-first feel.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/sign-in" className="rounded-full bg-white px-5 py-2 font-medium text-black">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-white/25 px-5 py-2 font-medium text-white/90 hover:bg-white/10"
          >
            Create account
          </Link>
        </div>
      </article>
    </section>
  );
}

