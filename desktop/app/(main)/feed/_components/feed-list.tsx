 "use client";

import { useQuery } from "@tanstack/react-query";

type FeedPost = {
  id: string;
  author: string;
  content: string;
  createdAt?: string;
};

export function FeedList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed", "for-you"],
    queryFn: async () => {
      const response = await fetch("/api/feed?limit=10");
      if (!response.ok) throw new Error("Failed to fetch feed");
      return (await response.json()) as { data: { posts: FeedPost[] } };
    },
  });

  if (isLoading) {
    return (
      <article className="glass-panel p-8 text-center text-white/75">Loading your vibe feed...</article>
    );
  }

  if (isError) {
    return (
      <article className="glass-panel p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Could not load your feed</h2>
        <p className="mt-2 text-white/70">Please retry in a moment.</p>
      </article>
    );
  }

  const posts = data?.data.posts ?? [];

  if (posts.length === 0) {
    return (
      <article className="glass-panel p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Your feed is calm right now</h2>
        <p className="mt-2 text-white/70">Follow interests or create your first Vyb post.</p>
      </article>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((item) => (
        <article key={item.id} className="glass-panel p-5">
          <p className="text-sm text-white/60">{item.author}</p>
          <p className="mt-2 text-white/90">{item.content}</p>
        </article>
      ))}
    </div>
  );
}
