"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Comment = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
};

export function PostComments({ postId, initialCount = 0 }: { postId: string; initialCount?: number }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: ["comments", postId],
    enabled: open,
    queryFn: async () => {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { data: Comment[] };
      return json.data;
    },
  });

  const create = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const count = open ? (comments.data?.length ?? initialCount) : initialCount;
  const items = comments.data ?? [];

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs text-white/55 hover:text-white/80">
        {open ? "Hide" : "View"} comments ({count})
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          {comments.isLoading ? <p className="text-xs text-white/50">Loading…</p> : null}
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="rounded-lg bg-black/20 px-3 py-2 text-sm">
                <p className="text-xs text-white/50">{c.author}</p>
                <p className="text-white/90">{c.content}</p>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a kind comment…"
              className="flex-1 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              type="button"
              disabled={!draft.trim() || create.isPending}
              onClick={() => create.mutate(draft)}
              className="rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
            >
              Reply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
