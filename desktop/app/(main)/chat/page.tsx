"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const rooms = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/chat/rooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as {
        data: Array<{ id: string; type: string; peerName?: string; peerUsername?: string | null }>;
      };
    },
  });

  async function startDm() {
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { data?: { id: string } };
    if (json.data?.id) router.push(`/chat/${json.data.id}`);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 p-6">
      <article className="glass-panel p-6">
        <h1 className="text-2xl font-semibold text-white">Messages</h1>
        <div className="mt-4 flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="flex-1 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white"
          />
          <button
            type="button"
            onClick={startDm}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Message
          </button>
        </div>
      </article>
      <ul className="grid gap-2">
        {(rooms.data?.data ?? []).map((room) => (
          <li key={room.id}>
            <Link href={`/chat/${room.id}`} className="glass-panel block p-4 text-sm text-white/85">
              {room.peerName ?? (room.type === "direct" ? "Direct chat" : "Group")}
              {room.peerUsername ? (
                <span className="block text-xs text-white/50">@{room.peerUsername}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
