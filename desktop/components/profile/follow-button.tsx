"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function FollowButton({ username, isOwner }: { username: string; isOwner: boolean }) {
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: ["connection", username],
    enabled: !isOwner,
    queryFn: async () => {
      const res = await fetch(`/api/connections?username=${encodeURIComponent(username)}`);
      if (!res.ok) return "none";
      const json = (await res.json()) as { status: string };
      return json.status;
    },
  });

  const mutate = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, action }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ status: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["connection", username] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (isOwner) return null;

  const current = status.data ?? "none";
  const following = current === "following" || current === "accepted";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={mutate.isPending}
        onClick={() => mutate.mutate(following ? "unfollow" : "follow")}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {following ? "Following" : "Follow"}
      </button>
      <button
        type="button"
        className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
        onClick={() =>
          fetch("/api/safety/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          })
        }
      >
        Block
      </button>
    </div>
  );
}
