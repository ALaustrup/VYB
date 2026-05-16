"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  MapPin,
  MessageCircle,
  Shuffle,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

const MODES = [
  {
    id: "matchmaker",
    href: "/chat/matchmaker",
    title: "Vyb Match",
    desc: "AI guide finds someone aligned with your vibe — optional live cam.",
    icon: Sparkles,
    accent: "var(--vyb-lavender)",
  },
  {
    id: "local",
    href: "/chat?tab=local",
    title: "Local groups",
    desc: "Distance-based hangouts near you.",
    icon: MapPin,
    accent: "var(--vyb-ocean)",
  },
  {
    id: "world",
    href: "/chat?tab=world",
    title: "World rooms",
    desc: "Open lounges anyone can join.",
    icon: Globe,
    accent: "var(--vyb-sunset)",
  },
  {
    id: "webcam",
    href: "/chat/create?mode=webcam",
    title: "Webcam lounge",
    desc: "Create a room with camera & mic enabled.",
    icon: Video,
    accent: "#f472b6",
  },
  {
    id: "random_cam",
    href: "/chat/create?mode=random_cam",
    title: "Random cam",
    desc: "Spin up a spontaneous video chat.",
    icon: Shuffle,
    accent: "#fbbf24",
  },
  {
    id: "dm",
    href: "/chat?tab=messages",
    title: "Direct messages",
    desc: "Private 1:1 conversations.",
    icon: MessageCircle,
    accent: "white",
  },
] as const;

export default function ChatHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "hub";

  const hub = useQuery({
    queryKey: ["chat-hub"],
    queryFn: async () => {
      const res = await fetch("/api/chat/hub");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as {
        data: {
          mine: Array<{ id: string; name: string | null; mode: string; peerName?: string; memberCount?: number }>;
          world: Array<{ id: string; name: string | null; mode: string; memberCount?: number }>;
          local: Array<{ id: string; name: string | null; mode: string; memberCount?: number }>;
        };
      };
    },
  });

  async function joinRoom(roomId: string) {
    await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "join", roomId }),
    });
    router.push(`/chat/${roomId}`);
  }

  const mine = hub.data?.data.mine ?? [];
  const world = hub.data?.data.world ?? [];
  const local = hub.data?.data.local ?? [];

  return (
    <section className="mx-auto max-w-4xl space-y-6 p-6 pb-28">
      <header className="glass-panel p-6">
        <h1 className="text-2xl font-semibold text-white">Connect</h1>
        <p className="mt-2 text-sm text-white/70">
          Local groups, world lounges, webcam hangs, and AI matchmaking — built for real social energy.
        </p>
        <Link
          href="/chat/create"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
        >
          <Users className="h-4 w-4" />
          Create room or group
        </Link>
      </header>

      {tab === "hub" || !tab ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.id}
                href={mode.href}
                className="glass-panel block p-5 transition hover:bg-white/10"
                style={{ borderColor: `color-mix(in oklab, ${mode.accent} 40%, transparent)` }}
              >
                <Icon className="h-6 w-6" style={{ color: mode.accent }} />
                <h2 className="mt-3 font-semibold text-white">{mode.title}</h2>
                <p className="mt-1 text-xs text-white/60">{mode.desc}</p>
              </Link>
            );
          })}
        </div>
      ) : null}

      {tab === "messages" ? (
        <RoomList title="Your conversations" rooms={mine} onJoin={(id) => router.push(`/chat/${id}`)} empty="No DMs yet — try Match or message someone from Explore." />
      ) : null}

      {tab === "world" ? (
        <RoomList title="World chat rooms" rooms={world} onJoin={joinRoom} empty="No world rooms yet. Be the first to create one!" />
      ) : null}

      {tab === "local" ? (
        <RoomList title="Local groups near you" rooms={local} onJoin={joinRoom} empty="Enable location on your dashboard, then create a local group." />
      ) : null}
    </section>
  );
}

function RoomList({
  title,
  rooms,
  onJoin,
  empty,
}: {
  title: string;
  rooms: Array<{ id: string; name: string | null; mode: string; peerName?: string; memberCount?: number }>;
  onJoin: (id: string) => void;
  empty: string;
}) {
  return (
    <article className="glass-panel p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {rooms.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onJoin(room.id)}
                className="flex w-full items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10"
              >
                <span>
                  {room.name ?? room.peerName ?? room.mode}
                  <span className="block text-xs text-white/45">{room.mode} · {room.memberCount ?? 1} members</span>
                </span>
                <span className="text-white/50">Open →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
