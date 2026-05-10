"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function CreatePostCard() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (nextContent: string) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent, mediaUrls: [] }),
      });
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      return response.json();
    },
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["feed", "for-you"] });
    },
  });

  return (
    <article className="glass-panel p-5">
      <p className="text-sm text-white/70">Share a thought, moment, or invitation</p>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="mt-3 min-h-20 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
        placeholder="What's your vibe today?"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => mutation.mutate(content)}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          disabled={!content.trim() || mutation.isPending}
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </article>
  );
}
