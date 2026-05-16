"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Calendar, Compass, Home, MessageCircle, Minus, Square, UserCircle, X } from "lucide-react";

export function DesktopTitleBar() {
  const { isSignedIn, user } = useUser();
  const profileHref =
    user?.username && user.username.trim().length > 0
      ? `/profile/${encodeURIComponent(user.username)}`
      : null;

  return (
    <header className="glass-panel sticky top-0 z-50 flex h-12 items-center justify-between border-b border-white/20 px-4">
      <div className="flex min-w-0 flex-1 items-center gap-4" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--vyb-sunset)]" />
          <p className="text-sm font-medium text-white/90">Vyb</p>
        </div>
        {isSignedIn ? (
          <nav className="hidden items-center gap-1 text-xs font-medium text-white/80 sm:flex" aria-label="Main">
            <Link className="rounded-full px-2 py-1 hover:bg-white/10" href="/feed">
              <span className="inline-flex items-center gap-1">
                <Home className="h-3.5 w-3.5" aria-hidden />
                Feed
              </span>
            </Link>
            <Link className="rounded-full px-2 py-1 hover:bg-white/10" href="/explore">
              <span className="inline-flex items-center gap-1">
                <Compass className="h-3.5 w-3.5" aria-hidden />
                Explore
              </span>
            </Link>
            <Link className="rounded-full px-2 py-1 hover:bg-white/10" href="/chat">
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Chat
              </span>
            </Link>
            <Link className="rounded-full px-2 py-1 hover:bg-white/10" href="/events">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Events
              </span>
            </Link>
            <Link className="rounded-full px-2 py-1 hover:bg-white/10" href="/notifications">
              Alerts
            </Link>
            {profileHref ? (
              <Link className="rounded-full px-2 py-1 hover:bg-white/10" href={profileHref}>
                <span className="inline-flex items-center gap-1">
                  <UserCircle className="h-3.5 w-3.5" aria-hidden />
                  Profile
                </span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isSignedIn ? (
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        ) : null}
        <div className="flex items-center gap-1">
        <button aria-label="Minimize" className="window-btn">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button aria-label="Maximize" className="window-btn">
          <Square className="h-3.5 w-3.5" />
        </button>
        <button aria-label="Close" className="window-btn window-btn-danger">
          <X className="h-3.5 w-3.5" />
        </button>
        </div>
      </div>
    </header>
  );
}
