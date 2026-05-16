"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { PostComments } from "@/components/posts/post-comments";

type FeedPost = {
  id: string;
  author: string;
  authorUsername?: string;
  content: string;
  commentsCount?: number;
  createdAt?: string;
};

export function FeedList() {
  const [filter, setFilter] = useState<"all" | "following">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed", filter],
    queryFn: async () => {
      const response = await fetch(`/api/feed?limit=10&filter=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch feed");
      return (await response.json()) as { data: { posts: FeedPost[] } };
    },
  });

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        {(["all", "following"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${
              filter === f ? "bg-white text-black" : "border border-white/20 text-white/75"
            }`}
          >
            {f === "all" ? "For you" : "Following"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <article className="glass-panel p-8 text-center text-white/75">Loading your vibe feed...</article>
      ) : isError ? (
        <article className="glass-panel p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Could not load your feed</h2>
        </article>
      ) : (data?.data.posts ?? []).length === 0 ? (
        <article className="glass-panel p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Your feed is calm right now</h2>
          <p className="mt-2 text-white/70">
            {filter === "following"
              ? "Follow people to see their posts here."
              : "Meet others on Vyb — explore, match, or say hello."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/explore" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
              Explore people
            </Link>
            <Link href="/chat/matchmaker" className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85">
              Vyb Match
            </Link>
            <Link href="/chat" className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85">
              Connect hub
            </Link>
          </div>
        </article>
      ) : (
        (data?.data.posts ?? []).map((item) => (
          <article key={item.id} className="glass-panel p-5">
            <p className="text-sm text-white/60">
              {item.authorUsername ? (
                <Link href={`/profile/${encodeURIComponent(item.authorUsername)}`} className="hover:text-white">
                  {item.author}
                </Link>
              ) : (
                item.author
              )}
            </p>
            <p className="mt-2 text-white/90">{item.content}</p>
            <PostComments postId={item.id} initialCount={item.commentsCount ?? 0} />
          </article>
        ))
      )}
    </div>
  );
}
