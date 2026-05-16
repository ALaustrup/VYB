"use client";

import { PostComments } from "@/components/posts/post-comments";

export function ProfilePosts({
  posts,
}: {
  posts: Array<{ id: string; content: string; createdAt: string }>;
}) {
  if (posts.length === 0) {
    return <article className="glass-panel p-8 text-center text-sm text-white/65">No posts yet.</article>;
  }

  return (
    <ul className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id} className="glass-panel p-5">
          <p className="text-xs text-white/45">{new Date(post.createdAt).toLocaleString()}</p>
          <p className="mt-2 text-sm text-white/90">{post.content}</p>
          <PostComments postId={post.id} />
        </li>
      ))}
    </ul>
  );
}
