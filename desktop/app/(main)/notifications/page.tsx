"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to load notifications");
      return response.json() as Promise<{ ok: boolean; data: NotificationRow[] }>;
    },
  });

  const markRead = useMutation({
    mutationFn: async (body: { markAllRead?: boolean; ids?: string[] }) => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const rows = notifications.data?.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-white">Alerts</h1>
          <p className="text-sm text-white/65">Kind, intentional updates — not noise.</p>
        </div>
        <button
          type="button"
          disabled={markRead.isPending || rows.filter((n) => !n.isRead).length === 0}
          onClick={() => markRead.mutate({ markAllRead: true })}
          className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-black disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>

      {notifications.isLoading ? (
        <article className="glass-panel p-8 text-center text-white/75">Loading…</article>
      ) : notifications.isError ? (
        <article className="glass-panel p-8 text-center text-red-200/90">Could not load alerts.</article>
      ) : rows.length === 0 ? (
        <article className="glass-panel p-8 text-center text-white/75">
          You&apos;re all caught up. Nothing new right now.
        </article>
      ) : (
        <ul className="grid gap-3">
          {rows.map((item) => (
            <li
              key={item.id}
              className={`glass-panel p-4 ${item.isRead ? "opacity-70" : "border-white/30"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/45">{item.type}</p>
                  <p className="mt-1 text-base font-medium text-white">{item.title}</p>
                  {item.body ? <p className="mt-1 text-sm text-white/75">{item.body}</p> : null}
                  <p className="mt-2 text-xs text-white/45">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                {!item.isRead ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs text-white/85 hover:bg-white/10"
                    onClick={() => markRead.mutate({ ids: [item.id] })}
                    disabled={markRead.isPending}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
