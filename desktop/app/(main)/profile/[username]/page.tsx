import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/lib/db/repositories/profile";

type PageProps = { params: Promise<{ username: string }> };

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const { userId } = await auth();
  const decoded = decodeURIComponent(username);

  const result = await getPublicProfile(decoded, userId ?? null);

  if (result === null) {
    return (
      <section className="mx-auto max-w-xl p-8 text-center text-white/80">
        <p>Profile data isn&apos;t available without a configured database connection.</p>
        <Link className="mt-4 inline-block text-white underline" href="/feed">
          Back to feed
        </Link>
      </section>
    );
  }

  if ("error" in result) {
    if (result.error === "not_found") {
      notFound();
    }
    if (result.error === "private") {
      return (
        <section className="mx-auto max-w-xl p-8">
          <article className="glass-panel p-8 text-center">
            <h1 className="text-xl font-semibold text-white">Private profile</h1>
            <p className="mt-2 text-sm text-white/70">
              This member only shares their full profile with people they choose.
            </p>
            <Link className="mt-6 inline-block text-sm text-white/85 underline" href="/explore">
              Explore others
            </Link>
          </article>
        </section>
      );
    }
  }

  if (!("data" in result)) {
    notFound();
  }

  const profile = result.data;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 pb-16">
      <article className="glass-panel overflow-hidden p-8">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/10">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Clerk URLs
              <img
                src={profile.avatarUrl}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/70">
                {(profile.displayName ?? profile.username).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold text-white">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-white/55">@{profile.username}</p>
            {profile.bio ? <p className="mt-3 text-sm leading-relaxed text-white/85">{profile.bio}</p> : null}
            <p className="mt-3 text-xs text-white/45">
              Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              {profile.isViewerOwner ? (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-white/90">You</span>
              ) : null}
            </p>
          </div>
        </div>

        {profile.interests.length > 0 ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Interests</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((item) => (
                <span
                  key={`${profile.id}-${item.slug}`}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90"
                >
                  {item.name}
                  <span className="text-white/40"> · {item.category}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Recent posts</h2>
        {profile.recentPosts.length === 0 ? (
          <article className="glass-panel p-8 text-center text-sm text-white/65">No posts yet.</article>
        ) : (
          <ul className="grid gap-3">
            {profile.recentPosts.map((post) => (
              <li key={post.id} className="glass-panel p-5">
                <p className="text-xs text-white/45">{new Date(post.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-white/90">{post.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
