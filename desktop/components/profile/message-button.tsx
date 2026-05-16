"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MessageButton({ username }: { username: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function openChat() {
    setPending(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { id: string } };
      if (json.data?.id) router.push(`/chat/${json.data.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={openChat}
      className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50"
    >
      {pending ? "Opening…" : "Message"}
    </button>
  );
}
