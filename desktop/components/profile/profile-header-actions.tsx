"use client";

import Link from "next/link";

import { FollowButton } from "./follow-button";
import { MessageButton } from "./message-button";

export function ProfileHeaderActions({ username, isOwner }: { username: string; isOwner: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      <FollowButton username={username} isOwner={isOwner} />
      {!isOwner ? <MessageButton username={username} /> : null}
      {isOwner ? (
        <Link
          href="/settings/profile"
          className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          Edit profile
        </Link>
      ) : null}
    </div>
  );
}
