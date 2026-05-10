"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type SearchGroups = {
  people: Array<{ id: string; username: string; displayName: string; bio: string | null }>;
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: string | null;
    authorUsername?: string;
  }>;
  interests: Array<{ id: string; slug: string; name: string; category: string }>;
};

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 280);
  const trimmed = debounced.trim();

  const enabled = trimmed.length >= 2;

  const query = useQuery({
    queryKey: ["search", trimmed],
    enabled,
    queryFn: async (): Promise<{ ok: boolean; data: SearchGroups }> => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json() as Promise<{ ok: boolean; data: SearchGroups }>;
    },
  });

  const data = query.data?.data;

  const counts = useMemo(() => {
    if (!data) return { people: 0, posts: 0, interests: 0 };
    return {
      people: data.people.length,
      posts: data.posts.length,
      interests: data.interests.length,
    };
  }, [data]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6">
      <div className="glass-panel p-6">
        <h1 className="text-2xl font-semibold text-white">Explore</h1>
        <p className="mt-1 text-sm text-white/70">Search people, posts, and interests across Vyb.</p>
        <label className="mt-4 grid gap-2 text-sm text-white/85">
          Search
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none placeholder:text-white/35"
            placeholder="Try a name, hobby, or keyword..."
            autoComplete="off"
          />
        </label>
        <p className="mt-2 text-xs text-white/50">Type at least 2 characters. Results update as you go.</p>
      </div>

      {!enabled ? (
        <article className="glass-panel p-6 text-center text-white/75">Start typing to discover.</article>
      ) : query.isLoading ? (
        <article className="glass-panel p-6 text-center text-white/75">Searching…</article>
      ) : query.isError ? (
        <article className="glass-panel p-6 text-center text-red-200/90">Something went wrong. Try again.</article>
      ) : (
        <div className="grid gap-4">
          <Group title="People" count={counts.people}>
            {data?.people.length ? (
              <ul className="grid gap-2">
                {data?.people.map((p) => (
                  <li key={p.id} className="glass-panel p-4 text-sm text-white/90">
                    <Link
                      href={`/profile/${encodeURIComponent(p.username)}`}
                      className="block rounded-lg outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <p className="font-medium text-white">{p.displayName}</p>
                      <p className="text-white/55">@{p.username}</p>
                      {p.bio ? <p className="mt-1 text-white/75">{p.bio}</p> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow />
            )}
          </Group>

          <Group title="Posts" count={counts.posts}>
            {data?.posts.length ? (
              <ul className="grid gap-2">
                {data?.posts.map((post) => (
                  <li key={post.id} className="glass-panel p-4 text-sm text-white/90">
                    <p className="text-white/55">
                      {post.authorUsername ? (
                        <Link
                          href={`/profile/${encodeURIComponent(post.authorUsername)}`}
                          className="hover:text-white"
                        >
                          {post.author}
                        </Link>
                      ) : (
                        post.author
                      )}
                    </p>
                    <p className="mt-1">{post.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow />
            )}
          </Group>

          <Group title="Interests" count={counts.interests}>
            {data?.interests.length ? (
              <ul className="flex flex-wrap gap-2">
                {data?.interests.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90"
                  >
                    {item.name}{" "}
                    <span className="text-white/45">({item.category})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow />
            )}
          </Group>
        </div>
      )}
    </section>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <article className="glass-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/50">{count} results</span>
      </div>
      {children}
    </article>
  );
}

function EmptyRow() {
  return <p className="text-sm text-white/55">No matches yet.</p>;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
