"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EventRsvpButton({ eventId, initialStatus }: { eventId: string; initialStatus: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);

  async function rsvp(next: "going" | "interested") {
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void rsvp("going")}
        className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          status === "going" ? "bg-white text-black" : "border border-white/25 text-white/85"
        }`}
      >
        Going
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void rsvp("interested")}
        className={`rounded-full px-4 py-2 text-sm disabled:opacity-50 ${
          status === "interested" ? "bg-white/20 text-white" : "border border-white/25 text-white/85"
        }`}
      >
        Interested
      </button>
    </div>
  );
}
