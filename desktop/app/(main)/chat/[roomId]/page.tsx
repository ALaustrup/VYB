"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
};

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { data: Message[] };
    },
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  const items = messages.data?.data ?? [];

  return (
    <section className="mx-auto flex h-[calc(100vh-3rem)] max-w-2xl flex-col p-4">
      <div className="glass-panel flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg bg-black/20 px-3 py-2 text-sm">
              <p className="text-xs text-white/50">{m.author}</p>
              <p className="text-white/90">{m.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 border-t border-white/10 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
            placeholder="Message…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim()) send.mutate(draft);
              }
            }}
          />
          <button
            type="button"
            disabled={!draft.trim() || send.isPending}
            onClick={() => send.mutate(draft)}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
